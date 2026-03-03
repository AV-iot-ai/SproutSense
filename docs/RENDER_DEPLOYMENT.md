# Render Backend Deployment (with WebSocket)

## 1) Deploy backend on Render

Use the repository root `render.yaml` blueprint, or create the service manually with:

- Service type: Web Service
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`
- Health Check Path: `/api`

If you deploy manually and `Root Directory` is not `backend`, Render may install the wrong package and startup will fail.

## 2) Required environment variables (Render)

Set these in the Render service:

- `NODE_ENV=production`
- `MONGODB_URI=<your-mongodb-atlas-uri>`
- `CORS_ORIGIN=<your-frontend-url>`
- `GEMINI_API_KEY=<optional-if-ai-used>`

> Do not hardcode `PORT`. Render injects `PORT` automatically.
> `MONGODB_URI` is required in Render. Without it, data endpoints cannot persist/fetch MongoDB records.

## 3) Frontend settings for WebSocket

In your frontend hosting (Netlify/Vercel), set:

- `VITE_API_BASE_URL=https://<your-render-service>.onrender.com/api`

Optional (recommended for explicit control):

- `VITE_WS_URL=wss://<your-render-service>.onrender.com/ws`

If `VITE_WS_URL` is set, the app uses it directly.
If not set, the app derives WebSocket URL from `VITE_API_BASE_URL`.

## 4) Verify WebSocket is working

After deployment:

1. Open your frontend in browser.
2. Open DevTools console.
3. Confirm log includes `Connecting to WebSocket: wss://.../ws`.
4. Confirm UI connection state changes to connected.

## 5) Common issues

- CORS blocked: ensure `CORS_ORIGIN` exactly matches frontend origin.
- Wrong protocol: use `wss://` for HTTPS frontend.
- Cold starts on free Render tier can delay first WebSocket connection.
