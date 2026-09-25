// Statistics management with Chart.js
window.StatisticsManager = {
  // Diagrammen byggs först när statistikpanelen öppnas
  initializeStatistics(persons, lan, branschById) {
    const details = document.getElementById('statistics')?.closest('details');
    if (!details) return;

    details.addEventListener('toggle', () => {
      if (typeof Chart === 'undefined') {
        console.warn('Chart.js not loaded, skipping statistics');
        return;
      }
      this.createLanChart(persons, lan);
      this.createBranschChart(persons, branschById);
    }, { once: true });
  },

  createLanChart(persons, lan) {
    // Varje person räknas en gång per län
    const counts = new Map();
    for (const person of persons) {
      for (const lanId of person.lanIds) counts.set(lanId, (counts.get(lanId) || 0) + 1);
    }

    const entries = lan
      .filter(l => counts.has(l.id))
      .map(l => [l.namn, counts.get(l.id)]);

    this.createBarChart(document.getElementById('lanChart'), entries, 35, 12);
  },

  createBranschChart(persons, branschById) {
    const counts = {};
    for (const person of persons) {
      if (!person.bransch) continue;
      const name = window.Utils.formatBranschNamn(branschById[person.bransch]?.namn || person.bransch);
      if (name) counts[name] = (counts[name] || 0) + 1;
    }

    this.createBarChart(document.getElementById('branschChart'), Object.entries(counts), 30, 11);
  },

  createBarChart(canvas, entries, rowHeight, fontSize) {
    if (!canvas) return;

    const sorted = [...entries].sort(([, a], [, b]) => b - a);
    canvas.parentElement.style.height = Math.max(300, sorted.length * rowHeight) + 'px';

    const css = getComputedStyle(document.documentElement);
    const fg = css.getPropertyValue('--fg').trim();
    const border = css.getPropertyValue('--border').trim();
    const bar = css.getPropertyValue('--chart').trim();

    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: sorted.map(([name]) => name),
        datasets: [{
          label: 'Antal personer',
          data: sorted.map(([, count]) => count),
          backgroundColor: bar,
          borderColor: border,
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true, ticks: { color: fg }, grid: { color: border } },
          y: { ticks: { color: fg, font: { size: fontSize } }, grid: { color: border } }
        }
      }
    });
  }
};
