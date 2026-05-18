# 🌿 SproutSense: Final Hardware Wiring & Power Guide
**Project**: Automated Plant Care System
**Configuration**: ESP32 (Logic) + Arduino Uno (Power Management)
**Power Source**: 5V Single Supply (Buffered with 1000µF Capacitor)

---

## ⚠️ CRITICAL SAFETY RULES (Read First)
1.  **Common Ground**: Connect a wire between **ESP32 GND** and **Arduino GND**.
2.  **Voltage Protection**: Do NOT connect the 12V pump power directly to any ESP32/Arduino pins.
3.  **Capacitor**: Place a **1000µF Capacitor** across the logic power rail (5V and GND) to prevent resets when the pump starts.
4.  **Heat Management**: ESP32 is running at **80MHz** (software fix) and most sensors are moved to the Arduino rail (hardware fix).

---

## 1. Power Distribution Table

| Component | Power Source | VCC Pin | GND Pin |
| :--- | :--- | :--- | :--- |
| **ESP32 DevKit** | USB (Logic) | - | GND |
| **Arduino Uno** | USB/Ext (Power) | - | GND |
| **Relay Module** | **Arduino 5V** | 5V / VCC | GND |
| **Soil Moisture** | **Arduino 5V** | VCC | GND |
| **Flow Meter** | **Arduino 5V** | VCC (Red) | GND (Black) |
| **Buzzer** | **Arduino 5V** | (+) / VCC | (Signal) |
| **DHT22** | **ESP32 3.3V** | VCC | GND |
| **LDR Module** | **ESP32 3.3V** | VCC | GND |

---

## 2. Logic Wiring (Signal Pins)

### ESP32 (Main Controller)
| Pin | Type | Connected To |
| :--- | :--- | :--- |
| **GPIO 35** | Analog IN | Soil Moisture Signal (AO) |
| **GPIO 32** | Analog IN | LDR Signal (AO) |
| **GPIO 13** | Digital IN | DHT22 Data Pin |
| **GPIO 26** | Interrupt | Flow Meter Signal (Yellow) |
| **GPIO 27** | Output | Buzzer Control |
| **GPIO 33** | Input | **Push Button**:<br>1. One side to GPIO 33<br>2. Other side to ESP32 GND |
| **GPIO 16** | RX2 | Arduino Uno TX |
| **GPIO 17** | TX2 | Arduino Uno RX |

### Arduino Uno (Power/Pump Manager)
| Pin | Type | Connected To |
| :--- | :--- | :--- |
| **Pin 0** | RX | ESP32 TX (GPIO 17) |
| **Pin 1** | TX | ESP32 RX (GPIO 16) |
| **Pin 8** | Output | Relay Module Signal (IN) |

---

## 3. High Power / Pump Circuit
*   **Source**: Battery or 5V Adapter.
*   **Relay COM**: Connect to Positive (+) of Power Source.
*   **Relay NO**: Connect to Positive (+) of Pump.
*   **Pump Negative (-)**: Connect to Negative (-) of Power Source.
*   **Capacitor**: Connect 1000µF capacitor across the Pump (+) and (-) for motor noise filtering.

---

## 4. System Logic & Beep Codes

### Buzzer Behavior (Status Sounds)
*   **Power On / Reset**: 3 Short beeps (Signals ESP32 started).
*   **Pump Activated**: 2 Short beeps (Signals watering started).
*   **HTTP/Network Failure**: 1 Long beep (Signals data could not reach server).

### Button Behavior (Silence Control)
*   **Single Press**: Toggles the Buzzer ON or OFF.
*   **Confirmation**:
    *   **Buzzer ON**: 1 Short high beep.
    *   **Buzzer OFF**: 2 Very short low beeps.

---

## 5. Software Checklist
- [ ] ESP32 CPU set to **80MHz** in `setup()`.
- [ ] Serial communication set to **9600 baud** for Uno-to-ESP link.
- [ ] Ensure `INPUT_PULLUP` is used for the Button and Flow Sensor.

---
**Date Generated**: May 18, 2026
**Document ID**: SS-WIRING-FINAL-V4
