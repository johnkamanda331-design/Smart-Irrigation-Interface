# ESP32 SIM800 to API Integration Guide

## Overview
This document describes how the ESP32 with SIM800 module sends sensor data to the API server via GSM, which then stores the data for the mobile app to poll.

## Architecture Flow

```
ESP32 (SIM800)
    ↓
HTTP POST /api/sensor-data
    ↓
API Server (Node.js/Express)
    ↓
PostgreSQL Database
    ↓
Mobile App polls /api/sensor-data GET
    ↓
React Native Dashboard displays data
```

## ESP32 Implementation

### Required Libraries
```cpp
#include <HTTPClient.h>
#include <WiFiClient.h>
// Or SIM800 specific library for GSM connectivity
```

### Sensor Data Structure
The ESP32 should POST the following JSON payload to the API:

```json
{
  "deviceId": "device_1234567890",
  "batteryVoltage": 3.82,
  "batteryPercent": 72,
  "solarVoltage": 14.3,
  "flowRate": 3.2,
  "waterLevel": "OK",
  "pumpStatus": true,
  "gsmSignal": 3
}
```

### Field Definitions
- **deviceId** (string, required): Unique identifier for the device (e.g., MAC address or hardcoded ID)
- **batteryVoltage** (number, required): Battery voltage in volts (3.0-4.2V typical for Li-ion)
- **batteryPercent** (integer, required): Battery percentage (0-100)
- **solarVoltage** (number, required): Solar panel voltage in volts
- **flowRate** (number, required): Water flow rate in L/min
- **waterLevel** (string, required): Tank level status - one of: `"OK"`, `"LOW"`, `"EMPTY"`
- **pumpStatus** (boolean, required): Pump on/off status
- **gsmSignal** (integer, required): GSM signal strength (0-31, where 31 is best)

### Example Arduino/ESP32 Code

```cpp
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Configuration
const char* API_URL = "http://your-api-server.com/api/sensor-data";
const char* DEVICE_ID = "device_1234567890";

void sendSensorData() {
  // Read sensor values
  float batteryVoltage = readBatteryVoltage();  // Your ADC reading
  int batteryPercent = calculateBatteryPercent(batteryVoltage);
  float solarVoltage = readSolarVoltage();
  float flowRate = readFlowRate();
  String waterLevel = readWaterLevel();  // Returns "OK", "LOW", or "EMPTY"
  bool pumpStatus = digitalRead(PUMP_PIN);
  int gsmSignal = readGSMSignal();

  // Create JSON payload
  StaticJsonDocument<256> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["batteryVoltage"] = batteryVoltage;
  doc["batteryPercent"] = batteryPercent;
  doc["solarVoltage"] = solarVoltage;
  doc["flowRate"] = flowRate;
  doc["waterLevel"] = waterLevel;
  doc["pumpStatus"] = pumpStatus;
  doc["gsmSignal"] = gsmSignal;

  // Send HTTP POST
  HTTPClient http;
  http.begin(API_URL);
  http.addHeader("Content-Type", "application/json");

  String jsonString;
  serializeJson(doc, jsonString);

  int httpResponseCode = http.POST(jsonString);

  // Log response
  if (httpResponseCode == 201) {
    Serial.println("✓ Sensor data sent successfully");
  } else {
    Serial.printf("✗ Failed to send data. HTTP code: %d\n", httpResponseCode);
    String response = http.getString();
    Serial.println("Response: " + response);
  }

  http.end();
}

void setup() {
  Serial.begin(115200);
  // Initialize GSM/SIM800
  // Initialize sensors
  // Set up timer to call sendSensorData() periodically (e.g., every 5 minutes)
}

void loop() {
  // Your main loop
  // Call sendSensorData() at regular intervals
}
```

### Recommended Posting Schedule
- **Production**: Every 5-10 minutes (balances battery life and real-time monitoring)
- **Development**: Every 30-60 seconds for faster feedback
- **On-demand**: Immediately when critical events occur (pump failure, low battery alert)

### Error Handling
The API returns appropriate HTTP status codes:
- **201 Created**: Data accepted successfully
- **400 Bad Request**: Invalid data format (check field types and required fields)
- **500 Internal Server Error**: Server error (retry after delay)

### Sample Error Response
```json
{
  "error": "Invalid sensor data",
  "details": [
    {
      "code": "invalid_type",
      "expected": "number",
      "received": "string",
      "path": ["batteryVoltage"],
      "message": "Expected number, received string"
    }
  ]
}
```

## Mobile App Data Polling

The React Native app will:
1. Retrieve the saved device ID from AsyncStorage
2. Poll `/api/sensor-data?deviceId=DEVICE_ID` every 30 seconds
3. Fetch historical data from `/api/sensor-data/history?deviceId=DEVICE_ID&limit=24` every 5 minutes
4. Update the UI with latest sensor values
5. Call `refreshData()` on the context to manually refresh

## Testing

### Test the API Endpoint Directly
```bash
# Send test data
curl -X POST http://localhost:3000/api/sensor-data \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "device_test",
    "batteryVoltage": 3.82,
    "batteryPercent": 72,
    "solarVoltage": 14.3,
    "flowRate": 3.2,
    "waterLevel": "OK",
    "pumpStatus": true,
    "gsmSignal": 3
  }'

# Fetch latest data
curl http://localhost:3000/api/sensor-data?deviceId=device_test

# Fetch history
curl http://localhost:3000/api/sensor-data/history?deviceId=device_test&limit=24
```

### Postman Collection
Create a Postman collection with these requests to test before deploying to production.

## Database Schema

The sensor data is stored in PostgreSQL with the following schema:
```sql
CREATE TABLE sensor_data (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  device_id TEXT NOT NULL,
  battery_voltage NUMERIC(5,2) NOT NULL,
  battery_percent INTEGER NOT NULL,
  solar_voltage NUMERIC(5,2) NOT NULL,
  flow_rate NUMERIC(8,2) NOT NULL,
  water_level TEXT NOT NULL CHECK (water_level IN ('OK', 'LOW', 'EMPTY')),
  pump_status BOOLEAN NOT NULL,
  gsm_signal INTEGER NOT NULL,
  device_online BOOLEAN NOT NULL DEFAULT true,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_device_id_timestamp ON sensor_data(device_id, timestamp DESC);
```

## Deployment Steps

1. **Set up database**: Run migrations to create sensor_data table
2. **Update API server**: Deploy the sensor data routes
3. **Generate API client**: Run `pnpm run generate:api` to generate TypeScript client
4. **Update app**: Deploy FarmContext changes with API polling
5. **Deploy ESP32 firmware**: Upload the sensor sending code to your devices

## Environment Variables

API server needs:
- `DATABASE_URL`: PostgreSQL connection string
- `API_PORT`: Server port (default 3000)
- `NODE_ENV`: production or development

ESP32 needs:
- `API_URL`: Full URL to API server (e.g., http://api.example.com)
- `DEVICE_ID`: Unique device identifier
- `SSID` / `PASSWORD`: WiFi credentials (if WiFi) or SIM800 APN settings (if GSM)

## Monitoring

Monitor these metrics in production:
- **Data ingestion rate**: How often devices are sending data
- **Data freshness**: Time since last sensor reading per device
- **API response times**: Ensure polling doesn't exceed 5 seconds
- **Database size**: Monitor long-term storage needs
- **Device online status**: Track which devices are currently active

## Troubleshooting

### Device not sending data?
- Check device ID matches what's stored in app
- Verify GSM/WiFi connectivity on device
- Check API URL is correct and reachable
- Verify JSON payload format matches schema

### App not showing data?
- Check device ID in settings
- Verify polling interval is working (check Network tab in DevTools)
- Check API server logs for errors
- Verify database connection is working

### High data latency?
- Check GSM signal strength (gsmSignal field)
- Reduce polling interval on app if needed
- Monitor server response times
- Check database query performance
