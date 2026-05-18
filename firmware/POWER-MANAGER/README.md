# SproutSense Power Manager

## Overview

The **Power Manager** is an external Arduino that solves power stability issues in SproutSense by isolating high-load components (relay/pump) onto a separate 12V power supply while maintaining stable voltage for the ESP32 and sensors.

**Problem Solved:** ESP32 crashes when pump starts due to relay inrush current.  
**Solution:** Dedicated Arduino + external PSU for power distribution and monitoring.

---

## What's Included

| File | Purpose |
|------|---------|
| `POWER-MANAGER.ino` | Arduino firmware for power management |
| `INTEGRATION_GUIDE.md` | How to integrate with ESP32 firmware |
| `HARDWARE_SETUP.md` | Wiring diagram and hardware assembly |
| `TROUBLESHOOTING.md` | Diagnostic guide for power issues |
| `README.md` | This file |

---

## Quick Start (5 Minutes)

### 1. Upload Arduino Firmware

```bash
# In Arduino IDE:
1. File → Open → POWER-MANAGER/POWER-MANAGER.ino
2. Board: Arduino Nano
3. Port: COM# (your Arduino port)
4. Upload
```

### 2. Wire Hardware

**ESP32 ↔ Arduino Serial:**
```
ESP32 GPIO 16 (TX2) → Arduino D0 (RX)
ESP32 GPIO 17 (RX2) → Arduino D1 (TX)
ESP32 GND ────────→ Arduino GND
```

**Power Distribution:**
```
12V PSU → Arduino RAW
Arduino +5 → ESP32 USB 5V
Arduino GND → PSU GND (common)
```

**Relay Control:**
```
Arduino D8 → Relay Module IN1
Relay NO → Pump +12V
Relay COM ← 12V PSU +
```

See [HARDWARE_SETUP.md](HARDWARE_SETUP.md) for detailed wiring.

### 3. Update ESP32 Firmware

Modify `apps/api/firmware/ESP32-SENSOR/ESP32-SENSOR.ino`:

Replace:
```cpp
void startPump() {
  digitalWrite(PIN_RELAY, HIGH);  // ❌ OLD
}
```

With:
```cpp
void startPump() {
  sendPumpCommand(true);  // ✅ NEW - send to Power Manager
}
```

See [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) for complete code changes.

### 4. Test

1. Open Arduino Serial Monitor (9600 baud)
2. You should see voltage readings and heartbeat messages
3. Manually trigger pump from ESP32
4. Verify relay clicks and pump runs

---

## How It Works

```
┌─────────────────────────────────────────────────────────┐
│                 EXTERNAL 12V PSU (5A+)                 │
└──────────────────────────────────────────────────────────┘
                      │
    ┌─────────────────┼─────────────────┐
    │                 │                 │
    ▼                 ▼                 ▼
 [Relay]          [Regulator]       [Monitor]
    │              (7805 5V)            │
    │                 │                 │
    ▼                 ▼                 ▼
 [Pump]          [5V Rail]        [Arduino A0/A1]
                      │
                      ▼
                 ┌─────────────┐
                 │  Arduino    │
                 │  Power Mgr  │
                 └──────┬──────┘
                        │ Serial
                        ▼
                 ┌─────────────┐
                 │   ESP32     │
                 │  Sensors    │
                 └─────────────┘
```

**Key Benefits:**
- ✅ **Pump isolation** - Relay draws from 12V, not ESP32 power
- ✅ **Voltage monitoring** - Real-time 12V and 5V tracking
- ✅ **Safety cutoff** - Auto-stops pump if voltage drops below 10.5V
- ✅ **Stable sensors** - ESP32 gets clean 5V with no interference
- ✅ **Easy control** - Simple JSON commands over serial

---

## Hardware Requirements

### Minimum BOM (Bill of Materials)

| Item | Est. Cost |
|------|-----------|
| Arduino Nano/Uno | $10-20 |
| 12V 5A Power Supply | $25-40 |
| 7805 Voltage Regulator | $1-2 |
| Capacitors + Resistors | $2-5 |
| Relay Module (5V) | $10-15 |
| Breadboard + Wires | $5-10 |
| **TOTAL** | **~$60-100** |

### Why These Specs?

| Component | Why This? | Cheaper = |
|-----------|----------|-----------|
| **12V PSU 5A** | Pump inrush is ~3-4A, need headroom | Voltage sag → brownout |
| **Arduino Nano** | Small, cheap, reliable | ✅ Clones OK |
| **7805 Regulator** | Simple 12V → 5V conversion | Can't skip - PSU overspec |
| **Relay Module** | Isolated coil voltage | Direct control = noise |

---

## Firmware Compatibility

| System | Version | Status |
|--------|---------|--------|
| ESP32-SENSOR | v3.2+ | ✅ Supported |
| Arduino Nano | All | ✅ Works |
| Arduino Uno | All | ✅ Works |
| Arduino Pro Mini | All | ⚠️ Needs FTDI adapter |

---

## Communication Protocol

### ESP32 → Arduino Commands

**Start Pump:**
```json
{"cmd": "PUMP_START", "ml": 100.0}
```

**Stop Pump:**
```json
{"cmd": "PUMP_STOP"}
```

**Query Status:**
```json
{"cmd": "STATUS"}
```

### Arduino → ESP32 Responses

**Heartbeat (every 10 seconds):**
```json
{"type": "HEARTBEAT", "uptime": 45, "v_main": 12.05, "v_5v": 5.02, "pump_ok": true}
```

**Status Report:**
```json
{"status": "PUMP_OK", "detail": "started", "value": 0}
```

**Alert:**
```json
{"status": "PUMP_FAIL", "detail": "voltage_low", "value": 10.2}
```

---

## Configuration

Edit these constants in `POWER-MANAGER.ino`:

```cpp
#define PIN_RELAY_PUMP      8      // Arduino GPIO for relay control
#define PIN_SENSOR_EN       9      // Sensor power enable (optional)
#define PIN_V_MONITOR       A0     // 12V monitoring
#define PIN_5V_MONITOR      A1     // 5V monitoring
#define V_MIN_SAFE         10.5f   // Minimum safe voltage (stops pump)
#define V_5V_MIN_SAFE       4.7f   // Minimum safe 5V rail
#define PUMP_DELAY_MS       500    // Delay before relay activates
#define PUMP_TIMEOUT_MS    25000   // Max pump runtime
#define MONITOR_INTERVAL_MS 5000   // How often to check voltage
```

---

## Troubleshooting

### Arduino won't connect
- Check COM port in Device Manager
- Install **CH340 driver** if using clone
- Ensure correct baud rate (9600)

### No voltage readings
- Verify voltage divider wiring
- Measure voltage at ADC pin with multimeter
- Adjust `V_DIVIDER_RATIO` constant

### Pump won't start
- Check voltage reading - should be >11.5V
- Verify relay module is powered on
- Test relay manually with known 5V source

### ESP32 still resets
- Add larger capacitor (1000µF) on 12V rail
- Check all GND connections are soldered
- Verify serial communication is working

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for comprehensive diagnostics.

---

## Testing Checklist

- [ ] Arduino firmware uploads successfully
- [ ] Arduino serial monitor shows voltage readings
- [ ] ESP32 can communicate with Arduino (serial test)
- [ ] Pump starts/stops via Arduino command
- [ ] Voltage stays stable when pump is running
- [ ] No ESP32 crashes during pump operation
- [ ] Power Manager heartbeat received every 10s
- [ ] LED flash codes match expected patterns

---

## FAQ

**Q: Do I need to remove the relay from ESP32?**  
A: Yes - disconnect GPIO 14 from relay. Power Manager handles relay now.

**Q: Can I use this with other microcontrollers?**  
A: Yes! Power Manager is agnostic. Any device that can send serial JSON commands will work.

**Q: What if I don't need voltage monitoring?**  
A: You still need the external PSU and Arduino for relay isolation. Remove ADC code if not needed.

**Q: Can I control multiple relays?**  
A: Yes - add more GPIO pins and relay modules. Modify POWER-MANAGER.ino accordingly.

**Q: Is this permanent or temporary?**  
A: Permanent solution. Provides monitoring and safety features beyond just power isolation.

---

## Next Steps

1. ✅ Build hardware (see [HARDWARE_SETUP.md](HARDWARE_SETUP.md))
2. ✅ Upload Arduino firmware
3. ✅ Integrate ESP32 firmware (see [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md))
4. ✅ Test communication and pump control
5. ✅ Monitor for stability (check diagnostics)
6. Deploy to production

---

## Support

For issues:
1. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. Collect serial logs from both Arduino and ESP32
3. Measure voltages with multimeter
4. Report with full diagnostics

---

## License

Same as SproutSense project (See root LICENSE)

---

**Last Updated:** 2026-05-18  
**Status:** Production Ready  
**Version:** 1.0
