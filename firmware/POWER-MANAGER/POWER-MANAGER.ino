/******************************************************************************
 * SPROUTSENSE — POWER MANAGER v1.0
 * External Arduino for Power Distribution & Load Management
 *
 * Board: Arduino Nano/Uno with external 12V power supply
 * 
 * Purpose: 
 * - Manages power distribution to avoid brownouts
 * - Controls high-load devices (relay/pump) independently
 * - Monitors voltage levels
 * - Communicates with ESP32 via Serial/I2C
 * - Provides stable power to sensors
 *
 * Connections:
 * - Arduino Serial RX (pin 0) ← ESP32 TX (GPIO 1)
 * - Arduino Serial TX (pin 1) → ESP32 RX (GPIO 3)
 * - Arduino GND ← ESP32 GND (common ground)
 * - Arduino GND ← External PSU GND (common ground)
 * 
 * Power Distribution:
 * - 5V to sensors (through voltage regulator)
 * - 12V to relay (via GPIO relay driver)
 * - 5V to ESP32 USB backup
 ******************************************************************************/

#include <Wire.h>
#include <SoftwareSerial.h>
#include <ArduinoJson.h>

/* ============================================================
   PIN CONFIGURATION (Arduino Nano/Uno)
   ============================================================ */
#define PIN_RELAY_PUMP      8    // HIGH to activate pump relay
#define PIN_SENSOR_EN       9    // HIGH to enable sensor power (optional PWM)
#define PIN_V_MONITOR       A0   // Voltage monitor input (12V PSU → voltage divider)
#define PIN_5V_MONITOR      A1   // 5V bus monitor
#define PIN_STATUS_LED      13   // Status indicator

/* ============================================================
   HARDWARE SERIAL (RX=0, TX=1)
   Using HardwareSerial to communicate with ESP32
   ============================================================ */
// HardwareSerial is built-in on Serial (pins 0, 1)

/* ============================================================
   CONSTANTS & CONFIG
   ============================================================ */
#define BAUD_RATE            9600
#define SAMPLE_COUNT         5
#define V_NOMINAL_12V        12.0f
#define V_MIN_SAFE           10.5f  // Minimum safe voltage
#define V_5V_NOMINAL         5.0f
#define V_5V_MIN_SAFE        4.7f   // Minimum safe 5V rail
#define ADC_REF_VOLTAGE      5.0f
#define ADC_MAX              1023
#define PUMP_DELAY_MS        500    // Delay before activating pump to allow PSU stabilization
#define PUMP_TIMEOUT_MS      25000  // Max pump runtime (safety cutoff)
#define MONITOR_INTERVAL_MS  5000   // How often to report voltage
#define HEARTBEAT_INTERVAL   10000  // Status heartbeat to ESP32

/* ============================================================
   VOLTAGE DIVIDER CALIBRATION (12V rail)
   Adjust these values based on your actual voltage divider
   Example: 12V → 2.5V at ADC pin requires calibration
   ============================================================ */
#define V_DIVIDER_RATIO      4.8f   // (R1+R2)/R2, measure and calibrate
#define ADC_OFFSET           0.0f   // Fine-tune if needed

/* ============================================================
   STATE VARIABLES
   ============================================================ */
bool g_pumpEnabled = false;
bool g_pumpRunning = false;
unsigned long g_pumpStartMs = 0;
unsigned long g_lastMonitorMs = 0;
unsigned long g_lastHeartbeatMs = 0;
float g_voltageMain = 12.0f;
float g_voltage5V = 5.0f;
bool g_lowVoltageAlert = false;
bool g_sensorPowerOn = true;

/* ============================================================
   SETUP
   ============================================================ */
void setup() {
  Serial.begin(BAUD_RATE);  // Hardware serial for ESP32 communication
  
  pinMode(PIN_RELAY_PUMP, OUTPUT);
  pinMode(PIN_SENSOR_EN, OUTPUT);
  pinMode(PIN_STATUS_LED, OUTPUT);
  
  // Start with safe state
  digitalWrite(PIN_RELAY_PUMP, LOW);  // Pump off
  digitalWrite(PIN_SENSOR_EN, HIGH);  // Sensors enabled
  digitalWrite(PIN_STATUS_LED, LOW);  // LED off
  
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
  
  // Monitor voltages periodically
  if (now - g_lastMonitorMs >= MONITOR_INTERVAL_MS) {
    g_lastMonitorMs = now;
    monitorVoltages();
    checkSafety();
  }
  
  // Send heartbeat periodically
  if (now - g_lastHeartbeatMs >= HEARTBEAT_INTERVAL) {
    g_lastHeartbeatMs = now;
    sendHeartbeat();
  }
  
  // Check pump timeout safety
  if (g_pumpRunning && (now - g_pumpStartMs > PUMP_TIMEOUT_MS)) {
    logError("PUMP_TIMEOUT", "Forced pump stop after %lu ms", now - g_pumpStartMs);
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
    float targetMl = doc["ml"] | 100.0f;
    logInfo("PUMP", "Start command received (target: %.0f ml)", targetMl);
    startPump();
  }
  
  // PUMP_STOP command
  else if (strcmp(cmd, "PUMP_STOP") == 0) {
    logInfo("PUMP", "Stop command received");
    stopPump();
  }
  
  // SENSOR_POWER command (optional - for power saving)
  else if (strcmp(cmd, "SENSOR_POWER") == 0) {
    bool enable = doc["enable"] | true;
    setSensorPower(enable);
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
    logError("PUMP", "Cannot start - voltage too low");
    sendStatusJson("PUMP_FAIL", "voltage_low", g_voltageMain);
    flashLED(2);
    return;
  }
  
  logInfo("PUMP", "Enabling relay after %d ms delay", PUMP_DELAY_MS);
  delay(PUMP_DELAY_MS);  // Allow PSU to stabilize
  
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
   SENSOR POWER CONTROL
   ============================================================ */
void setSensorPower(bool enable) {
  g_sensorPowerOn = enable;
  digitalWrite(PIN_SENSOR_EN, enable ? HIGH : LOW);
  logInfo("SENSOR_PWR", enable ? "Enabled" : "Disabled");
}

/* ============================================================
   VOLTAGE MONITORING
   ============================================================ */
void monitorVoltages() {
  // Read 12V rail
  int adcRaw12 = analogRead(PIN_V_MONITOR);
  g_voltageMain = (adcRaw12 / (float)ADC_MAX) * ADC_REF_VOLTAGE * V_DIVIDER_RATIO + ADC_OFFSET;
  
  // Read 5V rail
  int adcRaw5 = analogRead(PIN_5V_MONITOR);
  g_voltage5V = (adcRaw5 / (float)ADC_MAX) * ADC_REF_VOLTAGE;
  
  Serial.printf("║ V_MAIN: %.2fV (raw: %d)  V_5V: %.2fV (raw: %d)\n", 
                g_voltageMain, adcRaw12, g_voltage5V, adcRaw5);
}

void checkSafety() {
  bool prevAlert = g_lowVoltageAlert;
  
  g_lowVoltageAlert = (g_voltageMain < V_MIN_SAFE || g_voltage5V < V_5V_MIN_SAFE);
  
  if (g_lowVoltageAlert && !prevAlert) {
    logError("VOLTAGE", "LOW VOLTAGE ALERT! Main: %.2fV, 5V: %.2fV", 
             g_voltageMain, g_voltage5V);
    if (g_pumpRunning) {
      logError("PUMP", "Force stopping due to low voltage");
      stopPump();
    }
    flashLED(4);  // 4 flashes = low voltage
  }
  else if (!g_lowVoltageAlert && prevAlert) {
    logOK("VOLTAGE", "Voltage recovered. Main: %.2fV, 5V: %.2fV", 
          g_voltageMain, g_voltage5V);
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
  doc["sensor_power"] = g_sensorPowerOn;
  doc["v_main"] = g_voltageMain;
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
  doc["v_main"] = g_voltageMain;
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
  Serial.println(F("║ SproutSense POWER MANAGER v1.0 - Starting Up"));
  Serial.println(F("║ Arduino Power Distribution & Load Management System"));
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
