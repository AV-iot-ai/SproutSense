# Web Dashboard

Modern web interface for the Smart Watering System built with Vite.

## Prerequisites

⚠️ **Important**: The backend server must be running before starting the web dashboard!

1. Start MongoDB (if running locally)
2. Start the backend server: `cd backend && npm run dev`
3. Then start the web dashboard (instructions below)

## Setup

1. Install dependencies:
```bash
cd web
npm install
```

2. Run development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Environment Variables (Production)

When frontend and backend are on different domains (for example Netlify + Render), set:

```env
VITE_API_BASE_URL=https://<your-render-service>.onrender.com/api
VITE_WS_URL=wss://<your-render-service>.onrender.com/ws
```

`VITE_WS_URL` is optional. If omitted, WebSocket URL is derived from `VITE_API_BASE_URL`.

## Features

- Real-time sensor monitoring
- Manual watering controls
- AI-powered recommendations
- Configuration management
- Responsive design via WebSocket
- Manual watering controls
- AI-powered recommendations
- Configuration mUsed

The dashboard uses these backend endpoints:

- `GET /api/sensors` - Sensor readings
- `GET /api/config/status` - System status
- `GET /api/config` - Configuration
- `GET /api/ai/recommend` - AI recommendation
- `POST /api/water/start` - Start watering
- `POST /api/water/stop` - Stop watering
- `POST /api/config` - Save configuration
- `WebSocket /ws` - Real-time updates

See [backend/README.md](../backend/README.md) for full API documentation.

## Development

The Vite development server proxies API requests to avoid CORS issues:

```javascript
// vite.config.js
proxy: {
  '/api': 'http://localhost:5000',
  '/ws': 'ws://localhost:5000'
}
```

## Troubleshooting

**Dashboard loads but shows "Disconnected":**
- Verify backend is running: `http://localhost:5000/api`
- Check browser console for errors

**No data displayed:**
- Backend may have no data in MongoDB yet
- Use API to create test data (see QUICKSTART.md)

**WebSocket not connecting:**
- Check backend WebSocket server is running
- Verify no firewall blocking port 5000

```
Web Dashboard (port 3000)
       ↓
   Vite Proxy
       ↓
Backend API (port 5000)
       ↓
   MongoDB + ESP32
```

All API calls go through `/api` which is proxied to `http://localhost:5000` by Vite.

## API Endpoints Used
- `GET /ai/recommend` - AI recommendation
- `POST /water/start` - Start watering
- `POST /water/stop` - Stop watering
- `POST /config` - Save configuration
