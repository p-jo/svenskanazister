// Map management
window.MapManager = {
  initializeMap() {
    const { MAP_CENTER, MAP_ZOOM, CLUSTER_ZOOM, HEAT_RADIUS, HEAT_BLUR, HEAT_MAX_ZOOM, HEAT_MIN_OPACITY } = window.AppConfig;
    
    // Create map
//    const map = L.map('map', { zoomControl: true }).setView(MAP_CENTER, MAP_ZOOM);
    const map = L.map('map', {
      zoomControl: true,
      gestureHandling: true, // Aktiverar två-fingers krav
      gestureHandlingOptions: {
        text: {
          touch: "Använd två fingrar för att flytta kartan",
          scroll: "Håll ctrl + scrolla för att zooma",
          scrollMac: "Håll ⌘ + scrolla för att zooma"
        }
      }
    }).setView(MAP_CENTER, MAP_ZOOM);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { 
      maxZoom: 19, 
      attribution: '&copy; OpenStreetMap-bidragsgivare' 
    }).addTo(map);
    

    // Create marker cluster
    const cluster = L.markerClusterGroup({ disableClusteringAtZoom: CLUSTER_ZOOM });
    map.addLayer(cluster);
    
    // Create heatmap layer
    const heat = L.heatLayer([], { 
      radius: HEAT_RADIUS, 
      blur: HEAT_BLUR, 
      maxZoom: HEAT_MAX_ZOOM, 
      minOpacity: HEAT_MIN_OPACITY 
    }).addTo(map);
    
    return { map, cluster, heat };
  },

  createMarkers(persons, relationsByPerson, orgsById, citiesById, branschById) {
    const { esc } = window.Utils;
    const markerByPerson = new Map();
    const heatPoints = [];

    for (const person of persons) {
      const pairs = Array.isArray(person.coordinates) ? person.coordinates : [];
      const allMarkers = [];

      for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i];
        if (!Array.isArray(pair) || pair.length !== 2) continue;
        const [lon, lat] = pair;
        if (typeof lat !== 'number' || typeof lon !== 'number' ||
            Number.isNaN(lat) || Number.isNaN(lon) ||
            lat < -90 || lat > 90 || lon < -180 || lon > 180) {
          console.warn(`Invalid coordinates for person ${person.id}:`, pair);
          continue;
        }

        const marker = L.marker([lat, lon]);

        // Relations
        const rels = (relationsByPerson.get(person.id) || []).map(r => {
          const personOrg = person.organisationer?.find(po => po.organisation_id === r.organisation);
          const years = personOrg?.år || [];
          const årText = years.length > 0 ? ` <span class="meta-year">(${years.join(', ')})</span>` : '';
          return `<span class="meta-org">${esc(r.organisationNamn || r.organisation)}</span> <span class="meta-rel">${esc(r.relationstyp)}</span>${årText}`;
        }).join('<br/>');

        // Yrke/Bransch
        const yrkeText = person.yrke || '';
        const rawBransch = branschById[person.bransch]?.namn || '';
        const branschText = window.Utils.formatBranschNamn(rawBransch);
        const occupation = [branschText, yrkeText].filter(Boolean).join(': ');

        // Plats (visa första som meta)
        const locationParts = [];
        if (Array.isArray(person.platser) && person.platser.length) {
          const plats = person.platser[0];
          if (plats.adress) locationParts.push(plats.adress);
          if (plats.ort) locationParts.push(plats.ort);
          const kommunNamn = citiesById[plats.kommun]?.namn; // ← FIX: använd citiesById här
          if (kommunNamn) locationParts.push(kommunNamn);
        }
        const location = locationParts.join(', ');

        let popupContent = ` <div class="name">${esc(person.fullnamn)}${person.alias ? ` <span class="meta meta-alias">(${esc(person.alias)})</span>` : ''}</div>`;
        if (occupation) popupContent += `<div class="meta meta-occupation">${esc(occupation)}</div>`;
        if (location) popupContent += `<div class="meta meta-location">${esc(location)}</div>`;
        if (rels) popupContent += `<div class="meta">${rels}</div>`;

        marker.bindPopup(popupContent);
        // Spara kommunId per markör (matchar plats-index i i)
        const kommunId = (Array.isArray(person.platser) && person.platser[i] && person.platser[i].kommun)
          ? person.platser[i].kommun
          : null;
        allMarkers.push({ marker, kommunId });
        heatPoints.push([lat, lon, 1]);
      }

      if (allMarkers.length) {
        markerByPerson.set(person.id, allMarkers[0].marker);        // primär
        markerByPerson.set(person.id + '_all', allMarkers);  // alla
      }
    }

    console.log(`Created ${markerByPerson.size} markers from ${persons.length} persons`);
    return { markerByPerson, heatPoints };
  },


  refreshMarkers(ids, cluster, heat, markerByPerson, map, markersLayer, visibleIds, selectedLanId, kommunToLan) {
    cluster.clearLayers();
    
    const validMarkers = [];
    const heatPoints = [];
    
    for (const id of ids) { 
      const list = markerByPerson.get(id + '_all');
      if (Array.isArray(list) && list.length) {
        list.forEach(({ marker, kommunId }) => {
          const lanId = kommunToLan?.get(kommunId);
          if (!selectedLanId || lanId === selectedLanId) {
            cluster.addLayer(marker);
            validMarkers.push(marker);
            const latLng = marker.getLatLng();
            heatPoints.push([latLng.lat, latLng.lng, 1]);
          }
        });
        continue;
      }
      
      /*
      // Fallback för äldre data
      const m = markerByPerson.get(id);
      if (m && !selectedKommunId) {
        cluster.addLayer(m);
        validMarkers.push(m);
        const latLng = m.getLatLng();
        heatPoints.push([latLng.lat, latLng.lng, 1]);
      }
      */


    }
    
    // Uppdatera heatmap
    heat.setLatLngs(heatPoints);
    
    // Adjust map view
    if (validMarkers.length > 0) {
      try {
        if (validMarkers.length === 1) {
          // For single marker, just center on it
          const latLng = validMarkers[0].getLatLng();
          if (latLng && latLng.lat !== undefined && latLng.lng !== undefined) {
            map.setView(latLng, Math.max(map.getZoom(), 10));
          }
        } else {
          // For multiple markers, fit bounds
          const group = L.featureGroup(validMarkers);
          const bounds = group.getBounds();
          if (bounds && bounds.isValid && bounds.isValid()) {
            map.fitBounds(bounds, { animate: true, padding: [20, 20] });
          }
        }
      } catch (e) {
        console.warn('Could not fit bounds:', e);
        // Fallback: just center on first marker
        if (validMarkers.length > 0) {
          const latLng = validMarkers[0].getLatLng();
          if (latLng && latLng.lat !== undefined && latLng.lng !== undefined) {
            map.setView(latLng, 8);
          }
        }
      }
    }
  }
};  