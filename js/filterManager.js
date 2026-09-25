// Filter and search management
window.FilterManager = {
  initializeFilters(orgs, lan, branscher) {
    const { $, addOptions } = window.Utils;
    addOptions($('#org'), orgs);
    addOptions($('#lan'), lan);
    addOptions($('#bransch'), branscher);
  },

  initializeSearch(persons) {
    const { SEARCH_THRESHOLD } = window.AppConfig;

    return new Fuse(persons, {
      keys: [
        { name: 'fullnamn', weight: 0.7 },
        { name: 'alias', weight: 0.4 },
        { name: 'yrke', weight: 0.3 },
        { name: 'original_line', weight: 0.1 }
      ],
      threshold: SEARCH_THRESHOLD,
      ignoreLocation: true,
      minMatchCharLength: 2
    });
  },

  setupEventListeners(state, applyFilters) {
    const { $, debounce } = window.Utils;
    const { SEARCH_DELAY } = window.AppConfig;

    const inputs = {
      q: $('#q'),
      org: $('#org'),
      lan: $('#lan'),
      bransch: $('#bransch')
    };

    for (const [key, element] of Object.entries(inputs)) {
      const handler = () => {
        state[key] = element.value.trim();
        state.page = 1;
        applyFilters();
      };

      if (key === 'q') {
        element.addEventListener('input', debounce(handler, SEARCH_DELAY));
      } else {
        element.addEventListener('change', handler);
      }
    }

    $('#reset').addEventListener('click', () => {
      for (const element of Object.values(inputs)) element.value = '';
      Object.assign(state, { q: '', org: '', lan: '', bransch: '', page: 1 });
      applyFilters();
    });
  },

  filterPersons(persons, state, fuse) {
    let base = state.q ? fuse.search(state.q).map(r => r.item) : persons;

    if (state.lan) {
      base = base.filter(p => p.lanIds.has(state.lan));
    }

    if (state.bransch) {
      base = base.filter(p => p.bransch === state.bransch);
    }

    if (state.org) {
      base = base.filter(p => p.relations.some(r => r.organisation === state.org));
    }

    return base;
  }
};
