# SproutSense Architecture (Current)

This architecture reflects your current setup.

## Current Setup

- Dual ESP32 architecture
- No Blynk
- No Google Assistant
- Sensor controller includes TFT ST7735R live display
- ESP32-CAM used for image/disease workflow
- Backend + React dashboard as primary interface

## System Blocks

1. ESP32 Sensor Controller
- Reads moisture, pH, temperature, humidity, light, flow
- Controls pump relay
- Shows live values on TFT display
- Sends readings to backend API

2. ESP32-CAM AI Module
- Captures plant images
- Sends disease inference/events to backend

3. Backend (Node.js + Express + MongoDB)
- Stores sensor, watering, disease, config data
- Exposes APIs
- Pushes realtime updates to frontend

4. Frontend (React)
- Live dashboard
- Watering controls
- Configuration and history

## Data Flow

ESP32 Sensor -> /api/sensors -> MongoDB -> Web Dashboard
ESP32-CAM -> /api/ai/* -> MongoDB -> Web Dashboard

## Key Firmware Files

- esp32-upload/ESP32 - Controller/SproutSense_ESP32-SENSOR.ino
- esp32-upload/ESP32_CAM_AI/ESP32_CAM_AI.ino

## Key Docs

- docs/WIRING_GUIDE.md
- docs/CONFIGURATION_GUIDE.md
- docs/DEPLOYMENT_CHECKLIST.md


