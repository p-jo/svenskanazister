// Map management
window.MapManager = {
  initializeMap() {
    const { MAP_CENTER, MAP_ZOOM, CLUSTER_ZOOM, HEAT_RADIUS, HEAT_BLUR, HEAT_MAX_ZOOM, HEAT_MIN_OPACITY } = window.AppConfig;

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

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-bidragsgivare'
    }).addTo(map);

    const cluster = L.markerClusterGroup({ disableClusteringAtZoom: CLUSTER_ZOOM, chunkedLoading: true });
    map.addLayer(cluster);

    const heat = L.heatLayer([], {
      radius: HEAT_RADIUS,
      blur: HEAT_BLUR,
      maxZoom: HEAT_MAX_ZOOM,
      minOpacity: HEAT_MIN_OPACITY
    }).addTo(map);

    return { map, cluster, heat };
  },

  // Returnerar Map: personId -> [{ marker, lanId }]
  createMarkers(persons, lookups) {
    const markerByPerson = new Map();

    for (const person of persons) {
      if (!person.coordinates.length) continue;

      // Popup-HTML byggs först när popupen öppnas
      const popup = () => window.Utils.renderPersonDetails(person, lookups);
      markerByPerson.set(person.id, person.coordinates.map(({ lat, lon, lanId }) => ({
        marker: L.marker([lat, lon]).bindPopup(popup),
        lanId
      })));
    }

    return markerByPerson;
  },

  // Visar markörer för givna personer och returnerar de markörer som lades till
  refreshMarkers({ map, cluster, heat, markerByPerson }, ids, selectedLanId, animate = true) {
    const markers = [];
    for (const id of ids) {
      for (const { marker, lanId } of markerByPerson.get(id) || []) {
        if (!selectedLanId || lanId === selectedLanId) markers.push(marker);
      }
    }

    const latLngs = markers.map(m => m.getLatLng());
    cluster.clearLayers();
    cluster.addLayers(markers);
    heat.setLatLngs(latLngs);

    if (latLngs.length === 1) {
      map.setView(latLngs[0], Math.max(map.getZoom(), 10), { animate });
    } else if (latLngs.length > 1) {
      map.fitBounds(L.latLngBounds(latLngs), { padding: [20, 20], animate });
    }

    return markers;
  },

  // Visar alla en persons markörer och öppnar popupen för den första
  focusPerson(mapState, personId) {
    // Utan animering är vyn på plats innan zoomToShowLayer räknar ut klustren
    const [first] = this.refreshMarkers(mapState, [personId], '', false);
    if (first) mapState.cluster.zoomToShowLayer(first, () => first.openPopup());
  }
};
