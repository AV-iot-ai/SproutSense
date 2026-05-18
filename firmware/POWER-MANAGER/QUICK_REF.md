# Power Manager - Quick Reference Card

**Print this page for easy reference during assembly**

---

## 📋 Shopping List

```
☐ Arduino Nano or Uno (~$15)
☐ 12V Power Supply, 5A+ (~$30)
☐ 7805 Voltage Regulator (~$2)
☐ Capacitors: 0.1µF + 10µF (~$3)
☐ Resistors: 100k + 360k Ω (~$1)
☐ Relay Module 5V 4-channel (~$12)
☐ Breadboard + Jumper Wires (~$8)
────────────────────────────
TOTAL: ~$75 (one-time)
```

---

## 🔌 Pin Connections

### Arduino Nano Pinout

```
╔════════════════════════════════╗
║ Arduino Nano Pinout            ║
╠════════════════════════════════╣
║ GND ─── GND (PSU common)       ║
║ +5V ─── 5V Rail (via 7805)     ║
║ Vin ─── 12V from PSU           ║
║ D0 (RX) ← ESP32 GPIO 17 (TX2)  ║
║ D1 (TX) → ESP32 GPIO 16 (RX2)  ║
║ D8 ──→ Relay IN1 (pump control)║
║ D9 ──→ Sensor EN (GPIO)        ║
║ D13 ─→ Status LED (optional)   ║
║ A0 ──← 12V divider tap         ║
║ A1 ──← 5V divider tap          ║
╚════════════════════════════════╝
```

### Relay Wiring

```
Relay Module:
  VCC ─── 5V
  GND ─── GND
  IN1 ← Arduino D8
  
  NO  ─→ Pump +12V
  COM ← 12V PSU +
  
Pump:
  GND ─── PSU GND (common)
```

---

## 📏 Voltage Dividers

### For 12V Monitoring (A0)

```
   PSU 12V+
      │
   360kΩ
      │
      ├─→ Arduino A0
      │
   100kΩ
      │
     GND

Expected: ~2.4-2.5V at A0
```

### For 5V Monitoring (A1)

```
   5V Rail
      │
   100kΩ
      │
      ├─→ Arduino A1
      │
   100kΩ
      │
     GND

Expected: ~2.5V at A1
```

---

## ⚡ Assembly Order

1. **Mount Arduino** on breadboard
2. **Connect 12V PSU** → RAW pin + GND
3. **Install 7805** (Vin=12V, GND, Vout=5V)
4. **Add filter capacitors** (0.1µF + 10µF)
5. **Build voltage dividers**
6. **Connect relay module**
7. **Test voltages** with multimeter
8. **Connect ESP32 serial** (last step)

---

## ✅ Pre-Power Checklist

Before applying power:

```
☐ No solder bridges or cold joints
☐ Polarity correct on PSU wires
☐ Capacitors installed across power rails
☐ Voltage dividers soldered correctly
☐ Relay module powered and grounded
☐ All loose wires secured
☐ Multimeter ready for testing
```

---

## 🧪 Voltage Test Points

| Point | Expected | Test Action |
|-------|----------|-------------|
| PSU Out | 12.0V | Turn on PSU |
| Arduino RAW | 12.0V | Measure Vin pin |
| 7805 Out | 5.0V | Measure Vout pin |
| Arduino A0 | 2.4V | No load on divider |
| Arduino A1 | 2.5V | No load on divider |

**STOP if any reading is wrong!**

---

## 📱 Serial Commands (9600 baud)

**From ESP32 to Arduino:**

```
Start Pump:     {"cmd":"PUMP_START","ml":100}
Stop Pump:      {"cmd":"PUMP_STOP"}
Get Status:     {"cmd":"STATUS"}
```

**From Arduino to ESP32:**

```
Heartbeat:      {"type":"HEARTBEAT","uptime":45,"v_main":12.05}
Pump Status:    {"status":"PUMP_OK","detail":"started"}
```

---

## 🔴 LED Flash Codes (from Arduino)

| Pattern | Meaning | Action |
|---------|---------|--------|
| 1 flash | Low voltage recovered | ✅ OK |
| 2 flashes | Pump failed to start | ❌ Check voltage |
| 3 flashes | System ready | ✅ Normal |
| 4 flashes | Low voltage alert | ⚠️ Check PSU |
| 5 flashes | Pump timeout/jam | ❌ Stop and inspect |

---

## 🛠️ Troubleshooting Quick Fixes

| Issue | Fix |
|-------|-----|
| Arduino won't upload | 1. Install CH340 driver 2. Select Nano 3. Pick correct COM |
| No serial output | Check baud rate = 9600 |
| Voltages read 0 | Verify ADC pin connections |
| Pump won't start | 1. Check V_Main > 11.5V 2. Test relay manually |
| ESP32 still resets | Add 1000µF capacitor on 12V rail |
| Random resets | Check common GND connections |

---

## 📊 Current Limits

```
Arduino: ~500mA total
Relay coil: ~100mA @ 5V
ESP32: ~300-400mA peak
Sensors: ~50-100mA total
Pump motor: ~2-4A @ 12V (from PSU, isolated)

Total 5V rail: 500mA minimum
Total 12V rail: 5A+ minimum
```

---

## 🎯 Final Verification

After assembly and upload:

```bash
# In Arduino Serial Monitor (9600 baud):
┌─────────────────────────────────────┐
│ ║ V_MAIN: 12.05V  V_5V: 5.02V       │
│ ║ [OK    | PUMP  ] Relay activated  │
│ ║ [HEARTBEAT] Uptime: 45s           │
└─────────────────────────────────────┘

If you see this: ✅ SUCCESS!
```

---

## 📝 Notes

- [ ] Calibrate V_DIVIDER_RATIO if readings off
- [ ] Record initial voltage readings for reference
- [ ] Test with manual pump button first
- [ ] Monitor for 1 hour before declaring OK
- [ ] Keep this card with the Power Manager unit

---

**Component Sources:**
- **Arduino:** Arduino.cc, AliExpress (~$10-20)
- **PSU:** Amazon, Newegg (~$30-40)
- **Regulator/Relay:** Any electronics distributor
- **Capacitors/Resistors:** Local electronics store, bulk online

**Estimated Build Time:** 2-3 hours (first time)

---

**Save this page digitally: `firmware/POWER-MANAGER/QUICK_REF.md`**
