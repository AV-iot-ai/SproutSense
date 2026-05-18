# SproutSense Configuration Guide (Current)

Use this as the single configuration reference.

## 1) Sensor Controller Firmware

File:
- firmware/esp32-sensor/ESP32-SENSOR.ino

Set:
- WiFi SSID and password
- BACKEND_SENSOR_POST_URL
- BACKEND_DEVICE_ID
- Timezone string

## 2) Pin Configuration (must match wiring)

Sensors:
- Moisture AO -> GPIO 35
 - LDR (digital) -> GPIO 32
- DHT22 DATA -> GPIO 13
- Flow pulse (YFS401 / YF-S401) -> GPIO 26
- Button input (active LOW, INPUT_PULLUP) -> GPIO 33

Relay:
- IN1 -> GPIO 14

## 3) Core Thresholds

- Soil moisture trigger: 30%
- Soil moisture target: 70%
- Temperature comfort: 18C - 28C
- Humidity comfort: 40% - 75%

## 4) Backend Environment

Backend .env minimum:
- MONGODB_URI
- PORT
- CORS_ORIGIN
- NODE_ENV

Optional AI/weather keys can be set if used by backend.

## 5) Frontend Environment

apps/web .env minimum:
- VITE_API_BASE_URL

## 6) Required Arduino Libraries

- DHT sensor library

## 7) Current Non-Goals


- Google Assistant is not used
- pH sensor is not used in the current build
- on-device display module is not used in the current build

If something does not work, verify docs/firmware/wiring-guide.md first.


