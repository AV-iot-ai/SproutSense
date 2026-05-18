/******************************************************************************
 * SPROUTSENSE — POWER MANAGER v1.1 (SIMPLIFIED - Single 5V PSU)
 * Arduino Uno for Pump Relay Control & ESP32 Protection
 *
 * Board: Arduino Uno R3
 * 
 * Purpose:
 * - Controls relay for 3-6V pump
 * - Communicates with ESP32 via serial
 * - Monitors 5V rail health
 * - Large capacitor protects against inrush spikes
 *
 * Connections:
 * - Arduino D0 (RX) ← ESP32 GPIO 17 (TX2)
 * - Arduino D1 (TX) → ESP32 GPIO 16 (RX2)
 * - Arduino GND ← ESP32 GND (CRITICAL: common ground)
 * - Arduino D8 ← Relay IN (pump control)
 * - Arduino A0 ← 5V monitoring (optional, divider)
 * 
 * Power:
 * - Vin: 5V from USB PSU (with 1000µF capacitor protection)
 * - GND: Common with PSU, ESP32, relay
 *
 * The 1000µF capacitor is ESSENTIAL:
 * - Absorbs pump inrush current (0.5-1A for 10ms)
 * - Prevents voltage dips below 4.8V
 * - Keeps ESP32 powered during pump start
 ******************************************************************************/

#include <ArduinoJson.h>

/* ============================================================
   PIN CONFIGURATION
   ============================================================ */
#define PIN_RELAY_PUMP      8    // HIGH to activate pump relay
#define PIN_STATUS_LED      13   // Status indicator (built-in LED)
#define PIN_V_MONITOR       A0   // Optional: 5V monitoring

/* ============================================================
   SERIAL SETTINGS (Hardware RX/TX on D0/D1)
   ============================================================ */
#define BAUD_RATE            9600
#define PUMP_TIMEOUT_MS      25000  // Max pump runtime (safety cutoff)
#define PUMP_DELAY_MS        500    // Delay before relay activation
#define MONITOR_INTERVAL_MS  5000   // Voltage check interval
#define HEARTBEAT_INTERVAL   10000  // Status heartbeat to ESP32

/* ============================================================
   VOLTAGE MONITORING THRESHOLDS
   ============================================================ */
#define V_5V_NOMINAL         5.0f
#define V_5V_MIN_SAFE        4.7f   // Minimum safe voltage
#define ADC_REF_VOLTAGE      5.0f
#define ADC_MAX              1023
#define V_DIVIDER_RATIO      2.0f   // (R1+R2)/R2 for 5V divider

/* ============================================================
   STATE VARIABLES
   ============================================================ */
bool g_pumpRunning = false;
unsigned long g_pumpStartMs = 0;
unsigned long g_lastMonitorMs = 0;
unsigned long g_lastHeartbeatMs = 0;
float g_voltage5V = 5.0f;
bool g_lowVoltageAlert = false;

/* ============================================================
   SETUP
   ============================================================ */
void setup() {
  Serial.begin(BAUD_RATE);  // Hardware serial for ESP32
  
  pinMode(PIN_RELAY_PUMP, OUTPUT);
  pinMode(PIN_STATUS_LED, OUTPUT);
  
  // Start with safe state
  digitalWrite(PIN_RELAY_PUMP, LOW);   // Pump off
  digitalWrite(PIN_STATUS_LED, LOW);   // LED off
  
  delay(1000);
  
  logPowerup();
  flashLED(3);  // 3 flashes = ready
}

/* ============================================================
   MAIN LOOP
   ============================================================ */
void loop() {
  unsigned long now = millis();
  
  // Process commands from ESP32
  if (Serial.available()) {
    handleSerialCommand();
  }
  
  // Monitor voltage periodically
  if (now - g_lastMonitorMs >= MONITOR_INTERVAL_MS) {
    g_lastMonitorMs = now;
    monitorVoltage();
    checkSafety();
  }
  
  // Send heartbeat periodically
  if (now - g_lastHeartbeatMs >= HEARTBEAT_INTERVAL) {
    g_lastHeartbeatMs = now;
    sendHeartbeat();
  }
  
  // Check pump timeout safety
  if (g_pumpRunning && (now - g_pumpStartMs > PUMP_TIMEOUT_MS)) {
    logError("PUMP_TIMEOUT", "Forced stop after %lu ms", now - g_pumpStartMs);
    stopPump();
    flashLED(5);  // 5 flashes = pump timeout error
  }
}

/* ============================================================
   SERIAL COMMAND PROCESSING
   ============================================================ */
void handleSerialCommand() {
  String line = Serial.readStringUntil('\n');
  line.trim();
  
  if (line.length() == 0) return;
  
  // Parse JSON command from ESP32
  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, line);
  
  if (error) {
    logError("SERIAL", "JSON parse error: %s", error.c_str());
    return;
  }
  
  const char* cmd = doc["cmd"];
  if (!cmd) {
    logError("SERIAL", "Missing 'cmd' field");
    return;
  }
  
  // PUMP_START command
  if (strcmp(cmd, "PUMP_START") == 0) {
    float targetMl = doc["ml"] | 0.0f;
    if (targetMl > 0) {
      logInfo("PUMP", "Start command (target: %.0f ml)", targetMl);
    } else {
      logInfo("PUMP", "Start command");
    }
    startPump();
  }
  
  // PUMP_STOP command
  else if (strcmp(cmd, "PUMP_STOP") == 0) {
    logInfo("PUMP", "Stop command");
    stopPump();
  }
  
  // STATUS command - respond with current state
  else if (strcmp(cmd, "STATUS") == 0) {
    sendStatus();
  }
  
  else {
    logWarn("SERIAL", "Unknown command: %s", cmd);
  }
}

/* ============================================================
   PUMP CONTROL
   ============================================================ */
void startPump() {
  if (g_pumpRunning) {
    logWarn("PUMP", "Already running");
    return;
  }
  
  if (g_lowVoltageAlert) {
    logError("PUMP", "Cannot start - voltage too low (%.2fV)", g_voltage5V);
    sendStatusJson("PUMP_FAIL", "voltage_low", g_voltage5V);
    flashLED(2);
    return;
  }
  
  logInfo("PUMP", "Enabling relay after %d ms delay", PUMP_DELAY_MS);
  delay(PUMP_DELAY_MS);  // Allow PSU+capacitor to stabilize
  
  g_pumpRunning = true;
  g_pumpStartMs = millis();
  digitalWrite(PIN_RELAY_PUMP, HIGH);
  digitalWrite(PIN_STATUS_LED, HIGH);  // LED on while pumping
  
  logOK("PUMP", "Relay activated");
  sendStatusJson("PUMP_OK", "started", 0);
}

void stopPump() {
  if (!g_pumpRunning) {
    return;
  }
  
  g_pumpRunning = false;
  digitalWrite(PIN_RELAY_PUMP, LOW);
  digitalWrite(PIN_STATUS_LED, LOW);
  
  unsigned long runtime = millis() - g_pumpStartMs;
  logOK("PUMP", "Relay deactivated (runtime: %lu ms)", runtime);
  sendStatusJson("PUMP_OK", "stopped", runtime);
}

/* ============================================================
   VOLTAGE MONITORING
   ============================================================ */
void monitorVoltage() {
  // Read 5V rail
  int adcRaw = analogRead(PIN_V_MONITOR);
  g_voltage5V = (adcRaw / (float)ADC_MAX) * ADC_REF_VOLTAGE * V_DIVIDER_RATIO;
  
  Serial.printf("║ V_5V: %.2fV (ADC raw: %d)\n", g_voltage5V, adcRaw);
}

void checkSafety() {
  bool prevAlert = g_lowVoltageAlert;
  
  // Check if voltage is critically low
  g_lowVoltageAlert = (g_voltage5V < V_5V_MIN_SAFE);
  
  if (g_lowVoltageAlert && !prevAlert) {
    logError("VOLTAGE", "LOW VOLTAGE ALERT! Measured: %.2fV", g_voltage5V);
    if (g_pumpRunning) {
      logError("PUMP", "Force stopping due to low voltage");
      stopPump();
    }
    flashLED(4);  // 4 flashes = low voltage
  }
  else if (!g_lowVoltageAlert && prevAlert) {
    logOK("VOLTAGE", "Voltage recovered to %.2fV", g_voltage5V);
    flashLED(1);  // 1 flash = recovered
  }
}

/* ============================================================
   COMMUNICATION WITH ESP32
   ============================================================ */
void sendStatus() {
  StaticJsonDocument<256> doc;
  doc["type"] = "STATUS";
  doc["pump_running"] = g_pumpRunning;
  doc["v_5v"] = g_voltage5V;
  doc["low_voltage"] = g_lowVoltageAlert;
  
  String output;
  serializeJson(doc, output);
  Serial.println(output);
}

void sendStatusJson(const char* status, const char* detail, float value) {
  StaticJsonDocument<256> doc;
  doc["status"] = status;
  doc["detail"] = detail;
  if (value != 0) {
    doc["value"] = value;
  }
  
  String output;
  serializeJson(doc, output);
  Serial.println(output);
}

void sendHeartbeat() {
  StaticJsonDocument<256> doc;
  doc["type"] = "HEARTBEAT";
  doc["uptime"] = millis() / 1000;
  doc["v_5v"] = g_voltage5V;
  doc["pump_ok"] = !g_pumpRunning;
  
  String output;
  serializeJson(doc, output);
  Serial.println(output);
}

/* ============================================================
   LOGGING & DEBUG
   ============================================================ */
void logPowerup() {
  Serial.println(F("\n╔═══════════════════════════════════════════════════════════════"));
  Serial.println(F("║ SproutSense POWER MANAGER v1.1 (Single 5V PSU) - Starting Up"));
  Serial.println(F("║ Arduino Uno Relay Control & ESP32 Protection System"));
  Serial.println(F("╚═══════════════════════════════════════════════════════════════\n"));
}

void logInfo(const char* tag, const char* fmt, ...) {
  char buf[256];
  va_list args;
  va_start(args, fmt);
  vsnprintf(buf, sizeof(buf), fmt, args);
  va_end(args);
  Serial.printf("║ [INFO  | %-10s] %s\n", tag, buf);
}

void logOK(const char* tag, const char* fmt, ...) {
  char buf[256];
  va_list args;
  va_start(args, fmt);
  vsnprintf(buf, sizeof(buf), fmt, args);
  va_end(args);
  Serial.printf("║ [OK    | %-10s] %s\n", tag, buf);
}

void logWarn(const char* tag, const char* fmt, ...) {
  char buf[256];
  va_list args;
  va_start(args, fmt);
  vsnprintf(buf, sizeof(buf), fmt, args);
  va_end(args);
  Serial.printf("║ [WARN  | %-10s] %s\n", tag, buf);
}

void logError(const char* tag, const char* fmt, ...) {
  char buf[256];
  va_list args;
  va_start(args, fmt);
  vsnprintf(buf, sizeof(buf), fmt, args);
  va_end(args);
  Serial.printf("║ [ERROR | %-10s] %s\n", tag, buf);
}

void flashLED(uint8_t times) {
  for (uint8_t i = 0; i < times; i++) {
    digitalWrite(PIN_STATUS_LED, HIGH);
    delay(100);
    digitalWrite(PIN_STATUS_LED, LOW);
    delay(100);
  }
}
