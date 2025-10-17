// Statistics management with Chart.js
window.StatisticsManager = {

  initializeStatistics(persons, lan, branschById, kommunToLan) {
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js not loaded, skipping statistics');
      return;
    }

    this.createLanChart(persons, lan, kommunToLan);
    this.createBranschChart(persons, branschById);
  },

  createLanChart(persons, lan, kommunToLan) {
    const ctx = document.getElementById('kommunChart'); // Behåll samma ID för nu
    if (!ctx) return;

    // Count persons per lan
    const lanCounts = {};
    
    // Initialize all lan with 0
    lan.forEach(l => {
      lanCounts[l.namn] = 0;
    });

    persons.forEach(person => {
      if (person.platser && person.platser.length > 0) {
        const processedLan = new Set(); // Undvik dubbelräkning
        person.platser.forEach(plats => {
          if (plats.kommun) {
            const lanId = kommunToLan.get(plats.kommun);
            if (lanId && !processedLan.has(lanId)) {
              const lanObj = lan.find(l => l.id === lanId);
              if (lanObj) {
                lanCounts[lanObj.namn]++;
                processedLan.add(lanId);
              }
            }
          }
        });
      }
    });

    // Sort by count
    const sortedLan = Object.entries(lanCounts)
      .filter(([,count]) => count > 0) // Visa bara lan med personer
      .sort(([,a], [,b]) => b - a);

    const labels = sortedLan.map(([name]) => name);
    const data = sortedLan.map(([,count]) => count);

    // Adjust canvas height
    const chartHeight = Math.max(300, labels.length * 35);
    ctx.parentElement.style.height = chartHeight + 'px';

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Antal personer',
          data: data,
          backgroundColor: '#60cd64',
          borderColor: '#e0e2e2',
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              color: '#0b1215'
            },
            grid: {
              color: '#e0e2e2'
            }
          },
          y: {
            ticks: {
              color: '#0b1215',
              font: {
                size: 12
              }
            },
            grid: {
              color: '#e0e2e2'
            }
          }
        }
      }
    });
  },

  createBranschChart(persons, branschById) {
    const ctx = document.getElementById('branschChart');
    if (!ctx) return;

    // Count persons per bransch
    const branschCounts = {};
    persons.forEach(person => {
      if (person.bransch) {
        const branschName = branschById[person.bransch]?.namn || person.bransch;
        // Skip "Okänd" and "Övrigt" as per utils formatting
        const formattedName = window.Utils.formatBranschNamn(branschName);
        if (formattedName) {
          branschCounts[formattedName] = (branschCounts[formattedName] || 0) + 1;
        }
      }
    });

    // Sort by count (show all)
    const sortedBranscher = Object.entries(branschCounts)
      .sort(([,a], [,b]) => b - a);

    const labels = sortedBranscher.map(([name]) => name);
    const data = sortedBranscher.map(([,count]) => count);

    // Adjust canvas height based on number of items
    const chartHeight = Math.max(300, labels.length * 30);
    ctx.parentElement.style.height = chartHeight + 'px';

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Antal personer',
          data: data,
          backgroundColor: '#60cd64',
          borderColor: '#e0e2e2',
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              color: '#0b1215'
            },
            grid: {
              color: '#e0e2e2'
            }
          },
          y: {
            ticks: {
              color: '#0b1215',
              font: {
                size: 11
              }
            },
            grid: {
              color: '#e0e2e2'
            }
          }
        }
      }
    });
  }
};