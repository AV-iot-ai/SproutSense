# Power Manager Integration - ESP32 Firmware Updates

This document explains how to integrate the Power Manager Arduino with your ESP32 firmware.

## Overview

The Power Manager is an external Arduino that:
- Controls relay/pump independently (separate 12V power supply)
- Monitors voltage levels (12V PSU and 5V rails)
- Communicates with ESP32 via serial
- Prevents brownouts and power spikes

## Integration Steps

### 1. Add Serial Communication Module

Create a new file: `src/Services/PowerManager.js` (or C++ equivalent in firmware)

### For ESP32 C++ Firmware:

Add these helper functions to your ESP32 firmware:

```cpp
/* ============================================================
   POWER MANAGER SERIAL COMMUNICATION
   ============================================================ */
HardwareSerial SerialPM(2);  // UART2 on ESP32
#define PM_BAUD_RATE 9600
#define PM_RX_PIN    16      // GPIO 16 → Arduino TX
#define PM_TX_PIN    17      // GPIO 17 → Arduino RX

void initPowerManager() {
  SerialPM.begin(PM_BAUD_RATE, SERIAL_8N1, PM_RX_PIN, PM_TX_PIN);
  logLine("SETUP", "Power Manager initialized on UART2");
}

void sendPumpCommand(bool start, float targetMl = 100.0f) {
  StaticJsonDocument<256> doc;
  doc["cmd"] = start ? "PUMP_START" : "PUMP_STOP";
  if (start) {
    doc["ml"] = targetMl;
  }
  
  String output;
  serializeJson(doc, output);
  SerialPM.println(output);
  
  logLine("PM_CMD", "Sent: %s", output.c_str());
}

void processPowerManagerResponse() {
  if (SerialPM.available()) {
    String line = SerialPM.readStringUntil('\n');
    if (line.length() > 0) {
      handlePMResponse(line);
    }
  }
}

void handlePMResponse(const String& line) {
  StaticJsonDocument<512> doc;
  DeserializationError error = deserializeJson(doc, line);
  
  if (error) {
    logLine("PM_RESP", "Parse error: %s", error.c_str());
    return;
  }
  
  const char* type = doc["type"];
  
  if (strcmp(type, "HEARTBEAT") == 0) {
    float vMain = doc["v_main"];
    float v5V = doc["v_5v"];
    bool pumpOk = doc["pump_ok"];
    
    logLine("PM_HEALTH", "Uptime: %lu s | V_Main: %.2fV | V_5V: %.2fV | Pump: %s",
            doc["uptime"].as<uint32_t>(),
            vMain, v5V,
            pumpOk ? "OK" : "BUSY");
  }
  else if (doc["status"]) {
    const char* status = doc["status"];
    const char* detail = doc["detail"];
    float value = doc["value"] | 0.0f;
    
    logLine("PM_STATUS", "%s - %s (%.2f)", status, detail, value);
  }
}

// In your loop() or setup():
// Call initPowerManager() in setup()
// Call processPowerManagerResponse() in loop() periodically
```

### 2. Replace Pump Control Functions

In your ESP32 firmware, modify `startPump()` and `stopPump()`:

**Before:**
```cpp
void startPump(const char* trigger = "manual") {
  digitalWrite(PIN_RELAY, HIGH);  // Direct GPIO control
  g_pumpRunning = true;
  // ... rest of code
}

void stopPump() {
  digitalWrite(PIN_RELAY, LOW);
  g_pumpRunning = false;
}
```

**After (with Power Manager):**
```cpp
void startPump(const char* trigger = "manual") {
  // Don't control GPIO directly - let Power Manager handle it
  g_pumpRunning = true;
  g_pumpStartMs = millis();
  
  sendPumpCommand(true, TARGET_WATER_ML);  // Send to Power Manager
  
  logLine("PUMP", "Start command sent to Power Manager (%s)", trigger);
}

void stopPump() {
  g_pumpRunning = false;
  
  sendPumpCommand(false);  // Send to Power Manager
  
  logLine("PUMP", "Stop command sent to Power Manager");
}
```

### 3. Remove Direct Relay GPIO Control

In your ESP32 code, **comment out or remove**:

```cpp
// ❌ REMOVE these lines:
// pinMode(PIN_RELAY, OUTPUT);
// digitalWrite(PIN_RELAY, HIGH/LOW);
```

The Power Manager will handle relay control exclusively.

### 4. Integration in loop()

Add to your ESP32 main loop:

```cpp
void loop() {
  unsigned long now = millis();
  
  // ... existing code ...
  
  // Process responses from Power Manager (new)
  if (now - g_tPowerManager >= 100) {
    g_tPowerManager = now;
    processPowerManagerResponse();
  }
  
  // ... rest of loop ...
}
```

Add this global variable at the top:
```cpp
unsigned long g_tPowerManager = 0;
```

## Hardware Wiring

### Serial Connection (ESP32 ↔ Power Manager Arduino)

| ESP32 Pin  | Arduino Pin | Signal      |
|-----------|-----------|-------------|
| GPIO 16   | TX (pin 1) | Serial RX   |
| GPIO 17   | RX (pin 0) | Serial TX   |
| GND       | GND       | Ground      |

### Power Supply Architecture

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│  External 12V PSU (5A minimum)                          │
│         ↓                                               │
│  ┌──────────────────────────────────────┐              │
│  │  Arduino Power Manager                │              │
│  │  ├─ Voltage Monitoring (12V, 5V)    │              │
│  │  ├─ Pump Relay Control (GPIO 8)     │              │
│  │  ├─ Sensor Power Enable (GPIO 9)    │              │
│  │  └─ Serial Communication (UART)     │              │
│  └──────────────────────────────────────┘              │
│       ↑           ↑           ↑                         │
│    5V Rail    GND (common)  Relay                       │
│       ↓                       ↓                         │
│  ┌─────────┐            ┌─────────┐                    │
│  │ ESP32   │            │ Relay   │                    │
│  │ Sensors │            │ Pump    │                    │
│  └─────────┘            └─────────┘                    │
│       ↑                       ↑                         │
│    5V USB          12V from external PSU               │
└─────────────────────────────────────────────────────────┘
```

### Required Components

- **Arduino Nano or Uno** (~$10-15)
- **5A+ 12V Power Supply** (~$20-30)
- **Voltage Regulator** (7805 5V regulator if needed)
- **2× 100k Ω Resistors** (voltage divider for monitoring)
- **Capacitors** (0.1µF + 10µF for power filtering)
- **Jumper wires** and **breadboard** (for prototyping)

### Voltage Divider Calibration

For monitoring 12V on Arduino ADC pin:

```
12V PSU ─┬─ 100kΩ R1 ─┬─── A0 (ADC)
         │            │
       GND          100kΩ R2
                      │
                     GND
```

**Theoretical voltage at A0:** 12V × (100k / 200k) = 6V (exceeds 5V max!)

**Better calibration:** Use 360k + 100k to get ~1.25V at A0 for 12V input:
- Set `V_DIVIDER_RATIO = 4.8f`

Or use an **integrated voltage divider module** (pre-calibrated).

## Testing

### Arduino Serial Monitor
1. Upload `POWER-MANAGER.ino` to Arduino
2. Open Serial Monitor at **9600 baud**
3. Should see:
   ```
   ║ [INFO  | PUMP      ] Start command received
   ║ V_MAIN: 12.05V (raw: 987)  V_5V: 5.02V (raw: 1023)
   ║ [OK    | PUMP      ] Relay activated
   ```

### ESP32 Serial Monitor
1. Update ESP32 firmware with Power Manager integration
2. Open Serial Monitor at **115200 baud**
3. Should see:
   ```
   [PUMP] Start command sent to Power Manager (auto)
   [PM_HEALTH] Uptime: 45 s | V_Main: 12.05V | V_5V: 5.02V | Pump: OK
   ```

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| No serial communication | Wrong baud rate or pins | Check baud rate (9600) and GPIO pins |
| Pump doesn't activate | Low voltage alert | Check PSU is 12V and has 5A+ capacity |
| Random resets | Power supply not stable | Add 1000µF capacitor across 12V rails |
| ADC readings wrong | Voltage divider miscalibrated | Measure actual voltage at ADC pin, adjust ratio |
| Arduino resets | Insufficient GND connections | Ensure common ground between ESP32, Arduino, PSU |

## Benefits

✅ **Isolated power control** - Pump draws from separate 12V PSU
✅ **No ESP32 brownouts** - Relay inrush current doesn't affect ESP32
✅ **Voltage monitoring** - Detects and alerts on low voltage
✅ **Safety cutoff** - Pump auto-stops if voltage drops too low
✅ **Scalable** - Easy to add more sensors/actuators later
