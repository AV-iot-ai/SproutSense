/******************************************************************************
 * SPROUTSENSE — ESP32-CAM AI VISION MODULE v2.1
 * Tomato Disease Detection via Edge Impulse
 *
 * Board  : AI Thinker ESP32-CAM with OV3660 sensor (select in Arduino IDE)
 * Flash  : 4MB, Huge APP (3MB No OTA / 1MB SPIFFS)
 *
 * MODE A — SIMULATION (default, no EI library needed)
 *   Upload and test immediately. Sends random diseases to backend.
 *
 * MODE B — EDGE IMPULSE (real ML inference)
 *   1. Train model on Edge Impulse (96x96 RGB images)
 *   2. Export as Arduino library (.zip)
 *   3. In Arduino IDE: Sketch > Include Library > Add .ZIP Library
 *   4. Uncomment the two lines marked [STEP 1] and [STEP 2] below
 *
 * Serial Commands (open Serial Monitor at 115200 baud):
 *   h / ? — help menu
 *   s     — print dashboard
 *   c     — force capture + upload
 *   g     — force config sync
 *   b     — force heartbeat
 *   w     — reconnect WiFi
 *   r     — restart board
 ******************************************************************************/

/* ============================================================
   STANDARD LIBRARIES
   ============================================================ */
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <Preferences.h>
#include "esp_camera.h"
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"
#include "driver/rtc_io.h"

/* ============================================================
   EDGE IMPULSE — uncomment both lines when library is installed
   [STEP 1] #define USE_EDGE_IMPULSE
   [STEP 2] #include <your-project-name_inferencing.h>
   ============================================================ */
// #define USE_EDGE_IMPULSE
// #include <your-project-name_inferencing.h>

#ifdef USE_EDGE_IMPULSE
  #define EI_CAM_COLS           96
  #define EI_CAM_ROWS           96
  #define EI_CAM_BYTES          (EI_CAM_COLS * EI_CAM_ROWS * 3)
  #define ML_CONFIDENCE_MIN     0.70f
  #define ML_PRINT_PREDICTIONS  true
  static uint8_t *g_ei_buffer = NULL;
#endif

/* ============================================================
   WIFI CREDENTIALS
   ============================================================ */
Preferences preferences;

const char* DEFAULT_WIFI_SSID = "@Connect";        // FIX #2: corrected credentials
const char* DEFAULT_WIFI_PASS = "qwertyomm";

String wifiSSID     = "";
String wifiPassword = "";

/* ============================================================
   DEVICE IDENTITY
   *** IMPORTANT: Paste your plain device token here ***
   Get it by calling: POST /api/devices/ESP32-CAM/rotate
   with your user JWT in Authorization header
   ============================================================ */
const char* DEVICE_ID    = "ESP32-CAM-QPMOLV";
const char* DEVICE_TOKEN = "106A56F992F8472AB7FD4968864E5F22CE31E633A5BB180EE9978DE7DFF50CD5";  // FIX #1

const char* EDGE_IMPULSE_PROJECT = "919040";

/* ============================================================
   BACKEND ENDPOINTS
   ============================================================ */
const char* URL_DISEASE    = "https://sproutsense.onrender.com/api/ai/disease/device";
const char* URL_STATUS     = "https://sproutsense.onrender.com/api/config/status/device";
const char* URL_CONFIG     = "https://sproutsense.onrender.com/api/config/device/ESP32-CAM-1VJPQM";
const char* URL_CONFIG_ALT = "https://sproutsense.onrender.com/api/config/device?deviceId=ESP32-CAM-1VJPQM";

/* ============================================================
   TIMING CONSTANTS (milliseconds)
   ============================================================ */
#define BAUD_RATE             115200
#define HEARTBEAT_MS          30000UL
#define CONFIG_SYNC_MS        60000UL
#define LIVE_INTERVAL_MS      30000UL
#define SNAP_INTERVAL_MS      300000UL
#define WIFI_RETRY_MS         20000UL
#define API_RETRY_DELAY_MS    2500UL
#define LOOP_DELAY_MS         50UL
#define HTTP_TIMEOUT_SHORT_MS 8000
#define HTTP_TIMEOUT_LONG_MS  15000

/* ============================================================
   DEEP SLEEP — disabled by default
   ============================================================ */
#define DEEP_SLEEP_ENABLED  false
#define DEEP_SLEEP_US       300000000ULL   // 5 minutes in microseconds

/* ============================================================
    AI THINKER ESP32-CAM (OV3660) — CAMERA PIN MAP
   ============================================================ */
#define PWDN_GPIO_NUM   32
#define RESET_GPIO_NUM  -1
#define XCLK_GPIO_NUM    0
#define SIOD_GPIO_NUM   26
#define SIOC_GPIO_NUM   27
#define Y9_GPIO_NUM     35
#define Y8_GPIO_NUM     34
#define Y7_GPIO_NUM     39
#define Y6_GPIO_NUM     36
#define Y5_GPIO_NUM     21
#define Y4_GPIO_NUM     19
#define Y3_GPIO_NUM     18
#define Y2_GPIO_NUM      5
#define VSYNC_GPIO_NUM  25
#define HREF_GPIO_NUM   23
#define PCLK_GPIO_NUM   22

#define FLASH_LED_PIN    4

/* ============================================================
   GLOBAL STATE
   ============================================================ */
camera_fb_t* g_fb            = NULL;
bool g_camReady              = false;
bool g_wifiEverConnected     = false;

String g_aiMode              = "snapshots";
String g_growthStage         = "vegetative";
unsigned long g_captureInterval = SNAP_INTERVAL_MS;

String g_backendState        = "IDLE";
String g_runtimeTask         = "BOOT";

String g_lastDisease         = "unknown";
float  g_lastConf            = 0.0f;
unsigned long g_lastInfMs    = 0;
size_t g_lastFrameBytes      = 0;
int    g_lastFrameW          = 0;
int    g_lastFrameH          = 0;

int g_codeUpload             = 0;
int g_codeHeartbeat          = 0;
int g_codeConfig             = 0;

unsigned long g_tLastCapture   = 0;
unsigned long g_tLastHeartbeat = 0;
unsigned long g_tLastConfig    = 0;
unsigned long g_tLastWifiRetry = 0;

uint32_t g_captureCount    = 0;
uint32_t g_uploadOk        = 0;
uint32_t g_uploadFail      = 0;
uint32_t g_heartbeatOk     = 0;
uint32_t g_heartbeatFail   = 0;
uint32_t g_configOk        = 0;
uint32_t g_configFail      = 0;

#ifdef USE_EDGE_IMPULSE
  uint32_t      g_totalInferences = 0;
  unsigned long g_totalInfMs      = 0;
#endif

/* ============================================================
   FORWARD DECLARATIONS
   ============================================================ */
void   connectWiFi();
void   ensureWiFi();
void   initCamera();
bool   captureAndAnalyze();
bool   sendToBackend(const String& disease, float conf,
                     const String& stage, int health,
                     unsigned long infMs);
void   sendHeartbeat();
bool   syncRemoteAIConfig();
void   flashLED(uint16_t ms, uint8_t times = 1);
void   printDashboard();
void   printHelp();
void   printSavedWiFi();
void   handleSerialCmd(char c);
void   enterDeepSleep();
String normalizeDiseaseLabel(const String& raw);
int    httpGET(const char* url, String& body, uint16_t timeoutMs);
int    httpPOST(const char* url, const String& payload,
                String& response, uint16_t timeoutMs);

#ifndef USE_EDGE_IMPULSE
  String simulateDisease(float& confOut, unsigned long& infMsOut);
#else
  String runInference(camera_fb_t* fb, float& confOut, unsigned long& infMsOut);
  bool   resizeRGB565toRGB888(camera_fb_t* fb, uint8_t* out);
  int    eiGetData(size_t offset, size_t length, float* out);
  void   printMLStats();
#endif

/* ============================================================
   LOGGING HELPERS
   ============================================================ */
void logLine(const char* tag, const String& msg) {
  Serial.printf("--> [%-10s] %s\n", tag, msg.c_str());
}

void logCode(const char* tag, const char* label, int code) {
  Serial.printf("--> [%-10s] %s: HTTP %d\n", tag, label, code);
}

String normalizeDiseaseLabel(const String& raw) {
  String key = raw;
  key.trim();
  key.toLowerCase();
  key.replace("_", "");
  key.replace("-", "");
  key.replace(" ", "");

  if (key == "healthy") return "healthy";
  if (key == "bacterialblight") return "bacterialblight";
  if (key == "leafmold") return "leafmold";
  if (key == "leafspot") return "leafspot";
  if (key == "pestdamage") return "pestdamage";
  if (key == "viralmosaic") return "viralmosaic";
  if (key == "unknown") return "unknown";

  // Backward compatibility aliases from older datasets/firmware labels.
  if (key == "bacterialspot") return "bacterialblight";
  if (key == "mosaicvirus") return "viralmosaic";
  if (key == "septorialeafspot") return "leafspot";

  return "unknown";
}

/* ============================================================
   HTTP HELPERS
   ============================================================ */
int httpGET(const char* url, String& body, uint16_t timeoutMs) {
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;
  body = "";

  if (!http.begin(client, url)) return -1;
  http.setTimeout(timeoutMs);
  http.addHeader("X-Device-ID",    DEVICE_ID);
  http.addHeader("X-Device-Token", DEVICE_TOKEN);

  int code = http.GET();
  if (code > 0) body = http.getString();
  http.end();
  return code;
}

int httpPOST(const char* url, const String& payload, String& response, uint16_t timeoutMs) {
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;
  response = "";

  if (!http.begin(client, url)) return -1;
  http.setTimeout(timeoutMs);
  http.addHeader("Content-Type",   "application/json");
  http.addHeader("X-Device-ID",    DEVICE_ID);
  http.addHeader("X-Device-Token", DEVICE_TOKEN);

  int code = http.POST(payload);
  if (code > 0) response = http.getString();
  http.end();
  return code;
}

/* ============================================================
   FLASH LED HELPER
   ============================================================ */
void flashLED(uint16_t ms, uint8_t times) {
  for (uint8_t i = 0; i < times; i++) {
    digitalWrite(FLASH_LED_PIN, HIGH);
    delay(ms);
    digitalWrite(FLASH_LED_PIN, LOW);
    if (times > 1 && i < times - 1) delay(ms / 2);
  }
}

/* ============================================================
   WIFI
   ============================================================ */
void connectWiFi() {
  g_runtimeTask = "WIFI";

  preferences.begin("sproutsense", false);
  wifiSSID     = preferences.getString("ssid", DEFAULT_WIFI_SSID);
  wifiPassword = preferences.getString("pass", DEFAULT_WIFI_PASS);
  if (wifiSSID.length() == 0) {
    wifiSSID     = DEFAULT_WIFI_SSID;
    wifiPassword = DEFAULT_WIFI_PASS;
  }

  WiFi.mode(WIFI_STA);
  logLine("WIFI", "Connecting to " + wifiSSID);
  WiFi.begin(wifiSSID.c_str(), wifiPassword.c_str());

  uint8_t attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  Serial.println();

  if (WiFi.status() != WL_CONNECTED) {
    logLine("WIFI", "Connection failed! Restarting...");
    delay(5000);
    ESP.restart();
  }

  g_wifiEverConnected = true;
  logLine("WIFI", "Connected — IP: " + WiFi.localIP().toString());
  logLine("WIFI", "RSSI: " + String(WiFi.RSSI()) + " dBm");
  flashLED(80, 3);
  g_runtimeTask = "READY";
}

void ensureWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  unsigned long now = millis();
  if (now - g_tLastWifiRetry < WIFI_RETRY_MS) return;
  g_tLastWifiRetry = now;
  logLine("WIFI", "Connection lost. Reconnecting...");
  WiFi.disconnect(true, false);
  delay(200);
  connectWiFi();
}

/* ============================================================
   CAMERA INIT
   ============================================================ */
void initCamera() {
  g_runtimeTask = "CAMERA";
  logLine("CAMERA", "Initializing...");

  camera_config_t cfg;
  cfg.ledc_channel  = LEDC_CHANNEL_0;
  cfg.ledc_timer    = LEDC_TIMER_0;
  cfg.pin_d0        = Y2_GPIO_NUM;
  cfg.pin_d1        = Y3_GPIO_NUM;
  cfg.pin_d2        = Y4_GPIO_NUM;
  cfg.pin_d3        = Y5_GPIO_NUM;
  cfg.pin_d4        = Y6_GPIO_NUM;
  cfg.pin_d5        = Y7_GPIO_NUM;
  cfg.pin_d6        = Y8_GPIO_NUM;
  cfg.pin_d7        = Y9_GPIO_NUM;
  cfg.pin_xclk      = XCLK_GPIO_NUM;
  cfg.pin_pclk      = PCLK_GPIO_NUM;
  cfg.pin_vsync     = VSYNC_GPIO_NUM;
  cfg.pin_href      = HREF_GPIO_NUM;
  cfg.pin_sscb_sda  = SIOD_GPIO_NUM;
  cfg.pin_sscb_scl  = SIOC_GPIO_NUM;
  cfg.pin_pwdn      = PWDN_GPIO_NUM;
  cfg.pin_reset     = RESET_GPIO_NUM;
  cfg.xclk_freq_hz  = 20000000;
  cfg.pixel_format  = PIXFORMAT_RGB565;
  cfg.frame_size    = FRAMESIZE_QQVGA;
  cfg.jpeg_quality  = 12;
  cfg.fb_count      = 1;

  esp_err_t err = esp_camera_init(&cfg);
  if (err != ESP_OK) {
    g_camReady     = false;
    g_backendState = "ERROR";
    logLine("CAMERA", "Init FAILED: 0x" + String((uint32_t)err, HEX));
    flashLED(1000, 5);
    g_runtimeTask = "READY";
    return;
  }

  sensor_t* s = esp_camera_sensor_get();
  if (s) {
    logLine("CAMERA", "Sensor PID: 0x" + String((uint32_t)s->id.PID, HEX) + " (expected OV3660)");
    s->set_brightness(s,   1);
    s->set_contrast(s,     0);
    s->set_saturation(s,  -2);
    s->set_whitebal(s,     1);
    s->set_awb_gain(s,     1);
    s->set_wb_mode(s,      0);
    s->set_exposure_ctrl(s,1);
    s->set_aec2(s,         0);
    s->set_ae_level(s,     0);
    s->set_aec_value(s,  300);
    s->set_gain_ctrl(s,    1);
    s->set_agc_gain(s,     0);
    s->set_hmirror(s,      0);
    s->set_vflip(s,        1);
    s->set_dcw(s,          1);
    s->set_colorbar(s,     0);
  }

  g_camReady     = true;
  g_backendState = "IDLE";
  logLine("CAMERA", "Ready.");
  flashLED(150, 2);
  g_runtimeTask = "READY";
}

/* ============================================================
   REMOTE CONFIG SYNC
   ============================================================ */
bool syncRemoteAIConfig() {
  if (WiFi.status() != WL_CONNECTED) return false;
  g_runtimeTask = "CONFIG";

  String body;
  int code = httpGET(URL_CONFIG, body, HTTP_TIMEOUT_SHORT_MS);

  if (code != 200) {
    String bodyAlt;
    int codeAlt = httpGET(URL_CONFIG_ALT, bodyAlt, HTTP_TIMEOUT_SHORT_MS);
    if (codeAlt == 200) {
      body = bodyAlt;
      code = codeAlt;
    } else {
      g_codeConfig = codeAlt;
      g_configFail++;
      logCode("CONFIG", "GET failed", codeAlt);
      g_runtimeTask = "READY";
      return false;
    }
  }
  g_codeConfig = code;

  // Filter only the fields this firmware needs so large backend payloads still parse.
  StaticJsonDocument<384> filter;
  filter["aiInsightsMode"] = true;
  filter["aiInsightsSource"] = true;
  filter["aiTipsMode"] = true;
  filter["plantGrowthStage"] = true;
  filter["captureIntervalMs"] = true;
  filter["ssid"] = true;
  filter["password"] = true;
  filter["wifiSSID"] = true;
  filter["wifiPassword"] = true;
  filter["config"]["aiInsightsMode"] = true;
  filter["config"]["aiInsightsSource"] = true;
  filter["config"]["aiTipsMode"] = true;
  filter["config"]["plantGrowthStage"] = true;
  filter["config"]["plantGrowth"]["stage"] = true;
  filter["config"]["captureIntervalMs"] = true;
  filter["config"]["wifiConfiguration"]["ssid"] = true;
  filter["config"]["wifiConfiguration"]["password"] = true;

  StaticJsonDocument<1024> doc;
  DeserializationError err = deserializeJson(doc, body, DeserializationOption::Filter(filter));
  if (err) {
    logLine("CONFIG", "JSON parse error: " + String(err.c_str()));
    g_runtimeTask = "READY";
    return false;
  }

  const char* mode  = doc["config"]["aiTipsMode"]
                   | doc["config"]["aiInsightsMode"]
                   | doc["config"]["aiInsightsSource"]
                   | doc["aiTipsMode"]
                   | doc["aiInsightsMode"]
                   | doc["aiInsightsSource"]
                   | (const char*)nullptr;

  const char* stage = doc["config"]["plantGrowthStage"]
                   | doc["config"]["plantGrowth"]["stage"]
                   | doc["plantGrowthStage"]
                   | (const char*)nullptr;

  long interval     = doc["config"]["captureIntervalMs"] | doc["captureIntervalMs"] | -1L;

  if (mode  && strlen(mode)  > 0) g_aiMode      = String(mode);
  if (stage && strlen(stage) > 0) g_growthStage  = String(stage);
  if (interval >= 5000)           g_captureInterval = (unsigned long)interval;
  else g_captureInterval = (g_aiMode == "live_feed") ? LIVE_INTERVAL_MS : SNAP_INTERVAL_MS;

  const char* remoteSsid = doc["config"]["wifiConfiguration"]["ssid"]
                        | doc["ssid"]
                        | doc["wifiSSID"]
                        | (const char*)nullptr;
  const char* remotePass = doc["config"]["wifiConfiguration"]["password"]
                        | doc["password"]
                        | doc["wifiPassword"]
                        | (const char*)nullptr;

  String nextSsid = (remoteSsid && strlen(remoteSsid) > 0) ? String(remoteSsid) : wifiSSID;
  String nextPass = (remotePass != nullptr) ? String(remotePass) : wifiPassword;

  if (nextSsid.length() > 0) {
    if (nextSsid != wifiSSID || nextPass != wifiPassword) {
      logLine("CONFIG", "New WiFi credentials — restarting");
      preferences.putString("ssid", nextSsid);
      preferences.putString("pass", nextPass);
      delay(2000);
      ESP.restart();
    }
  }

  g_configOk++;
  logLine("CONFIG", "mode=" + g_aiMode +
          " stage=" + g_growthStage +
          " interval=" + String(g_captureInterval / 1000UL) + "s");
  g_runtimeTask = "READY";
  return true;
}

/* ============================================================
   HEARTBEAT
   ============================================================ */
void sendHeartbeat() {
  if (WiFi.status() != WL_CONNECTED) return;
  g_runtimeTask = "HEARTBEAT";

  if (!g_camReady) g_backendState = "ERROR";
  if (g_backendState != "IDLE" && g_backendState != "ERROR") g_backendState = "IDLE";

  StaticJsonDocument<256> doc;
  doc["deviceId"]     = DEVICE_ID;
  doc["online"]       = true;
  doc["currentState"] = g_backendState;
  doc["ipAddress"]    = WiFi.localIP().toString();
  doc["uptime"]       = (unsigned long)(millis() / 1000UL);
  String payload; serializeJson(doc, payload);

  String resp;
  g_codeHeartbeat = httpPOST(URL_STATUS, payload, resp, HTTP_TIMEOUT_SHORT_MS);

  if (g_codeHeartbeat == 200 || g_codeHeartbeat == 201) {
    g_heartbeatOk++;
    logCode("HEARTBEAT", "POST /status", g_codeHeartbeat);
  } else {
    g_heartbeatFail++;
    logCode("HEARTBEAT", "POST /status FAILED", g_codeHeartbeat);
    flashLED(200, 2);
  }
  g_runtimeTask = "READY";
}

/* ============================================================
   BACKEND UPLOAD — FIX #5: ArduinoJson for safe payload
   ============================================================ */
bool sendToBackend(const String& disease, float conf, const String& stage,
                   int health, unsigned long infMs) {
  if (WiFi.status() != WL_CONNECTED) {
    g_codeUpload = -1;
    logLine("API", "Skipped — no WiFi");
    return false;
  }
  g_runtimeTask = "UPLOAD";

  StaticJsonDocument<384> doc;
  doc["deviceId"]        = DEVICE_ID;
  doc["detectedDisease"] = disease;
  doc["confidence"]      = round(conf * 100.0f) / 100.0f;
  doc["growthStage"]     = stage;
  JsonObject health_obj  = doc.createNestedObject("plantHealth");
  health_obj["overallScore"] = health;
  JsonObject ei           = doc.createNestedObject("edgeImpulseData");
  ei["projectId"]         = EDGE_IMPULSE_PROJECT;
  ei["inferenceTime"]     = (unsigned long)infMs;
  String payload; serializeJson(doc, payload);

  String resp;
  int code = -1;

  for (int attempt = 1; attempt <= 3; attempt++) {
    if (attempt > 1) {
      logLine("API", "Retry " + String(attempt) + "/3...");
      delay(API_RETRY_DELAY_MS);
    }
    code = httpPOST(URL_DISEASE, payload, resp, HTTP_TIMEOUT_LONG_MS);
    if (code == 200 || code == 201) break;
  }

  g_codeUpload = code;
  if (code == 200 || code == 201) {
    g_uploadOk++;
    logCode("API", "POST /ai/disease", code);
    g_runtimeTask = "READY";
    flashLED(80, 1);
    return true;
  } else {
    g_uploadFail++;
    logCode("API", "Upload FAILED", code);
    g_runtimeTask = "READY";
    flashLED(300, 3);
    return false;
  }
}

/* ============================================================
   SIMULATION MODE
   ============================================================ */
#ifndef USE_EDGE_IMPULSE
String simulateDisease(float& confOut, unsigned long& infMsOut) {
  infMsOut = (unsigned long)random(90, 160);
  int r = random(0, 100);
  if      (r < 55) { confOut = 0.93f; return "healthy"; }
  else if (r < 66) { confOut = 0.84f; return "bacterial_blight"; }
  else if (r < 76) { confOut = 0.82f; return "leafmold"; }
  else if (r < 86) { confOut = 0.80f; return "leafspot"; }
  else if (r < 94) { confOut = 0.77f; return "pestdamage"; }
  else             { confOut = 0.75f; return "viralmosaic"; }
}
#endif

/* ============================================================
   EDGE IMPULSE HELPERS
   ============================================================ */
#ifdef USE_EDGE_IMPULSE

int eiGetData(size_t offset, size_t length, float* out) {
  size_t px = offset * 3;
  for (size_t i = 0; i < length; i++) {
    out[i * 3 + 0] = g_ei_buffer[px + 0] / 255.0f;
    out[i * 3 + 1] = g_ei_buffer[px + 1] / 255.0f;
    out[i * 3 + 2] = g_ei_buffer[px + 2] / 255.0f;
    px += 3;
  }
  return 0;
}

bool resizeRGB565toRGB888(camera_fb_t* fb, uint8_t* out) {
  if (!fb || !fb->buf || !out) return false;
  int srcW = fb->width;
  int srcH = fb->height;
  uint16_t* rgb565 = (uint16_t*)fb->buf;
  for (int y = 0; y < EI_CAM_ROWS; y++) {
    for (int x = 0; x < EI_CAM_COLS; x++) {
      int sx = (x * srcW) / EI_CAM_COLS;
      int sy = (y * srcH) / EI_CAM_ROWS;
      int si = sy * srcW + sx;
      int di = (y * EI_CAM_COLS + x) * 3;
      uint16_t px = rgb565[si];
      out[di + 0] = ((px >> 11) & 0x1F) << 3;
      out[di + 1] = ((px >>  5) & 0x3F) << 2;
      out[di + 2] = ( px        & 0x1F) << 3;
    }
  }
  return true;
}

String runInference(camera_fb_t* fb, float& confOut, unsigned long& infMsOut) {
  confOut  = 0.0f;
  infMsOut = 0;
  if (!fb) { logLine("ML", "No frame buffer"); return "unknown"; }

  if (g_ei_buffer == NULL) {
    g_ei_buffer = (uint8_t*)malloc(EI_CAM_BYTES);
    if (!g_ei_buffer) {
      logLine("ML", "Malloc failed (" + String(EI_CAM_BYTES) + " bytes)");
      return "unknown";
    }
    logLine("ML", "EI buffer allocated: " + String(EI_CAM_BYTES) + " bytes");
  }

  if (!resizeRGB565toRGB888(fb, g_ei_buffer)) {
    logLine("ML", "Image resize failed");
    return "unknown";
  }

  signal_t signal;
  signal.total_length = EI_CLASSIFIER_INPUT_WIDTH * EI_CLASSIFIER_INPUT_HEIGHT;
  signal.get_data     = &eiGetData;

  ei_impulse_result_t result = { 0 };
  unsigned long t0 = millis();
  EI_IMPULSE_ERROR res = run_classifier(&signal, &result, false);
  infMsOut = millis() - t0;

  if (res != EI_IMPULSE_OK) {
    logLine("ML", "Classifier error: " + String((int)res));
    return "unknown";
  }

  g_totalInfMs      += infMsOut;
  g_totalInferences++;

  float       maxConf   = 0.0f;
  const char* bestLabel = "unknown";
  for (size_t i = 0; i < EI_CLASSIFIER_LABEL_COUNT; i++) {
    if (ML_PRINT_PREDICTIONS)
      Serial.printf("[ML] %-20s %.2f%%\n",
                    result.classification[i].label,
                    result.classification[i].value * 100.0f);
    if (result.classification[i].value > maxConf) {
      maxConf   = result.classification[i].value;
      bestLabel = result.classification[i].label;
    }
  }
  confOut = maxConf;
  if (g_totalInferences % 10 == 0) printMLStats();
  if (maxConf < ML_CONFIDENCE_MIN) { logLine("ML", "Below threshold"); return "unknown"; }
  return String(bestLabel);
}

void printMLStats() {
  float avg = g_totalInferences ? ((float)g_totalInfMs / (float)g_totalInferences) : 0.0f;
  Serial.println("╔══════════════════════════════════╗");
  Serial.println("║       ML INFERENCE STATS         ║");
  Serial.printf ("║ Total inferences : %-12lu  ║\n", (unsigned long)g_totalInferences);
  Serial.printf ("║ Avg time         : %-8.1f ms  ║\n", avg);
  Serial.println("╚══════════════════════════════════╝");
}

#endif /* USE_EDGE_IMPULSE */

/* ============================================================
   CAPTURE AND ANALYZE
   ============================================================ */
bool captureAndAnalyze() {
  if (!g_camReady) {
    g_backendState = "ERROR";
    logLine("CAPTURE", "Camera not ready");
    flashLED(500, 4);
    return false;
  }

  g_runtimeTask = "CAPTURE";
  g_captureCount++;                        // FIX #4: count every attempt
  logLine("CAPTURE", "Cycle #" + String(g_captureCount));

  flashLED(120);

  g_fb = esp_camera_fb_get();
  if (!g_fb) {
    g_backendState = "ERROR";
    logLine("CAPTURE", "Frame grab failed");
    flashLED(500, 3);
    return false;
  }

  g_lastFrameBytes = g_fb->len;
  g_lastFrameW     = g_fb->width;
  g_lastFrameH     = g_fb->height;

  g_runtimeTask = "INFERENCE";
  float confOut      = 0.0f;
  unsigned long infMs = 0;
  String disease;

#ifdef USE_EDGE_IMPULSE
  disease = runInference(g_fb, confOut, infMs);
#else
  disease = simulateDisease(confOut, infMs);
#endif

  disease = normalizeDiseaseLabel(disease);

  g_lastDisease = disease;
  g_lastConf    = confOut;
  g_lastInfMs   = infMs;

  int healthScore = (disease == "healthy")
    ? (int)(confOut * 100.0f)
    : (int)((1.0f - confOut) * 60.0f + 10);

  esp_camera_fb_return(g_fb);
  g_fb = NULL;

  bool ok        = sendToBackend(disease, confOut, g_growthStage, healthScore, infMs);
  g_backendState = ok ? "IDLE" : "ERROR";
  g_runtimeTask  = "READY";

  printDashboard();
  return ok;
}

/* ============================================================
   SERIAL DASHBOARD
   ============================================================ */
void printDashboard() {
  Serial.println();
  Serial.println("╔══════════════════════════════════════════════════════════════╗");
  Serial.println("║            SPROUTSENSE CAM DASHBOARD                         ║");
  Serial.println("╠══════════════════════════════════════════════════════════════╣");
  Serial.printf ("║  Device ID       : %-40s ║\n", DEVICE_ID);
  Serial.printf ("║  Backend State   : %-40s ║\n", g_backendState.c_str());
  Serial.printf ("║  Runtime Task    : %-40s ║\n", g_runtimeTask.c_str());
  Serial.printf ("║  Uptime          : %-37lu s ║\n", millis() / 1000UL);
  Serial.printf ("║  Free Heap       : %-37u B ║\n", ESP.getFreeHeap());
  Serial.println("╠══════════════════════════════════════════════════════════════╣");
  Serial.printf ("║  WiFi            : %-40s ║\n",
                 WiFi.status() == WL_CONNECTED ? "Connected" : "Disconnected");
  Serial.printf ("║  IP Address      : %-40s ║\n",
                 WiFi.status() == WL_CONNECTED ? WiFi.localIP().toString().c_str() : "0.0.0.0");
  Serial.printf ("║  RSSI            : %-37d dBm ║\n",
                 WiFi.status() == WL_CONNECTED ? WiFi.RSSI() : 0);
  Serial.println("╠══════════════════════════════════════════════════════════════╣");
  Serial.printf ("║  AI Mode         : %-40s ║\n", g_aiMode.c_str());
  Serial.printf ("║  Growth Stage    : %-40s ║\n", g_growthStage.c_str());
  Serial.printf ("║  Last Disease    : %-40s ║\n", g_lastDisease.c_str());
  Serial.printf ("║  Confidence      : %-40.2f ║\n", g_lastConf);
  Serial.printf ("║  Inference Time  : %-37lu ms ║\n", g_lastInfMs);
  Serial.printf ("║  Frame Size      : %dx%-36d ║\n", g_lastFrameW, g_lastFrameH);
  Serial.printf ("║  Frame Bytes     : %-37u B ║\n", (unsigned)g_lastFrameBytes);
  Serial.println("╠══════════════════════════════════════════════════════════════╣");
  Serial.printf ("║  Config HTTP     : %-40d ║\n", g_codeConfig);
  Serial.printf ("║  Upload HTTP     : %-40d ║\n", g_codeUpload);
  Serial.printf ("║  Heartbeat HTTP  : %-40d ║\n", g_codeHeartbeat);
  Serial.printf ("║  Capture Intrvl  : %-37lu s ║\n", g_captureInterval / 1000UL);
  Serial.printf ("║  Total Captures  : %-40u ║\n",  g_captureCount);
  Serial.printf ("║  Uploads OK/Fail : %-2u / %-33u ║\n", g_uploadOk, g_uploadFail);
  Serial.println("╚══════════════════════════════════════════════════════════════╝");
  Serial.println();
}

/* ============================================================
   SERIAL HELP MENU
   ============================================================ */
void printHelp() {
  Serial.println();
  Serial.println("╔══════════════════════════════════════════════╗");
  Serial.println("║           SERIAL COMMAND MENU                ║");
  Serial.println("╠══════════════════════════════════════════════╣");
  Serial.println("║  h / ?  — show this help                     ║");
  Serial.println("║  s      — print dashboard now                ║");
  Serial.println("║  i      — show saved WiFi creds              ║");
  Serial.println("║  c      — force capture + upload             ║");
  Serial.println("║  g      — force config sync from backend     ║");
  Serial.println("║  b      — force heartbeat to backend         ║");
  Serial.println("║  w      — reconnect WiFi                     ║");
  Serial.println("║  r      — restart ESP32                      ║");
  Serial.println("╚══════════════════════════════════════════════╝");
  Serial.println();
}

void printSavedWiFi() {
  String savedSsid = wifiSSID;
  String savedPass = wifiPassword;

  String maskedPass = "(empty)";
  if (savedPass.length() > 0) {
    maskedPass = "";
    for (size_t i = 0; i < savedPass.length(); i++) maskedPass += '*';
  }

  Serial.println();
  Serial.println("╔══════════════════════════════════════════════╗");
  Serial.println("║            SAVED WIFI CONFIG                 ║");
  Serial.println("╠══════════════════════════════════════════════╣");
  Serial.printf ("║  SSID    : %-34s ║\n", savedSsid.length() ? savedSsid.c_str() : "(empty)");
  Serial.printf ("║  PASS    : %-34s ║\n", maskedPass.c_str());
  Serial.println("╚══════════════════════════════════════════════╝");
  Serial.println();
}

/* ============================================================
   SERIAL COMMAND HANDLER
   ============================================================ */
void handleSerialCmd(char c) {
  switch (c) {
    case 'h': case '?': printHelp();                                              break;
    case 's':           printDashboard();                                         break;
    case 'i':           printSavedWiFi();                                         break;
    case 'c':           logLine("SERIAL","Manual capture"); captureAndAnalyze(); break;
    case 'g':           logLine("SERIAL","Manual config sync"); syncRemoteAIConfig(); break;
    case 'b':           logLine("SERIAL","Manual heartbeat"); sendHeartbeat();    break;
    case 'w':           logLine("SERIAL","Manual WiFi reconnect"); connectWiFi(); break;
    case 'r':           logLine("SYSTEM","Restarting..."); delay(500); ESP.restart(); break;
    default: break;
  }
}

/* ============================================================
   DEEP SLEEP — FIX #3: use DEEP_SLEEP_US (was DEEP_SLEEP_INTERVAL_US)
   ============================================================ */
void enterDeepSleep() {
  logLine("SLEEP", "Entering deep sleep for " +
          String((unsigned long)(DEEP_SLEEP_US / 1000000ULL)) + "s");  // FIX #3
  Serial.flush();
  esp_sleep_enable_timer_wakeup(DEEP_SLEEP_US);
  esp_deep_sleep_start();
}

/* ============================================================
   SETUP
   ============================================================ */
void setup() {
  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);

  Serial.begin(BAUD_RATE);
  delay(1000);
  randomSeed(micros());

  pinMode(FLASH_LED_PIN, OUTPUT);
  digitalWrite(FLASH_LED_PIN, LOW);

  Serial.println();
  Serial.println("╔════════════════════════════════════════════════════════════════╗");
  Serial.println("║        SPROUTSENSE — ESP32-CAM AI VISION MODULE v2.1          ║");
  Serial.println("║        Tomato Disease Detection via Edge Impulse               ║");
  Serial.println("╠════════════════════════════════════════════════════════════════╣");
#ifdef USE_EDGE_IMPULSE
  Serial.println("║  Mode: EDGE IMPULSE (real ML inference)                        ║");
#else
  Serial.println("║  Mode: SIMULATION (no EI library — random labels)              ║");
#endif
  Serial.println("╚════════════════════════════════════════════════════════════════╝");
  Serial.println();

  connectWiFi();
  initCamera();

  if (WiFi.status() == WL_CONNECTED) {
    syncRemoteAIConfig();
    sendHeartbeat();
  }

  logLine("INIT", "First capture...");
  if (captureAndAnalyze()) logLine("INIT", "First capture OK");
  else                     logLine("INIT", "First capture failed — will retry in loop");

  g_tLastCapture   = millis();
  g_tLastHeartbeat = millis();
  g_tLastConfig    = millis();

  printHelp();
  logLine("INIT", "Setup complete. Entering main loop.");
}

/* ============================================================
   MAIN LOOP
   ============================================================ */
void loop() {
  unsigned long now = millis();

  ensureWiFi();

  if (WiFi.status() == WL_CONNECTED && (now - g_tLastConfig >= CONFIG_SYNC_MS)) {
    g_tLastConfig = now;
    syncRemoteAIConfig();
  }

  if (WiFi.status() == WL_CONNECTED && (now - g_tLastHeartbeat >= HEARTBEAT_MS)) {
    g_tLastHeartbeat = now;
    sendHeartbeat();
  }

  if (now - g_tLastCapture >= g_captureInterval) {
    g_tLastCapture = now;
    captureAndAnalyze();

    if (DEEP_SLEEP_ENABLED) enterDeepSleep();
  }

  if (Serial.available()) handleSerialCmd((char)Serial.read());

  delay(LOOP_DELAY_MS);
}