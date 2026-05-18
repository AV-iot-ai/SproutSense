# ESP32 Overheating Fix

ESP32 heating because internal regulator overloaded by sensors. Hardware + Software fix below.

## 1. Hardware Fix (CRITICAL)

**Move sensor power from ESP32 3.3V/5V pins to external Arduino Uno 5V rail.**

*   **Current (Hot):** Sensors → ESP32 Pins → USB power.
*   **Target (Cool):** Sensors → Arduino Uno 5V Rail → External PSU.

**Wiring Change:**
1. Disconnect VCC of LDR, DHT22, Soil Moisture, Flow Sensor from ESP32.
2. Connect all sensor VCCs to **Arduino Uno 5V pin**.
3. **Common Ground:** Ensure ESP32 GND and Arduino GND are connected.

## 2. Software Fix: Lower CPU Frequency

Current code run at 240MHz (Max). Change to 80MHz to drop heat 40%.

**Update `setup()` in `ESP32-SENSOR.ino`:**

```cpp
void setup() {
  setCpuFrequencyMhz(80); // Lower speed = Lower heat
  // ... existing setup ...
}
```

## 3. Software Fix: Radio Sleep

Disable WiFi and BT power when not transmitting.

**Update main loop:**
```cpp
void loop() {
  // Use light sleep / modem sleep if timing allow
  // Ensure background tasks don't block
}
```

## 4. Heat Checklist
- [ ] **Short Circuit:** Check for stray wires on breadboard.
- [ ] **Wrong Voltage:** Confirm LDR/Soil sensors not getting 5V if they need 3.3V (or vice versa).
- [ ] **Relay Back-EMF:** Confirm relay module have flyback diode.
- [ ] **CPU Load:** Confirm no `delay()` heavy loops. Use `millis()` timers (already in code).

## Summary
Internal ESP32 regulator small. Sensors draw too much. Uno 5V rail big. Move load → Heat gone.
