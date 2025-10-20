// Modal management for sources
window.ModalManager = {
  initializeModal() {
    const { $ } = window.Utils;
    
    const backdrop = $('#sourcesBackdrop');
    const sourcesList = $('#sourcesList');
    
    const closeModal = () => {
      backdrop.style.display = 'none';
      document.body.classList.remove('modal-open');
    };
    
    $('#sourcesClose').addEventListener('click', closeModal);

    backdrop.addEventListener('click', (e) => { 
      if (e.target === backdrop) {
        closeModal();
      } 
    });
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && backdrop.style.display === 'flex') {
        closeModal();
      }
    });
    
    return { backdrop, sourcesList };
  },

  openPersonSources(personId, persons, relationsByPerson) {
    const { esc } = window.Utils;
    const { backdrop, sourcesList } = window.AppState.modal;
    
    const person = persons.find(p => p.id === personId);
    if (!person) {
      sourcesList.innerHTML = '<p>Person kunde inte hittas.</p>';
      backdrop.style.display = 'flex';
      document.body.classList.add('modal-open');
      return;
    }

    let html = `<p></p>`;
    
    const rels = relationsByPerson.get(person.id) || [];
    const orgsById = window.AppState.orgsById;

    if (!rels.length) {
      sourcesList.innerHTML = html + '<p>Inga källor länkade till denna person.</p>';
      backdrop.style.display = 'flex';
      document.body.classList.add('modal-open');
      return;
    }

    html += rels.map((r, index) => {
      const org = orgsById[r.organisation];
      if (!org) return '';
      
      // Hämta rätt original_line för denna organisation (baserat på index)
      const originalLines = Array.isArray(person.original_line) 
        ? (person.original_line[index] || '') 
        : (person.original_line || '');
      
      const linkHtml = org.länk ? `<a href="${esc(org.länk)}" target="_blank">${esc(org.länk)} <span style="font-size:12px;">🔗</span></a>` : esc(org.källa);
      
      return `
        <div style="margin-bottom: 20px;">
          <p><strong>"${esc(originalLines)}"</strong></p>
          <h3 style="margin-bottom:6px">${esc(org.namn)}</h3>
          <div class="meta">${esc(org.källa)}</div>
          <div class="meta" style="margin-bottom:4px;">${linkHtml}</div>
          <div class="meta" style="margin-bottom:16px;">${esc(org.beskrivning || '')}</div>
        </div>
      `;
    }).join('');

    sourcesList.innerHTML = html;
    backdrop.style.display = 'flex';
    document.body.classList.add('modal-open');
  }
};