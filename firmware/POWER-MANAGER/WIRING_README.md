# SproutSense Wiring Guide (ESP32 + Arduino Uno Power Manager)

ESP32 handle logic. Arduino Uno handle power + relay. 1000µF cap stop brownout.

## 1. ESP32 Sensor Connections

| Sensor | ESP32 Pin | Logic |
| :--- | :--- | :--- |
| **Soil Moisture** | GPIO 35 | Analog (Soil AO) |
| **LDR** | GPIO 32 | Analog (LDR AO) |
| **DHT22** | GPIO 13 | Digital Data |
| **YF-S401 (Flow)** | GPIO 26 | Pulse (Yellow wire) |
| **Button** | GPIO 33 | ACTIVE LOW (Input Pullup) |
| **Buzzer** | GPIO 27 | PWM/Digital |

## 2. ESP32 ↔ Arduino Uno (Serial)

| Signal | ESP32 Pin | Arduino Uno Pin |
| :--- | :--- | :--- |
| **TX → RX** | GPIO 17 (TX2) | D0 (RX) |
| **RX ← TX** | GPIO 16 (RX2) | D1 (TX) |
| **Ground** | GND | GND (Common) |

## 3. Arduino Uno + Relay + Motor

| Component | Pin | Note |
| :--- | :--- | :--- |
| **Relay IN** | Arduino D8 | High = Pump ON |
| **Status LED** | Arduino D13 | Blinks on state change |

### Relay Power Path:
1. **Relay VCC/GND** → Arduino 5V/GND.
2. **Relay COM** → 5V Rail (+).
3. **Relay NO** → Motor (+).
4. **Motor (-)** → Common GND.

## 4. Power Architecture (CRITICAL)

Single 5V 3A+ PSU required.

1. **PSU 5V+** → **1000µF Capacitor (+)** → Arduino Vin / ESP32 5V.
2. **PSU GND** → **1000µF Capacitor (-)** → Common Ground.

Capacitor absorb inrush. ESP32 stay alive.

## Setup
1. Flash `POWER-MANAGER-SIMPLE.ino` to Uno.
2. Flash `ESP32-SENSOR.ino` to ESP32.
3. Verify Serial at 9600 baud.
