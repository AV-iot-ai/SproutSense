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
| **Soil Moisture** | **ESP32 3.3V** | VCC | GND |
| **Flow Meter** | **Arduino 5V** | VCC (Red) | GND (Black) |
| **Buzzer** | **Arduino 5V** | (+) / VCC | PIN 9 |
| **Button** | **Logic (GND)** | - | PIN 2 |
| **DHT22** | **ESP32 3.3V** | VCC | GND |
| **LDR Module** | **Digital (GPIO)** | VCC | GND |

---

## 2. Logic Wiring (Signal Pins)

### ESP32 (Main Controller)
| Pin | Type | Connected To |
| :--- | :--- | :--- |
| **GPIO 35** | Analog IN | Soil Moisture Signal (AO) |
| **GPIO 32** | Analog IN | LDR Signal (AO) |
| **GPIO 15** | Digital IN | DHT22 Data Pin |
| **GPIO 26** | Interrupt | Flow Meter Signal (Yellow) |
| **GPIO 16** | RX2 | Arduino Uno TX |
| **GPIO 17** | TX2 | Arduino Uno RX |

### Arduino Uno (Power/Pump Manager)
| Pin | Type | Connected To |
| :--- | :--- | :--- |
| **Pin 0** | RX | ESP32 TX (GPIO 17) |
| **Pin 1** | TX | ESP32 RX (GPIO 16) |
| **Pin 2** | Interrupt | **Push Button**:<br>1. One side to Pin 2<br>2. Other side to Arduino GND |
| **Pin 8** | Output | Relay Module Signal (IN) |
| **Pin 9** | Output | **Buzzer**:<br>1. (+) to Pin 9<br>2. (-) to Arduino **GND** |

---

## 3. High Power / Pump Circuit
*   **Source**: Battery or 5V Adapter.
*   **Relay COM**: Connect to Positive (+) of Power Source.
*   **Relay NO**: Connect to Positive (+) of Pump.
*   **Pump Negative (-)**: Connect to Negative (-) of Power Source.
*   **Capacitor**: Connect 1000µF capacitor across the Pump (+) and (-) for motor noise filtering.

---

## 4. System Logic & Beep Codes

### Buzzer Behavior (Arduino Managed)
*   **Automatic Trigger**: Buzzer turns ON immediately when Pump Relay (Pin 8) is activated.
*   **Mute Toggle**: Pressing the Button (Pin 2) while pump is running will toggle the buzzer status.
*   **Reset**: Buzzer logic resets (unmuted) every time a new watering cycle starts.

### Button Behavior (Uno Interrupt)
*   **Interrupt Driven**: Connected to Pin 2 (`INPUT_PULLUP`).
*   **Function**: Acts as a hard-wired mute switch for the buzzer alerts during motor operation.

---

## 5. Software Checklist
- [ ] ESP32 CPU set to **80MHz** in `setup()`.
- [ ] Serial communication set to **9600 baud** for Uno-to-ESP link.
- [ ] Ensure `INPUT_PULLUP` is used for the Button and Flow Sensor.

---
**Date Generated**: May 18, 2026
**Document ID**: SS-WIRING-FINAL-V4
