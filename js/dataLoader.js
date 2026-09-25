// Data loading from JSON
window.DataLoader = {
  async fetchJson(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Kunde inte hämta ${url} (HTTP ${r.status})`);
    return r.json();
  },

  async loadCoreData() {
    const { DATA_BASE } = window.AppConfig;

    const [personsData, orgsData, lanData, branschData] = await Promise.all([
      this.fetchJson(`${DATA_BASE}/personer.json`),
      this.fetchJson(`${DATA_BASE}/organisationer.json`),
      this.fetchJson(`${DATA_BASE}/lan.json`),
      this.fetchJson(`${DATA_BASE}/branscher.json`)
    ]);

    const orgs = orgsData.organisationer || [];
    const lan = lanData.lan || [];
    const branscher = branschData.branscher || [];

    // Kommun till län
    const kommuner = [];
    const kommunToLan = new Map();
    for (const l of lan) {
      for (const k of l.kommuner || []) {
        kommuner.push(k);
        kommunToLan.set(k.id, l.id);
      }
    }

    const orgsById = Object.fromEntries(orgs.map(o => [o.id, o]));

    const persons = (personsData.records || []).map((person, index) => {
      const id = person.namn ? person.namn.toLowerCase().replace(/\s+/g, '-') + '-' + index : `person-${index}`;
      const platser = person.plats || [];

      // Koordinater behåller sin kommun så att länsfiltret matchar rätt markör
      const coordinates = [];
      for (const p of platser) {
        if (!p.geocoding) continue;
        const [lat, lon] = p.geocoding.split(',').map(Number);
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
          coordinates.push({ lat, lon, lanId: kommunToLan.get(p.kommun) || null });
        }
      }

      const organisationer = person.organisationer || [];
      const relations = organisationer
        .filter(o => orgsById[o.organisation_id])
        .map(o => {
          const org = orgsById[o.organisation_id];
          return {
            organisation: org.id,
            organisationNamn: org.namn,
            relationstyp: org.medlemstyp || 'medlem',
            år: o.år || []
          };
        });

      return {
        id,
        fullnamn: person.namn || '',
        yrke: person.yrke || '',
        bransch: person.bransch || '',
        alias: person.alias || '',
        coordinates,
        platser,
        lanIds: new Set(platser.map(p => kommunToLan.get(p.kommun)).filter(Boolean)),
        organisationer,
        relations,
        original_line: person.original_line || []
      };
    });

    return {
      persons,
      orgs,
      lan,
      branscher,
      kommunToLan,
      personsById: Object.fromEntries(persons.map(p => [p.id, p])),
      orgsById,
      kommunerById: Object.fromEntries(kommuner.map(k => [k.id, k])),
      branschById: Object.fromEntries(branscher.map(b => [b.id, b]))
    };
  },

  initializeAllSources(orgs) {
    const allSourcesDiv = window.Utils.$('#allSources');
    if (!allSourcesDiv) return;

    if (orgs.length) {
      allSourcesDiv.innerHTML = orgs.map(window.Utils.renderOrgSource).join('');
    } else {
      allSourcesDiv.textContent = 'Inga organisationer inlästa ännu.';
    }
  }
};
