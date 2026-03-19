// =====================================================
// SPROUTSENSE ESP32-SENSOR — FINAL PRODUCTION v2.1
// Board: ESP32 Dev Module
// Sensors: Soil Moisture, pH, LDR, DHT22
// Actuators: Relay (GPIO 14) + Flow Sensor (GPIO 12)
// Display: TFT ST7735R (SPI)
// Backend: Render.com
// =====================================================
//
// ARDUINO IDE SETTINGS:
//   Board           : ESP32 Dev Module
//   Upload Speed    : 921600
//   CPU Frequency   : 240 MHz
//   Flash Size      : 4MB (32Mb)
//   Partition Scheme: Huge APP (3MB No OTA)
//   Flash Mode      : QIO
//
// REQUIRED LIBRARIES:
//   - DHT sensor library     (Adafruit)
//   - Adafruit GFX Library   (Adafruit)
//   - Adafruit ST7735        (Adafruit)
//   - ArduinoJson            (Benoit Blanchon)
//   - HTTPClient             (built-in ESP32)
//
// BACKEND FIELD NAMES (match schema exactly):
//   soilMoisture  -> 0-100 (%)
//   pH            -> 0-14   *** capital H! ***
//   light         -> 0-100000 (lux)
//   temperature   -> Celsius
//   humidity      -> 0-100 (%)
//   flowRate      -> mL/min  (calculated, not raw volume)
//   flowVolume    -> mL dispensed total
//   deviceId      -> "ESP32-SENSOR"
// =====================================================


// ========== LIBRARIES ==========
#include <WiFi.h>
#include <DHT.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <SPI.h>
#include <Adafruit_GFX.h>
#include <Adafruit_ST7735.h>


// ========== WIFI CREDENTIALS ==========
const char* WIFI_SSID     = "@Connect";
const char* WIFI_PASSWORD = "qwertyomm";


// ========== STATIC IP (optional) ==========
#define STATICIP_ENABLED true
const uint8_t STATIC_IP[]      = {192, 168, 1, 120};
const uint8_t STATIC_GATEWAY[] = {192, 168, 1,   1};
const uint8_t STATIC_SUBNET[]  = {255, 255, 255, 0};
const uint8_t STATIC_DNS1[]    = {8,   8,   8,   8};


// ========== BACKEND URLs ==========
// FIX 5A: Added HEARTBEAT_URL for device online/offline status on dashboard
const char* BACKEND_URL   = "https://sproutsense-backend.onrender.com/api/sensors";
const char* HEARTBEAT_URL = "https://sproutsense-backend.onrender.com/api/config/status";
const char* DEVICE_ID     = "ESP32-SENSOR";


// ========== PIN CONFIGURATION (ADC1 ONLY — WiFi safe) ==========
#define PIN_SOIL_MOISTURE  35   // ADC1_CH7 — Capacitive moisture sensor
#define PIN_PH_SENSOR      34   // ADC1_CH6 — Analog pH probe
#define PIN_LDR            39   // ADC1_CH3 — LDR light sensor
#define PIN_DHT            13   // Digital   — DHT22 temperature/humidity
#define PIN_RELAY          14   // Output    — Relay CH1 → Water pump
#define PIN_FLOW_SENSOR    12   // Interrupt — YF-S401 flow meter

// TFT ST7735R (128x160) — Hardware SPI
#define PIN_TFT_CS   5
#define PIN_TFT_RST  4
#define PIN_TFT_DC   27
// MOSI = GPIO 23, SCLK = GPIO 18 (fixed hardware SPI)


// ========== SENSOR SETTINGS ==========
#define DHT_TYPE           DHT22
#define MOISTURE_THRESHOLD 30.0    // Auto-water below this %
#define TARGET_WATER_ML    100.0   // Volume per watering cycle
#define PUMP_MAX_TIME_MS   20000   // Safety timeout (20 seconds)

// Moisture ADC calibration
#define MOISTURE_ADC_DRY   2800
#define MOISTURE_ADC_WET   1200

// LDR calibration
#define LUX_MAX 100000.0

// Flow sensor calibration
#define FLOW_PULSES_PER_ML  5.5    // YF-S401: adjust if measurement drifts


// ========== TIMING (milliseconds) ==========
#define INTERVAL_SENSORS   5000    // Read sensors every 5s
#define INTERVAL_BACKEND   15000   // Send to backend every 15s
#define INTERVAL_TFT       5000    // Update TFT every 5s
#define INTERVAL_HEARTBEAT 30000   // Heartbeat every 30s


// ========== OBJECTS ==========
DHT dht(PIN_DHT, DHT_TYPE);
Adafruit_ST7735 tft = Adafruit_ST7735(PIN_TFT_CS, PIN_TFT_DC, PIN_TFT_RST);


// ========== TFT COLORS ==========
#define C_BLACK   0x0000
#define C_WHITE   0xFFFF
#define C_CYAN    0x07FF
#define C_GREEN   0x07E0
#define C_YELLOW  0xFFE0
#define C_RED     0xF800
#define C_ORANGE  0xFD20
#define C_LGRAY   0xC618
#define C_DGRAY   0x4208


// ========== FORWARD DECLARATIONS ==========
// FIX 6: Prevents "not declared in this scope" error since
//        loop() calls handleSerialCommand() which is defined later
void handleSerialCommand(char cmd);


// ========== FLOW SENSOR (interrupt-driven) ==========
volatile unsigned long flowPulseCount = 0;

void IRAM_ATTR flowISR() {
  flowPulseCount++;
}

float getFlowVolumeMl() {
  return (float)flowPulseCount / FLOW_PULSES_PER_ML;
}

void resetFlowCounter() {
  flowPulseCount = 0;
}


// ========== PUMP CONTROL ==========
bool pumpRunning   = false;
bool manualPump    = false;
unsigned long pumpStartTime = 0;

void startPump() {
  resetFlowCounter();
  digitalWrite(PIN_RELAY, HIGH);
  pumpRunning   = true;
  pumpStartTime = millis();
  Serial.println("[PUMP] ON — target: " + String(TARGET_WATER_ML) + " mL");
}

void stopPump() {
  digitalWrite(PIN_RELAY, LOW);
  pumpRunning = false;
  Serial.printf("[PUMP] OFF — dispensed: %.1f mL in %lums\n",
    getFlowVolumeMl(), millis() - pumpStartTime);
}

void updatePumpLogic() {
  if (!pumpRunning) return;
  float vol             = getFlowVolumeMl();
  unsigned long runtime = millis() - pumpStartTime;
  if (vol >= TARGET_WATER_ML) {
    Serial.println("[PUMP] Target volume reached");
    stopPump();
  } else if (runtime >= PUMP_MAX_TIME_MS) {
    Serial.println("[PUMP] Safety timeout — stopping");
    stopPump();
  }
}


// ========== CACHED SENSOR VALUES ==========
float cachedMoisture = 0;
float cachedPH       = 7.0;
float cachedLux      = 0;
float cachedTemp     = 25.0;    // FIX 6: Sensible default (not 0) so first
float cachedHumidity = 50.0;    //        backend POST has realistic fallback
bool  dhtValid       = false;


// ========== SENSOR READ FUNCTIONS ==========
float readSoilMoisture() {
  int raw = analogRead(PIN_SOIL_MOISTURE);
  float pct = (float)(MOISTURE_ADC_DRY - raw) /
              (float)(MOISTURE_ADC_DRY - MOISTURE_ADC_WET) * 100.0;
  return constrain(pct, 0.0, 100.0);
}

float readPH() {
  long sum = 0;
  for (int i = 0; i < 5; i++) {
    sum += analogRead(PIN_PH_SENSOR);
    delayMicroseconds(200);
  }
  float voltage = (sum / 5.0 / 4095.0) * 3.3;
  return constrain(7.0 - ((voltage - 2.5) / 0.18), 0.0, 14.0);
}

float readLux() {
  return (analogRead(PIN_LDR) / 4095.0) * LUX_MAX;
}

void updateAllSensors() {
  cachedMoisture = readSoilMoisture();
  cachedPH       = readPH();
  cachedLux      = readLux();
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  // Only update cache if DHT gives valid reading
  // Keeps last known good values instead of overwriting with NaN
  if (!isnan(t) && !isnan(h)) {
    cachedTemp = t; cachedHumidity = h; dhtValid = true;
  }
}

void printSensors() {
  Serial.printf("[SENSORS] Moisture:%.1f%% pH:%.2f Lux:%.0f",
    cachedMoisture, cachedPH, cachedLux);
  if (dhtValid)
    Serial.printf(" Temp:%.1fC Hum:%.1f%%", cachedTemp, cachedHumidity);
  else
    Serial.print(" Temp:CACHED Hum:CACHED");
  Serial.printf(" Flow:%.1fmL Pump:%s\n",
    getFlowVolumeMl(), pumpRunning ? "ON" : "OFF");
}


// ========== AUTO WATERING ==========
void checkAutoWatering() {
  if (pumpRunning || manualPump) return;
  if (cachedMoisture < MOISTURE_THRESHOLD) {
    Serial.printf("[AUTO] Moisture %.1f%% < %.0f%% — starting pump\n",
      cachedMoisture, MOISTURE_THRESHOLD);
    startPump();
  }
}


// ========== HEARTBEAT ==========
// FIX 5: Tells backend this device is ONLINE every 30s
//        Without this, dashboard shows ESP32-SENSOR as OFFLINE always
void sendHeartbeat() {
  if (WiFi.status() != WL_CONNECTED) return;

  StaticJsonDocument<256> doc;
  doc["deviceId"]     = DEVICE_ID;
  doc["online"]       = true;
  doc["pumpActive"]   = pumpRunning;
  doc["currentState"] = pumpRunning ? "WATERING" : "IDLE";
  doc["ipAddress"]    = WiFi.localIP().toString();
  doc["uptime"]       = millis() / 1000;

  String payload;
  serializeJson(doc, payload);

  HTTPClient http;
  http.begin(HEARTBEAT_URL);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(5000);
  int code = http.POST(payload);
  http.end();
  Serial.printf("[HEARTBEAT] %d | Pump:%s | Uptime:%lus\n",
    code, pumpRunning ? "ON" : "OFF", millis() / 1000);
}


// ========== BACKEND SYNC ==========
void sendToBackend() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[BACKEND] Skipped — no WiFi");
    return;
  }

  // FIX 3: Correct flowRate = mL/min (not volume)
  //        Volume dispensed over runtime gives actual rate
  float flowRateMlPerMin = 0.0;
  if (pumpRunning) {
    float runtimeMin = (millis() - pumpStartTime) / 60000.0;
    if (runtimeMin > 0.0)
      flowRateMlPerMin = getFlowVolumeMl() / runtimeMin;
  }

  StaticJsonDocument<512> doc;
  doc["deviceId"]     = DEVICE_ID;
  doc["soilMoisture"] = round(cachedMoisture * 10) / 10.0;   // 0-100 %
  doc["pH"]           = round(cachedPH * 100) / 100.0;       // capital H!
  doc["light"]        = (int)cachedLux;                       // lux

  // FIX 6: Always send last known good temp/humidity (cached)
  //        Schema requires these fields — never skip or send fake 0
  doc["temperature"]  = round(cachedTemp * 10) / 10.0;
  doc["humidity"]     = round(cachedHumidity * 10) / 10.0;

  doc["flowRate"]     = round(flowRateMlPerMin * 10) / 10.0; // mL/min
  doc["flowVolume"]   = round(getFlowVolumeMl() * 10) / 10.0;// total mL

  String payload;
  serializeJson(doc, payload);
  Serial.println("[BACKEND] Sending: " + payload);

  // FIX 4: Retry up to 3 times — handles Render cold-start & WiFi hiccups
  int code = -1;
  for (int attempt = 0; attempt < 3 && code != 200 && code != 201; attempt++) {
    if (attempt > 0) {
      Serial.printf("[BACKEND] Retry %d/2...\n", attempt);
      delay(3000);
    }
    HTTPClient http;
    http.begin(BACKEND_URL);
    http.addHeader("Content-Type", "application/json");
    http.setTimeout(10000); // 10s — Render cold starts can be slow
    code = http.POST(payload);
    if (code == 200 || code == 201) {
      Serial.println("[BACKEND] OK (" + String(code) + ") — saved to sproutsense DB");
    } else {
      Serial.printf("[BACKEND] Attempt %d failed: %d\n", attempt + 1, code);
    }
    http.end();
  }

  if (code != 200 && code != 201) {
    Serial.println("[BACKEND] All 3 attempts failed — data lost for this cycle");
  }
}


// ========== TFT DISPLAY ==========
uint8_t tftPage = 0;
unsigned long lastTFTUpdate = 0;

void updateTFTDisplay() {
  tft.fillScreen(C_BLACK);
  tft.setTextSize(1);
  tft.setCursor(2, 2);
  tft.setTextColor(C_CYAN);  tft.print("SPROUTSENSE ");
  tft.setTextColor(C_DGRAY); tft.printf("P%u/4", tftPage + 1);
  tft.drawLine(0, 12, 160, 12, C_DGRAY);

  switch (tftPage) {
    case 0: // Soil & Light
      tft.setCursor(5, 18); tft.setTextColor(C_YELLOW);  tft.println("SOIL & LIGHT");
      tft.setCursor(5, 32);
      tft.setTextColor(cachedMoisture < 30 ? C_RED : C_GREEN);
      tft.printf("Moisture : %.1f%%\n", cachedMoisture);
      tft.setCursor(5, 46);
      tft.setTextColor((cachedPH < 5.5 || cachedPH > 7.5) ? C_ORANGE : C_GREEN);
      tft.printf("pH       : %.2f\n", cachedPH);
      tft.setCursor(5, 60);
      tft.setTextColor(cachedLux < 2000 ? C_RED : C_GREEN);
      tft.printf("Light    : %.0f lux\n", cachedLux);
      break;

    case 1: // Climate
      tft.setCursor(5, 18); tft.setTextColor(C_YELLOW); tft.println("CLIMATE");
      if (dhtValid) {
        tft.setTextSize(2);
        tft.setCursor(10, 36); tft.setTextColor(C_CYAN);
        tft.printf("%.1fC\n", cachedTemp);
        tft.setTextSize(1);
        tft.setCursor(5, 62); tft.setTextColor(C_LGRAY); tft.println("Temperature");
        tft.setTextSize(2);
        tft.setCursor(10, 78); tft.setTextColor(C_GREEN);
        tft.printf("%.0f%%\n", cachedHumidity);
        tft.setTextSize(1);
        tft.setCursor(5, 100); tft.setTextColor(C_LGRAY); tft.println("Humidity");
      } else {
        tft.setCursor(5, 36); tft.setTextColor(C_ORANGE);
        tft.printf("%.1fC (cached)\n", cachedTemp);
        tft.setCursor(5, 52); tft.setTextColor(C_ORANGE);
        tft.printf("%.0f%% (cached)\n", cachedHumidity);
        tft.setCursor(5, 70); tft.setTextColor(C_RED);
        tft.println("DHT22 offline!");
        tft.println("Check GPIO 13");
      }
      break;

    case 2: // Watering
      tft.setCursor(5, 18); tft.setTextColor(C_YELLOW); tft.println("WATERING");
      tft.setCursor(5, 32);
      tft.setTextColor(pumpRunning ? C_GREEN : C_LGRAY);
      tft.printf("Pump     : %s\n", pumpRunning ? "ON" : "OFF");
      tft.setCursor(5, 46); tft.setTextColor(C_CYAN);
      tft.printf("Volume   : %.1f mL\n", getFlowVolumeMl());
      tft.setCursor(5, 60); tft.setTextColor(C_DGRAY);
      tft.printf("Target   : %.0f mL\n", TARGET_WATER_ML);
      tft.setCursor(5, 74); tft.setTextColor(C_DGRAY);
      tft.printf("Threshold: %.0f%%\n", MOISTURE_THRESHOLD);
      if (pumpRunning) {
        tft.setCursor(5, 88); tft.setTextColor(C_ORANGE);
        tft.printf("Runtime  : %lus", (millis() - pumpStartTime) / 1000);
      }
      break;

    case 3: // Network
      tft.setCursor(5, 18); tft.setTextColor(C_YELLOW); tft.println("NETWORK");
      tft.setCursor(5, 32);
      tft.setTextColor(WiFi.status() == WL_CONNECTED ? C_GREEN : C_RED);
      tft.printf("WiFi  : %s\n",
        WiFi.status() == WL_CONNECTED ? "OK" : "FAIL");
      if (WiFi.status() == WL_CONNECTED) {
        tft.setCursor(5, 46); tft.setTextColor(C_LGRAY);
        tft.print(WiFi.localIP().toString().c_str());
        tft.setCursor(5, 58); tft.setTextColor(C_LGRAY);
        tft.printf("RSSI  : %d dBm", WiFi.RSSI());
      }
      tft.setCursor(5, 72); tft.setTextColor(C_CYAN);
      tft.printf("Uptime: %lu min", millis() / 60000);
      // Show DHT status on network page too
      tft.setCursor(5, 86); tft.setTextColor(dhtValid ? C_GREEN : C_RED);
      tft.printf("DHT22 : %s", dhtValid ? "OK" : "ERR");
      break;
  }
}


// ========== TIMERS ==========
unsigned long lastSensorRead  = 0;
unsigned long lastBackendSync = 0;
unsigned long lastHeartbeat   = 0;   // FIX 5B: Heartbeat timer


// ========== SETUP ==========
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n====================================");
  Serial.println("  SPROUTSENSE ESP32-SENSOR v2.1");
  Serial.println("  Flow + Relay + TFT + Cloud");
  Serial.println("====================================\n");

  // TFT init
  tft.initR(INITR_BLACKTAB);
  tft.setRotation(1);
  tft.fillScreen(C_BLACK);
  tft.setTextColor(C_CYAN); tft.setTextSize(1);
  tft.setCursor(5, 5);  tft.println("SproutSense v2.1");
  tft.setCursor(5, 20); tft.setTextColor(C_WHITE); tft.println("Initializing...");

  // GPIO
  pinMode(PIN_RELAY, OUTPUT);
  digitalWrite(PIN_RELAY, LOW); // Pump OFF at boot
  pinMode(PIN_FLOW_SENSOR, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(PIN_FLOW_SENSOR), flowISR, FALLING);
  Serial.println("[INIT] Relay GPIO 14 — OFF");
  Serial.println("[INIT] Flow sensor GPIO 12 — interrupt attached");

  // ADC
  analogSetWidth(12);
  analogSetAttenuation(ADC_11db);

  // DHT warmup
  dht.begin();
  delay(2500);
  for (int i = 0; i < 3; i++) {
    float t = dht.readTemperature();
    float h = dht.readHumidity();
    if (!isnan(t) && !isnan(h)) {
      cachedTemp = t; cachedHumidity = h; dhtValid = true;
      Serial.printf("[DHT] Warmup OK: %.1fC %.1f%%\n", t, h);
      break;
    }
    delay(2000);
  }
  if (!dhtValid) Serial.println("[DHT] Warmup failed — using defaults, check GPIO 13");

  // WiFi
  WiFi.mode(WIFI_STA);
#if STATICIP_ENABLED
  IPAddress ip(STATIC_IP[0],      STATIC_IP[1],      STATIC_IP[2],      STATIC_IP[3]);
  IPAddress gw(STATIC_GATEWAY[0], STATIC_GATEWAY[1], STATIC_GATEWAY[2], STATIC_GATEWAY[3]);
  IPAddress sn(STATIC_SUBNET[0],  STATIC_SUBNET[1],  STATIC_SUBNET[2],  STATIC_SUBNET[3]);
  IPAddress d1(STATIC_DNS1[0],    STATIC_DNS1[1],    STATIC_DNS1[2],    STATIC_DNS1[3]);
  WiFi.config(ip, gw, sn, d1);
  Serial.printf("[WIFI] Static IP: %d.%d.%d.%d\n",
    STATIC_IP[0], STATIC_IP[1], STATIC_IP[2], STATIC_IP[3]);
#endif
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.printf("[WIFI] Connecting to %s", WIFI_SSID);
  int tries = 0;
  while (WiFi.status() != WL_CONNECTED && tries < 30) {
    delay(500); Serial.print("."); tries++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n[WIFI] Connected! IP: %s\n",
      WiFi.localIP().toString().c_str());
    tft.setCursor(5, 35); tft.setTextColor(C_GREEN);
    tft.print(WiFi.localIP().toString().c_str());
    // FIX 5: Send first heartbeat immediately after WiFi connects
    sendHeartbeat();
  } else {
    Serial.println("\n[WIFI] FAILED — will retry in loop");
    tft.setCursor(5, 35); tft.setTextColor(C_RED); tft.println("WiFi FAILED");
  }

  delay(2000);
  tft.fillScreen(C_BLACK);
  Serial.println("\n>>> SPROUTSENSE v2.1 READY <<<");
  Serial.println("Commands: h=help s=sensors p=pump-on o=pump-off w=wifi d=diag b=send");
  Serial.println("Backend : " + String(BACKEND_URL));
  Serial.println("Heartbt : " + String(HEARTBEAT_URL));
  Serial.println("DB      : sproutsense (set MONGODB_URI on Render!)\n");
}


// ========== MAIN LOOP ==========
void loop() {
  unsigned long now = millis();

  // Auto-reconnect WiFi
  if (WiFi.status() != WL_CONNECTED) {
    static unsigned long lastReconnect = 0;
    if (now - lastReconnect > 30000) {
      lastReconnect = now;
      Serial.println("[WIFI] Reconnecting...");
      WiFi.reconnect();
    }
  }

  // Read sensors every 5s
  if (now - lastSensorRead >= INTERVAL_SENSORS) {
    lastSensorRead = now;
    updateAllSensors();
    printSensors();
    checkAutoWatering();
  }

  // Send to backend every 15s
  if (now - lastBackendSync >= INTERVAL_BACKEND) {
    lastBackendSync = now;
    sendToBackend();
  }

  // FIX 5C: Heartbeat every 30s — shows device ONLINE on dashboard
  if (now - lastHeartbeat >= INTERVAL_HEARTBEAT) {
    lastHeartbeat = now;
    sendHeartbeat();
  }

  // Update TFT every 5s
  if (now - lastTFTUpdate >= INTERVAL_TFT) {
    lastTFTUpdate = now;
    updateTFTDisplay();
    tftPage = (tftPage + 1) % 4;
  }

  // Pump safety logic
  updatePumpLogic();

  // Serial commands
  if (Serial.available()) {
    handleSerialCommand((char)Serial.read());
  }

  delay(50); // Yield to RTOS
}


// ========== SERIAL COMMANDS ==========
void handleSerialCommand(char cmd) {
  switch (cmd) {
    case 'h':
    case '?':
      Serial.println("\n=== SPROUTSENSE COMMANDS ===");
      Serial.println("  s — Show sensor readings");
      Serial.println("  p — Pump ON (manual)");
      Serial.println("  o — Pump OFF (manual)");
      Serial.println("  r — Test relay (1s click)");
      Serial.println("  f — Show flow sensor count");
      Serial.println("  w — WiFi status");
      Serial.println("  t — TFT page test (cycles all pages)");
      Serial.println("  m — Memory info");
      Serial.println("  d — Full diagnostics");
      Serial.println("  b — Force backend send now");
      Serial.println("  x — Force heartbeat now");
      break;
    case 's':
      updateAllSensors();
      printSensors();
      break;
    case 'p':
      manualPump = true;
      startPump();
      break;
    case 'o':
      manualPump = false;
      stopPump();
      break;
    case 'r':
      Serial.println("[TEST] Relay click test...");
      digitalWrite(PIN_RELAY, HIGH); delay(1000); digitalWrite(PIN_RELAY, LOW);
      Serial.println("[TEST] Done — heard a click? If not, check wiring");
      break;
    case 'f':
      Serial.printf("[FLOW] Pulses: %lu | Volume: %.1f mL\n",
        flowPulseCount, getFlowVolumeMl());
      break;
    case 'w':
      Serial.printf("[WIFI] %s | IP: %s | RSSI: %d dBm\n",
        WiFi.status() == WL_CONNECTED ? "CONNECTED" : "DISCONNECTED",
        WiFi.localIP().toString().c_str(), WiFi.RSSI());
      break;
    case 't':
      Serial.println("[TFT] Cycling all 4 pages...");
      for (int i = 0; i < 4; i++) {
        tftPage = i; updateTFTDisplay(); delay(2000);
      }
      break;
    case 'm':
      Serial.printf("[MEM] Free heap: %u bytes | Min free: %u bytes\n",
        ESP.getFreeHeap(), ESP.getMinFreeHeap());
      break;
    case 'd':
      updateAllSensors(); printSensors();
      Serial.printf("[PUMP] Running: %s | Volume: %.1f mL\n",
        pumpRunning ? "YES" : "NO", getFlowVolumeMl());
      Serial.printf("[FLOW] Pulses: %lu\n", flowPulseCount);
      Serial.printf("[WIFI] %s | IP: %s | RSSI: %ddBm\n",
        WiFi.status() == WL_CONNECTED ? "OK" : "FAIL",
        WiFi.localIP().toString().c_str(), WiFi.RSSI());
      Serial.printf("[DHT]  Valid: %s | Temp: %.1fC | Hum: %.1f%%\n",
        dhtValid ? "YES" : "NO (cached)", cachedTemp, cachedHumidity);
      Serial.printf("[MEM]  Free: %u | Min: %u\n",
        ESP.getFreeHeap(), ESP.getMinFreeHeap());
      break;
    case 'b':
      Serial.println("[BACKEND] Force sending now...");
      sendToBackend();
      break;
    case 'x':
      Serial.println("[HEARTBEAT] Force sending now...");
      sendHeartbeat();
      break;
  }
}


// =====================================================
// END — SPROUTSENSE ESP32-SENSOR.INO v2.1
// GPIO 12 = YF-S401 Flow Sensor (INTERRUPT, IRAM_ATTR)
// GPIO 14 = Relay (Pump Control, external PSU required)
//
// FIXES APPLIED vs v2.0:
//   FIX 3 — flowRate now calculated as actual mL/min
//   FIX 4 — sendToBackend() retries 3x on failure
//   FIX 5 — sendHeartbeat() keeps device ONLINE on dashboard
//   FIX 6 — Forward declaration for handleSerialCommand()
//            Cached temp/humidity defaults (25C/50%) not 0
// =====================================================
