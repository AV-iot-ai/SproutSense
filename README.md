# 🌱 SproutSense — IoT Smart Plant Care System

[![Backend](https://img.shields.io/badge/Backend-Render-46E3B7)](https://render.com)
[![Frontend](https://img.shields.io/badge/Frontend-Netlify-00C7B7)](https://netlify.com)
[![Database](https://img.shields.io/badge/Database-MongoDB_Atlas-13AA52)](https://mongodb.com/atlas)
[![ESP32](https://img.shields.io/badge/Hardware-ESP32-E7352C)](https://espressif.com)

> Production IoT platform for automated plant care using dual ESP32 + MERN stack.

---

## 🚨 CRITICAL: MongoDB Database Fix

**Symptom**: All sensor data saves to `test` database instead of `sproutsense`.

**Cause**: Your `MONGODB_URI` on Render doesn't include the database name.

**Fix — Update on Render Dashboard:**
```bash
# ❌ WRONG — defaults to "test" database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority

# ✅ CORRECT — explicitly sets "sproutsense"
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/sproutsense?retryWrites=true&w=majority
                                                                     ^^^^^^^^^^^
```

**Steps:**
1. Render Dashboard → Your backend service → **Environment** tab
2. Edit `MONGODB_URI` → add `/sproutsense` before the `?`
3. Save Changes → service auto-redeploys
4. Verify: `GET /api/config/health` → response must show `"dbName": "sproutsense"`
5. Confirm in MongoDB Atlas → Browse Collections → database = **`sproutsense`**

---

## 🏗️ Architecture

### Dual ESP32 System

| Device | ID | Role | Firmware |
|--------|-----|------|----------|
| ESP32 Dev Board | `ESP32-SENSOR-001` | Sensors + Pump + Flow + TFT | `esp32-upload/ESP32-SENSOR/ESP32-SENSOR.ino` |
| ESP32-CAM | `ESP32-CAM-001` | Image capture + Disease detection | `esp32-upload/ESP32_CAM_AI/ESP32_CAM_AI.ino` |

### Cloud Stack

```
ESP32-SENSOR-001  ──POST──►  Render Backend  ◄──►  Netlify Frontend
ESP32-CAM-001     ──POST──►  (Node.js/Express)        (React/Vite)
                                    │
                                    ▼
                          MongoDB Atlas
                        (DB: sproutsense)
                     ┌──────────────────────┐
                     │ sensorreadings       │
                     │ wateringlogs         │
                     │ diseasedetections    │
                     │ systemconfigs        │
                     │ devicestatuses       │
                     └──────────────────────┘
```

---

## 🔌 Hardware — ESP32-SENSOR-001

### Pin Configuration

| Component | GPIO | Type | Notes |
|-----------|------|------|-------|
| Soil Moisture | 35 | ADC1_CH7 | Capacitive v2.0 |
| pH Sensor | 34 | ADC1_CH6 | ZS-09 analog probe |
| LDR Light | 39 | ADC1_CH3 | → lux (0–100,000) |
| DHT22 | 13 | Digital | Temp + Humidity |
| **Relay (Pump)** | **14** | **Output** | **✅ Implemented** |
| **Flow Sensor** | **12** | **Interrupt** | **✅ YF-S401 implemented** |
| TFT CS | 5 | SPI | ST7735R display |
| TFT RST | 4 | SPI | |
| TFT DC | 27 | SPI | |

> ⚠️ **Use only ADC1 pins (32–39) for analog sensors — ADC2 conflicts with WiFi!**

### Flow Sensor (YF-S401) Wiring
```
YF-S401 RED    → 5V
YF-S401 BLACK  → GND
YF-S401 YELLOW → GPIO 12
```

### Relay (Pump) Wiring
```
Relay VCC → 5V
Relay GND → GND
Relay IN1 → GPIO 14
Pump power → External 5V 2A supply (NOT ESP32 pin!)
```

### Flow & Relay Code Status ✅

Both are fully implemented in `ESP32-SENSOR.ino`:

```cpp
// Flow sensor — interrupt-driven
#define PIN_FLOW_SENSOR  12
volatile unsigned long flowPulseCount = 0;
void IRAM_ATTR flowISR() { flowPulseCount++; }  // ISR
float volume = flowPulseCount / 5.5;            // mL

// Relay — pump control
#define PIN_RELAY 14
void startPump() { digitalWrite(PIN_RELAY, HIGH); }
void stopPump()  { digitalWrite(PIN_RELAY, LOW);  }

// Safety: stops at 100 mL target OR 20s max runtime
if (volume >= TARGET_WATER_ML || runtime >= PUMP_MAX_TIME) stopPump();
```

### Serial Commands (115200 baud)
```
h → Help menu
s → Show sensor readings
p → Pump ON (manual)
o → Pump OFF
w → WiFi status
b → Blynk status
t → TFT page test
m → Memory info
d → Full diagnostics
```

---

## 🖥️ TFT Display (ST7735R)

The firmware drives a 128×160 ST7735R display with 4 rotating pages (every 5s):

| Page | Content |
|------|---------|
| 1 | Soil & Environment — Moisture, pH, Light |
| 2 | Climate — Temperature, Humidity |
| 3 | Watering System — Pump state, Volume, Runtime |
| 4 | Network — WiFi, Blynk, IP, Uptime |

---

## 🚀 Production Deployment

### Backend — Render.com

**Settings:**
```
Root Directory : backend
Build Command  : npm install
Start Command  : npm start
Branch         : main
```

**Environment Variables:**
```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/sproutsense?retryWrites=true&w=majority
CLIENT_URL=https://your-app.netlify.app
GEMINI_API_KEY=your_key_here
```

**Health Check:** `GET /api/config/health`
```json
{ "status": "ok", "database": "connected", "dbName": "sproutsense" }
```

---

### Frontend — Netlify

**Settings:**
```
Base directory  : web
Build command   : npm run build
Publish directory: dist
Branch          : main
```

**Environment Variables:**
```bash
VITE_API_BASE_URL=https://sproutsense-backend.onrender.com/api
VITE_WS_URL=wss://sproutsense-backend.onrender.com
```

> ⚠️ Use `wss://` (secure WebSocket) not `ws://` for HTTPS sites

**netlify.toml** (already in repo):
```toml
[build]
  base = "web"
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

### Database — MongoDB Atlas

1. Create free **M0** cluster
2. Database user: `readWrite` privileges
3. Network Access: `0.0.0.0/0` (allow all for Render)
4. Connection string must end with `/sproutsense?...`
5. Collections auto-created on first backend start

**Collections:**
- `sensorreadings` — ESP32-SENSOR data
- `wateringlogs` — Irrigation events
- `diseasedetections` — ESP32-CAM AI results
- `systemconfigs` — Device configuration
- `devicestatuses` — Online/offline tracking

---

## 💻 Local Development

```bash
# Clone
git clone https://github.com/AV-iot-ai/SproutSense.git
cd SproutSense

# Backend
cd backend
npm install
# Create .env:
#   NODE_ENV=development
#   PORT=5000
#   MONGODB_URI=mongodb://localhost:27017/sproutsense
#   CLIENT_URL=http://localhost:3000
npm run dev

# Frontend (new terminal)
cd web
npm install
# Create .env:
#   VITE_API_BASE_URL=http://localhost:5000/api
#   VITE_WS_URL=ws://localhost:5000
npm run dev
```

---

## 📡 API Reference

**Base URL:** `https://sproutsense-backend.onrender.com/api`

### Sensor Endpoints
```
POST /api/sensors            — Submit reading (from ESP32)
GET  /api/sensors/latest     — Latest reading
GET  /api/sensors/history    — Paginated history
GET  /api/sensors/trends     — Hourly aggregates
GET  /api/sensors/export/csv — Download CSV
```

### Watering Endpoints
```
POST /api/water/start           — Start watering
POST /api/water/stop            — Stop watering
GET  /api/water/status/:id      — Current status
GET  /api/water/history         — Event log
GET  /api/water/today           — Today stats
```

### AI Endpoints
```
POST /api/ai/disease            — Submit detection (ESP32-CAM)
GET  /api/ai/recommend          — Watering recommendation
GET  /api/ai/insights           — Comprehensive analysis
POST /api/ai/chat               — Gemini AI chat
GET  /api/ai/disease/latest     — Latest detection
GET  /api/ai/disease/history    — Detection history
GET  /api/ai/disease/alerts     — Active alerts
```

### Config Endpoints
```
GET  /api/config/:deviceId      — Get config
POST /api/config                — Update config
GET  /api/config/status         — All device statuses
POST /api/config/status         — Device heartbeat
GET  /api/config/health         — Health check ← use this to verify DB name
POST /api/config/testmode       — Toggle mock data mode
```

---

## 🐛 Troubleshooting

### Data goes to `test` database
```
Fix: Update MONGODB_URI on Render → add /sproutsense before ?
Verify: curl /api/config/health → check dbName field
```

### Flow sensor reads 0.0 mL
```
Check: YF-S401 YELLOW wire → GPIO 12
Check: Flow direction arrow on sensor body
Check: Water actually flowing through sensor
Test:  Press 'p' in Serial Monitor → pulse count should increase
```

### Pump doesn't activate
```
Check: Relay IN1 → GPIO 14
Check: Relay has 5V power (separate from pump)
Check: Pump has external 5V 2A supply
Test:  Press 'd' in Serial Monitor for diagnostics
```

### Backend not receiving data
```
Check: BACKEND_URL in ESP32-SENSOR.ino points to Render URL
Check: WiFi connected (Serial → 'w' command)
Check: Render service is live (not sleeping)
Test:  curl /api/config/health
```

### ESP32-CAM disease always returns unknown
```
Check: Camera lens focus and cleanliness
Check: Adequate lighting (>500 lux)
Check: Edge Impulse model confidence threshold (default 70%)
```

---

## 📁 Repository Structure

```
SproutSense/
├── esp32-upload/
│   ├── ESP32-SENSOR/
│   │   └── ESP32-SENSOR.ino        ← ✅ Flow sensor + Relay implemented
│   └── ESP32_CAM_AI/
│       └── ESP32_CAM_AI.ino        ← AI disease detection firmware
│
├── backend/
│   └── src/
│       ├── server.js
│       ├── config/db.js             ← MongoDB connection
│       ├── models/                  ← Mongoose schemas
│       ├── controllers/             ← Business logic
│       └── routes/                  ← API endpoints
│
├── web/
│   └── src/
│       ├── App.jsx
│       ├── api.js
│       ├── components/
│       └── pages/
│           ├── HomePage.jsx
│           ├── RecordsPage.jsx      ← Reads from MongoDB
│           ├── AlertsPage.jsx
│           ├── InsightsPage.jsx
│           └── AIChat.jsx
│
├── docs/
│   └── WIRING_GUIDE.md
│
├── AI_PROJECT_CONTEXT.txt           ← Full technical documentation
└── PRESENTATION_10MIN_GUIDE.txt
```

---

## 📊 Performance Targets

| Metric | Target |
|--------|--------|
| Uptime | 97%+ |
| Sensor interval | Every 15s (backend), 5s (TFT) |
| Flow accuracy | ±10 mL per 100 mL cycle |
| Disease confidence | >70% threshold |
| API response | <500ms |

---

## 📝 Changelog

### v2.0 — March 14, 2026
- ✅ Flow sensor (YF-S401) fully implemented on GPIO 12
- ✅ Relay pump control on GPIO 14 with volume targeting
- ✅ TFT ST7735R display with 4 rotating pages
- ✅ Static IP support for ESP32
- ✅ MongoDB database fix (sproutsense, not test)
- ✅ Render + Netlify production deployment
- ✅ ESP32-CAM disease alerts in AlertsPage
- ✅ DeviceStatus offline bug fixed (5-min timeout)

### v1.0 — March 2, 2026
- Initial release with sensor reading and Blynk

---

## 📚 Additional Docs

- [Full Project Context](./AI_PROJECT_CONTEXT.txt)
- [Wiring Guide](./docs/WIRING_GUIDE.md)
- [Presentation Guide](./PRESENTATION_10MIN_GUIDE.txt)
- [Backend README](./backend/README.md)

---

**Happy Smart Gardening! 🌱💧🤖**  
*NIT Rourkela — MINOR PROJECT*