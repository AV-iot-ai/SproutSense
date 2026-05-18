/******************************************************************************
 * SPROUTSENSE — ESP32-SENSOR v3.2 (No Blynk)
 * Tomato Plant Monitoring & Auto Watering
 *
 * Board   : ESP32-WROOM-32 DevKit (38-pin)
 * Sensors : Soil Moisture (ADC), LDR (ADC), DHT22 (Digital), Flow Meter (pulse)
 * Outputs : Relay → Water Pump (GPIO 14)
 *           Buzzer → Audible alert when pump is ON (GPIO 27)
 * Inputs  : YFS401 (YF-S401) Flow Meter (GPIO 26, interrupt)
 *           Manual button (GPIO 33, active LOW, INPUT_PULLUP)
 * Cloud   : Custom backend REST API only
 * Notes   : pH sensor and on-device display are not used in this build
 ******************************************************************************/

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <DHT.h>
#include <ArduinoJson.h>
#include <Preferences.h>
#include <stdarg.h>

/* ============================================================
   WIFI CREDENTIALS
   ============================================================ */
Preferences preferences;

const char* DEFAULT_WIFI_SSID = "@Connect";
const char* DEFAULT_WIFI_PASS = "qwertyomm";

String wifiSSID = "";
String wifiPassword = "";

/* ============================================================
   DEVICE IDENTITY
   ============================================================ */
const char* DEVICE_ID = "ESP32-SENSOR-6B70E9";
const char* DEVICE_TOKEN = "6D8069AA50BFEF6E30CE03A2C73C35F190D375A61C441406BBBDC19E0034E80A";

/* ============================================================
   BACKEND REST API ENDPOINTS
   ============================================================ */
const char* URL_SENSORS     = "https://sproutsense.onrender.com/api/sensors/device";
const char* URL_STATUS      = "https://sproutsense.onrender.com/api/config/status/device";
const char* URL_WATER_START = "https://sproutsense.onrender.com/api/water/device/start";
const char* URL_WATER_STOP  = "https://sproutsense.onrender.com/api/water/device/stop";

String URL_CONFIG_STR;
String URL_WATER_STATUS_STR;
const char* URL_CONFIG = nullptr;
const char* URL_WATER_STATUS = nullptr;

void configureSecureClient(WiFiClientSecure& client) {
  client.setInsecure();
}

/* ============================================================
   PIN CONFIGURATION
   ============================================================ */
#define PIN_SOIL    35
#define PIN_LDR     32
#define PIN_DHT     15  // CHANGED FROM 13 TO 15
#define PIN_RELAY   14
#define PIN_FLOW    26
#define PIN_BUZZER  27
#define PIN_BUTTON  33

/* ============================================================
   SENSOR CALIBRATION
   ============================================================ */
#define DHT_TYPE            DHT22
#define MOISTURE_ADC_DRY    2800
#define MOISTURE_ADC_WET    1200
#define LUX_MAX             100000.0f
#define FLOW_PULSES_PER_ML  5.5f
#define MOISTURE_THRESHOLD   30.0f
#define TARGET_WATER_ML     100.0f
#define PUMP_MAX_MS         20000

// If your LDR module provides a digital HIGH/LOW output instead of an
// analog voltage on AO, set this to 1. When set, the firmware will use
// `digitalRead(PIN_LDR)` and treat light as a binary state. Set to 0 to
// use the original analog behavior with `analogRead(PIN_LDR)`.
#define LDR_DIGITAL_MODE 1

/* ============================================================
   TIMING INTERVALS (ms)
   ============================================================ */
#define IV_SENSORS         2000
#define IV_BACKEND        15000
#define IV_HEARTBEAT      30000
#define IV_CMD_POLL        8000
#define IV_CONFIG         60000
#define BUTTON_DEBOUNCE_MS   40

/* ============================================================
   OBJECTS
   ============================================================ */
DHT dht(PIN_DHT, DHT_TYPE);

/* ============================================================
   FLOW SENSOR
   ============================================================ */
volatile unsigned long g_flowPulses = 0;

void IRAM_ATTR flowISR() { g_flowPulses++; }

unsigned long flowPulsesSnapshot() {
  noInterrupts();
  unsigned long pulses = g_flowPulses;
  interrupts();
  return pulses;
}

float flowMl() { return (float)flowPulsesSnapshot() / FLOW_PULSES_PER_ML; }

void resetFlow() {
  noInterrupts();
  g_flowPulses = 0;
  interrupts();
}

/* ============================================================
   PUMP STATE
   ============================================================ */
bool g_pumpRunning = false;
bool g_manualPump = false;
unsigned long g_pumpStartMs = 0;
bool g_safetyStop = false;

/* ============================================================
   CACHED SENSOR VALUES
   ============================================================ */
float g_moisture = 0.0f;
float g_lux = 0.0f;
float g_temp = 25.0f;
float g_humidity = 50.0f;
bool g_dhtValid = false;

/* ============================================================
   INTERVAL TIMERS
   ============================================================ */
unsigned long g_tSensors = 0;
unsigned long g_tBackend = 0;
unsigned long g_tHeartbeat = 0;
unsigned long g_tCmdPoll = 0;
unsigned long g_tConfig = 0;

bool g_btnStable = HIGH;
bool g_btnLastReading = HIGH;
unsigned long g_btnChangeMs = 0;

/* ============================================================
   BACKEND HEALTH COUNTERS
   ============================================================ */
uint32_t g_backendOk = 0;
uint32_t g_backendFail = 0;

/* ============================================================
   FORWARD DECLARATIONS
   ============================================================ */
void handleSerial(char c);
void startPump(const char* trigger = "manual");
void stopPump();
void pollRemoteCommand();
void pollRemoteConfig();
void buzzerBeep(uint16_t onMs, uint8_t times = 1, uint16_t gapMs = 100);
void handleButton(unsigned long now);

/* ============================================================
   BUZZER & BUTTON STATE
   ============================================================ */
bool g_buzzerEnabled = true;

void buzzerBeep(uint16_t onMs, uint8_t times, uint16_t gapMs) {
  if (!g_buzzerEnabled) return;
  for (uint8_t i = 0; i < times; i++) {
    digitalWrite(PIN_BUZZER, HIGH);
    delay(onMs);
    digitalWrite(PIN_BUZZER, LOW);
    if (times > 1 && i < times - 1) delay(gapMs);
  }
}

/* ============================================================
   SERIAL LOGGING HELPERS
   ============================================================ */
void logSep(const char* tag) {
  Serial.printf("\n╔══════════════════════════════════[ %s ]\n", tag);
}

void logLine(const char* tag, const char* fmt, ...) {
  char buf[256];
  va_list args;
  va_start(args, fmt);
  vsnprintf(buf, sizeof(buf), fmt, args);
  va_end(args);
  Serial.printf("║ [%-10s] %s\n", tag, buf);
}

void logOK(const char* tag, const char* fmt, ...) {
  char buf[256];
  va_list args;
  va_start(args, fmt);
  vsnprintf(buf, sizeof(buf), fmt, args);
  va_end(args);
  Serial.printf("║ [%-10s] ✔ %s\n", tag, buf);
}

void logERR(const char* tag, const char* fmt, ...) {
  char buf[256];
  va_list args;
  va_start(args, fmt);
  vsnprintf(buf, sizeof(buf), fmt, args);
  va_end(args);
  Serial.printf("║ [%-10s] ✖ %s\n", tag, buf);
}

void logWARN(const char* tag, const char* fmt, ...) {
  char buf[256];
  va_list args;
  va_start(args, fmt);
  vsnprintf(buf, sizeof(buf), fmt, args);
  va_end(args);
  Serial.printf("║ [%-10s] ⚠ %s\n", tag, buf);
}

void logEnd() {
  Serial.println("╚══════════════════════════════════════════════");
}

/* ============================================================
   HTTP HELPERS
   ============================================================ */
int httpPost(const char* url, const String& payload, int timeoutMs = 8000) {
  WiFiClientSecure client;
  configureSecureClient(client);
  HTTPClient http;
  if (!http.begin(client, url)) return -1;

  http.addHeader("Content-Type", "application/json");
  if (strlen(DEVICE_TOKEN) > 0) {
    http.addHeader("X-Device-ID", DEVICE_ID);
    http.addHeader("X-Device-Token", DEVICE_TOKEN);
  }
  http.setTimeout(timeoutMs);

  int code = http.POST(payload);
  if (code > 0) {
    String resp = http.getString();
    if (code >= 400) logERR("HTTP", "POST %s → %d body=%s", url, code, resp.c_str());
  } else {
    logERR("HTTP", "POST %s failed (code=%d)", url, code);
  }
  http.end();
  return code;
}

String httpGet(const char* url, int timeoutMs = 6000) {
  WiFiClientSecure client;
  configureSecureClient(client);
  HTTPClient http;
  String body = "";
  if (!http.begin(client, url)) return body;

  if (strlen(DEVICE_TOKEN) > 0) {
    http.addHeader("X-Device-ID", DEVICE_ID);
    http.addHeader("X-Device-Token", DEVICE_TOKEN);
  }
  http.setTimeout(timeoutMs);

  int code = http.GET();
  if (code == 200) {
    body = http.getString();
  } else {
    logWARN("HTTP", "GET %s → %d", url, code);
  }
  http.end();
  return body;
}

/* ============================================================
   PUMP CONTROL
   ============================================================ */
void startPump(const char* trigger) {
  if (g_pumpRunning) return;

  resetFlow();
  digitalWrite(PIN_RELAY, HIGH);
  g_pumpRunning = true;
  g_pumpStartMs = millis();
  buzzerBeep(150, 2, 100);

  logSep("PUMP");
  logOK("PUMP", "ON trigger=%-10s target=%.0f mL", trigger, TARGET_WATER_ML);
  logEnd();

  if (WiFi.status() == WL_CONNECTED) {
    StaticJsonDocument<192> doc;
    doc["deviceId"] = DEVICE_ID;
    doc["triggerType"] = trigger;
    String p;
    serializeJson(doc, p);
    int code = httpPost(URL_WATER_START, p);
    if (code == 200 || code == 201) logOK("PUMP", "Backend ACK start → %d", code);
    else logWARN("PUMP", "Backend start ACK failed → %d (non-critical)", code);
  }
}

void stopPump() {
  if (!g_pumpRunning) return;

  digitalWrite(PIN_RELAY, LOW);
  g_pumpRunning = false;
  g_manualPump = false;

  float vol = flowMl();
  unsigned long ms = millis() - g_pumpStartMs;
  
  // <--- NEW: Distinct "Done" sound (Slow descending double beep)
  if (!g_safetyStop) {
    buzzerBeep(200, 1); 
    delay(100);
    buzzerBeep(400, 1);
  }

  logSep("PUMP");
  logOK("PUMP", "OFF dispensed=%.1f mL runtime=%lu ms", vol, ms);
  logEnd();

  if (WiFi.status() == WL_CONNECTED) {
    StaticJsonDocument<192> doc;
    doc["deviceId"] = DEVICE_ID;
    String p;
    serializeJson(doc, p);
    int code = httpPost(URL_WATER_STOP, p);
    if (code == 200 || code == 201) logOK("PUMP", "Backend ACK stop → %d", code);
    else logWARN("PUMP", "Backend stop ACK failed → %d (non-critical)", code);
  }
}

void updatePumpSafety() {
  if (!g_pumpRunning) return;

  float vol = flowMl();
  unsigned long runtime = millis() - g_pumpStartMs;

  if (vol >= TARGET_WATER_ML) {
    logOK("PUMP", "Target %.0f mL reached (got %.1f mL) — stopping", TARGET_WATER_ML, vol);
    stopPump();
  } else if (runtime >= PUMP_MAX_MS) {
    logWARN("PUMP", "Safety timeout %u ms — force stop (%.1f mL)", PUMP_MAX_MS, vol);
    g_safetyStop = true;
    stopPump();
    g_safetyStop = false;
    buzzerBeep(200, 3);
  }
}

/* ============================================================
   SENSOR READS
   ============================================================ */
float readMoisture() {
  // Take 10 samples and average them to get a stable reading
  long sum = 0;
  for (int i = 0; i < 10; i++) {
    sum += analogRead(PIN_SOIL);
    delay(10);
  }
  int raw = sum / 10;
  
  // MANDATORY DEBUG: View actual raw voltage numbers to fix 0/100 issue
  Serial.print(">>> DEBUG_RAW_SOIL: "); Serial.println(raw);

  return constrain(
    (float)(MOISTURE_ADC_DRY - raw) / (float)(MOISTURE_ADC_DRY - MOISTURE_ADC_WET) * 100.0f,
    0.0f, 100.0f
  );
}

float readLux() {
#if LDR_DIGITAL_MODE
  return digitalRead(PIN_LDR) == HIGH ? LUX_MAX : 0.0f;
#else
  return (analogRead(PIN_LDR) / 4095.0f) * LUX_MAX;
#endif
}

void updateSensors() {
  logLine("SENSORS", "Refreshing readings...");
  g_moisture = readMoisture();
  g_lux = readLux();

  // Try multiple reads for DHT22 stability
  float t = NAN;
  float h = NAN;
  for (int i = 0; i < 3; i++) {
    t = dht.readTemperature();
    h = dht.readHumidity();
    if (!isnan(t) && !isnan(h)) break;
    logWARN("SENSORS", "DHT22 read retry %d...", i + 1);
    delay(200); 
  }

  if (!isnan(t) && !isnan(h)) {
    g_temp = t;
    g_humidity = h;
    g_dhtValid = true;
    logOK("SENSORS", "DHT22: %.1fC %.1f%%", g_temp, g_humidity);
  } else {
    g_dhtValid = false;
    logERR("SENSORS", "DHT22 failed after 3 attempts");
  }
}

void printSensors() {
  logSep("SENSORS");
  logLine("SENSORS", "Moisture : %6.1f %%  (threshold: %.0f%%  %s)",
          g_moisture, MOISTURE_THRESHOLD,
          g_moisture < MOISTURE_THRESHOLD ? "<-- DRY!" : "OK");
  logLine("SENSORS", "Light    : %6.0f lux  (%s)", g_lux, g_lux < 2000 ? "LOW" : "OK");
  if (g_dhtValid) {
    logLine("SENSORS", "Temp     : %6.1f °C", g_temp);
    logLine("SENSORS", "Humidity : %6.1f %%", g_humidity);
  } else {
    logWARN("SENSORS", "DHT22 read failed — cached %.1f°C %.0f%%", g_temp, g_humidity);
  }
  logLine("SENSORS", "Flow vol : %6.1f mL  pulses=%lu", flowMl(), flowPulsesSnapshot());
  logLine("SENSORS", "Pump     : %s  Buzzer: GPIO%d", g_pumpRunning ? "ON" : "OFF", PIN_BUZZER);
  logLine("SENSORS", "Button   : GPIO%d  state=%s", PIN_BUTTON, digitalRead(PIN_BUTTON) == LOW ? "PRESSED" : "RELEASED");
  logEnd();
}

/* ============================================================
   AUTO WATERING
   ============================================================ */
void checkAutoWatering() {
  if (g_pumpRunning || g_manualPump) return;
  if (g_moisture < MOISTURE_THRESHOLD) {
    logWARN("AUTO", "Moisture %.1f%% < %.0f%% — triggering auto-water",
            g_moisture, MOISTURE_THRESHOLD);
    startPump("auto");
  }
}

/* ============================================================
   LOCAL BUTTON
   ============================================================ */
void handleButton(unsigned long now) {
  bool reading = digitalRead(PIN_BUTTON);

  if (reading != g_btnLastReading) {
    g_btnLastReading = reading;
    g_btnChangeMs = now;
  }

  if ((now - g_btnChangeMs) < BUTTON_DEBOUNCE_MS) return;
  if (reading == g_btnStable) return;

  g_btnStable = reading;
  if (g_btnStable == LOW) {
    // Serial print that button is pressed
    logLine("BUTTON", "Button Pressed!");
    Serial.println(">>> BUTTON_PRESSED_EVENT_DETECTED <<<");

    // Disable buzzer immediately when button is pressed
    if (g_buzzerEnabled) {
      g_buzzerEnabled = false;
      logLine("BUTTON", "Buzzer DISABLED due to button press");
      digitalWrite(PIN_BUZZER, LOW); // Ensure buzzer is physically off
    }

    // 1. Long press logic (2 seconds) to RESET WIFI
    unsigned long pressStartTime = millis();
    while(digitalRead(PIN_BUTTON) == LOW) {
      if (millis() - pressStartTime > 2000) {
        logLine("BUTTON", "RESET: Clearing WiFi and Restarting...");
        // Re-enable buzzer temporarily for reset feedback if desired, or skip it
        digitalWrite(PIN_BUZZER, HIGH); delay(100); digitalWrite(PIN_BUZZER, LOW); 
        delay(50);
        digitalWrite(PIN_BUZZER, HIGH); delay(100); digitalWrite(PIN_BUZZER, LOW); 
        preferences.begin("sproutsense", false);
        preferences.clear();
        delay(1000);
        ESP.restart();
      }
    }

    // Original Toggle Buzzer Logic (Modified to be specific)
    /*
    g_buzzerEnabled = !g_buzzerEnabled;
    if (g_buzzerEnabled) {
      // Short high beep for ON
      digitalWrite(PIN_BUZZER, HIGH); delay(100); digitalWrite(PIN_BUZZER, LOW);
      logLine("BUTTON", "Buzzer ENABLED");
    } else {
      // Low double beep for OFF
      digitalWrite(PIN_BUZZER, HIGH); delay(50); digitalWrite(PIN_BUZZER, LOW);
      delay(50);
      digitalWrite(PIN_BUZZER, HIGH); delay(50); digitalWrite(PIN_BUZZER, LOW);
      logLine("BUTTON", "Buzzer DISABLED");
    }
    */

    // 2. Original Pump Logic (Keep or modify as needed)
    if (g_pumpRunning) {
      logLine("BUTTON", "Pressed: pump OFF");
      g_manualPump = false;
      stopPump();
    } else {
      // Optional: Start pump on button press? 
      // If you only want the button for Buzzer, comment out the next 2 lines.
      // g_manualPump = true;
      // startPump("button");
    }
  }
}

/* ============================================================
   HEARTBEAT
   ============================================================ */
void sendHeartbeat() {
  if (WiFi.status() != WL_CONNECTED) {
    logWARN("HEARTBEAT", "Skipped — no WiFi");
    return;
  }

  StaticJsonDocument<384> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["online"] = true;
  doc["pumpActive"] = g_pumpRunning;
  doc["currentState"] = g_pumpRunning ? "WATERING" : "IDLE";
  doc["ipAddress"] = WiFi.localIP().toString();
  doc["uptime"] = (int)(millis() / 1000);
  String p;
  serializeJson(doc, p);

  int code = httpPost(URL_STATUS, p);
  if (code == 200 || code == 201) {
    logOK("HEARTBEAT", "Server online. Latency OK.");
    logLine("HEARTBEAT", "Device stats: %lu sec uptime, RSSI: %d dBm", millis()/1000, WiFi.RSSI());
  } else {
    logERR("HEARTBEAT", "Server unreachable! HTTP Code: %d", code);
  }
}

/* ============================================================
   SENSOR POST
   ============================================================ */
void sendSensors() {
  if (WiFi.status() != WL_CONNECTED) {
    logWARN("BACKEND", "Skipped — no WiFi");
    return;
  }

  float flowRateMlPerMin = 0.0f;
  if (g_pumpRunning) {
    float runMin = (millis() - g_pumpStartMs) / 60000.0f;
    if (runMin > 0.0f) flowRateMlPerMin = flowMl() / runMin;
  }

  StaticJsonDocument<384> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["soilMoisture"] = round(g_moisture * 10.0f) / 10.0f;
  doc["temperature"] = round(g_temp * 10.0f) / 10.0f;
  doc["humidity"] = round(g_humidity * 10.0f) / 10.0f;
  doc["light"] = (float)(int)g_lux;
  doc["flowRateMlPerMin"] = round(flowRateMlPerMin * 10.0f) / 10.0f;
  doc["flowVolume"] = round(flowMl() * 10.0f) / 10.0f;

  String payload;
  serializeJson(doc, payload);

  logSep("BACKEND");
  logLine("BACKEND", "POST %s", URL_SENSORS);
  logLine("BACKEND", "Payload: %s", payload.c_str());

  int code = -1;
  for (int attempt = 1; attempt <= 3 && code != 200 && code != 201; attempt++) {
    if (attempt > 1) {
      logWARN("BACKEND", "Retry %d/3…", attempt);
      delay(3000);
    }
    code = httpPost(URL_SENSORS, payload, 10000);
    if (code == 200 || code == 201) {
      g_backendOk++;
      logOK("BACKEND", "Saved successfully → HTTP %d", code);      buzzerBeep(50, 1); // <--- NEW: Single short chirp for successful data upload      logLine("BACKEND", "Stats: Total OK=%u, Total FAIL=%u", g_backendOk, g_backendFail);
    } else if (code == 401 || code == 403) {
      logERR("BACKEND", "Auth rejected → HTTP %d (Check Device Token)", code);
      break;
    } else {
      logWARN("BACKEND", "Attempt %d failed → HTTP %d", attempt, code);
    }
  }
  if (code != 200 && code != 201) {
    g_backendFail++;
    logERR("BACKEND", "FATAL: All 3 attempts failed (Network or Server problem)");
    logLine("BACKEND", "Stats: Total OK=%u, Total FAIL=%u", g_backendOk, g_backendFail);
    buzzerBeep(500, 1); // Long warning beep for network failure
  }
  logEnd();
}

/* ============================================================
   REMOTE COMMAND POLL
   ============================================================ */
void pollRemoteCommand() {
  if (WiFi.status() != WL_CONNECTED) return;

  String body = httpGet(URL_WATER_STATUS);
  if (body.isEmpty()) return;

  StaticJsonDocument<256> doc;
  DeserializationError err = deserializeJson(doc, body);
  if (err) {
    logWARN("CMD-POLL", "JSON parse error: %s", err.c_str());
    return;
  }

  bool remotePump = doc["pumpActive"] | false;

  if (remotePump && !g_pumpRunning && !g_manualPump) {
    logLine("CMD-POLL", "Remote pump=ON → starting");
    g_manualPump = true;
    startPump("manual");
  } else if (!remotePump && g_pumpRunning && g_manualPump) {
    logLine("CMD-POLL", "Remote pump=OFF → stopping");
    stopPump();
  }
}

/* ============================================================
   REMOTE CONFIG POLL
   ============================================================ */
void pollRemoteConfig() {
  if (WiFi.status() != WL_CONNECTED) return;

  String body = httpGet(URL_CONFIG, 10000);
  if (body.isEmpty()) return;

  StaticJsonDocument<128> filter;
  filter["wifiConfiguration"]["ssid"] = true;
  filter["wifiConfiguration"]["password"] = true;
  filter["config"]["wifiConfiguration"]["ssid"] = true;
  filter["config"]["wifiConfiguration"]["password"] = true;

  StaticJsonDocument<512> doc;
  DeserializationError err = deserializeJson(doc, body, DeserializationOption::Filter(filter));
  if (err) return;

  const char* newSsid = doc["config"]["wifiConfiguration"]["ssid"]
                      | doc["wifiConfiguration"]["ssid"]
                      | (const char*)nullptr;
  const char* newPass = doc["config"]["wifiConfiguration"]["password"]
                      | doc["wifiConfiguration"]["password"]
                      | (const char*)nullptr;

  if (newSsid && strlen(newSsid) > 0) {
    if (String(newSsid) != wifiSSID || (newPass && String(newPass) != wifiPassword)) {
      logLine("CONFIG", "New WiFi credentials received — restarting");
      preferences.putString("ssid", newSsid);
      preferences.putString("pass", newPass ? newPass : "");
      delay(2000);
      ESP.restart();
    }
  }
}

/* ============================================================
   SERIAL HELP MENU
   ============================================================ */
void printHelp() {
  Serial.println();
  Serial.println("╔══════════════════════════════════════════════════╗");
  Serial.println("║       SPROUTSENSE v3.2 SERIAL COMMANDS          ║");
  Serial.println("╠══════════════════════════════════════════════════╣");
  Serial.println("║  h / ?  — This help menu                        ║");
  Serial.println("║  s      — Read & print all sensors now          ║");
  Serial.println("║  p      — Pump ON  (manual start)               ║");
  Serial.println("║  o      — Pump OFF (manual stop)                ║");
  Serial.println("║  r      — Relay click test (1 second)           ║");
  Serial.println("║  f      — Flow counter status                   ║");
  Serial.println("║  w      — WiFi status + IP                      ║");
  Serial.println("║  b      — Force backend sensor POST now         ║");
  Serial.println("║  c      — Force heartbeat POST now              ║");
  Serial.println("║  z      — Buzzer test beep                      ║");
  Serial.println("║  Hardware button on GPIO33 toggles pump         ║");
  Serial.println("╚══════════════════════════════════════════════════╝");
}

/* ============================================================
   SERIAL COMMAND HANDLER
   ============================================================ */
void handleSerial(char cmd) {
  switch (cmd) {
    case 'h': case '?': printHelp(); break;

    case 's': updateSensors(); printSensors(); break;

    case 'p':
      logLine("CMD", "Manual pump ON");
      g_manualPump = true;
      startPump("manual");
      break;

    case 'o':
      logLine("CMD", "Manual pump OFF");
      g_manualPump = false;
      stopPump();
      break;

    case 'r':
      logLine("TEST", "Relay click test…");
      digitalWrite(PIN_RELAY, HIGH);
      delay(1000);
      digitalWrite(PIN_RELAY, LOW);
      logOK("TEST", "Relay click done");
      break;

    case 'f':
      logSep("FLOW");
      logLine("FLOW", "Pulses : %lu", flowPulsesSnapshot());
      logLine("FLOW", "Volume : %.2f mL", flowMl());
      logLine("FLOW", "Cal    : %.1f pulses/mL", FLOW_PULSES_PER_ML);
      logEnd();
      break;

    case 'w':
      logSep("WIFI");
      logLine("WIFI", "Status : %s", WiFi.status() == WL_CONNECTED ? "CONNECTED" : "DISCONNECTED");
      logLine("WIFI", "IP     : %s", WiFi.localIP().toString().c_str());
      logLine("WIFI", "RSSI   : %d dBm", WiFi.RSSI());
      logLine("WIFI", "SSID   : %s", WiFi.SSID().c_str());
      logEnd();
      break;

    case 'b':
      logLine("CMD", "Forcing backend POST…");
      sendSensors();
      break;

    case 'c':
      logLine("CMD", "Forcing heartbeat POST…");
      sendHeartbeat();
      break;

    case 'z':
      logLine("TEST", "Buzzer test: pump-on pattern");
      buzzerBeep(150, 2, 100);
      delay(500);
      logLine("TEST", "Buzzer test: pump-off pattern");
      buzzerBeep(400, 1);
      delay(500);
      logLine("TEST", "Buzzer test: safety-timeout pattern");
      buzzerBeep(200, 3, 80);
      logOK("TEST", "Buzzer test done");
      break;
  }
}

/* ============================================================
   SETUP
   ============================================================ */
void setup() {
  setCpuFrequencyMhz(80); // Reduce heat by lowering clock from 240MHz to 80MHz
  Serial.begin(115200);
  delay(1000);

  Serial.println();
  Serial.println("╔══════════════════════════════════════════════════╗");
  Serial.println("║        SPROUTSENSE ESP32-SENSOR v3.2            ║");
  Serial.println("║        Tomato Disease & Health Monitor           ║");
  Serial.println("╚══════════════════════════════════════════════════╝");

  URL_CONFIG_STR = String("https://sproutsense.onrender.com/api/config/device/") + DEVICE_ID;
  URL_WATER_STATUS_STR = String("https://sproutsense.onrender.com/api/water/device/status/") + DEVICE_ID;
  URL_CONFIG = URL_CONFIG_STR.c_str();
  URL_WATER_STATUS = URL_WATER_STATUS_STR.c_str();

  pinMode(PIN_RELAY, OUTPUT);
  digitalWrite(PIN_RELAY, LOW);
  pinMode(PIN_BUZZER, OUTPUT);
  digitalWrite(PIN_BUZZER, LOW);
  pinMode(PIN_FLOW, INPUT_PULLUP);
  pinMode(PIN_BUTTON, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(PIN_FLOW), flowISR, FALLING);
  logOK("INIT", "GPIO: relay=GPIO%d flow=GPIO%d buzzer=GPIO%d button=GPIO%d",
        PIN_RELAY, PIN_FLOW, PIN_BUZZER, PIN_BUTTON);

  analogSetWidth(12);
  analogSetPinAttenuation(PIN_SOIL, ADC_11db);
#if !LDR_DIGITAL_MODE
  analogSetPinAttenuation(PIN_LDR, ADC_11db);
#else
  pinMode(PIN_LDR, INPUT);
#endif
  logOK("INIT", "ADC 12-bit 11dB per-pin attenuation");

  dht.begin();
  delay(2500);
  logLine("INIT", "DHT22 warmup…");
  for (int i = 0; i < 3; i++) {
    float t = dht.readTemperature();
    float h = dht.readHumidity();
    if (!isnan(t) && !isnan(h)) {
      g_temp = t;
      g_humidity = h;
      g_dhtValid = true;
      logOK("INIT", "DHT22 OK: %.1f°C  %.0f%%", t, h);
      break;
    }
    logWARN("INIT", "DHT22 attempt %d failed — retrying…", i + 1);
    delay(2000);
  }
  if (!g_dhtValid) logERR("INIT", "DHT22 all attempts failed — using defaults");

  // --- BUZZER BOOT SOUND ---
  logLine("INIT", "Signalling boot...");
  buzzerBeep(100, 3, 50); // 3 short beeps on power up

  preferences.begin("sproutsense", false);
  wifiSSID = preferences.getString("ssid", DEFAULT_WIFI_SSID);
  wifiPassword = preferences.getString("pass", DEFAULT_WIFI_PASS);
  if (wifiSSID.length() == 0) {
    wifiSSID = DEFAULT_WIFI_SSID;
    wifiPassword = DEFAULT_WIFI_PASS;
  }

  WiFi.persistent(false);
  WiFi.setAutoReconnect(true);
  WiFi.mode(WIFI_STA);

  logLine("WIFI", "Connecting to %s…", wifiSSID.c_str());
  WiFi.begin(wifiSSID.c_str(), wifiPassword.c_str());

  int tries = 0;
  while (WiFi.status() != WL_CONNECTED && tries < 30) {
    delay(500);
    Serial.print(".");
    tries++;
  }
  Serial.println();

  if (WiFi.status() != WL_CONNECTED) {
    logWARN("WIFI", "Connection failed — restarting…");
    delay(5000);
    ESP.restart();
  }

  logOK("WIFI", "Connected — IP=%s  RSSI=%d dBm",
        WiFi.localIP().toString().c_str(), WiFi.RSSI());
  buzzerBeep(100, 1);

  sendHeartbeat();
  updateSensors();
  printSensors();
  buzzerBeep(80, 3, 80);

  Serial.println();
  Serial.println("╔══════════════════════════════════════════════════╗");
  Serial.println("║        SPROUTSENSE v3.2 READY                   ║");
  Serial.println("║        Type 'h' for commands                    ║");
  Serial.println("╚══════════════════════════════════════════════════╝");
  Serial.println();
}

/* ============================================================
   MAIN LOOP
   ============================================================ */
void loop() {
  unsigned long now = millis();

  if (WiFi.status() != WL_CONNECTED) {
    static unsigned long lastReconn = 0;
    if (now - lastReconn >= 30000UL) {
      lastReconn = now;
      logWARN("WIFI", "Disconnected — reconnecting…");
      WiFi.reconnect();
    }
  }

  if (now - g_tSensors >= IV_SENSORS) {
    g_tSensors = now;
    updateSensors();
    printSensors();
    checkAutoWatering();
  }

  if (now - g_tBackend >= IV_BACKEND) {
    g_tBackend = now;
    sendSensors();
  }

  if (now - g_tHeartbeat >= IV_HEARTBEAT) {
    g_tHeartbeat = now;
    sendHeartbeat();
  }

  if (now - g_tCmdPoll >= IV_CMD_POLL) {
    g_tCmdPoll = now;
    pollRemoteCommand();
  }

  if (now - g_tConfig >= IV_CONFIG) {
    g_tConfig = now;
    pollRemoteConfig();
  }

  updatePumpSafety();
  handleButton(now);

  if (Serial.available()) handleSerial((char)Serial.read());

  delay(50);
}