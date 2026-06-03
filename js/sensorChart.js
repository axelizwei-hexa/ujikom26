// Sensor Chart Renderer
// Menggunakan Chart.js (sudah di-load via CDN di dashboard.html)

window.renderChart = function (chartData) {
  const ctx = document.getElementById('sensorChart');
  if (!ctx) return;

  const labels = chartData?.labels || ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];
  const lampu = chartData?.lampu || [1, 1, 0, 1, 1, 0, 1, 1];

  if (window.__chartInstance) window.__chartInstance.destroy();

  window.__chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Lampu (ON=1 / OFF=0)',
          data: lampu,
          borderColor: '#4f46e5',
          backgroundColor: 'rgba(79,70,229,.12)',
          fill: true,
          tension: .4,
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: { boxWidth: 10, usePointStyle: true, padding: 20 }
        },
        tooltip: {
          backgroundColor: 'rgba(15,23,42,0.9)',
          titleColor: '#94a3b8',
          bodyColor: '#f1f5f9',
          padding: 12,
          cornerRadius: 8
        }
      },
      scales: {
        y: {
          grid: { color: 'rgba(148,163,184,0.1)' },
          ticks: { color: '#94a3b8' }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#94a3b8' }
        }
      }
    }
  });
};

// Auto-render setelah data dimuat oleh dashboard.js
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (window.__sensorData?.chart) window.renderChart(window.__sensorData.chart);
    else window.renderChart();
  }, 700);
});
