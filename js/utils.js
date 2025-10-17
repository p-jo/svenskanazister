// Utility functions
window.Utils = {
  // DOM selector
  $: (sel) => document.querySelector(sel),
  
  // HTML escape
  esc: (s = '') => String(s).replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m])),
  

  // Format helpers
  formatCity: (id, kommunerById) => kommunerById[id]?.namn || id || '',
  
  formatOccupations: (ids = [], occById) => 
    ids.map(id => occById[id]?.etikett || id).join(', '),
  
  formatRelation: (key) => window.Utils.relMap[key] || key,
  
  // Create option elements for select
  addOptions: (select, items, getVal = (x) => x.id, getText = (x) => x.namn || x.etikett) => {
    for (const item of items) {
      const option = document.createElement('option');
      option.value = getVal(item);
      option.textContent = getText(item);
      select.appendChild(option);
    }
  },
  
  // Debounce function
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  showElementLoader: (elementId, text = 'Laddar...') => {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    // Ta bort befintlig overlay om den finns
    const existing = element.querySelector('.element-overlay');
    if (existing) existing.remove();
    
    const overlay = document.createElement('div');
    overlay.className = 'element-overlay';
    overlay.innerHTML = `
      <div class="element-overlay-content">
        <div class="spinner-clean"></div>
        <div>${text}</div>
      </div>
    `;
    element.appendChild(overlay);
  },

  hideElementLoader: (elementId) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const overlay = element.querySelector('.element-overlay');
    if (overlay) overlay.remove();
  }
};


// Visa inte branschnamn i UI om det är "Okänd" eller "Övrigt"
window.Utils = window.Utils || {};
window.Utils.formatBranschNamn = function (namn) {
  if (!namn) return '';
  const n = String(namn).trim().toLowerCase();
  if (n === 'okänd' || n === 'övrigt') return '';
  return namn; // returnera originalet annars
};
