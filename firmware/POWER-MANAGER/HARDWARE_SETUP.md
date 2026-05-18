# Power Manager - Hardware Setup & Wiring

## Quick Summary

**Problem:** ESP32 crashes when pump starts due to power surge  
**Solution:** Use Arduino Uno + single 5V PSU with large capacitor for inrush current

---

## Hardware Shopping List

| Component | Part Number | Price | Notes |
|-----------|------------|-------|-------|
| Arduino Uno | Arduino Uno R3 | $20-30 | You already have one ✓ |
| Power Supply | 5V 3A USB | $10-15 | Enough for ESP32 + 3-6V pump |
| OR | 12V 2A adapter | $10-15 | If you want headroom (convert to 5V) |
| Voltage Regulator | LM7805 | $1-2 | For clean 5V if using 12V PSU |
| Capacitors | 1000µF + 0.1µF | $3-5 | **Important: large cap for pump inrush** |
| Resistors | 100k Ω | <$1 | For voltage divider (optional monitoring) |
| Relay Module | 5V 1-channel relay | $5-8 | Single channel is enough for pump |
| Jumper wires + breadboard | | $5-10 | For prototyping |
| **TOTAL** | | **~$35-50** | Much simpler & cheaper! |

---

## Wiring Diagram ASCII

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃     SINGLE 5V USB POWER SUPPLY           ┃
┃        Input: USB 5V 3A+                 ┃
┃    Enough for ESP32 + 3-6V pump         ┃
┗━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
    ┃ (5V+)
    ┃
    ├─→ [1000µF Capacitor] (Important for pump inrush!)
    │
    ├─→ [Arduino Uno] Vin = 5V
    │   └─ Arduino +5 output
    │
    └─→ [LDO Regulator] (optional, if you want cleaner 5V)
        └─ Output → 5V Rail
    
    Arduino Pin Configuration:
    ├─ D8 → Relay IN (pump control)
    ├─ D0 (RX) ← ESP32 GPIO 17 (TX2)
    ├─ D1 (TX) → ESP32 GPIO 16 (RX2)
    ├─ A0 → 5V monitoring (optional)
    └─ GND ← Common GND
    
    Relay Wiring:
    ├─ VCC ← 5V
    ├─ GND ← Common GND
    ├─ IN ← Arduino D8
    │
    ├─ NO (Normally Open) → Pump +5V/6V
    └─ COM (Common) ← 5V Rail
    
    Pump:
    ├─ +5V/6V ← Relay NO
    └─ GND ← Common GND
    
┌─────────────────────────────────────────────┐
│         ARDUINO UNO PIN LAYOUT              │
├─────────────────────────────────────────────┤
│                                             │
│  Vin ═╪═ GND                                │
│  +5V ═╪═ RST                                │
│  GND ═╪═ D1 (TX) → ESP32 GPIO 16 (RX)      │
│   A5 ═╪═ D0 (RX) ← ESP32 GPIO 17 (TX)      │
│   A4 ═╪═ D2                                │
│   A3 ═╪═ D3                                │
│   A2 ═╪═ D4                                │
│   A1 ═╪═ D5                                │
│   A0 ═╪═ D6                                │
│  +5V ═╪═ D7                                │
│  GND ═╪═ D8 → Relay IN (HIGH = pump ON)    │
│   Vin ═╪═ D9                               │
│       ═╪═ D10                              │
│       ═╪═ D11                              │
│       ═╪═ D12                              │
│       ═╪═ D13 → Status LED (optional)      │
│                                             │
└─────────────────────────────────────────────┘

PIN CONNECTIONS SUMMARY:

Power Management:
  PSU +5V ────── Arduino Vin (with 1000µF cap)
  PSU GND ────── Arduino GND (common with ESP32 GND)
  Arduino +5V ── 5V Rail (for sensors/ESP32)

Control:
  Arduino D8 ──── Relay IN (HIGH = pump on)
  Arduino D13 ─── Status LED (optional)

Communication:
  Arduino D0 (RX) ← ESP32 GPIO 17 (TX2)
  Arduino D1 (TX) → ESP32 GPIO 16 (RX2)
  Arduino GND ──── ESP32 GND (common ground)

Optional Monitoring:
  Arduino A0 ──── 5V monitoring input (optional voltage divider)

Pump Connection:
  Relay NO → 5V/6V pump +
  Relay GND → Pump GND (common with rest of system)
```

---

## Step-by-Step Setup

### Step 1: Build Voltage Dividers

**Optional: For 5V Monitoring (Arduino A0):**

If you want to monitor voltage, use a simple voltage divider:

```
  5V Rail
    │
    R1 (100kΩ)
    │
    ├──→ Arduino A0
    │
    R2 (100kΩ)
    │
     GND
```

Expected voltage at A0: `5V × (100k / (100k+100k)) = 2.5V`

**NOTE:** This is optional - pump is so low-power you may not need monitoring.

### Step 2: Solder Connections

Build on breadboard first:

1. Mount Arduino Uno on breadboard
2. Connect 5V PSU wires: +5V to Vin (with 1000µF cap first!), GND to GND
3. Connect relay module (VCC=+5V, GND=GND, IN=D8)
4. Add 1000µF capacitor across Vin and GND (THIS IS CRITICAL)
5. Add 0.1µF ceramic capacitor across Arduino +5V and GND
6. Connect pump to relay NO output
7. Optional: solder voltage divider resistors if you want monitoring

### Step 3: Test Power Rails

Before connecting ESP32:

```bash
PSU output: Should read ~5.0V±0.2V
Arduino Vin pin: Should read ~5.0V (after diode if present)
Arduino +5 pin: Should read ~4.8V+ (accounting for 0.2V drop)
With 1000µF cap: Should be stable under load
```

### Step 4: Connect ESP32 Serial

**Critical:** Connect grounds FIRST before anything else!

Using **GPIO 16/17** (UART2) on ESP32:

```
ESP32 Pin 16 (TX2) → Arduino Pin 0 (RX)
ESP32 Pin 17 (RX2) → Arduino Pin 1 (TX)
ESP32 GND ────────→ Arduino GND (common)
```

### Step 5: Upload Firmware

**Arduino:**
1. Open Arduino IDE
2. File → Open → `firmware/POWER-MANAGER/POWER-MANAGER.ino`
3. Select **Board: Arduino Uno** (important!)
4. Select correct **COM port**
5. Upload

**ESP32:**
1. Update ESP32 firmware with Power Manager integration
2. Modify `startPump()` and `stopPump()` functions (see INTEGRATION_GUIDE.md)
3. Upload to ESP32

### Step 6: Test Communication

1. Connect both boards via serial (check all grounds first!)
2. Open Arduino Serial Monitor (9600 baud)
3. Should see startup messages:
  ```
  ║ SproutSense POWER MANAGER v1.0 - Starting Up
  ║ [INFO  | SETUP     ] Power Manager initialized
  ║ [OK    | VOLTAGE   ] Voltage readings OK
  ```
4. Manually trigger pump from ESP32
5. Verify relay clicks and pump runs

---

## Calibration

### Voltage Divider Calibration (If Using Monitoring)

If readings are off:

1. **Measure actual voltage** at the ADC pin with multimeter
2. **Adjust `V_DIVIDER_RATIO`** in POWER-MANAGER.ino:
  ```cpp
  #define V_DIVIDER_RATIO  2.0f  // For 5V divider (usually ~2.0)
  ```
3. Formula: `Actual_Voltage_at_PSU / Measured_Voltage_at_ADC = V_DIVIDER_RATIO`

### Fine-tuning Pump Delay

**With a large 1000µF capacitor, you may not need delay, but if you see resets:**

1. Increase `PUMP_DELAY_MS` in POWER-MANAGER.ino:
  ```cpp
  #define PUMP_DELAY_MS  1000  // Increase from 500ms to 1000ms
  ```
2. This gives the capacitor more time to charge before pump activates

---

## Safety Features

✅ **Voltage Monitoring** - Stops pump if voltage drops below 10.5V  
✅ **Pump Timeout** - Auto-stops pump after 25 seconds (safety cutoff)  
✅ **Serial Heartbeat** - Arduino sends status every 10 seconds  
✅ **LED Status** - 3 flashes = ready, 4 flashes = low voltage, 5 flashes = timeout  

---

## Troubleshooting Checklist

| Symptom | Diagnosis | Fix |
|---------|-----------|-----|
| Arduino won't upload | Wrong board selected | Select "Arduino Nano" in IDE |
| ESP32 still resets | Serial communication failed | Check GPIO 16/17 connections |
| Pump doesn't turn on | Low voltage alert | Check PSU is outputting 12V |
| Voltage readings show 0 | ADC pin not connected | Verify voltage divider wiring |
| Arduino resets randomly | Power supply insufficient | Upgrade to 5A PSU, add 1000µF cap |
| No serial output | Wrong baud rate | Ensure both sides use 9600 |

---

## Optional: Add Current Monitoring

To monitor pump current (detect clogs):

```cpp
// Add current sensor on pump +12V line
#define PIN_CURRENT_SENSE A2  // Use INA219 module for accuracy

// In loop():
float current_mA = analogRead(PIN_CURRENT_SENSE) * (5.0 / 1023.0) * 200;  // 200mA per volt
if (current_mA > 500) {  // Pump drawing too much current
  logError("PUMP", "High current detected: %.0f mA", current_mA);
  stopPump();
}
```

---

## Next Steps

1. ✅ Build and test Power Manager (this guide)
2. ✅ Integrate ESP32 firmware (see INTEGRATION_GUIDE.md)
3. ✅ Verify serial communication
4. ✅ Test pump control with monitoring
5. Deploy to production with monitoring
