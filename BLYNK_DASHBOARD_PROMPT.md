# Blynk AI Dashboard Prompt for SproutSense

## Project Overview
Create a comprehensive IoT dashboard for **SproutSense** - an automated plant monitoring and watering system using ESP32-CAM. The dashboard should provide real-time monitoring, manual controls, and historical data visualization.

---

## Virtual Pins Configuration

### Sensor Data Pins (Read-only)
- **V0** - Soil Moisture (0-100%)
- **V1** - Soil pH (4.0-8.5)
- **V2** - Temperature (°C)
- **V3** - Relative Humidity (0-100%)
- **V4** - Light Level (0-100%)
- **V5** - Last Watering Volume (mL)
- **V8** - Watering Cycles This Hour (0-3)
- **V9** - Last Watering Timestamp

### Control Pins (Write)
- **V6** - Pump Control (0=OFF, 1=ON) - Manual override button
- **V7** - Camera Snapshot Trigger (button)

---

## Dashboard Layout Requirements

### Page 1: **Main Dashboard** (Overview)

#### Top Section - Quick Status
1. **SuperChart Widget**
   - Pin: V0, V2, V3, V4
   - Display: Line chart with 24-hour history
   - Colors: V0=Blue (moisture), V2=Red (temp), V3=Green (humidity), V4=Yellow (light)
   - Update interval: 10 seconds
   - Title: "24-Hour Sensor Trends"

2. **Gauge Widgets** (4 gauges in 2x2 grid)
   - **Soil Moisture** (V0)
     - Range: 0-100%
     - Color gradient: Red (0-30%), Yellow (30-60%), Green (60-100%)
     - Label: "Soil Moisture"
   
   - **Temperature** (V2)
     - Range: 0-50°C
     - Color gradient: Blue (0-20°C), Green (20-30°C), Red (30-50°C)
     - Label: "Temperature"
   
   - **Humidity** (V3)
     - Range: 0-100%
     - Color gradient: Red (0-40%), Yellow (40-70%), Green (70-100%)
     - Label: "Humidity"
   
   - **Light Level** (V4)
     - Range: 0-100%
     - Color gradient: Dark gray (0-30%), Yellow (30-70%), Bright yellow (70-100%)
     - Label: "Light Level"

#### Middle Section - Soil Health
3. **Level Widget**
   - Pin: V1
   - Range: 4.0-8.5
   - Target zone: 6.0-7.5 (Green)
   - Label: "Soil pH"
   - Orientation: Horizontal bar

4. **Value Display Widget**
   - Pin: V0
   - Label: "Current Moisture"
   - Suffix: "%"
   - Font size: Large
   - Color: Dynamic based on value

#### Bottom Section - Watering Controls
5. **Button Widget** - PUMP CONTROL
   - Pin: V6
   - Mode: Switch (ON/OFF)
   - On label: "PUMP ON 💧"
   - Off label: "PUMP OFF"
   - On color: Blue
   - Off color: Gray
   - Size: Large

6. **Labeled Value Widgets** (in row)
   - **Last Watering Volume** (V5)
     - Suffix: "mL"
     - Label: "Last Watering"
   
   - **Watering Count** (V8)
     - Suffix: "cycles"
     - Label: "Today's Cycles"

7. **Terminal Widget** or **LCD Widget**
   - Pin: V9
   - Display: Last watering timestamp
   - Label: "Last Watered"
   - Format: Time ago (e.g., "2 hours ago")

---

### Page 2: **Advanced Monitoring**

1. **SuperChart Widget** - pH History
   - Pin: V1
   - 7-day history
   - Show optimal range zone (6.0-7.5) as highlighted band

2. **SuperChart Widget** - Watering History
   - Pin: V5
   - Bar chart showing daily water consumption
   - Y-axis: mL dispensed
   - X-axis: Last 7 days

3. **Image Gallery Widget** (if available)
   - Pin: V7
   - Display camera snapshots
   - Button to trigger new snapshot
   - Label: "Plant Health Monitor"

4. **Notification History Widget**
   - Show last 10 alerts and notifications
   - Include timestamps

---

### Page 3: **Camera & AI**

1. **Button Widget** - Capture Image
   - Pin: V7
   - Mode: Push button
   - Label: "📷 Take Snapshot"
   - Color: Purple

2. **Image Display Widget**
   - Show latest captured image from ESP32-CAM
   - Auto-refresh when V7 triggered

3. **Terminal Widget**
   - Display AI analysis results
   - Show disease detection status
   - Show Gemini plant care advice

---

## Automation & Alerts

### Create These Automations:

1. **Low Moisture Alert**
   - Trigger: When V0 < 30%
   - Action: Send push notification "⚠️ Soil moisture low! Your plant needs water."
   - Frequency: Once per hour

2. **High Temperature Alert**
   - Trigger: When V2 > 35°C
   - Action: Send notification "🌡️ Temperature too high! Consider moving plant to cooler area."
   - Frequency: Once per 3 hours

3. **Low Temperature Alert**
   - Trigger: When V2 < 5°C
   - Action: Send notification "❄️ Temperature too low! Plant may be at risk."
   - Frequency: Immediately

4. **pH Out of Range**
   - Trigger: When V1 < 5.0 OR V1 > 8.0
   - Action: Send notification "⚗️ Soil pH abnormal! Check your plant."
   - Frequency: Once per day

5. **Successful Watering**
   - Trigger: When V5 > 50mL (new watering completed)
   - Action: Send notification "💧 Plant watered successfully! Volume: {V5}mL"
   - Frequency: Each watering

6. **Daily Report**
   - Trigger: Every day at 8:00 AM
   - Action: Send notification with summary:
     - "🌱 Daily Report: Moisture {V0}%, Temp {V2}°C, pH {V1}, Watered {V8} times"

---

## Widget Styling

### Color Scheme
- Primary: Green (#4CAF50)
- Secondary: Blue (#2196F3)
- Alert: Red (#F44336)
- Warning: Orange (#FF9800)
- Background: Light gray (#F5F5F5)
- Text: Dark gray (#333333)

### Widget Borders
- Use rounded corners
- Subtle shadows for depth
- Group related widgets with similar styling

### Font Sizes
- Headers: Large (24px)
- Values: Extra Large (32px)
- Labels: Medium (16px)
- Units: Small (12px)

---

## Mobile App Layout Optimization

### Portrait Mode (Primary)
- Stack widgets vertically
- Full-width SuperChart at top
- Gauges in 2x2 grid
- Controls at bottom for easy thumb access

### Landscape Mode
- Split view: Charts on left, gauges/controls on right
- Maximize screen real estate

---

## Google Assistant Integration Note

Add a note widget explaining:
"🎤 **Voice Control Setup**

To control your plant with Google Assistant:

1. Open Google Assistant → Routines
2. Create routine: \"Water my plant\"
3. Add action: Make web request
4. URL: `https://blynk.cloud/external/api/update?token=YOUR_TOKEN&pin=V6&value=1`

Say: \"Hey Google, water my plant\" ✨"

---

## Additional Features

### Timeline/Event Log
- Log all watering events
- Log alert triggers
- Show ESP32 connection status changes
- Display camera snapshot timestamps

### Device Info Display
- Show ESP32 connection status (green dot = online)
- Display Wi-Fi signal strength (RSSI)
- Show device uptime
- Display last data update timestamp

---

## Implementation Priority

**Phase 1 (Essential):**
- V0 (Moisture gauge)
- V6 (Pump control button)
- V2, V3, V4 (Temperature, humidity, light gauges)
- Basic 24h chart

**Phase 2 (Enhanced):**
- V1 (pH monitoring)
- V5, V8, V9 (Watering stats)
- Automation rules
- Notifications

**Phase 3 (Advanced):**
- V7 (Camera integration)
- Historical data visualization
- AI insights terminal
- Multi-page layout

---

## Testing Checklist

After creating dashboard:
- [ ] Test pump control button (V6) - verify pump responds
- [ ] Verify all gauge values update correctly
- [ ] Check chart historical data display
- [ ] Test notification triggers
- [ ] Verify timestamp displays correctly
- [ ] Test camera snapshot button
- [ ] Confirm automation rules fire properly
- [ ] Test on both mobile and tablet layouts

---

**Copy this entire prompt into Blynk AI or use it as a guide to manually create your dashboard!** 🌱
