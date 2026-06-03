# Panduan Debug Relay Control (Microbit + Relay Module)

## 🔍 Langkah-Langkah Debug

### 1. **Cek Firebase Database Rules**
Relay tidak akan merespons jika database rules memblokir akses. Buka Firebase Console → Realtime Database → Rules.

Pastikan rules mengizinkan read/write di `/lampu` dan `/kipas`:
```json
{
  "rules": {
    "lampu": { ".read": true, ".write": true },
    "kipas": { ".read": true, ".write": true },
    "suhu": { ".read": true, ".write": true },
    "cahaya": { ".read": true, ".write": true },
    "sensor": { ".read": true, ".write": true }
  }
}
```

### 2. **Cek Console Dashboard**
Buka `http://localhost:8000/dashboard.html`, tekan F12 (Console), dan klik toggle ON/OFF.

**Apa yang seharusnya muncul:**
```
✅ Lampu set to: 1
✅ Lampu set to: 0
```

**Jika muncul error:**
- `permission_denied` → Rules Firebase blokir → Perbaiki step 1
- `Network error` → Koneksi internet problem / Firebase unreachable
- Tidak ada log sama sekali → Toggle button tidak bekerja di HTML

### 3. **Cek Firebase Realtime Database (Live)**
Buka Firebase Console → Realtime Database → Data tab.

Setelah klik toggle di dashboard:
- Nilai `/lampu` harus berubah dari 0 → 1 atau 1 → 0
- Nilai `/kipas` harus berubah sesuai toggle

**Jika tidak berubah:**
- Dashboard tidak bisa menulis → Lihat console error (step 2)
- Microbit tidak membaca → Lihat step 4

---

## 📡 Contoh Kode Microbit (JavaScript dengan Firebase Realtime Database)

Microbit perlu:
1. Terhubung ke WiFi
2. Listen ke Firebase path `/lampu` dan `/kipas`
3. Kontrol relay GPIO sesuai nilai yang diterima

### **Opsi A: Menggunakan MicroPython + Firebase REST API**

```python
# microbit_relay_control.py
import requests
import json
import time
from machine import Pin

# Konfigurasi
FIREBASE_URL = "https://ujikom-iot-2026-default-rtdb.asia-southeast1.firebasedatabase.app"
RELAY_LAMPU_PIN = Pin(16)  # GPIO16 untuk relay Lampu (sesuaikan dengan board Anda)
RELAY_KIPAS_PIN = Pin(17)  # GPIO17 untuk relay Kipas

# Setup pins sebagai output
RELAY_LAMPU_PIN.init(Pin.OUT)
RELAY_KIPAS_PIN.init(Pin.OUT)

def read_relay_state(device_name):
    """Baca status relay dari Firebase"""
    try:
        url = f"{FIREBASE_URL}/{device_name}.json"
        response = requests.get(url)
        if response.status_code == 200:
            value = response.json()
            return value == 1 or value == True or value == '1'
        return False
    except Exception as e:
        print(f"Error reading {device_name}:", e)
        return False

def control_relay():
    """Loop untuk membaca dan kontrol relay"""
    last_lampu = None
    last_kipas = None
    
    while True:
        # Baca status Lampu
        lampu_state = read_relay_state('lampu')
        if lampu_state != last_lampu:
            if lampu_state:
                RELAY_LAMPU_PIN.on()
                print("💡 LAMPU: ON")
            else:
                RELAY_LAMPU_PIN.off()
                print("💡 LAMPU: OFF")
            last_lampu = lampu_state
        
        # Baca status Kipas
        kipas_state = read_relay_state('kipas')
        if kipas_state != last_kipas:
            if kipas_state:
                RELAY_KIPAS_PIN.on()
                print("🍃 KIPAS: ON")
            else:
                RELAY_KIPAS_PIN.off()
                print("🍃 KIPAS: OFF")
            last_kipas = kipas_state
        
        time.sleep(1)  # Polling setiap 1 detik

if __name__ == '__main__':
    print("Microbit Relay Control started...")
    control_relay()
```

### **Opsi B: Menggunakan Arduino/ESP32 + Firebase SDK**

```cpp
// arduino_relay_control.ino
#include <WiFi.h>
#include <Firebase_ESP_Client.h>

// Firebase Config
#define API_KEY "AIzaSyDnKA1lBYAgLIH0Mc-m9tVCWM9yKEMGJYw"
#define DATABASE_URL "https://ujikom-iot-2026-default-rtdb.asia-southeast1.firebasedatabase.app"
#define WIFI_SSID "YOUR_SSID"
#define WIFI_PASSWORD "YOUR_PASSWORD"

// Relay Pins
#define RELAY_LAMPU 16
#define RELAY_KIPAS 17

FirebaseData firebaseData;
FirebaseAuth auth;
FirebaseConfig config;

void setup() {
  Serial.begin(115200);
  
  // Setup relay pins
  pinMode(RELAY_LAMPU, OUTPUT);
  pinMode(RELAY_KIPAS, OUTPUT);
  digitalWrite(RELAY_LAMPU, LOW);
  digitalWrite(RELAY_KIPAS, LOW);
  
  // Connect to WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected!");
  
  // Firebase Config
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

void loop() {
  // Baca Lampu
  if (Firebase.getInt(firebaseData, "/lampu")) {
    int lampuValue = firebaseData.intData();
    digitalWrite(RELAY_LAMPU, lampuValue == 1 ? HIGH : LOW);
    Serial.print("💡 Lampu: ");
    Serial.println(lampuValue == 1 ? "ON" : "OFF");
  }
  
  // Baca Kipas
  if (Firebase.getInt(firebaseData, "/kipas")) {
    int kipasValue = firebaseData.intData();
    digitalWrite(RELAY_KIPAS, kipasValue == 1 ? HIGH : LOW);
    Serial.print("🍃 Kipas: ");
    Serial.println(kipasValue == 1 ? "ON" : "OFF");
  }
  
  delay(1000); // Polling setiap 1 detik
}
```

---

## ✅ Checklist Debugging

- [ ] Firebase Rules memungkinkan read/write `/lampu` & `/kipas`?
- [ ] Console dashboard menunjukkan "set to: 1/0"?
- [ ] Nilai di Firebase Console berubah saat klik toggle?
- [ ] Microbit code terhubung ke WiFi?
- [ ] Microbit menampilkan log "ON/OFF" saat nilai berubah?
- [ ] Relay GPIO pins benar (sesuaikan dengan hardware)?
- [ ] Relay modul menerima 5V power?

---

## 🛠 Jika Masih Error

Kirim info berikut:
1. **Microbit model** (Microbit V2, ESP32, Arduino, dll)
2. **Console error** dari dashboard (F12 → Console)
3. **Relay module type** (4-channel, 8-channel, single relay?)
4. **Relay wiring diagram**

Saya siap bantu setup!
