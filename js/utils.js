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

  // Create option elements for select
  addOptions: (select, items, getVal = (x) => x.id, getText = (x) => x.namn || x.etikett) => {
    for (const item of items) {
      const option = document.createElement('option');
      option.value = getVal(item);
      option.textContent = getText(item);
      select.appendChild(option);
    }
  },

  debounce: (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  // Visa inte branschnamn i UI om det är "Okänd" eller "Övrigt"
  formatBranschNamn: (namn) => {
    if (!namn) return '';
    const n = String(namn).trim().toLowerCase();
    return (n === 'okänd' || n === 'övrigt') ? '' : namn;
  },

  displayName: (person) => person.fullnamn || 'Namn saknas',

  // Extern länk som öppnas i ny flik
  externalLink: (href) => {
    const { esc } = window.Utils;
    return `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(href)} <span aria-hidden="true" style="font-size:12px;">🔗</span><span class="visually-hidden">(öppnas i ny flik)</span></a>`;
  },

  // Organisationsbeskrivning, används i sidfoten och i källdialogen
  renderOrgSource: (org) => {
    const { esc, externalLink } = window.Utils;
    return `
      <h3>${esc(org.namn)}</h3>
      <div class="meta">${esc(org.källa)}</div>
      <div class="meta" style="margin-bottom:8px;">${org.länk ? externalLink(org.länk) : esc(org.källa)}</div>
      <div class="meta" style="margin-bottom:20px;">${esc(org.beskrivning || '')}</div>
    `;
  },

  // Personuppgifter, används i listan och i kartans popup
  renderPersonDetails: (person, { branschById, kommunerById }, nameTag = 'div') => {
    const { esc, formatBranschNamn, displayName } = window.Utils;

    const occupation = [formatBranschNamn(branschById[person.bransch]?.namn), person.yrke]
      .filter(Boolean).join(': ');

    const location = person.platser.map(plats =>
      [plats.adress, plats.ort, kommunerById[plats.kommun]?.namn].filter(Boolean).map(esc).join(', ')
    ).filter(Boolean).join('<br>');

    const rels = person.relations.map(r => {
      const yearText = r.år.length ? ` <span class="meta-year">(${esc(r.år.join(', '))})</span>` : '';
      return `<span class="meta-org">${esc(r.organisationNamn)}</span> <span class="meta-rel">${esc(r.relationstyp)}</span>${yearText}`;
    }).join('<br>');

    const alias = person.alias ? ` <span class="meta meta-alias">(${esc(person.alias)})</span>` : '';
    let html = `<${nameTag} class="name">${esc(displayName(person))}${alias}</${nameTag}>`;
    if (occupation) html += `<div class="meta meta-occupation">${esc(occupation)}</div>`;
    if (location) html += `<div class="meta meta-location">${location}</div>`;
    if (rels) html += `<div class="meta meta-org-data">${rels}</div>`;
    return html;
  },

  showElementLoader: (elementId, text = 'Laddar...') => {
    const element = document.getElementById(elementId);
    if (!element) return;

    element.querySelector('.element-overlay')?.remove();

    const overlay = document.createElement('div');
    overlay.className = 'element-overlay';
    overlay.setAttribute('role', 'status');
    overlay.innerHTML = `
      <div class="element-overlay-content">
        <div class="spinner-clean"></div>
        <div>${window.Utils.esc(text)}</div>
      </div>
    `;
    element.appendChild(overlay);
  },

  hideElementLoader: (elementId) => {
    document.getElementById(elementId)?.querySelector('.element-overlay')?.remove();
  }
};
