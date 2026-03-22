# Dual ESP32 Architecture (Current)

This project uses two ESP32 devices.

## ESP32 #1: Sensor Controller

Purpose:
- Read environmental sensors
- Run watering logic
- Control relay/pump
- Display live data on TFT ST7735R
- Push data to backend

Main firmware:
- esp32-upload/ESP32 - Controller/SproutSense_ESP32-SENSOR.ino

## ESP32 #2: ESP32-CAM AI

Purpose:
- Capture plant images
- Run disease/vision workflow
- Send disease results to backend

Main firmware:
- esp32-upload/ESP32_CAM_AI/ESP32_CAM_AI.ino

## Why Dual ESP32

- Better stability (sensor and camera loads are separated)
- Simpler pin planning
- Easier maintenance and debugging

## Communication Model

Both devices send HTTP data to backend APIs.
Frontend reads via backend/websocket.

## Not Used in Current Setup

- Blynk
- Google Assistant


