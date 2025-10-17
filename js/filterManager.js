// Filter and search management
window.FilterManager = {

  initializeFilters(orgs, lan, branscher) {
    const { $, addOptions } = window.Utils;
    
    const orgSelect = $('#org');
    const lanSelect = $('#lan'); // ändrat från kommun
    const branschSelect = $('#bransch');
    
    // Clear existing options
    orgSelect.innerHTML = '<option value="">Alla organisationer</option>';
    lanSelect.innerHTML = '<option value="">Alla län</option>';
    branschSelect.innerHTML = '<option value="">Alla branscher</option>';
    
    // Add options
    addOptions(orgSelect, orgs);
    addOptions(lanSelect, lan);
    addOptions(branschSelect, branscher);
    
    return { orgSelect, lanSelect, branschSelect };
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
      includeScore: false
    });
  },

  setupEventListeners(state, applyFilters) {
    const { $, debounce } = window.Utils;
    const { SEARCH_DELAY } = window.AppConfig;
    
    const inputs = { 
      q: $('#q'), 
      org: $('#org'), 
      lan: $('#lan'), // ändrat från kommun
      bransch: $('#bransch')
    };
    
    for (const [key, element] of Object.entries(inputs)) {
      if (!element) continue;
      
      const handler = () => { 
        state[key] = (element.value || '').trim(); 
        state.page = 1; 
        applyFilters(); 
      };
      
      if (key === 'q') {
        element.addEventListener('input', debounce(handler, SEARCH_DELAY));
      } else {
        element.addEventListener('change', handler);
      }
    }
    
    const resetBtn = $('#reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => { 
        for (const element of Object.values(inputs)) {
          if (element) element.value = '';
        }
        Object.assign(state, {q:'', org:'', lan:'', bransch:'', page:1}); 
        applyFilters(); 
      });
    }
    
    return inputs;
  },

  filterPersons(persons, state, fuse, relationsByPerson, kommunToLan) {
    let base = persons;
    
    // Text search
    if (state.q) {
      base = fuse.search(state.q).map(r => r.item);
    }
    
    // Lan filter
    if (state.lan) {
      base = base.filter(p => 
        p.platser && p.platser.some(plats => 
          kommunToLan.get(plats.kommun) === state.lan
        )
      );
    }
    
    // Bransch filter
    if (state.bransch) {
      base = base.filter(p => p.bransch === state.bransch);
    }
    
    // Organization filter
    if (state.org) {
      base = base.filter(p => {
        const rels = relationsByPerson.get(p.id) || [];
        return rels.some(r => r.organisation === state.org);
      });
    }
    
    return base;
  }
};