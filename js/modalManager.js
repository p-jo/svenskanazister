// Modal management for sources
window.ModalManager = {
  initializeModal() {
    const { $ } = window.Utils;

    const dialog = $('#sourcesModal');
    const sourcesList = $('#sourcesList');

    $('#sourcesClose').addEventListener('click', () => dialog.close());

    // Klick utanför innehållet (på bakgrunden) stänger
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) dialog.close();
    });

    dialog.addEventListener('close', () => document.body.classList.remove('modal-open'));

    return { dialog, sourcesList };
  },

  show(html) {
    const { dialog, sourcesList } = window.AppState.modal;
    sourcesList.innerHTML = html;
    document.body.classList.add('modal-open');
    dialog.showModal();
  },

  openPersonSources(person) {
    const { esc, renderOrgSource } = window.Utils;

    if (!person) return this.show('<p>Person kunde inte hittas.</p>');

    const rels = person.relations;
    if (!rels.length) return this.show('<p>Inga källor länkade till denna person.</p>');

    const lines = person.original_line;
    const quote = (line) => line ? `<p><strong>"${esc(line)}"</strong></p>` : '';
    const note = '<p class="meta">Rollen anger vilken typ av förteckning organisationen förde, inte nödvändigtvis personens egen roll.</p>';
    const orgsById = window.AppState.orgsById;

    // Källraderna och organisationerna står i samma ordning när antalet är lika.
    // Annars går det inte att para ihop dem, så raderna visas samlade.
    if (lines.length === rels.length) {
      return this.show(note + rels.map((r, i) =>
        `<div>${quote(lines[i])}${renderOrgSource(orgsById[r.organisation])}</div>`
      ).join(''));
    }

    this.show(
      note +
      `<div style="margin-bottom:20px;">${lines.map(quote).join('')}</div>` +
      rels.map(r => renderOrgSource(orgsById[r.organisation])).join('')
    );
  }
};
