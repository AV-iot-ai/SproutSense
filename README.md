# SproutSense — IoT Smart Plant Care System

## Overview

**SproutSense** is a production-grade IoT platform for ESP32-based plant care. It streams 5 real-time sensor channels, auto-waters based on soil moisture, stores timestamped snapshots 5× per day, and integrates a Gemini-powered AI assistant for plant diagnostics.

**Key Capabilities:**
- 📊 Real-time sensor monitoring — moisture, pH, temperature, humidity, light intensity
- 💧 Smart auto-watering with daily schedule, timed runs, and safety limits
- 🤖 Gemini AI Chat — sensor-aware plant assistant (key set in Settings)
- 🗄️ MongoDB + 5×/day scheduled snapshots (06:00, 10:00, 14:00, 18:00, 22:00)
- 📈 Records page — paginated sensor history with sparklines, filters, CSV export
- 🔔 Alert system — live alert badge, severity-tiered AlertsPage
- 🔧 Settings page — theme, notifications, API keys, device config
- 📡 WebSocket real-time push from ESP32 → dashboard
- 🌐 ESP32-CAM ready with AI image analysis hooks

---

## File Structure

```
z:\MINOR _ PROJECT\ss\
├── src/                     # C++ source files (ESP32)
│   ├── main.cpp             # Main sketch (non-blocking loop)
│   ├── sensors.cpp          # All 5 sensor readers
│   ├── watering.cpp         # Irrigation FSM
│   ├── network.cpp          # Wi-Fi + Blynk
│   └── ai_hooks.cpp         # AI feature stubs
│
├── include/                 # Header files (ESP32)
│   ├── config.h             # Pin mapping & constants
│   ├── secrets.h.example    # Credentials template (COPY & EDIT)
│   ├── sensors.h
│   ├── watering.h
│   ├── network.h
│   └── ai_hooks.h
│
├── backend/                 # Node.js/Express backend with MongoDB
│   ├── src/
│   │   ├── server.js        # Main server entry point
│   │   ├── config/
│   │   │   └── db.js        # MongoDB connection
│   │   ├── models/          # Mongoose schemas
│   │   │   ├── SensorReading.js
│   │   │   ├── WateringLog.js
│   │   │   ├── SystemConfig.js
│   │   │   └── DeviceStatus.js
│   │   ├── controllers/     # Business logic
│   │   ├── routes/          # API endpoints
│   │   └── middleware/      # Error handling, etc.
│   ├── package.json
│   └── .env                 # Environment variables
│
├── web/                     # Vite web dashboard
│   ├── src/
│   │   ├── main.js          # Main application logic
│   │   ├── api.js           # Backend API client
│   │   └── style.css        # Styles
│   ├── index.html           # Dashboard UI
│   ├── package.json         # Dependencies
│   └── vite.config.js       # Vite configuration
│
└── docs/                    # Documentation
    ├── WIRING_GUIDE.md      # Hardware connection guide
    ├── IMPLEMENTATION_SUMMARY.md
    └── QUICK_REFERENCE.md
```

---

## Installation Steps

### Step 1: Set Up Arduino IDE / PlatformIO

#### Arduino IDE:
1. Install [Arduino IDE](https://www.arduino.cc/en/software)
2. Add ESP32 board support:
   - **File → Preferences**
   - Paste into "Additional Boards Manager URLs":
     ```
     https://dl.espressif.com/dl/package_esp32_index.json
     ```
   - **Tools → Board Manager** → Search "ESP32" → Install by Espressif
3. Select board: **Tools → Board → ESP32 Arduino → ESP32-CAM**
4. Select partition: **Tools → Partition Scheme → "Huge APP (3MB No OTA)"**
5. Select upload speed: **Tools → Upload Speed → 921600**

#### PlatformIO:
1. Install [VS Code](https://code.visualstudio.com/) + [PlatformIO extension](https://platformio.org/)
2. Create new project with board "ESP32-CAM"
3. Copy all files into `src/` folder
4. Configure upload speed and partition in `platformio.ini`

### Step 2: Install Required Libraries

#### Arduino IDE:
- **Sketch → Include Library → Manage Libraries**
- Search for and install:
  1. `Blynk` by Volodymyr Shymanskyy (latest)
  2. `DHT sensor library` by Adafruit (latest)
  3. `Arduino_JSON` by Arduino (for JSON parsing stubs)

#### PlatformIO:
Add to `platformio.ini`:
```ini
lib_deps = 
    blynk/Blynk@^1.2.0
    adafruit/DHT sensor library@^1.4.4
    bblanchon/ArduinoJson@^6.21.0
```

### Step 3: Configure Credentials

**Critical Step:** Create your own secrets file!

1. **Copy the template:**
   ```bash
   cp secrets.h.example secrets.h
   ```

2. **Edit `secrets.h` with your credentials:**

   ```cpp
   // WiFi
   const char* WIFI_SSID = "Your_WiFi_Network";
   const char* WIFI_PASSWORD = "Your_WiFi_Password";

   // Blynk (from https://blynk.cloud)
   const char* BLYNK_TEMPLATE_ID = "TMPL_XXXXXXXXXX";
   const char* BLYNK_AUTH_TOKEN = "YourAuthTokenHere";

   // OpenWeatherMap (from https://openweathermap.org/api)
   const char* OPENWEATHER_API_KEY = "your_api_key";
   const char* LOCATION_NAME = "Sambalpur,Odisha,IN";
   ```

3. **Keep `secrets.h` private!** (Never commit to git)

### Step 4: Verify Hardware Connections

Before uploading, review [WIRING_GUIDE.md](docs/WIRING_GUIDE.md):
- ✅ All sensors wired to correct GPIO pins (see `config.h`)
- ✅ Power rails properly connected (+5V, GND common ground)
- ✅ Pump connected through relay
- ✅ Flow sensor on GPIO 12 (interrupt-capable)

### Step 5: Upload Code to ESP32-CAM

#### Arduino IDE:
1. **Tools → Port** → Select your ESP32-CAM COM port
2. **Sketch → Upload** (or press Ctrl+U)
3. Watch upload progress

#### PlatformIO:
```bash
platformio run --target upload
```

### Step 6: Open Serial Monitor

```
Tools → Serial Monitor (or press Ctrl+Shift+M)
Baud: 115200
```

You should see:
```
╔════════════════════════════════════════════════════════╗
║         SPROTSENSE - Smart Plant Care System           ║
║           ESP32-CAM IoT Irrigation Controller           ║
╚════════════════════════════════════════════════════════╝

[SETUP] Starting initialization sequence...
[SETUP] Initializing sensors...
[SENSORS] Initialization complete
[SETUP] Initializing watering system...
[WATERING] System initialized
...
[SETUP] Initialization complete! Starting main loop.
```

### Step 7: Test Sensors & Hardware

In Serial Monitor, type these commands (without quotes):

```
t   → Run sensor self-test
     Output: PASS/FAIL for each sensor

s   → Show current sensor readings
     Output: Moisture %, pH, Temp, Humidity, Light %, Flow rate

r   → Test relay module
     You should hear relay click twice

p   → Turn pump ON (manual)
q   → Turn pump OFF (manual)
w   → Show watering state machine status
c   → Show Wi-Fi & Blynk connection status
d   → Full system diagnostics
m   → Memory info
?   → Help menu
```

### Step 8: Set Up Blynk Dashboard

**Create Mobile App Dashboard:**

1. **Download Blynk App** (iOS from App Store / Android from Play Store)

2. **Create Device:**
   - Tap "+" button
   - "Create New Device"
   - Paste `BLYNK_AUTH_TOKEN` from `secrets.h`
   - Name it "SproutSense"

3. **Add Virtual Pins to Dashboard:**

   | Pin | Widget Type | Display Name | Refresh |
   |---|---|---|---|
   | V0 | Gauge/Progress | Soil Moisture % | Auto |
   | V1 | Gauge/Number | pH Value | Auto |
   | V2 | Gauge/Thermometer | Temperature (°C) | Auto |
   | V3 | Gauge/Humidity | Humidity (%) | Auto |
   | V4 | Gauge/Progress | Light Level % | Auto |
   | V5 | Number | Water Volume (mL) | Auto |
   | V6 | Button | Manual Pump ON/OFF | - |
   | V7 | Button | Camera Snapshot | - |
   | V8 | Number | Watering Cycles/Hour | Auto |
   | V9 | Text | Last Watering | Auto |

4. **Enable Notifications:**
   - Menu → "Blynk Console" → Device notifications
   - Subscribe to push alerts on extreme conditions

---

## First Run Experience

### Immediate Feedback (First 30 seconds)

1. ✅ **Serial Monitor** shows startup messages
2. ✅ **Wi-Fi connects** (watch for "WiFi: CONNECTED")
3. ✅ **Blynk syncs** (watch for "Blynk: SYNCED")
4. ✅ **Sensors read** (every 5 seconds)
5. ✅ **Dashboard updates** (every 10 seconds)

### Testing Watering (First 5 minutes)

1. Get sensor readings:
   ```
   (Type 's' in Serial Monitor)
   Soil Moisture: 45%
   pH: 6.8
   Temperature: 28°C
   ...
   ```

2. Test manual pump:
   ```
   (Type 'p' to turn pump ON)
   [MANUAL] Pump started via override
   [WATERING] In progress: 12 / 100 mL
   [WATERING] In progress: 45 / 100 mL
   [WATERING] Target reached: 100 mL - entering cooldown
   (Type 'q' to turn pump OFF early)
   ```

3. Watch state machine:
   ```
   (Type 'w' in Serial Monitor)
   State: IDLE
   Pump Running: NO
   Current Cycle Volume: 0 mL
   Cycles this hour: 1 / 3
   ...
   ```

### Connect Your Plant

Once testing is complete:

1. Ensure **moisture sensor** is inserted into soil
2. **Flow sensor** is in the watering line
3. **Pump intake** is submerged in water
4. Keep **Serial Monitor open** at least 1 hour to watch first watering cycle

---

## Backend Setup (MongoDB)

A complete Node.js/Express backend with MongoDB provides data storage, analytics, and API services.

### Prerequisites

1. **Install MongoDB**:
   - **Windows**: Download from [mongodb.com](https://www.mongodb.com/try/download/community)
   - **Mac**: `brew install mongodb-community`
   - **Linux**: `sudo apt-get install mongodb`
   
   OR use **MongoDB Atlas** (cloud): [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)

2. **Install Node.js 18+**: [nodejs.org](https://nodejs.org/)

### Backend Installation

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment (already set up):
   - File: `backend/.env`
   - Update `MONGODB_URI` if using MongoDB Atlas
   - Update `ESP32_IP` to your device's IP address

4. Start MongoDB (if running locally):
   ```bash
   mongod
   ```

5. Start backend server:
   ```bash
   # Development with auto-reload
   npm run dev

   # Production
   npm start
   ```

6. Verify backend is running:
   - Open: `http://localhost:5000/api`
   - Should see: `{"success":true,"message":"Smart Watering System API",...}`

### Backend Features

- 🗄️ **MongoDB Database** - Stores all sensor readings, watering logs, and configuration
- 📡 **REST API** - Complete API for sensors, watering, config management
- 🔄 **WebSocket** - Real-time updates to dashboard (auto-refresh)
- 🤖 **AI Engine** - Smart watering recommendations based on historical data
- 📊 **Analytics** - Hourly averages, daily stats, trend analysis
- 🔒 **Security** - CORS, Helmet.js security headers

### API Endpoints

```
GET  /api/sensors              # Latest sensor readings
GET  /api/sensors/history      # Historical data
POST /api/water/start          # Start watering
POST /api/water/stop           # Stop watering
GET  /api/ai/recommend         # AI recommendation
GET  /api/config               # System configuration
POST /api/config               # Update configuration
```

Full API documentation: [backend/README.md](backend/README.md)

---

## Web Dashboard (Optional)

A modern Vite-based web interface is included for browser-based monitoring and control.

### Setup Web Dashboard

**Note**: The backend server must be running first!

1. Navigate to web directory:
   ```bash
   cd web
   ```

2. Install dependencies:
   ```bash
   npm install
   Start development server:
   ```bash
   npm run dev
   ```

4  ```

5. Open browser to: `http://localhost:3000`

### Web Dashboard Features

- 📊 **Real-time monitoring** - Sensor readings update every 5 seconds
- 💧 **Manual controls** - Start/stop watering with buttons
- 🤖 **AI recommendations** - View smart watering suggestions
- ⚙️ **Configuration** - Adjust moisture threshold and auto-mode
- 📊 **Real-time monitoring** - Sensor readings update every 5 seconds via WebSocket
- 💧 **Manual controls** - Start/stop watering with buttons
- 🤖 **AI recommendations** - Smart watering suggestions
- ⚙️ **Configuration** - Adjust moisture threshold and auto-mode
- 📱 **Responsive design** - Works on desktop, tablet, and mobile
- 📈 **Historical charts** - View sensor trends over time
```bash
cd web
npm run build
```

The production files will be in `web/dist/` - you can serve these from any web server or upload to the ESP32 if you add a web server to the firmware.

---

## Configuration & Calibration

### Moisture Sensor Calibration

Capacitive sensors vary by brand. Adjust in `config.h`:

```cpp
#define MOISTURE_ADC_DRY          2800  // ADC reading when soil is dry
#define MOISTURE_ADC_WET          1200  // ADC reading when soil is saturated
```

**How to calibrate:**
1. Read dry soil: Type `s` in Serial Monitor, note raw ADC (use multimeter on GPIO 35)
2. Read wet soil: Add water, note new ADC
3. Update constants in `config.h`
4. Recompile and upload

### pH Sensor Calibration

Requires pH 4.0 and pH 7.0 buffer solutions:

```cpp
#define PH_CALIBRATION_VOLTAGE_PH4  3.3  // Voltage at pH 4.0 buffer
#define PH_CALIBRATION_VOLTAGE_PH7  2.5  // Voltage at pH 7.0 buffer
```

**Two-Point Calibration Procedure:**
1. Immerse pH probe in pH 7.0 buffer
2. Read voltage: Type `s`, note pH sensor output
3. Update `PH_CALIBRATION_VOLTAGE_PH7`
4. Repeat for pH 4.0 buffer
5. Recompile

### Flow Sensor Calibration (YF-S401)

Default: 5.5 pulses per mL. Adjust if needed:

```cpp
#define FLOW_SENSOR_PULSES_PER_ML 5.5
```

**Test procedure:**
1. Collect water from pump in measuring cup
2. Watch Serial output: `Flow Rate: X.X ml/min`
3. Compare with actual mL dispensed
4. Adjust constant proportionally

### Watering Parameters

Edit in `config.h`:

```cpp
#define MOISTURE_THRESHOLD_PERCENT     30.0  // Water when below 30%
#define MAX_WATERING_CYCLES_PER_HOUR   3     // Safety limit
#define TARGET_WATER_VOLUME_ML         100.0 // Volume per cycle
#define PUMP_MAX_RUNTIME_MS            20000 // 20 sec timeout
#define WATERING_COOLDOWN_MS           20000 // 20 min between cycles
```

---

## Advanced Features

### Enable AI Feature Hooks

These are optional stubs. When implemented, they provide:

**Edge Impulse (Disease Detection):**
```cpp
#define ENABLE_DISEASE_DETECTION true
// Captures image daily, sends to Edge Impulse classifier
// Triggers alert if disease detected (>70% confidence)
```

**Google Gemini (AI Advice):**
```cpp
#define ENABLE_GEMINI_ADVICE true
// Requests plant care advice hourly based on sensor data
// Sends recommendation via Blynk notification
```

**Google Assistant (Voice Control):**
```cpp
#define ENABLE_VOICE_CONTROL true
// Hooks for IFTTT "water my plant" voice command
// Responds to queries via Blynk/email
```

### Weather-Based Watering

OpenWeatherMap integration is a **TODO stub** in `network.cpp::fetchWeatherAndUpdateRainFlag()`:

Steps to implement:
1. Get free API key: https://openweathermap.org/api
2. Update `secrets.h` with your key
3. Implement HTTP GET in `fetchWeatherAndUpdateRainFlag()`
4. Parse JSON for rain probability
5. Skip watering if rain expected (>50% chance)

---

## Troubleshooting

### Issue: Code won't compile

**Error:** `error: 'DHT' was not declared`  
**Fix:** Install DHT library via Library Manager (search "DHT sensor")

**Error:** `error: 'Blynk' was not declared`  
**Fix:** Install Blynk library (search "Blynk")

**Error:** `fatal error: secrets.h: No such file or directory`  
**Fix:** Copy `secrets.h.example` to `secrets.h` and fill in credentials

---

### Issue: sensors always report 0 or -1

**Problem:** ADC pins not reading properly  
**Solutions:**
- Check pin mapping in `config.h` matches your wiring
- Verify sensor VCC is powered (+5V rail for analog sensors)
- Check GND connections are solid
- Try typing `t` in Serial Monitor to run self-test

---

### Issue: Won't connect to Wi-Fi

**Problem:** SSID/password incorrect  
**Solutions:**
- Check `secrets.h` for typos (case-sensitive!)
- Verify 2.4 GHz network (ESP32 doesn't support 5 GHz)
- Check router allows IoT devices

**Watch in Serial Monitor:**
```
[WIFI] Connecting to ...
[WIFI] ..........  ← Too many dots = connection failure
[WIFI] Connected!  ← Success
```

---

### Issue: Blynk shows "offline"

**Problem:** Device not reaching Blynk cloud  
**Solutions:**
- Verify Wi-Fi is working first (check `c` command output)
- Verify auth token in `secrets.h` matches Blynk device
- Check internet speed (minimum 1 Mbps recommended)
- Restart device (type 'd' then power cycle)

---

### Issue: Pump runs but water not dispensed

**Problem:** Flow sensor not detecting water  
**Solutions:**
- Verify sensor mounted correctly in water line (flow direction matters)
- Check sensor not clogged with sediment
- Verify yellow pulse wire on GPIO 12
- Test with `t` command (self-test includes flow)

---

### Issue: Manual pump button in Blynk doesn't work

**Problem:** Virtual pin messages not reaching device  
**Solutions:**
- Verify Blynk is synced: `c` command shows "SYNCED"
- Restart Blynk app (force close and reopen)
- Check pump relay actually energizes when button pressed
- Watch Serial for: `[BLYNK] Manual pump ON`

---

## Monitoring & Reliability

### Uptime Tracking

The system logs uptime automatically. Check via Serial:
```
d   → Shows uptime in hours and minutes
     Target: 97%+ over 1 month = max 21.6 hours downtime
```

### Memory Management

Monitor available RAM:
```
m   → Shows free heap memory and max allocable block
     Watch for memory leaks (free memory decreasing over time)
     Restart if free heap drops below 50 KB
```

### Logging & History

Sensor readings are logged every 60 seconds (7-day history):
- Visible in Blynk virtual pin charts
- Useful for trend analysis
- Helps detect sensor drift over time

---

## Maintenance Schedule

| Task | Frequency | Notes |
|---|---|---|
| pH sensor rinse | After each calib | Use distilled water |
| Moisture sensor | Weekly | Let dry between uses |
| Flow sensor clean | Monthly | Check for sediment |
| Water reservoir | Weekly | Refill as needed |
| Pump test | Weekly | Manual pump cycle |
| Sensor calibration | Monthly | Verify drifts |
| Software update | As released | Pull latest from repo |

---

## Performance Targets

| Metric | Target | Typical |
|---|---|---|
| Uptime | 97%+ | 99%+ with proper power |
| Sensor accuracy | ±5% | ±3% with calibration |
| Response time | <5 sec | <2 sec (Blynk) |
| Watering precision | ±10% | ±5% (flow sensor) |
| Battery life | N/A | Continuous (5V powered) |

---

## Support & Documentation

- 📖 **Wiring:** [WIRING_GUIDE.md](docs/WIRING_GUIDE.md)
- 🔧 **API Reference:** Check individual `.h` files for function documentation
- 💬 **Serial Commands:** Type `?` in Serial Monitor for help
- 🌐 **Blynk Docs:** https://docs.blynk.io
- 📡 **OpenWeatherMap:** https://openweathermap.org/api
- 🤖 **Edge Impulse:** https://edgeimpulse.com/
- 🎤 **IFTTT:** https://ifttt.com/maker

---

## FAQ

**Q: Can I use this with a different water pump?**  
A: Yes! Update `PUMP_MAX_RUNTIME_MS` and flow sensor calibration (pulses per mL).

**Q: Does it work with different soil sensors?**  
A: Yes! Adjust `MOISTURE_ADC_DRY` and `MOISTURE_ADC_WET` constants.

**Q: Can I add more zones (multiple plants)?**  
A: Yes! Use relay CH2 (GPIO 15) and add second pump/sensor set.

**Q: What if I lose Wi-Fi?**  
A: Device gracefully degrades. Local sensors still work. Blynk sync disabled until reconnected.

**Q: Is the code open source?**  
A: Yes! MIT license. Modify and redistribute freely with attribution.

---

## Changelog

**v1.0.0 (Initial Release - March 2, 2026)**
- ✅ Core sensor integration (moisture, pH, DHT, LDR, flow)
- ✅ Watering FSM with safety rules
- ✅ Blynk IoT sync
- ✅ Non-blocking main loop
- ✅ AI feature hooks (stubs)
- ✅ Wiring documentation

**Planned (v1.1.0+)**
- 🔜 OpenWeatherMap API implementation
- 🔜 Edge Impulse disease detection
- 🔜 Google Gemini advice generation
- 🔜 IFTTT voice command handler
- 🔜 SD card data logging

---

## License

MIT License - Free to use, modify, and distribute.

---

**Happy gardening with SproutSense! 🌱💚**

For issues or feature requests, refer to the troubleshooting section above or review the code comments in each `.cpp` file.
