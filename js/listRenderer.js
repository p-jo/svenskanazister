// List rendering and pagination
window.ListRenderer = {
  setupPagination(state, filterAndRender) {
    const { $ } = window.Utils;
    
    const prevBtn = $('#prev');
    const nextBtn = $('#next');
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (state.page > 1) { 
          state.page--; 
          filterAndRender(); 
        }
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => { 
        state.page++; 
        filterAndRender(); 
      });
    }
  },

  renderList(items, state, relationsByPerson, orgsById, branschById, kommunerById, markerByPerson, map, refreshMarkers, openPersonSources) {
    const { $, esc } = window.Utils;
    const { PAGE_SIZE } = window.AppConfig;
    
    const container = $('#items');
    if (!container) return;
    
    container.innerHTML = '';
    
    const start = (state.page - 1) * PAGE_SIZE;
    const pageItems = items.slice(start, start + PAGE_SIZE);

    for (const p of pageItems) {
      // Get relations for this person with years
      const rels = (relationsByPerson.get(p.id) || []).map(r => {
        const orgName = r.organisationNamn || r.organisation;
        const relType = r.relationstyp || 'medlem';
        
        // Format years - get years from the person's organisationer data
        const personOrg = p.organisationer?.find(po => po.organisation_id === r.organisation);
        const years = personOrg?.år || [];
        const yearText = years.length > 0 ? ` <span class="meta-year">(${years.join(', ')})</span>` : '';
        
        return `<span class="meta-org">${esc(orgName)}</span> <span class="meta-rel">${esc(relType)}</span>${yearText}`;
      }).join('<br>');
      
      const row = document.createElement('div');
      row.className = 'row';
      
      // Format yrke and bransch
      const yrkeText = p.yrke || '';
      const rawBransch = branschById[p.bransch]?.namn || '';
      const branschText = window.Utils.formatBranschNamn(rawBransch);
     // const branschText = branschById[p.bransch]?.namn || '';
      const occupation = [branschText, yrkeText].filter(Boolean).join(': ');
      
      // Lista alla platser (adress, ort, kommun)
      let location = '';
      if (Array.isArray(p.platser) && p.platser.length) {
        const rows = p.platser.map(plats => {
          const bits = [];
          if (plats.adress) bits.push(esc(plats.adress));
          if (plats.ort) bits.push(esc(plats.ort));
          const kommunNamn = kommunerById[plats.kommun]?.namn;
          if (kommunNamn) bits.push(esc(kommunNamn));
          return `${bits.join(', ')}`;
        });
        location = `${rows.join('<br>')}`;
      }

      
      // Build HTML
      row.innerHTML = `
        <div>
          <div class="name">${esc(p.fullnamn)}${p.alias ? ` <span class="meta meta-alias">(${esc(p.alias)})</span>` : ''}</div>
          <div class="meta meta-occupation">${esc(occupation)}</div>
          <div class="meta meta-location">${location}</div>
          <div class="meta">${rels}</div>
        </div>
        <div class="actions">
          <a href="#" class="pill" data-person="${esc(p.id)}" data-action="map" aria-label="Visa ${esc(p.fullnamn)} på karta">Visa på karta</a>
          <a href="#" class="pill" data-person="${esc(p.id)}" data-action="source" aria-label="Källor för ${esc(p.fullnamn)}">Källa</a>
        </div>`;
      
      // Add event listeners
      const mapBtn = row.querySelector('[data-action="map"]');
      const srcBtn = row.querySelector('[data-action="source"]');
      
      if (mapBtn) {
        mapBtn.addEventListener('click', (e) => {
          e.preventDefault();

          // Visa alla markörer för personen och zooma in
          refreshMarkers([p.id]);
          const list = markerByPerson.get(p.id + '_all') || [];
          if (list[0]) list[0].openPopup();

        });
      }
      
      if (srcBtn) {
        srcBtn.addEventListener('click', (e) => { 
          e.preventDefault(); 
          openPersonSources(p.id); 
        });
      }
      
      container.appendChild(row);
    }

    // Update stats and pagination
    this.updateStats(items.length);
    this.updatePagination(items.length, state.page);
    
    // Update map
    refreshMarkers(items.map(p => p.id));
  },

  updateStats(totalCount) {
    const { $ } = window.Utils;
    const statsEl = $('#stats');
    if (statsEl) {
      statsEl.innerHTML = `${totalCount.toLocaleString('sv-SE')} personer matchar`;
    }
  },

  updatePagination(totalCount, currentPage) {
    const { $ } = window.Utils;
    const { PAGE_SIZE } = window.AppConfig;
    
    const pages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
    
    const pageInfo = $('#pageinfo');
    const prevBtn = $('#prev');
    const nextBtn = $('#next');
    
    if (pageInfo) pageInfo.textContent = `${currentPage} / ${pages}`;
    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= pages;
  }
};