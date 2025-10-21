// Main application entry point
(async function() {
  try {
    // Initialize global app state
    window.AppState = {
      persons: [],
      orgs: [],
      kommuner: [],
      branscher: [],
      relationsByPerson: new Map(),
      map: null,
      cluster: null,
      heat: null,
      markerByPerson: new Map(),
      fuse: null,
      modal: null,
      state: { q: '', org: '', kommun: '', bransch: '', page: 1 }
    };

    // Ladda första gången
    window.Utils.showElementLoader('list', 'Laddar namn…');
    window.Utils.showElementLoader('map', 'Laddar karta…');

    // Load all data
    console.log('Starting application...');
    
    // Load all data
    const [persons, orgs, lan, kommuner, branscher, kommunToLan] = await window.DataLoader.loadCoreData();

    // Store in global state
    Object.assign(window.AppState, {
      persons, orgs, lan, kommuner, branscher, kommunToLan
    });

    // Create lookup objects
    const lookups = window.DataLoader.createLookupObjects(persons, orgs, kommuner, branscher);
    Object.assign(window.AppState, lookups);

    // Build relations map with org data
    window.AppState.relationsByPerson = window.DataLoader.buildRelationsMap(persons, lookups.orgsById);

    // Initialize all sources display
    window.DataLoader.initializeAllSources(orgs);

    // Initialize map
    const { map, cluster, heat } = window.MapManager.initializeMap();
    Object.assign(window.AppState, { map, cluster, heat });

    // Create markers
    const { markerByPerson, heatPoints } = window.MapManager.createMarkers(
      persons,
      window.AppState.relationsByPerson, 
      window.AppState.orgsById,
      window.AppState.kommunerById,
      window.AppState.branschById
    );
    window.AppState.markerByPerson = markerByPerson;
    heat.setLatLngs(heatPoints);

    // Initialize search
    window.AppState.fuse = window.FilterManager.initializeSearch(persons);

    // Initialize filters
    window.FilterManager.initializeFilters(orgs, lan, branscher);

    // Update state object
    window.AppState.state = { q: '', org: '', lan: '', bransch: '', page: 1 };

    // Initialize modal
    window.AppState.modal = window.ModalManager.initializeModal();

    // Initialize statistics
    window.StatisticsManager.initializeStatistics(
      window.AppState.persons,
      window.AppState.lan,
      window.AppState.branschById,
      window.AppState.kommunToLan
    );

    // Helper functions
    /*
    const refreshMarkers = (ids) => {
      window.MapManager.refreshMarkers(
        ids, 
        window.AppState.cluster, 
        window.AppState.heat, 
        window.AppState.markerByPerson, 
        window.AppState.map
      );
    };
    */

    const refreshMarkers = (ids) => {
      const selectedLanId = (document.getElementById('lan')?.value || '').trim();
      
      window.MapManager.refreshMarkers(
        ids,
        window.AppState.cluster,
        window.AppState.heat,
        window.AppState.markerByPerson,
        window.AppState.map,
        null,
        [],
        selectedLanId,
        window.AppState.kommunToLan
      );
    };

    const openPersonSources = (personId) => {
      window.ModalManager.openPersonSources(
        personId,
        window.AppState.persons,
        window.AppState.relationsByPerson
      );
    };

    const filterAndRender = (isPagination = false) => {
      // Visa loader
      window.Utils.showElementLoader('list', 'Laddar namn…');
      window.Utils.showElementLoader('map', 'Laddar karta…');
      
      // Använd setTimeout för att låta UI uppdateras
      setTimeout(() => {
        const filteredPersons = window.FilterManager.filterPersons(
          window.AppState.persons,
          window.AppState.state,
          window.AppState.fuse,
          window.AppState.relationsByPerson,
          window.AppState.kommunToLan
        );

        window.ListRenderer.renderList(
          filteredPersons,
          window.AppState.state,
          window.AppState.relationsByPerson,
          window.AppState.orgsById,
          window.AppState.branschById,
          window.AppState.kommunerById,
          window.AppState.markerByPerson,
          window.AppState.map,
          refreshMarkers,
          openPersonSources,
          isPagination
        );
        
        // Dölj loader
        window.Utils.hideElementLoader('list');
        window.Utils.hideElementLoader('map');

        // Gå till början av listan
        requestAnimationFrame(() => {
          const items = document.getElementById('items');
          if (!items) return;

          // Desktop – scrolla internt i #items
          if (!window.matchMedia('(max-width: 900px)').matches) {
            items.scrollTop = 0;
            return;
          }

          // Mobil – hoppa till listan *endast* om det var från pagination
          if (isPagination) {
            window.scrollTo({ top: items.getBoundingClientRect().top + window.scrollY - 160, behavior: 'auto' });
           // items.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
      }, 10);
    };

    // Setup event listeners
    window.FilterManager.setupEventListeners(window.AppState.state, filterAndRender);
    window.ListRenderer.setupPagination(window.AppState.state, filterAndRender);

    // Initial render
    console.log('Application initialized successfully');
    
    // Ta bort overlay när allt är klart
    window.Utils.hideElementLoader('list');
    window.Utils.hideElementLoader('map');

    filterAndRender();

    
  } catch (error) {
    console.error('Application initialization failed:', error);
    
    // Show error to user
    const container = window.Utils.$('#items');
    if (container) {
      container.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #ff6b6b;">
          <h3>Fel vid laddning av data</h3>
          <p>Kunde inte ladda applikationsdata. Kontrollera att alla datafiler finns på plats.</p>
          <details style="margin-top: 10px; text-align: left;">
            <summary>Teknisk information</summary>
            <pre style="background: #2a2a2a; padding: 10px; border-radius: 5px; overflow: auto;">${error.stack || error.message}</pre>
          </details>
        </div>
      `;
    }
  }
})();

/*
// Efter att dina select-element har fyllts med data
document.addEventListener('DOMContentLoaded', function() {
    // Gör dropdowns sökbara
    new SearchableDropdown(document.getElementById('org'));
    new SearchableDropdown(document.getElementById('kommun'));
    new SearchableDropdown(document.getElementById('bransch'));
}); 
*/