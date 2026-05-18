import axios from 'axios';
import { 
  isMockEnabled, 
  getMockSensors, 
  getMockAlerts, 
  getMockCropHealth, 
  getMockWeather 
} from '../services/mockDataService';

function normalizeApiBaseUrl(rawValue) {
  const value = String(rawValue || '').trim();
  if (!value) return '/api';
  if (value.startsWith('/')) return value;
  if (/^https?:\/\//i.test(value)) return value;
  if (/^(localhost|127\.0\.0\.1)(:\d+)?(\/.*)?$/i.test(value)) {
    return `http://${value}`;
  }
  return value;
}

const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL || '/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Automatic retry for 429 responses (exponential backoff + jitter)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MAX_RETRIES = parseInt(import.meta.env.VITE_API_RETRY_MAX || '4', 10);

// Global response interceptor for error handling and cleaning
api.interceptors.response.use(
  (response) => {
    // Return direct data if successful
    return response.data?.status || response.data?.data || response.data || response;
  },
  (error) => {
    const { response } = error;
    
    // Graceful handling for 404 on sensors - return empty array/null instead of crashing
    if (response?.status === 404 && response?.config?.url?.includes('/sensors')) {
      console.warn('[API] Resource not found, returning empty state');
      return { readings: [], history: [], data: null };
    }

    return Promise.reject(error);
  }
);

api.interceptors.response.use(null, async (error) => {
  const { config, response } = error || {};
  if (!config || !response) return Promise.reject(error);

  config.__retryCount = config.__retryCount || 0;

  // Only retry on 429 Too Many Requests
  if (response.status === 429 && config.__retryCount < MAX_RETRIES) {
    config.__retryCount += 1;

    // Use Retry-After header if provided (seconds), else exponential backoff
    const ra = parseInt(response.headers['retry-after'], 10);
    const backoffMs = ra && !Number.isNaN(ra) ? ra * 1000 : Math.min(1000 * 2 ** config.__retryCount, 30000);
    const jitter = Math.floor(Math.random() * 250);
    const delay = backoffMs + jitter;

    // Optional: log retry attempts in development
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn(`[API] 429 received. Retrying request (${config.__retryCount}/${MAX_RETRIES}) after ${delay}ms.`);
    }

    await sleep(delay);
    return api(config);
  }

  return Promise.reject(error);
});

// ─── MOCK HELPER ─────────────────────────────────────────────────────────────
// Simulates network delay and returns data in the same format Axios does
const mockResponse = (data, delay = 300) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Axios resolves with response.data inside the interceptor phase,
      // but since we are bypassing axios, we return the data directly here 
      // formatted how the rest of the functions expect it before they return `response.data`.
      resolve({ data }); 
    }, delay);
  });
};

function shouldUseMock(options = {}) {
  return isMockEnabled() && !options?.forceLive;
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function normalizeMockSensorReading(sensor, fallbackTimestamp = new Date().toISOString()) {
  if (!sensor || typeof sensor !== 'object') return null;

  const timestamp = sensor.timestamp || sensor.lastSeen || fallbackTimestamp;
  const soilMoisture = Number(sensor.soilMoisture ?? sensor.moisture ?? 0);
  const temperature = Number(sensor.temperature ?? 0);
  const humidity = Number(sensor.humidity ?? 0);
  const pH = Number(sensor.pH ?? sensor.ph ?? 6.8);
  const flowRate = Number(sensor.flowRate ?? sensor.flowRateMlPerMin ?? sensor.waterFlowRate ?? 0);
  const flowVolume = Number(sensor.flowVolume ?? sensor.cycleVolumeML ?? sensor.waterFlowVolume ?? 0);

  return {
    ...sensor,
    soilMoisture,
    moisture: soilMoisture,
    temperature,
    humidity,
    pH,
    ph: pH,
    light: Number(sensor.light ?? sensor.lightIntensity ?? 1200),
    flowRate,
    flowVolume,
    leafCount: Number(sensor.leafCount ?? sensor.leaf_count ?? sensor.canopyLeafCount ?? 28),
    deviceId: sensor.deviceId || 'ESP32-SENSOR',
    timestamp,
  };
}

function pickMockSensorBaseline(mockSensors) {
  if (!Array.isArray(mockSensors) || mockSensors.length === 0) return null;

  const normalized = mockSensors
    .map((sensor) => normalizeMockSensorReading(sensor))
    .filter((sensor) => sensor?.sensorType !== 'flow')
    .filter(Boolean);

  if (normalized.length === 0) return null;

  const avg = (key) => normalized.reduce((sum, row) => sum + Number(row[key] || 0), 0) / normalized.length;

  return {
    soilMoisture: avg('soilMoisture'),
    temperature: avg('temperature'),
    humidity: avg('humidity'),
    light: avg('light'),
    pH: avg('pH') || 6.8,
    leafCount: avg('leafCount') || 28,
  };
}

function generateMockSensorHistory(startDate, endDate, mockSensors) {
  const baseline = pickMockSensorBaseline(mockSensors);
  if (!baseline) return [];

  const startMs = Number.isFinite(new Date(startDate).getTime())
    ? new Date(startDate).getTime()
    : Date.now() - 24 * 60 * 60 * 1000;
  const endMs = Number.isFinite(new Date(endDate).getTime())
    ? new Date(endDate).getTime()
    : Date.now();

  const spanMs = Math.max(60 * 60 * 1000, endMs - startMs);
  const stepMs = 15 * 60 * 1000;
  const points = Math.max(8, Math.floor(spanMs / stepMs));

  return Array.from({ length: points }, (_, idx) => {
    const ratio = points > 1 ? idx / (points - 1) : 1;
    const timestampMs = Math.round(startMs + ratio * spanMs);
    const wave = Math.sin(idx / 3.6);
    const drift = Math.cos(idx / 5.2);

    const soilMoisture = clamp(baseline.soilMoisture + wave * 4 + drift * 1.2, 5, 98);
    const temperature = clamp(baseline.temperature + Math.sin(idx / 7.5) * 2.1, 12, 46);
    const humidity = clamp(baseline.humidity + Math.cos(idx / 6.4) * 5.4, 20, 98);
    const light = clamp(baseline.light + Math.sin(idx / 2.8) * 160, 40, 65000);
    const pH = clamp(baseline.pH + Math.cos(idx / 9.3) * 0.16, 4.5, 8.5);

    const flowRate = soilMoisture < 35
      ? clamp(90 + Math.sin(idx / 2.4) * 22, 45, 180)
      : 0;

    return {
      soilMoisture: Number(soilMoisture.toFixed(1)),
      temperature: Number(temperature.toFixed(1)),
      humidity: Number(humidity.toFixed(1)),
      light: Math.round(light),
      pH: Number(pH.toFixed(2)),
      ph: Number(pH.toFixed(2)),
      flowRate: Number(flowRate.toFixed(1)),
      flowVolume: flowRate > 0 ? Math.round(flowRate * 1.5) : 0,
      leafCount: Math.round(clamp(baseline.leafCount + Math.sin(idx / 8.8) * 1.8, 5, 450)),
      deviceId: 'ESP32-SENSOR',
      timestamp: new Date(timestampMs).toISOString(),
    };
  });
}

function generateMockWaterLogs(sensorHistory = [], limit = 10) {
  const active = sensorHistory.filter((row) => Number(row.flowRate) > 1);
  if (active.length === 0) return [];

  return active
    .slice(-Math.max(1, Math.min(limit, 25)))
    .map((row, index) => ({
      _id: `mock-water-${index + 1}`,
      deviceId: row.deviceId || 'ESP32-SENSOR',
      startedAt: row.timestamp,
      endedAt: row.timestamp,
      durationSeconds: 12,
      volumeMl: Number(row.flowVolume || 0),
      flowRateMlPerMin: Number(row.flowRate || 0),
      source: 'mock',
      status: 'completed',
    }));
}

// ==========================================
// SENSOR API
// ==========================================
export const sensorAPI = {
  // GET /api/sensors - latest reading (backend uses query.deviceId)
  getLatest: async (deviceId = 'ESP32-SENSOR', options = {}) => {
    if (shouldUseMock(options)) {
      const mockSensors = getMockSensors();
      const mockPrimary = mockSensors.length > 0 ? mockSensors[0] : null;
      const normalized = normalizeMockSensorReading(mockPrimary);
      const res = await mockResponse(normalized);
      return res.data;
    }
    const response = await api.get('/sensors', { params: { deviceId }, ...options });
    return response;
  },

  // GET /api/sensors/history?deviceId=&start=&end= OR ?hours=
  getHistory: async (startDate, endDate, deviceId = 'ESP32-SENSOR', options = {}) => {
    if (shouldUseMock(options)) {
      let start = startDate;
      let end = endDate;

      if (!(typeof startDate === 'string' && typeof endDate === 'string')) {
        const hours = Number(startDate) || 24;
        end = new Date().toISOString();
        start = new Date(Date.now() - hours * 3_600_000).toISOString();
      }

      const mockHistory = generateMockSensorHistory(start, end, getMockSensors());
      const res = await mockResponse(mockHistory);
      return res.data;
    }
    let params = { deviceId };
    if (typeof startDate === 'string' && typeof endDate === 'string') {
      params.start = startDate;
      params.end   = endDate;
    } else {
      params.hours = startDate || 24; // fallback to hours window
    }
    const response = await api.get('/sensors/history', { params, ...options });
    
    return response;
  }
};

// ==========================================
// WATERING API
// ==========================================
export const wateringAPI = {
  // POST /api/water/start
  start: async (deviceId = 'ESP32-SENSOR', duration = null, options = {}) => {
    if (isMockEnabled()) {
      const res = await mockResponse({ success: true, message: 'Mock pump started', pumpActive: true });
      return res.data;
    }
    const payload = { deviceId };
    if (duration) payload.duration = duration;
    const response = await api.post('/water/start', payload, options);
    return response;
  },

  // POST /api/water/stop
  stop: async (deviceId = 'ESP32-SENSOR', options = {}) => {
    if (isMockEnabled()) {
      const res = await mockResponse({ success: true, message: 'Mock pump stopped', pumpActive: false });
      return res.data;
    }
    const response = await api.post('/water/stop', { deviceId }, options);
    return response;
  },

  // GET /api/water/status/:deviceId
  getStatus: async (deviceId = 'ESP32-SENSOR', options = {}) => {
    if (isMockEnabled()) {
      const res = await mockResponse({ pumpActive: false, lastWatered: new Date().toISOString() });
      return res.data;
    }
    const response = await api.get(`/water/status/${deviceId}`, options);
    return response;
  },

  // GET /api/water/history
  getLogs: async (limit = 10, deviceId = 'ESP32-SENSOR', options = {}) => {
    if (shouldUseMock(options)) {
      const mockHistory = generateMockSensorHistory(
        new Date(Date.now() - 24 * 3_600_000).toISOString(),
        new Date().toISOString(),
        getMockSensors()
      );
      const res = await mockResponse(generateMockWaterLogs(mockHistory, limit));
      return res.data;
    }
    const response = await api.get('/water/history', {
      params: { limit, deviceId },
      ...options
    });
    return response;
  }
};

// ==========================================
// CONFIG API
// ==========================================
export const configAPI = {
  // GET /api/config?deviceId=
  get: async (deviceId = 'ESP32-SENSOR') => {
    if (isMockEnabled()) {
      const res = await mockResponse({
        soilMoistureThreshold: 30,
        plantGrowthEnabled: true,
        plantGrowthStage: 'vegetative',
        aiInsightsMode: 'snapshots',
        pumpDurationSeconds: 10
      });
      return res.data;
    }
    const response = await api.get('/config', { params: { deviceId } });
    return response;
  },

  // GET /api/config/status?deviceId=
  getStatus: async (deviceId = 'ESP32-SENSOR', options = {}) => {
    if (shouldUseMock(options)) {
      const res = await mockResponse({ deviceId, online: true, lastSeen: new Date().toISOString() });
      return res.data;
    }
    const response = await api.get('/config/status', { params: { deviceId }, ...options });
    return response;
  },

  // GET /api/config/health  (deviceId is ignored by backend health)
  getHealth: async () => {
    if (isMockEnabled()) {
      const res = await mockResponse({ backend: 'healthy', database: 'connected', version: '1.0.0-mock' });
      return res.data;
    }
    const response = await api.get('/config/health');
    return response;
  },

  getSystemStats: async () => {
    if (isMockEnabled()) {
      const res = await mockResponse({
        stats: {
          users: { total: 10, online: 2, topPlant: 'Tomato', roleDistribution: { admin: { total: 1, online: 1 }, user: { total: 7, online: 1 }, viewer: { total: 2, online: 0 } } },
          devices: { sensors: { total: 2, online: 1, offline: 1, avgLatency: 45 }, cams: { total: 1, online: 1, offline: 0, avgLatency: 120 } }
        }
      });
      return res.data;
    }
    const response = await api.get('/config/system-stats');
    return response;
  },

  // POST /api/config (body includes deviceId)
  update: async (deviceId = 'ESP32-SENSOR', config) => {
    if (isMockEnabled()) {
      const res = await mockResponse({ success: true, message: 'Mock config updated', data: config });
      return res.data;
    }
    const response = await api.post('/config', { ...config, deviceId });
    return response;
  },

  // Data cleanup helpers
  clearSensorHistory: async (deviceId = 'ESP32-SENSOR', retentionDays = 90) => {
    if (isMockEnabled()) return { success: true, message: 'Mock history cleared' };
    const response = await api.post('/config/clear-sensor-history', {
      retentionDays,
      deviceId
    });
    return response;
  },

  clearWateringHistory: async (deviceId = 'ESP32-SENSOR', retentionDays = 365) => {
    if (isMockEnabled()) return { success: true, message: 'Mock history cleared' };
    const response = await api.post('/config/clear-watering-history', {
      retentionDays,
      deviceId
    });
    return response;
  },

  clearDiseaseHistory: async (deviceId = 'ESP32-SENSOR', retentionDays = 180) => {
    if (isMockEnabled()) return { success: true, message: 'Mock history cleared' };
    const response = await api.post('/config/clear-disease-history', {
      retentionDays,
      deviceId
    });
    return response;
  },

  clearAllHistory: async (deviceId = 'ESP32-SENSOR') => {
    if (isMockEnabled()) return { success: true, message: 'Mock history cleared' };
    const response = await api.post('/config/clear-all-history', { deviceId });
    return response;
  },

  getDataRetentionPolicy: async (deviceId = 'ESP32-SENSOR') => {
    if (isMockEnabled()) {
      const res = await mockResponse({ sensorHistoryDays: 90, wateringHistoryDays: 365, diseaseHistoryDays: 180 });
      return res.data;
    }
    const response = await api.get('/config/data-retention', {
      params: { deviceId }
    });
    return response;
  },

  updateDataRetentionPolicy: async (deviceId = 'ESP32-SENSOR', policy) => {
    if (isMockEnabled()) {
      const res = await mockResponse({ success: true, data: policy });
      return res.data;
    }
    const response = await api.put('/config/data-retention', policy, {
      params: { deviceId }
    });
    return response;
  },

  getAdminLogs: async (limit = 100) => {
    if (isMockEnabled()) {
      const res = await mockResponse([]);
      return res.data;
    }
    const response = await api.get('/config/admin-logs', {
      params: { limit }
    });
    return response;
  },

  deleteAdminLogs: async (options = {}) => {
    if (isMockEnabled()) {
      const res = await mockResponse({ success: true, deletedCount: 0 });
      return res.data;
    }

    const response = await api.delete('/config/admin-logs', options);
    return response;
  },

  createAdminLog: async ({ actor = 'admin', action, level = 'info', section = 'admin-panel', details = null } = {}) => {
    if (isMockEnabled()) {
      const res = await mockResponse({ success: true, log: { actor, action, level, section, details } });
      return res.data;
    }
    const response = await api.post('/config/admin-logs', {
      actor,
      action,
      level,
      section,
      details
    });
    return response;
  },

  exportAdminLogs: async ({ format = 'json', limit = 500, q = '', level = 'all' } = {}) => {
    if (isMockEnabled()) {
      const payload = format === 'csv'
        ? 'timestamp,actor,level,section,action,details\n'
        : JSON.stringify({ success: true, logs: [] }, null, 2);
      const type = format === 'csv' ? 'text/csv' : 'application/json';
      return new Blob([payload], { type });
    }

    const response = await api.get('/config/admin-logs/export', {
      params: { format, limit, q, level },
      responseType: 'blob'
    });

    return response;
  }
};

// ==========================================
// AI API
// ==========================================
export const authAPI = {
  register: async ({ fullName, email, password, confirmPassword }, options = {}) => {
    const response = await api.post('/auth/register', { fullName, email, password, confirmPassword }, options);
    return response;
  },

  login: async ({ email, password }, options = {}) => {
    const response = await api.post('/auth/login', { email, password }, options);
    return response;
  },

  refresh: async ({ refreshToken }, options = {}) => {
    const response = await api.post('/auth/refresh', { refreshToken }, options);
    return response;
  },

  logout: async ({ refreshToken }, options = {}) => {
    const response = await api.post('/auth/logout', { refreshToken }, options);
    return response;
  },

  me: async (options = {}) => {
    const response = await api.get('/auth/me', options);
    return response;
  },

  impersonate: async ({ userId }, options = {}) => {
    const response = await api.post('/auth/impersonate', { userId }, options);
    return response;
  },

  updateProfile: async ({ preferredPlant }, options = {}) => {
    const response = await api.patch('/auth/me', { preferredPlant }, options);
    return response;
  },

  verifyEmail: async ({ token }, options = {}) => {
    const response = await api.post('/auth/verify-email', { token }, options);
    return response;
  },

  resendVerification: async ({ email }, options = {}) => {
    const response = await api.post('/auth/resend-verification', { email }, options);
    return response;
  },

  forgotPassword: async ({ email }, options = {}) => {
    const response = await api.post('/auth/forgot-password', { email }, options);
    return response;
  },

  resetPassword: async ({ token, password, confirmPassword }, options = {}) => {
    const response = await api.post('/auth/reset-password', { token, password, confirmPassword }, options);
    return response;
  },

  passwordStrength: async ({ password, fullName, email }, options = {}) => {
    const response = await api.post('/auth/password-strength', { password, fullName, email }, options);
    return response;
  },
};

export const usersAPI = {
  list: async (limit = 100, options = {}) => {
    const response = await api.get('/users', {
      params: { limit },
      ...options,
    });
    return response;
  },

  create: async ({ fullName, email, password, roleKey, accountStatus, emailVerified }, options = {}) => {
    const response = await api.post('/users', {
      fullName,
      email,
      password,
      roleKey,
      accountStatus,
      emailVerified,
    }, options);
    return response;
  },

  updateRole: async (userId, roleKey, options = {}) => {
    const response = await api.patch(`/users/${userId}/role`, { roleKey }, options);
    return response;
  },

  updateAccountStatus: async (userId, accountStatus, options = {}) => {
    const response = await api.patch(`/users/${userId}/account-status`, { accountStatus }, options);
    return response;
  },

  updateSensorVisibility: async (userId, sensorDataVisible, options = {}) => {
    const response = await api.patch(`/users/${userId}/sensor-visibility`, { sensorDataVisible }, options);
    return response;
  },

  delete: async (userId, options = {}) => {
    const response = await api.delete(`/users/${userId}`, options);
    return response;
  },

  bulkAction: async (userIds, action, value, options = {}) => {
    const response = await api.post('/users/bulk-action', { userIds, action, value }, options);
    return response;
  },
  
  updatePreferences: async (userId, uiPreferences, options = {}) => {
    const response = await api.patch(`/users/${userId}/preferences`, { uiPreferences }, options);
    return response;
  },

  bulkUpdatePreferences: async ({ userIds, uiPreferences, targetAll = false }, options = {}) => {
    const response = await api.post('/users/bulk-preferences', { userIds, uiPreferences, targetAll }, options);
    return response;
  },
};

export const deviceAPI = {
  pairDevice: async ({ deviceId, deviceToken, deviceSecret, displayName, firmwareVersion }, options = {}) => {
    const normalizedDeviceId = String(deviceId || '').trim().toUpperCase();
    const resolvedToken = normalizedDeviceId || deviceToken || deviceSecret;
    const response = await api.post('/device/pair', {
      deviceId: normalizedDeviceId,
      deviceToken: resolvedToken,
      // Backward-compatible payload key for older servers.
      deviceSecret: resolvedToken,
      displayName,
      firmwareVersion,
    }, options);
    return response;
  },

  listMine: async (options = {}) => {
    const response = await api.get('/device/mine', options);
    return response;
  },

  rotateToken: async (deviceId, options = {}) => {
    const response = await api.post(`/device/${encodeURIComponent(deviceId)}/rotate-token`, {}, options);
    return response;
  },

  unpair: async (deviceId, options = {}) => {
    const response = await api.delete(`/device/${encodeURIComponent(deviceId)}`, options);
    return response;
  },

  // Device key management (admin)
  createKey: async ({ deviceId, pairingKey, provisioningSeed, displayName }, options = {}) => {
    const response = await api.post('/device/keys/create', { deviceId, pairingKey, provisioningSeed, displayName }, options);
    return response;
  },

  listKeys: async (options = {}) => {
    const response = await api.get('/device/keys/list', options);
    return response;
  },

  deleteKey: async (deviceId, options = {}) => {
    const response = await api.delete(`/device/keys/${encodeURIComponent(deviceId)}`, options);
    return response;
  },

  toggleKeyStatus: async (deviceId, options = {}) => {
    const response = await api.patch(`/device/keys/${encodeURIComponent(deviceId)}/toggle`, {}, options);
    return response;
  },

  batchDeleteKeys: async (deviceIds, options = {}) => {
    const response = await api.delete('/device/keys/batch', { data: { deviceIds }, ...options });
    return response;
  },

  forcePair: async ({ deviceId, userId, displayName }, options = {}) => {
    const response = await api.post('/device/force-pair', { deviceId, userId, displayName }, options);
    return response;
  },

  adminUnpair: async (deviceId, options = {}) => {
    const response = await api.delete(`/device/force-unpair/${encodeURIComponent(deviceId)}`, options);
    return response;
  },
};

export const publicAPI = {
  getOverview: async (options = {}) => {
    const response = await api.get('/public/overview', options);
    return response;
  },

  getAnalyticsPreview: async (hours = 24, options = {}) => {
    const response = await api.get('/public/analytics-preview', {
      params: { hours },
      ...options,
    });
    return response;
  },

  getReportsPreview: async (options = {}) => {
    const response = await api.get('/public/reports-preview', options);
    return response;
  },
};

export const aiAPI = {
  // GET /api/ai/recommend?deviceId=
  getRecommendation: async (deviceId = 'ESP32-SENSOR', options = {}) => {
    if (isMockEnabled()) {
      const cropHealth = getMockCropHealth() || {};
      const res = await mockResponse({ 
        recommendation: `Mock AI Insight: Crop overall score is ${cropHealth.overallScore}%. Growth stage: ${cropHealth.growthStage}.` 
      });
      return res.data;
    }
    const response = await api.get('/ai/recommend', {
      params: { deviceId },
      ...options
    });
    return response;
  },

  // GET /api/ai/insights?days=&deviceId=
  getInsights: async ({ days = 7, deviceId } = {}, options = {}) => {
    const params = { days };
    if (deviceId) params.deviceId = deviceId;
    const response = await api.get('/ai/insights', { params, ...options });
    return response;
  },

  // GET /api/ai/usage?deviceModel=
  getUsageStats: async (deviceModel = 'ESP32-SENSOR', options = {}) => {
    if (isMockEnabled()) {
      const res = await mockResponse({
        deviceModel,
        dateKey: new Date().toISOString().slice(0, 10),
        usedCount: 0,
        dailyLimit: 2,
        remaining: 2,
        exhausted: false,
        resetAt: new Date(new Date().setUTCHours(24, 0, 0, 0)).toISOString()
      });
      return res.data;
    }

    const response = await api.get('/ai/usage', {
      params: { deviceModel },
      ...options
    });
    return response;
  },

  // GET /api/ai/usage/all
  getAllUsageStats: async (options = {}) => {
    if (isMockEnabled()) {
      const res = await mockResponse([
        {
          deviceId: 'ESP32-SENSOR',
          usedCount: 1,
          dailyLimit: 2,
          remaining: 1,
          exhausted: false,
          lastUsedAt: new Date().toISOString()
        }
      ]);
      return res.data;
    }

    const response = await api.get('/ai/usage/all', options);
    return response;
  },

  // POST /api/ai/chat
  chat: async ({ message, sensorContext = '', history = [] }, options = {}) => {
    if (isMockEnabled()) {
      const res = await mockResponse({ 
        reply: `Mock AI response to: "${message}". The system is currently in Mock Data mode, so real AI processing is disabled.` 
      });
      return res.data;
    }
    const response = await api.post('/ai/chat', {
      message,
      sensorContext,
      history,
    }, options);
    return response;
  },

  // GET /api/ai/disease/all?deviceId=&page=&limit=&startDate=&endDate=
  getDiseaseDetections: async ({
    deviceId  = 'ESP32-CAM',
    page      = 1,
    limit     = 200,
    startDate,
    endDate,
  } = {}, options = {}) => {
    if (shouldUseMock(options)) {
      const mockAlerts = getMockAlerts() || [];
      const diseaseAlerts = mockAlerts.filter(a => {
        const msg = String(a.message || '').toLowerCase();
        return a.type === 'disease' || a.source === 'ESP32-CAM' || msg.includes('disease');
      });

      let detections = diseaseAlerts.map((a, index) => ({
        _id: a.id || `mock-disease-${index + 1}`,
        timestamp: a.time || a.timestamp || new Date(Date.now() - index * 3_600_000).toISOString(),
        detectedDisease: String(a.detectedDisease || a.message || 'leaf_blight')
          .replace('Plant disease detected: ', '')
          .replace(/\s+/g, '_')
          .toLowerCase(),
        confidence: Number(a.confidence ?? 0.82),
        deviceId: 'ESP32-CAM'
      }));

      if (detections.length === 0) {
        const now = Date.now();
        detections = [
          {
            _id: 'mock-disease-healthy',
            timestamp: new Date(now - 90 * 60 * 1000).toISOString(),
            detectedDisease: 'healthy',
            confidence: 0.93,
            deviceId: 'ESP32-CAM'
          },
          {
            _id: 'mock-disease-leaf-blight',
            timestamp: new Date(now - 8 * 60 * 60 * 1000).toISOString(),
            detectedDisease: 'leaf_blight',
            confidence: 0.84,
            deviceId: 'ESP32-CAM'
          }
        ];
      }

      const sorted = detections
        .filter((item) => !startDate || new Date(item.timestamp) >= new Date(startDate))
        .filter((item) => !endDate || new Date(item.timestamp) <= new Date(endDate))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      const paged = sorted.slice(0, limit);
      const res = await mockResponse({
        detections: paged,
        total: sorted.length,
        page,
        totalPages: Math.max(1, Math.ceil(sorted.length / Math.max(1, limit)))
      });
      return res.data;
    }

    const params = { deviceId, page, limit };
    if (startDate) params.startDate = startDate;
    if (endDate)   params.endDate   = endDate;
    const response = await api.get('/ai/disease/all', { params, ...options });
    return response;
  },

  // ── Admin-only AI API Key management ──────────────────────────────
  // GET /api/ai/keys
  getAdminKeys: async (options = {}) => {
    const response = await api.get('/ai/keys', options);
    return response;
  },

  // POST /api/ai/keys
  addAdminKey: async ({ label, key }, options = {}) => {
    const response = await api.post('/ai/keys', { label, key }, options);
    return response;
  },

  // DELETE /api/ai/keys/:index
  deleteAdminKey: async (index, options = {}) => {
    const response = await api.delete(`/ai/keys/${index}`, options);
    return response;
  },

  // PATCH /api/ai/keys/:index/toggle
  toggleAdminKey: async (index, options = {}) => {
    const response = await api.patch(`/ai/keys/${index}/toggle`, {}, options);
    return response;
  },
};

export default api;