import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// ==========================================
// SENSOR API
// ==========================================
export const sensorAPI = {
  // GET /api/sensors - latest reading (backend uses query.deviceId)
  getLatest: async (deviceId = 'ESP32-SENSOR') => {
    const response = await api.get('/sensors', { params: { deviceId } });
    return response.data;
  },

  // GET /api/sensors/history?deviceId=&start=&end= OR ?hours=
  getHistory: async (startDate, endDate, deviceId = 'ESP32-SENSOR') => {
    // Controller expects: start, end or hours[cite:66]
    //   const { deviceId, hours, start, end } = req.query;
    let params = { deviceId };
    if (typeof startDate === 'string' && typeof endDate === 'string') {
      params.start = startDate;
      params.end   = endDate;
    } else {
      params.hours = startDate || 24; // fallback to hours window
    }
    const response = await api.get('/sensors/history', { params });
    return response.data;
  }
};

// ==========================================
// WATERING API
// ==========================================
export const wateringAPI = {
  // POST /api/water/start
  start: async (deviceId = 'ESP32-SENSOR', duration = null) => {
    const payload = { deviceId };
    if (duration) payload.duration = duration;
    const response = await api.post('/water/start', payload);
    return response.data;
  },

  // POST /api/water/stop
  stop: async (deviceId = 'ESP32-SENSOR') => {
    const response = await api.post('/water/stop', { deviceId });
    return response.data;
  },

  // GET /api/water/status/:deviceId[cite:67]
  getStatus: async (deviceId = 'ESP32-SENSOR') => {
    const response = await api.get(`/water/status/${deviceId}`);
    return response.data;
  },

  // GET /api/water/history
  getLogs: async (limit = 10, deviceId = 'ESP32-SENSOR') => {
    const response = await api.get('/water/history', {
      params: { limit, deviceId }
    });
    return response.data;
  }
};

// ==========================================
// CONFIG API
// ==========================================
export const configAPI = {
  // GET /api/config?deviceId=
  get: async (deviceId = 'ESP32-SENSOR') => {
    const response = await api.get('/config', { params: { deviceId } });
    return response.data;
  },

  // GET /api/config/status?deviceId=
  getStatus: async (deviceId = 'ESP32-SENSOR') => {
    const response = await api.get('/config/status', { params: { deviceId } });
    return response.data;
  },

  // GET /api/config/health  (deviceId is ignored by backend health)[cite:69][cite:68]
  getHealth: async () => {
    const response = await api.get('/config/health');
    return response.data;
  },

  // POST /api/config (body includes deviceId)[cite:69]
  update: async (deviceId = 'ESP32-SENSOR', config) => {
    const response = await api.post('/config', { ...config, deviceId });
    return response.data;
  },

  // Data cleanup helpers
  clearSensorHistory: async (deviceId = 'ESP32-SENSOR', retentionDays = 90) => {
    const response = await api.post('/config/clear-sensor-history', {
      retentionDays,
      deviceId
    });
    return response.data?.data || response.data;
  },

  clearWateringHistory: async (deviceId = 'ESP32-SENSOR', retentionDays = 365) => {
    const response = await api.post('/config/clear-watering-history', {
      retentionDays,
      deviceId
    });
    return response.data?.data || response.data;
  },

  clearDiseaseHistory: async (deviceId = 'ESP32-SENSOR', retentionDays = 180) => {
    const response = await api.post('/config/clear-disease-history', {
      retentionDays,
      deviceId
    });
    return response.data?.data || response.data;
  },

  clearAllHistory: async (deviceId = 'ESP32-SENSOR') => {
    const response = await api.post('/config/clear-all-history', { deviceId });
    return response.data?.data || response.data;
  },

  getDataRetentionPolicy: async (deviceId = 'ESP32-SENSOR') => {
    const response = await api.get('/config/data-retention', {
      params: { deviceId }
    });
    return response.data;
  },

  updateDataRetentionPolicy: async (deviceId = 'ESP32-SENSOR', policy) => {
    const response = await api.put('/config/data-retention', policy, {
      params: { deviceId }
    });
    return response.data;
  }
};

// ==========================================
// AI API
// ==========================================
export const aiAPI = {
  // GET /api/ai/recommend?deviceId=
  getRecommendation: async (deviceId = 'ESP32-SENSOR') => {
    const response = await api.get('/ai/recommend', {
      params: { deviceId }
    });
    return response.data;
  },

  // POST /api/ai/chat
  chat: async ({ message, sensorContext = '', history = [], apiKey = '' }) => {
    const response = await api.post('/ai/chat', {
      message,
      sensorContext,
      history,
      apiKey
    });
    return response.data;
  },

  // GET /api/ai/disease/all?deviceId=&page=&limit=&startDate=&endDate=[cite:63][cite:68]
  getDiseaseDetections: async ({
    deviceId  = 'ESP32-CAM',
    page      = 1,
    limit     = 200,
    startDate,
    endDate,
  } = {}) => {
    const params = { deviceId, page, limit };
    if (startDate) params.startDate = startDate;
    if (endDate)   params.endDate   = endDate;
    const response = await api.get('/ai/disease/all', { params });
    return response.data;
  }
};

export default api;
