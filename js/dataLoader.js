// Data loading from JSON
window.DataLoader = {
  async loadCoreData() {
    const { DATA_BASE } = window.AppConfig; // Ny config för API-bas-URL
    
    const [personsData, orgsData, lanData, branschData] = await Promise.all([
      fetch(`${DATA_BASE}/personer.json`).then(r => r.json()),
      fetch(`${DATA_BASE}/organisationer.json`).then(r => r.json()),
      fetch(`${DATA_BASE}/lan.json`).then(r => r.json()),
      fetch(`${DATA_BASE}/branscher.json`).then(r => r.json())
    ]);


    // Extract arrays from the new structure
    const persons = personsData.records || [];
    const orgs = orgsData.organisationer || [];
    const lan = lanData.lan || [];
    const branscher = branschData.branscher || [];

    // Transform persons data (samma logik som innan)
    const transformedPersons = persons.map((person, index) => {
      const id = person.namn ? person.namn.toLowerCase().replace(/\s+/g, '-') + '-' + index : `person-${index}`;
      
      const coordinates = [];
      if (person.plats && person.plats.length > 0) {
        person.plats.forEach(p => {
          if (p.geocoding) {
            try {
              const [lat, lon] = p.geocoding.split(',').map(Number);
              if (!isNaN(lat) && !isNaN(lon)) {
                coordinates.push([lon, lat]);
              }
            } catch (e) {
              console.warn(`Invalid geocoding for person ${id}:`, p.geocoding);
            }
          }
        });
      }

      return {
        id: id,
        fullnamn: person.namn || '',
        yrke: person.yrke || '',
        bransch: person.bransch || '',
        alias: person.alias || '',
        coordinates: coordinates,
     //   hemorter: person.plats ? person.plats.map(p => p.kommun).filter(Boolean) : [],
        platser: person.plats || [],
        organisationer: person.organisationer || [],
        original_line: person.original_line || [] // Behåll som array
      };
    });

    // Skapa kommun till län mappning
    const kommuner = [];
    const kommunToLan = new Map();
    lan.forEach(l => {
      if (l.kommuner) {
        l.kommuner.forEach(k => {
          kommuner.push(k);
          kommunToLan.set(k.id, l.id);
        });
      }
    });

    return [transformedPersons, orgs, lan, kommuner, branscher, kommunToLan];
  },

  // Resten av metoderna behåller samma logik
  createLookupObjects(persons, orgs, kommuner, branscher) {
    return {
      personsById: Object.fromEntries(persons.map(p => [p.id, p])),
      orgsById: Object.fromEntries(orgs.map(o => [o.id, o])),
      kommunerById: Object.fromEntries(kommuner.map(k => [k.id, k])),
      branschById: Object.fromEntries(branscher.map(b => [b.id, b]))
    };
  },

  buildRelationsMap(persons, orgsById) {
    const relationsByPerson = new Map();
    
    for (const person of persons) {
      if (!person.organisationer || person.organisationer.length === 0) continue;
      
      const relations = [];
      
      for (const orgData of person.organisationer) {
        const org = orgsById[orgData.organisation_id];
        if (!org) continue;
        
        relations.push({ 
          organisation: orgData.organisation_id,
          organisationNamn: org.namn,
          relationstyp: org.medlemstyp || 'medlem',
          källa: org.källa || ''
        });
      }
      
      relationsByPerson.set(person.id, relations);
    }
    
    return relationsByPerson;
  },

  initializeAllSources(orgs) {
    const { esc } = window.Utils;
    const allSourcesDiv = window.Utils.$('#allSources');
    
    if (!allSourcesDiv) return;
    
    if (orgs.length) {
      let html = orgs.map(org => {
        const linkHtml = org.länk ? 
          `<a href="${esc(org.länk)}" target="_blank">${esc(org.länk)} <span style="font-size:12px;">🔗</span></a>` : 
          esc(org.källa);
        
        return `
          <h3>${esc(org.namn)}</h3>
          <div>${esc(org.källa)}</div>
          <div style="margin-bottom:8px;">${linkHtml}</div>
          <div style="margin-bottom:20px;">${esc(org.beskrivning || '')}</div>
        `;
      }).join('');
      
      allSourcesDiv.innerHTML = html;
    } else {
      allSourcesDiv.textContent = 'Inga organisationer inlästa ännu.';
    }
  }
};