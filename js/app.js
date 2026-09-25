// Main application entry point
(async function() {
  const { showElementLoader, hideElementLoader, esc } = window.Utils;

  try {
    window.AppState = {
      state: { q: '', org: '', lan: '', bransch: '', page: 1 }
    };
    const app = window.AppState;

    showElementLoader('list', 'Laddar namn…');
    showElementLoader('map', 'Laddar karta…');

    Object.assign(app, await window.DataLoader.loadCoreData());
    const lookups = { branschById: app.branschById, kommunerById: app.kommunerById };

    window.DataLoader.initializeAllSources(app.orgs);

    Object.assign(app, window.MapManager.initializeMap());
    app.markerByPerson = window.MapManager.createMarkers(app.persons, lookups);

    app.fuse = window.FilterManager.initializeSearch(app.persons);
    window.FilterManager.initializeFilters(app.orgs, app.lan, app.branscher);
    app.modal = window.ModalManager.initializeModal();
    window.StatisticsManager.initializeStatistics(app.persons, app.lan, app.branschById);

    let filtered = [];
    // Kartan visar bara en person efter "Visa på karta" tills listan byter sida eller filter
    let mapFocused = false;

    const showFilteredOnMap = () => {
      window.MapManager.refreshMarkers(app, filtered.map(p => p.id), app.state.lan);
      mapFocused = false;
    };

    const renderPage = (isPagination) => {
      window.ListRenderer.renderList(filtered, app.state, lookups);

      const items = document.getElementById('items');
      if (!window.matchMedia('(max-width: 900px)').matches) {
        // Desktop – scrolla internt i listan
        items.scrollTop = 0;
      } else if (isPagination) {
        // Mobil – hoppa till listan bara vid sidbyte
        items.scrollIntoView({ block: 'start' });
      }
    };

    const filterAndRender = () => {
      showElementLoader('list', 'Laddar namn…');
      showElementLoader('map', 'Laddar karta…');

      // Låt UI visa laddaren innan filtreringen körs
      setTimeout(() => {
        filtered = window.FilterManager.filterPersons(app.persons, app.state, app.fuse);
        renderPage(false);
        showFilteredOnMap();
        hideElementLoader('list');
        hideElementLoader('map');
      }, 10);
    };

    const changePage = () => {
      renderPage(true);
      if (mapFocused) showFilteredOnMap();
    };

    window.FilterManager.setupEventListeners(app.state, filterAndRender);
    window.ListRenderer.setupPagination(app.state, () => filtered.length, changePage);
    window.ListRenderer.setupActions(
      (personId) => {
        window.MapManager.focusPerson(app, personId);
        mapFocused = true;
        if (window.matchMedia('(max-width: 900px)').matches) {
          document.getElementById('map').scrollIntoView({ block: 'start' });
        }
      },
      (personId) => window.ModalManager.openPersonSources(app.personsById[personId])
    );

    filterAndRender();
  } catch (error) {
    console.error('Application initialization failed:', error);
    hideElementLoader('list');
    hideElementLoader('map');

    const container = window.Utils.$('#items');
    if (container) {
      container.innerHTML = `
        <li style="padding: 20px; text-align: center; color: #c62828;">
          <h3>Fel vid laddning av data</h3>
          <p>Kunde inte ladda applikationsdata. Kontrollera att alla datafiler finns på plats.</p>
          <details style="margin-top: 10px; text-align: left;">
            <summary>Teknisk information</summary>
            <pre style="padding: 10px; overflow: auto;">${esc(error.stack || error.message)}</pre>
          </details>
        </li>
      `;
    }
  }
})();
