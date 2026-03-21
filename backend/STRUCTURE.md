# Backend Project Structure

Complete MERN stack backend with MongoDB, Express, rate limiting, validation, and WebSocket support.

### Sensor Endpoints

- `GET /api/sensors` — latest reading (`?deviceId=` optional)
- `GET /api/sensors/history` — history (`?deviceId=&start=&end=` or `?hours=24`)

### Watering Endpoints

- `POST /api/water/start`
- `POST /api/water/stop`
- `GET /api/water/status/:deviceId`
- `GET /api/water/history`
- `GET /api/water/today`

### Config & Health

- `GET /api/config` — system config (`?deviceId=`)
- `GET /api/config/status` — all devices or `?deviceId=`
- `GET /api/config/health` — backend + DB health (used by Render health check)


## Directory Structure

```
backend/
├── src/
│   ├── config/              # Configuration files
│   │   ├── config.js        # Main configuration
│   │   ├── constants.js     # Application constants
│   │   └── db.js            # MongoDB connection
│   │
│   ├── models/              # Mongoose models
│   │   ├── SensorReading.js # Sensor data model
│   │   ├── WateringLog.js   # Watering history model
│   │   ├── SystemConfig.js  # Configuration model
│   │   └── DeviceStatus.js  # Device status model
│   │
│   ├── controllers/         # Business logic
│   │   ├── sensorController.js
│   │   ├── wateringController.js
│   │   ├── configController.js
│   │   └── aiController.js
│   │
│   ├── routes/              # API endpoints
│   │   ├── sensors.js       # /api/sensors routes
│   │   ├── watering.js      # /api/water routes
│   │   ├── config.js        # /api/config routes
│   │   └── ai.js            # /api/ai routes
│   │
│   ├── middleware/          # Express middleware
│   │   ├── errorHandler.js  # Error handling
│   │   ├── rateLimiter.js   # Rate limiting
│   │   └── commonMiddleware.js # Utilities
│   │
│   ├── validators/          # Request validation
│   │   └── requestValidator.js # express-validator rules
│   │
│   ├── utils/               # Helper functions
│   │   ├── helpers.js       # Common utilities
│   │   └── websocketService.js # WebSocket service
│   │
│   └── server.js            # Main server entry point
│
├── .env                     # Environment variables
├── .env.example             # Environment template
├── .gitignore               # Git ignore rules
├── package.json             # Dependencies
└── README.md                # Documentation
```

## Features Implemented

### ✅ MERN Stack Best Practices

- **Modular structure** - Separation of concerns
- **MVC pattern** - Models, Views (API), Controllers
- **Middleware chain** - Request processing pipeline
- **Error handling** - Centralized error management
- **Environment config** - Dotenv configuration
- **Code organization** - Clean and maintainable

### ✅ Rate Limiting

Multiple rate limiters for different endpoints:

- **API Limiter**: 100 requests per 15 minutes (general)
- **Watering Limiter**: 10 commands per minute (prevents spam)
- **Sensor Post Limiter**: 5 posts per 5 seconds (ESP32)
- **Read Limiter**: 300 requests per minute (GET endpoints)
- **AI Limiter**: 30 requests per minute (computationally expensive)

### ✅ Request Validation

Using `express-validator` for input validation:

- Sensor readings validation (ranges, types)
- Watering request validation
- Configuration update validation
- Query parameter validation
- MongoDB ObjectId validation

### ✅ WebSocket Service

Centralized WebSocket management:

- Broadcast sensor updates
- Notify watering events
- Config change notifications
- Device status updates
- Auto-reconnect support

### ✅ Helper Functions

Utility functions for:

- Standard response formatting
- Pagination
- Date range calculations
- Input sanitization
- Percentage calculations

### ✅ Security

- Helmet.js security headers
- CORS configuration
- Rate limiting on all endpoints
- Input validation and sanitization
- Error message sanitization

### ✅ Configuration Management

- Centralized config file
- Environment-based settings
- Constants for magic numbers
- Easy-to-modify settings

## Rate Limiting Configuration

Current limits (configurable in `config/config.js`):

```javascript
RATE_LIMIT: {
  WINDOW_MS: 15 * 60 * 1000,  // 15 minutes
  MAX_REQUESTS: 100,           // Max requests per window
}
```

### Per-Endpoint Limits:

| Endpoint | Limit | Window | Purpose |
|----------|-------|--------|---------|
| `/api/*` (all) | 100 | 15 min | General API protection |
| `/api/water/start` | 10 | 1 min | Prevent pump spam |
| `/api/sensors` (POST) | 5 | 5 sec | ESP32 rate limit |
| `/api/sensors` (GET) | 300 | 1 min | Allow frequent reads |
| `/api/ai/*` | 30 | 1 min | Expensive operations |

## Request Validation Examples

### Sensor Reading Validation

```javascript
{
  "soilMoisture": 45,      // 0-100
  "temperature": 25,       // -40 to 85
  "humidity": 60,          // 0-100
  "light": 35000,          // 0-100000
  "pH": 6.8               // 0-14 (optional)
}
```

### Config Update Validation

```javascript
{
  "moistureThreshold": 30,        // 0-100
  "autoMode": true,               // boolean
  "wateringDurationMs": 5000,     // 1000-60000
  "maxWateringCyclesPerDay": 3   // 1-20
}
```

## Environment Variables

Required variables in `.env`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/smart-watering
ESP32_IP=192.168.1.100
CORS_ORIGIN=http://localhost:3000
```

## API Response Format

### Success Response

```json
{
  "success": true,
  "message": "Success message",
  "data": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error message",
  "errors": [ ... ]  // Optional validation errors
}
```

### Rate Limit Response

```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again later",
  "retryAfter": 900  // seconds
}
```

## WebSocket Events

Events broadcasted to connected clients:

- `sensor_update` - New sensor reading
- `watering_started` - Pump activated
- `watering_stopped` - Pump deactivated
- `config_updated` - Settings changed
- `device_status_changed` - Device state change
- `error` - Error occurred

## Error Handling

Centralized error handler catches:

- Validation errors (400)
- Not found errors (404)
- MongoDB errors (400/500)
- JWT errors (401)
- Rate limit errors (429)
- Server errors (500)

## Testing

Test endpoints with curl:

```bash
# Create sensor reading (should respect rate limit)
for i in {1..10}; do
  curl -X POST http://localhost:5000/api/sensors \
    -H "Content-Type: application/json" \
    -d '{"soilMoisture":45,"temperature":25,"humidity":60,"light":35000}'
done

# Test rate limiting (should get 429 after limit)
for i in {1..150}; do
  curl http://localhost:5000/api/sensors
done
```

## Development vs Production

### Development

- Detailed logging
- CORS allows localhost
- Verbose error messages
- Lower rate limits for testing

### Production

- Minimal logging
- Strict CORS policy
- Sanitized error messages
- Standard rate limits
- HTTPS/WSS required

## Performance Considerations

- MongoDB indexes on frequently queried fields
- Efficient aggregation pipelines
- Pagination for large datasets
- WebSocket for real-time updates (no polling)
- Rate limiting to prevent abuse
- Connection pooling for database

## Upgrade Path

To enhance further:

1. **Authentication** - Add JWT auth for users
2. **Authorization** - Role-based access control
3. **Caching** - Redis for frequently accessed data
4. **Logging** - Winston for structured logging
5. **Monitoring** - Prometheus metrics
6. **Testing** - Jest/Supertest for API tests
7. **Documentation** - Swagger/OpenAPI
8. **Deployment** - Docker containerization
