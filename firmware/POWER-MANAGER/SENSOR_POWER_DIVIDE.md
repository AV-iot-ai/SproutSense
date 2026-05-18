# Sensor Power Distribution Guide

To stop the ESP32 from overheating, we must divide the power load between the ESP32 and the Arduino Uno.

## 1. Connected to ARDUINO UNO 5V (High Load)
These sensors draw the most current or require stable 5V.
*   **Soil Moisture Sensor VCC**: This is often the biggest power draw.
*   **Water Flow Sensor VCC**: The internal hall-effect sensor needs stable power.
*   **Relay Module VCC**: Moving the relay trigger power to the Uno prevents the ESP32 from resetting during pump start.
*   **Buzzer VCC**: If using an active buzzer, it draws significant current.

## 2. Connected to ESP32 3.3V (Low Load)
Only keep low-power, logic-level devices here.
*   **DHT22 VCC**: Draws very little power (standard for 3.3V).
*   **LDR (Photoresistor) VCC**: Extremely low current draw.

## summary Wiring Table

| Component | Power Source | Logic Pin |
| :--- | :--- | :--- |
| **Soil Moisture** | **Arduino 5V** | ESP32 GPIO 35 (Analog) |
| **Flow Sensor** | **Arduino 5V** | ESP32 GPIO 26 (Interrupt) |
| **Relay** | **Arduino 5V** | Arduino Pin 8 (Managed by Uno) |
| **Buzzer** | **Arduino 5V** | ESP32 GPIO 27 (Output) |
| **DHT22** | **ESP32 3.3V** | ESP32 GPIO 13 (Digital) |
| **LDR** | **ESP32 3.3V** | ESP32 GPIO 32 (Analog) |
| **Push Button** | **No Power** | ESP32 GPIO 33 (GND trigger) |

## Buzzer and Button Details

### Buzzer (Significant Heat/Power)
The buzzer contains a coil or piezo that vibrates. This draws a "spike" of current every time it beeps.
*   **Power**: Connect the Buzzer **(+)** or **VCC** to the **Arduino 5V** pin.
*   **Signal**: Connect the Signal/Buzzer **(-)** to **ESP32 Pin 27**.

### Push Button (Safe for ESP32)
The button doesn't use a "power pin" ($VCC$). It works by connecting a signal pin to Ground.
*   **Wiring**: One side of the button goes to **ESP32 Pin 33**. The other side goes to **ESP32 GND**.
*   **Power**: It uses zero power because of the `INPUT_PULLUP` setting in the code. It is 100% safe to keep on the ESP32.

## CRITICAL: Common Ground
**You MUST connect one GND pin from the ESP32 to one GND pin on the Arduino Uno.** 
Without this, the sensor signals will be "noisy" and the system will not work.

## Wiring Diagram Update
*   **ESP32 Vin**: Powered by USB.
*   **Arduino Uno Vin**: Powered by its own USB or 9V/12V adapter.
*   **GND-to-GND**: Connect them.
