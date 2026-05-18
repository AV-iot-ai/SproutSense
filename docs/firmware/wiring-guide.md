# SproutSense Wiring Guide (Current)

This is the only wiring you need for your current project.


Important:
- Blynk is not used in the current firmware
- Google Assistant is removed
- Sensor board is ESP32-WROOM-32 DevKit (not ESP32-CAM)
- ESP32-CAM is used only for camera/AI module (no sensors connected)
- Data is sent to backend API (no direct cloud dashboard wiring)
- pH sensor and on-device display are not used in the current hardware build

---

## 1) Sensor Controller Board (ESP32-WROOM-32 DevKit)

Use this board for:
- soil moisture
- DHT22
- light (LDR module AO)
- flow sensor
- button
- relay + pump
- buzzer (optional audible alert)

### Power Rules
- ESP32: USB 5V
- Sensors: 3.3V or 5V as required
- Relay + pump: external 5V supply recommended
- All grounds must be common

---


## 2) Pin Mapping (ESP32 Sensor Controller)

### Sensors (Analog/Other)
- **GPIO 35** (`PIN_SOIL_MOISTURE`): Soil Moisture AO
- **GPIO 32** (`PIN_LDR`): LDR digital output (use `LDR_DIGITAL_MODE` = 1)
- **GPIO 13** (`PIN_DHT`): DHT22 DATA
- **GPIO 26** (`PIN_FLOW`): Flow sensor pulse (YFS401/YF-S401 yellow)
- **GPIO 33** (`PIN_BUTTON`): Manual button input (active LOW)

### Relay + Pump
- **GPIO 14** (`PIN_RELAY`): Relay IN1 (pump control)

### Optional Buzzer
- **GPIO 27** (`PIN_BUZZER`): audible alert output

---


## 3) Relay and Pump Wiring (Safe)

Relay logic side:
- Relay VCC -> 5V
- Relay GND -> GND
- Relay IN1 -> GPIO 14 (PIN_RELAY)

Pump power side:
- PSU +5V -> Relay COM
- Relay NO -> Pump + (red)
- Pump - (black) -> PSU GND
- PSU GND -> ESP32 GND (common ground)

Why NO contact:
- Pump remains OFF by default when relay is idle (recommended for safety).

---

## 4) DHT22 Wiring

- DHT22 VCC -> 3.3V
- DHT22 DATA -> GPIO 13
- DHT22 GND -> GND
- Optional: 10k pull-up from DATA to 3.3V

---

## 5) Flow Sensor YFS401 (YF-S401)

- Red -> 5V
- Black -> GND
- Yellow -> GPIO 26

Mount direction as arrow on sensor body.

---

## 6) Button Wiring (Manual Pump Toggle)

- One side -> GPIO 33
- Other side -> GND
- Configure GPIO33 as `INPUT_PULLUP` (already used in firmware)
- Logic: press = LOW, release = HIGH

---

## 7) ESP32-CAM (AI Module) Wiring

Use ESP32-CAM only for image capture / disease inference.
Do not connect sensor controller analog sensors to ESP32-CAM.
This build uses the OV3660 camera module variant.

Typical:
- 5V -> ESP32-CAM 5V
- GND -> ESP32-CAM GND
- UART (for flashing) via USB-TTL/FTDI

---

## 8) Quick Pre-Power Checklist

- Common GND connected across ESP32, relay PSU, sensors
- Pump powered from external 5V (not directly from ESP32 3.3V)
- Sensor AO lines are on ADC1 pins (35). The LDR in digital mode uses GPIO32.
- No Blynk pins or Blynk dependencies in wiring
- Button on GPIO33 pulls to GND when pressed

---


## 9) Software Match Check

Firmware file:
- `firmware/esp32-sensor/ESP32-SENSOR.ino`

Pin defines in firmware:
- `PIN_SOIL_MOISTURE` = 35
 - `PIN_LDR` = 32
- `PIN_DHT` = 13
- `PIN_FLOW` = 26
- `PIN_RELAY` = 14
- `PIN_BUZZER` = 27
- `PIN_BUTTON` = 33

Other notes:
- Legacy extra analog chemistry input is disabled in the current firmware build
- Backend API URL is set in code (no hardware change needed)

---

If boot fails after wiring changes:
- Re-check GPIO assignments against firmware constants
- Confirm common ground and external pump power wiring
- Keep GPIO 0, 2, 15 boot constraints in mind when flashing


