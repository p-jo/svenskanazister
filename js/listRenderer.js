// List rendering and pagination
window.ListRenderer = {
  pageCount(totalCount) {
    return Math.max(1, Math.ceil(totalCount / window.AppConfig.PAGE_SIZE));
  },

  setupPagination(state, getTotalCount, onPageChange) {
    const { $ } = window.Utils;

    $('#prev').addEventListener('click', () => {
      if (state.page > 1) {
        state.page--;
        onPageChange();
      }
    });

    $('#next').addEventListener('click', () => {
      if (state.page < this.pageCount(getTotalCount())) {
        state.page++;
        onPageChange();
      }
    });
  },

  // Ett delegerat klick-lyssnare för knapparna i listan
  setupActions(onMap, onSource) {
    window.Utils.$('#items').addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      if (btn.dataset.action === 'map') onMap(btn.dataset.person);
      if (btn.dataset.action === 'source') onSource(btn.dataset.person);
    });
  },

  renderList(items, state, lookups) {
    const { $, esc, displayName, renderPersonDetails } = window.Utils;
    const { PAGE_SIZE } = window.AppConfig;

    const container = $('#items');
    state.page = Math.min(Math.max(1, state.page), this.pageCount(items.length));

    const start = (state.page - 1) * PAGE_SIZE;
    container.innerHTML = items.slice(start, start + PAGE_SIZE).map(p => {
      const id = esc(p.id);
      const name = esc(displayName(p));
      const mapBtn = p.coordinates.length
        ? `<button type="button" class="pill" data-person="${id}" data-action="map" aria-label="Visa ${name} på karta">Visa på karta</button>`
        : '';

      return `
        <li class="row">
          <div class="actions">
            ${mapBtn}
            <button type="button" class="pill" data-person="${id}" data-action="source" aria-label="Källor för ${name}">Källa</button>
          </div>
          <div>${renderPersonDetails(p, lookups, 'h3')}</div>
        </li>`;
    }).join('');

    this.updateStats(items.length);
    this.updatePagination(items.length, state.page);
  },

  updateStats(totalCount) {
    window.Utils.$('#stats').textContent = `${totalCount.toLocaleString('sv-SE')} personer`;
  },

  updatePagination(totalCount, currentPage) {
    const { $ } = window.Utils;
    const pages = this.pageCount(totalCount);

    $('#pageinfo').textContent = `${currentPage} / ${pages}`;
    $('#prev').disabled = currentPage <= 1;
    $('#next').disabled = currentPage >= pages;
  }
};
