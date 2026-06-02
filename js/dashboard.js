import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { ref, onValue, set, get } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// Auth guard dengan fallback
let isDevelopment = false;
onAuthStateChanged(auth, (user) => {
  if (!user) {
    isDevelopment = true;
    console.warn('Development mode: Menggunakan dummy data');
    // Load initial data dari dummy
    loadDummy();
    // Uncomment di bawah untuk production:
    // window.location.href = 'login.html';
  }
});

document.getElementById('logoutBtn')?.addEventListener('click', async (e) => {
  e.preventDefault();
  await signOut(auth);
  window.location.href = 'login.html';
});

// Load initial dummy data untuk development
// ini akan di-override jika Firebase data tersedia
loadDummy();

// ====================================
// HISTORY DATA — hanya Lampu & Kipas
// ====================================
const historyRef = ref(db, 'sensor/history');

onValue(historyRef, (snapshot) => {
  const rows = snapshot.val() || [];
  updateTable(rows);
}, () => {
  console.warn('History tidak tersedia');
});

const relayState = {
  Lampu: false,
  Kipas: false
};

const sensorState = {
  Suhu: 0,
  Cahaya: 0
};

const relayItems = [
  {
    name: 'Lampu',
    dbPath: 'lampu',
    toggleId: 'lampToggle',
    labelId: 'lampLabel',
    statusId: 'lampStatus'
  },
  {
    name: 'Kipas',
    dbPath: 'kipas',
    toggleId: 'kipasToggle',
    labelId: 'kipasLabel',
    statusId: 'kipasStatus'
  }
];

function updateDeviceStats() {
  // Update relay states
  relayItems.forEach((item) => {
    const isOn = relayState[item.name];
    const statEl = document.getElementById(`stat${item.name}`);
    const trendEl = document.getElementById(`trend${item.name}`);

    if (statEl) statEl.textContent = isOn ? 'ON' : 'OFF';
    if (trendEl) {
      trendEl.textContent = isOn ? '✔ Aktif' : '✖ Mati';
      trendEl.className = 'trend ' + (isOn ? 'up' : 'down');
    }
  });

  // Update sensor states (Suhu & Cahaya)
  const suhuEl = document.getElementById('statSuhu');
  const cahayaEl = document.getElementById('statCahaya');
  const trendSuhu = document.getElementById('trendSuhu');
  const trendCahaya = document.getElementById('trendCahaya');

  if (suhuEl) suhuEl.textContent = `${sensorState.Suhu}°C`;
  if (cahayaEl) cahayaEl.textContent = `${sensorState.Cahaya} lx`;
  
  if (trendSuhu) {
    const suhuStatus = sensorState.Suhu > 28 ? 'Tinggi' : sensorState.Suhu < 24 ? 'Rendah' : 'Normal';
    trendSuhu.textContent = '📊 ' + suhuStatus;
    trendSuhu.className = 'trend ' + (sensorState.Suhu > 28 ? 'down' : 'up');
  }
  
  if (trendCahaya) {
    const cahayaStatus = sensorState.Cahaya > 600 ? 'Terang' : sensorState.Cahaya < 300 ? 'Gelap' : 'Sedang';
    trendCahaya.textContent = '💡 ' + cahayaStatus;
    trendCahaya.className = 'trend up';
  }
}

function updateTable(rows) {
  const tbody = document.getElementById('dataTable');
  if (!tbody) return;
  const filtered = rows.filter(r => r.sensor === 'Lampu' || r.sensor === 'Kipas');
  tbody.innerHTML = filtered.map(r => `
    <tr>
      <td>${r.waktu}</td>
      <td>${r.sensor}</td>
      <td>${r.nilai}</td>
      <td><span class="badge-pill ${r.status === 'OK' ? 'ok' : r.status === 'WARN' ? 'warn' : 'err'}">${r.status}</span></td>
    </tr>
  `).join('');
}

// Fallback ke dummy.json
async function loadDummy() {
  try {
    const res = await fetch('data/dummy.json');
    const data = await res.json();
    relayState.Lampu = data.lampu === 1 || data.lampu === true || data.lampu === '1';
    relayState.Kipas = data.kipas === 1 || data.kipas === true || data.kipas === '1';
    sensorState.Suhu = data.suhu || 0;
    sensorState.Cahaya = data.cahaya || 0;
    updateDeviceStats();
    updateTable(data.history || []);
    window.__sensorData = data;
    if (window.renderChart) window.renderChart(data.chart);
  } catch (e) {
    console.warn('Tidak bisa memuat data dummy:', e);
  }
}

// ====================================
// SENSOR DATA LISTENERS (Suhu & Cahaya)
// ====================================

// Suhu listener
const suhuRef = ref(db, 'suhu');
onValue(suhuRef, (snapshot) => {
  sensorState.Suhu = snapshot.val() || 0;
  updateDeviceStats();
}, () => console.warn('Suhu data tidak tersedia, gunakan dummy'));

// Cahaya listener
const cahayaRef = ref(db, 'cahaya');
onValue(cahayaRef, (snapshot) => {
  sensorState.Cahaya = snapshot.val() || 0;
  updateDeviceStats();
}, () => console.warn('Cahaya data tidak tersedia, gunakan dummy'));

// ====================================
// RELAY CONTROL
// ====================================

function formatRelayStatus(deviceName, isOn) {
  return `Status: ${isOn ? '🟢 Menyala' : '🔴 Mati'} — ${deviceName} ${isOn ? 'aktif' : 'non-aktif'}`;
}

relayItems.forEach((item) => {
  const itemRef = ref(db, item.dbPath);
  const toggleEl = document.getElementById(item.toggleId);
  const labelEl = document.getElementById(item.labelId);
  const statusEl = document.getElementById(item.statusId);

  onValue(itemRef, (snapshot) => {
    const val = snapshot.val();
    const isOn = val === 1 || val === true || val === '1';

    if (toggleEl) toggleEl.checked = isOn;
    if (labelEl) {
      labelEl.textContent = isOn ? 'ON' : 'OFF';
      labelEl.style.color = isOn ? '#10b981' : '#475569';
    }
    relayState[item.name] = isOn;
    updateDeviceStats();
    if (statusEl) statusEl.textContent = formatRelayStatus(item.name, isOn);
  }, (err) => {
    console.error(`Gagal membaca status ${item.name}:`, err);
    if (statusEl) statusEl.textContent = `Status: Tidak dapat memuat ${item.name}`;
  });

  if (toggleEl) {
    toggleEl.addEventListener('change', async () => {
      const newState = toggleEl.checked ? 1 : 0;
      const labelState = newState === 1 ? 'ON' : 'OFF';

      try {
        await set(itemRef, newState);
        console.log(`${item.name} set to:`, newState);

        const historyRef = ref(db, 'sensor/history');
        const historySnapshot = await get(historyRef);
        let history = historySnapshot.val() || [];
        if (!Array.isArray(history)) {
          history = history ? Object.values(history) : [];
        }

        const now = new Date();
        const timeStr = now.toTimeString().split(' ')[0];
        const dateStr = now.toISOString().split('T')[0];

        history.push({
          waktu: timeStr,
          tanggal: dateStr,
          sensor: item.name,
          nilai: labelState,
          status: 'OK'
        });

        if (history.length > 50) {
          history = history.slice(-50);
        }

        await set(historyRef, history);
      } catch (err) {
        console.error(`Gagal mengubah ${item.name} atau mencatat riwayat:`, err);
        if (toggleEl) toggleEl.checked = !toggleEl.checked;
      }
    });
  }
});
