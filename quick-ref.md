backend/src
├── server.js          # HTTP + WebSocket server bootstrap
├── app.js             # Express app, middleware, routes
├── config/
│   ├── db.js          # MongoDB connection + logging
│   └── env.js         # Env var loading & validation
├── models/
│   ├── SensorReading.js
│   ├── WateringLog.js
│   ├── DiseaseDetection.js
│   ├── SystemConfig.js
│   └── DeviceStatus.js
├── controllers/
│   ├── sensorController.js
│   ├── wateringController.js
│   ├── aiController.js
│   └── configController.js
├── routes/
│   ├── sensorRoutes.js
│   ├── wateringRoutes.js
│   ├── aiRoutes.js
│   └── configRoutes.js
├── middleware/
│   ├── errorHandler.js
│   ├── rateLimiter.js      # e.g., 5 sensor req / 5s
│   └── validatePayload.js
├── utils/
│   ├── websocket.js        # WS broadcast helpers
│   └── logger.js
└── validators/
    └── *.js                # Joi/Zod request schemas


## 🧱 System Architecture (Detailed)

SproutSense is a dual‑ESP32 + MERN system split into **edge devices**, a **Node.js API backend**, a **React/Vite dashboard**, and **MongoDB Atlas** for storage.

### High‑Level Flow

```text
  [ESP32-SENSOR-001] ── HTTP/JSON ──►  /api/sensors, /api/water, /api/config
       ▲                                      │
       │ ADC1 sensors, relay, flow           │
       │                                      ▼
  [ESP32-CAM-001] ── HTTP/JSON ──►       Node.js / Express
       ▲                                 (Render.com)
       │ Image + AI result                    │
       │                                      ▼
       └────────────── WebSocket ◄──── React / Vite Dashboard
                             ▲           (Netlify)
                             │
                      MongoDB Atlas (DB: sproutsense)
