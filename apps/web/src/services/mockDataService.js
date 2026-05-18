// ─── SPROUTSENSE MOCK DATA SERVICE ───────────────────────────────────────────
// Central in-memory store. No localStorage. Default: OFF.
// Enhanced with logging & status tracking for development visibility.

const listeners = [];
const actionLog = [];
const MAX_LOG_ENTRIES = 50;

function createFlowSensor(overrides = {}) {
  return {
    id: `F${Date.now()}`,
    name: 'Irrigation Flow Sensor',
    sensorType: 'flow',
    moisture: 0,
    temperature: 0,
    humidity: 0,
    flowRate: 142.5,
    flowVolume: 860,
    status: 'active',
    lastUpdate: 'just now',
    activityIndex: 0,
    ...overrides,
  };
}

// ─── LOGGING SYSTEM ──────────────────────────────────────────────────────────
function logAction(action, details = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    action,
    details,
  };
  actionLog.unshift(entry); // Add to front
  if (actionLog.length > MAX_LOG_ENTRIES) actionLog.pop(); // Keep last 50
  
  // Console output with emoji prefix
  const prefix = {
    'MOCK_ENABLED': '🔴',
    'MOCK_DISABLED': '⚪',
    'DRIFT_ON': '💨',
    'DRIFT_OFF': '⏸️',
    'SCENARIO_APPLIED': '🎭',
    'SENSOR_ADDED': '➕',
    'SENSOR_DELETED': '➖',
    'ALERT_ADDED': '🔔',
    'SENSOR_HISTORY_REQUEST': '📊',
  }[action] || '📝';

  console.log(`%c${prefix} MockData: ${action}`, 'color: #22d3ee; font-weight: 600;', details);
}

export function getActionLog() {
  return [...actionLog];
}

export function clearActionLog() {
  actionLog.length = 0;
}

export function subscribeToMockUpdates(callback) {
  listeners.push(callback);
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx > -1) listeners.splice(idx, 1);
  };
}

function notifyUpdate() {
  listeners.forEach(cb => cb());
}

export const mockDataStore = {
  enabled: (() => {
    try {
      const persisted = localStorage.getItem('ss_mock_enabled');
      return persisted ? JSON.parse(persisted) : false;
    } catch (e) {
      return false;
    }
  })(),
  simulationActive: false, // Drift mode
  scenario: 'normal',
  _timer: null,

  sensors: [
    { id: 'S001', name: 'Field A - Zone 1', moisture: 62, temperature: 28.4, humidity: 71, status: 'active', lastUpdate: 'just now', activityIndex: 0 },
    { id: 'S002', name: 'Field A - Zone 2', moisture: 45, temperature: 31.2, humidity: 65, status: 'active', lastUpdate: 'just now', activityIndex: 0 },
    { id: 'S003', name: 'Field B - Zone 1', moisture: 78, temperature: 26.8, humidity: 80, status: 'active', lastUpdate: 'just now', activityIndex: 0 },
    { id: 'S004', name: 'Field B - Zone 2', moisture: 33, temperature: 29.1, humidity: 68, status: 'warning', lastUpdate: 'just now', activityIndex: 0 },
    createFlowSensor({ id: 'F001', name: 'Main Line Flow Sensor' }),
  ],

  alerts: [
    { id: 'A001', type: 'moisture', severity: 'high',   message: 'Soil moisture critically low in Field B Zone 2', timestamp: '10:32 AM', enabled: true },
    { id: 'A002', type: 'temperature', severity: 'medium', message: 'High temperature detected in Field A Zone 2', timestamp: '09:15 AM', enabled: true },
    { id: 'A003', type: 'system', severity: 'low',     message: 'Sensor S003 battery at 18%', timestamp: '08:00 AM', enabled: false },
  ],

  cropHealth: {
    overallScore: 74,
    growthStage: 'Vegetative',
    diseaseProbability: 12,
    waterStress: 8,
    nutrientLevel: 81,
    lastAnalysis: '2026-03-29 08:00',
  },

  weather: {
    temperature: 29,
    humidity: 68,
    rainfall: 0,
    windSpeed: 12,
    uvIndex: 7,
    forecast: 'Partly Cloudy',
    nextRainIn: '3 days',
  },

  users: [
    { id: 'U001', name: 'Arjun Verma',   email: 'arjun@sproutsense.io', role: 'admin',   active: true },
    { id: 'U002', name: 'Priya Nayak',   email: 'priya@sproutsense.io', role: 'viewer',  active: true },
    { id: 'U003', name: 'Demo User',     email: 'demo@sproutsense.io',  role: 'viewer',  active: false },
  ],
};

// ─── Scenario Presets ─────────────────────────────────────────────────────────
const SCENARIOS = {
  normal: {
    sensors: mockDataStore.sensors,
    alerts: mockDataStore.alerts,
    cropHealth: mockDataStore.cropHealth,
    weather: mockDataStore.weather,
  },
  empty: {
    sensors: [],
    alerts: [],
    cropHealth: { overallScore: 0, growthStage: '—', diseaseProbability: 0, waterStress: 0, nutrientLevel: 0, lastAnalysis: '—' },
    weather: { temperature: 0, humidity: 0, rainfall: 0, windSpeed: 0, uvIndex: 0, forecast: '—', nextRainIn: '—' },
  },
  error: {
    sensors: null,
    alerts: null,
    cropHealth: null,
    weather: null,
    _forceError: true,
  },
  highLoad: {
    sensors: [
      ...Array.from({ length: 20 }, (_, i) => ({
      id: `S${String(i + 1).padStart(3, '0')}`,
      name: `Field ${String.fromCharCode(65 + Math.floor(i / 4))} - Zone ${(i % 4) + 1}`,
      moisture: Math.floor(Math.random() * 80 + 20),
      temperature: +(24 + Math.random() * 10).toFixed(1),
      humidity: Math.floor(Math.random() * 40 + 50),
      status: ['active', 'active', 'active', 'warning'][Math.floor(Math.random() * 4)],
      lastUpdate: `${Math.floor(Math.random() * 9) + 1} min ago`,
    })),
      createFlowSensor({
        id: 'F999',
        name: 'Enterprise Flow Sensor',
        flowRate: 165.2,
        flowVolume: 1240,
      }),
    ],
    alerts: mockDataStore.alerts,
    cropHealth: mockDataStore.cropHealth,
    weather: mockDataStore.weather,
  },
  demo: {
    sensors: mockDataStore.sensors,
    alerts: mockDataStore.alerts,
    cropHealth: { ...mockDataStore.cropHealth, overallScore: 92 },
    weather: { ...mockDataStore.weather, forecast: 'Sunny', rainfall: 0 },
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────
export function setMockEnabled(val) { 
  mockDataStore.enabled = !!val;
  
  // Persist to localStorage for admin panel toggle to survive refreshes
  try {
    localStorage.setItem('ss_mock_enabled', JSON.stringify(mockDataStore.enabled));
  } catch (e) {
    console.error('Failed to persist mock setting', e);
  }

  if (mockDataStore.enabled) {
    logAction('MOCK_ENABLED', {
      scenario: mockDataStore.scenario,
      sensors: mockDataStore.sensors?.length || 0,
      alerts: mockDataStore.alerts?.length || 0,
    });
  } else {
    setSimulationActive(false);
    logAction('MOCK_DISABLED', {});
  }
  notifyUpdate(); 
}

export function isMockEnabled() { return mockDataStore.enabled; }

export function getStatus() {
  return {
    enabled: mockDataStore.enabled,
    simulationActive: mockDataStore.simulationActive,
    scenario: mockDataStore.scenario,
    sensorCount: mockDataStore.sensors?.length || 0,
    alertCount: mockDataStore.alerts?.length || 0,
    cropHealth: mockDataStore.cropHealth,
    weather: mockDataStore.weather,
    userCount: mockDataStore.users?.length || 0,
    actionLogLength: actionLog.length,
    lastAction: actionLog[0] || null,
  };
}

export function isSimulationActive() { return mockDataStore.simulationActive; }

export function setSimulationActive(val) {
  mockDataStore.simulationActive = !!val;
  
  if (mockDataStore.simulationActive) {
    if (mockDataStore._timer) clearInterval(mockDataStore._timer);
    logAction('DRIFT_ON', { sensorCount: mockDataStore.sensors?.length || 0 });
    mockDataStore._timer = setInterval(() => {
      if (!mockDataStore.sensors) return;
      
      let changed = false;
      mockDataStore.sensors = mockDataStore.sensors.map(s => {
        if (s.status !== 'active') return s;

        const isFlowSensor = s.sensorType === 'flow' || /flow/i.test(s.name || '');
        if (isFlowSensor) {
          const baseRate = Number.isFinite(Number(s.flowRate)) ? Number(s.flowRate) : 120;
          const rateDrift = (Math.sin((s.activityIndex || 0) / 2) * 18) + ((Math.random() - 0.5) * 10);
          const nextRate = Math.max(0, Math.min(1800, baseRate + rateDrift));
          const nextVolume = Number(s.flowVolume || 0) + (nextRate * 0.05);

          changed = true;
          return {
            ...s,
            flowRate: +nextRate.toFixed(1),
            flowVolume: +nextVolume.toFixed(1),
            activityIndex: (s.activityIndex || 0) + 1,
            lastUpdate: 'pulsing',
          };
        }
        
        // Random drift +/- 0.5 to 1.5
        const driftM = (Math.random() - 0.5) * 2;
        const driftT = (Math.random() - 0.5) * 0.4;
        const driftH = (Math.random() - 0.5) * 1.2;
        
        changed = true;
        return {
          ...s,
          moisture: Math.max(0, Math.min(100, +(s.moisture + driftM).toFixed(1))),
          temperature: Math.max(0, Math.min(50, +(s.temperature + driftT).toFixed(1))),
          humidity: Math.max(0, Math.min(100, +(s.humidity + driftH).toFixed(1))),
          activityIndex: (s.activityIndex || 0) + 1,
          lastUpdate: 'pulsing'
        };
      });
      
      if (changed) notifyUpdate();
    }, 3000);
  } else {
    if (mockDataStore._timer) {
      clearInterval(mockDataStore._timer);
      mockDataStore._timer = null;
      logAction('DRIFT_OFF', {});
    }
  }
  notifyUpdate();
}

export function applyScenario(name) {
  const preset = SCENARIOS[name];
  if (!preset) return;
  Object.assign(mockDataStore, preset);
  mockDataStore.scenario = name;
  logAction('SCENARIO_APPLIED', {
    scenario: name,
    sensors: mockDataStore.sensors?.length || 0,
    alerts: mockDataStore.alerts?.length || 0,
  });
  notifyUpdate();
}

export function getMockSensors()      { return mockDataStore.sensors ?? []; }
export function getMockAlerts()       { return mockDataStore.alerts ?? []; }
export function getMockCropHealth()   { return mockDataStore.cropHealth; }
export function getMockWeather()      { return mockDataStore.weather; }
export function getMockUsers()        { return mockDataStore.users; }

// ─── Sensor CRUD ──────────────────────────────────────────────────────────────
export function addSensor(sensor) {
  const sensorType = String(sensor?.sensorType || '').toLowerCase();
  const isFlowSensor = sensorType === 'flow';
  const newSensor = {
    id: `${isFlowSensor ? 'F' : 'S'}${Date.now()}`,
    status: 'active',
    lastUpdate: 'just now',
    ...(isFlowSensor
      ? { sensorType: 'flow', moisture: 0, temperature: 0, humidity: 0, flowRate: 120, flowVolume: 0 }
      : {}),
    ...sensor,
  };
  mockDataStore.sensors = [...(mockDataStore.sensors || []), newSensor];
  logAction('SENSOR_ADDED', { sensorId: newSensor.id, name: newSensor.name });
  notifyUpdate();
  return newSensor;
}
export function updateSensor(id, fields) {
  mockDataStore.sensors = (mockDataStore.sensors || []).map(s => s.id === id ? { ...s, ...fields } : s);
  notifyUpdate();
}
export function deleteSensor(id) {
  mockDataStore.sensors = (mockDataStore.sensors || []).filter(s => s.id !== id);
  logAction('SENSOR_DELETED', { sensorId: id });
  notifyUpdate();
}

// ─── Alert CRUD ───────────────────────────────────────────────────────────────
export function addAlert(alert) {
  const newAlert = { id: `A${Date.now()}`, enabled: true, timestamp: new Date().toLocaleTimeString(), ...alert };
  mockDataStore.alerts = [...(mockDataStore.alerts || []), newAlert];
  logAction('ALERT_ADDED', { alertId: newAlert.id, type: newAlert.type });
  notifyUpdate();
  return newAlert;
}
export function updateAlert(id, fields) {
  mockDataStore.alerts = (mockDataStore.alerts || []).map(a => a.id === id ? { ...a, ...fields } : a);
  notifyUpdate();
}
export function deleteAlert(id) {
  mockDataStore.alerts = (mockDataStore.alerts || []).filter(a => a.id !== id);
  notifyUpdate();
}

// ─── Crop Health update ───────────────────────────────────────────────────────
export function updateCropHealth(fields) {
  mockDataStore.cropHealth = { ...mockDataStore.cropHealth, ...fields };
  notifyUpdate();
}

// ─── Weather update ───────────────────────────────────────────────────────────
export function updateWeather(fields) {
  mockDataStore.weather = { ...mockDataStore.weather, ...fields };
  notifyUpdate();
}

// ─── User CRUD ────────────────────────────────────────────────────────────────
export function addUser(user) {
  const newUser = { id: `U${Date.now()}`, active: true, ...user };
  mockDataStore.users = [...mockDataStore.users, newUser];
  notifyUpdate();
  return newUser;
}
export function updateUser(id, fields) {
  mockDataStore.users = mockDataStore.users.map(u => u.id === id ? { ...u, ...fields } : u);
  notifyUpdate();
}
export function deleteUser(id) {
  mockDataStore.users = mockDataStore.users.filter(u => u.id !== id);
  notifyUpdate();
}

// ─── Reset ────────────────────────────────────────────────────────────────────
export function resetToDefaults() {
  const preset = SCENARIOS['normal'];
  Object.assign(mockDataStore, preset);
  mockDataStore.scenario = 'normal';
  logAction('SCENARIO_APPLIED', {
    scenario: 'normal (factory reset)',
    sensors: mockDataStore.sensors?.length || 0,
  });
  notifyUpdate();
}

export function exportMockData() {
  const data = {
    sensors: mockDataStore.sensors,
    alerts: mockDataStore.alerts,
    cropHealth: mockDataStore.cropHealth,
    weather: mockDataStore.weather,
    users: mockDataStore.users,
  };
  logAction('DATA_EXPORTED', {
    sensors: data.sensors?.length || 0,
    alerts: data.alerts?.length || 0,
    timestamp: new Date().toISOString(),
  });
  return JSON.stringify(data, null, 2);
}

export function importMockData(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    if (data.sensors)    mockDataStore.sensors    = data.sensors;
    if (data.alerts)     mockDataStore.alerts     = data.alerts;
    if (data.cropHealth) mockDataStore.cropHealth = data.cropHealth;
    if (data.weather)    mockDataStore.weather    = data.weather;
    if (data.users)      mockDataStore.users      = data.users;
    logAction('DATA_IMPORTED', {
      sensors: data.sensors?.length || 0,
      alerts: data.alerts?.length || 0,
      timestamp: new Date().toISOString(),
    });
    notifyUpdate();
    return { success: true };
  } catch (err) {
    logAction('IMPORT_FAILED', { error: err.message });
    return { success: false, error: 'Invalid JSON format' };
  }
}