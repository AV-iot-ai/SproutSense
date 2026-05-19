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
  simulationActive: (() => {
    try {
      const persisted = localStorage.getItem('ss_simulation_active');
      return persisted ? JSON.parse(persisted) : true;
    } catch (e) {
      return true;
    }
  })(),
  scenario: 'normal',
  pumpActive: false,
  simTimeOfDay: 8.0, // Start at 8:00 AM
  _timer: null,

  sensors: [
    { id: 'S001', name: 'Field A - Zone 1', moisture: 62, temperature: 28.4, humidity: 71, light: 1200, status: 'active', lastUpdate: 'just now', activityIndex: 0 },
    { id: 'S002', name: 'Field A - Zone 2', moisture: 45, temperature: 31.2, humidity: 65, light: 850, status: 'active', lastUpdate: 'just now', activityIndex: 0 },
    { id: 'S003', name: 'Field B - Zone 1', moisture: 78, temperature: 26.8, humidity: 80, light: 1500, status: 'active', lastUpdate: 'just now', activityIndex: 0 },
    { id: 'S004', name: 'Field B - Zone 2', moisture: 33, temperature: 29.1, humidity: 68, light: 340, status: 'warning', lastUpdate: 'just now', activityIndex: 0 },
    createFlowSensor({ id: 'F001', name: 'Main Line Flow Sensor', flowRate: 142.5, flowVolume: 860 }),
  ],

  alerts: [
    { id: 'A001', type: 'moisture', severity: 'high',   message: 'Soil moisture critically low in Field B Zone 2', timestamp: new Date(Date.now() - 15 * 60_000).toISOString(), enabled: true },
    { id: 'A002', type: 'temperature', severity: 'medium', message: 'High temperature detected in Field A Zone 2', timestamp: new Date(Date.now() - 2 * 3600_000).toISOString(), enabled: true },
    { id: 'A003', type: 'system', severity: 'low',     message: 'Sensor S003 battery at 18%', timestamp: new Date(Date.now() - 5 * 3600_000).toISOString(), enabled: false },
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
      light: Math.floor(Math.random() * 1800 + 200),
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
    setSimulationActive(true);
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

// ─── Alert Syncing and Crop Health Helpers ────────────────────────────────────
function syncMockAlerts() {
  if (!mockDataStore.sensors || !mockDataStore.alerts) return false;

  const currentAlerts = [...mockDataStore.alerts];
  let changed = false;

  mockDataStore.sensors.forEach(s => {
    const isFlowSensor = s.sensorType === 'flow' || /flow/i.test(s.name || '');
    if (isFlowSensor) return;

    const critId = `crit-moisture-${s.id}`;
    const warnId = `warn-moisture-${s.id}`;

    // Moisture Alerts
    if (s.moisture < 20) {
      const hasCrit = currentAlerts.some(a => a.id === critId);
      if (!hasCrit) {
        mockDataStore.alerts = mockDataStore.alerts.filter(a => a.id !== warnId);
        mockDataStore.alerts.push({
          id: critId,
          type: 'moisture',
          severity: 'high',
          message: `Soil moisture critically low in ${s.name}`,
          value: `${s.moisture}%`,
          timestamp: new Date().toISOString(),
          enabled: true
        });
        logAction('ALERT_ADDED', { alertId: critId, type: 'moisture', severity: 'high' });
        changed = true;
      } else {
        mockDataStore.alerts = mockDataStore.alerts.map(a => 
          a.id === critId ? { ...a, value: `${s.moisture}%` } : a
        );
      }
    } else if (s.moisture < 30) {
      const hasWarn = currentAlerts.some(a => a.id === warnId);
      if (!hasWarn) {
        mockDataStore.alerts = mockDataStore.alerts.filter(a => a.id !== critId);
        mockDataStore.alerts.push({
          id: warnId,
          type: 'moisture',
          severity: 'medium',
          message: `Soil moisture needs attention in ${s.name}`,
          value: `${s.moisture}%`,
          timestamp: new Date().toISOString(),
          enabled: true
        });
        logAction('ALERT_ADDED', { alertId: warnId, type: 'moisture', severity: 'medium' });
        changed = true;
      } else {
        mockDataStore.alerts = mockDataStore.alerts.map(a => 
          a.id === warnId ? { ...a, value: `${s.moisture}%` } : a
        );
      }
    } else {
      const lenBefore = mockDataStore.alerts.length;
      mockDataStore.alerts = mockDataStore.alerts.filter(a => a.id !== critId && a.id !== warnId);
      if (mockDataStore.alerts.length !== lenBefore) {
        logAction('ALERT_CLEARED', { sensorId: s.id, type: 'moisture' });
        changed = true;
      }
    }

    // Temperature Alerts
    const tempCritId = `crit-temp-${s.id}`;
    const tempWarnId = `warn-temp-${s.id}`;
    if (s.temperature >= 40) {
      const hasCrit = currentAlerts.some(a => a.id === tempCritId);
      if (!hasCrit) {
        mockDataStore.alerts = mockDataStore.alerts.filter(a => a.id !== tempWarnId);
        mockDataStore.alerts.push({
          id: tempCritId,
          type: 'temperature',
          severity: 'high',
          message: `Critical high temperature in ${s.name}`,
          value: `${s.temperature} °C`,
          timestamp: new Date().toISOString(),
          enabled: true
        });
        logAction('ALERT_ADDED', { alertId: tempCritId, type: 'temperature', severity: 'high' });
        changed = true;
      } else {
        mockDataStore.alerts = mockDataStore.alerts.map(a => 
          a.id === tempCritId ? { ...a, value: `${s.temperature} °C` } : a
        );
      }
    } else if (s.temperature >= 35) {
      const hasWarn = currentAlerts.some(a => a.id === tempWarnId);
      if (!hasWarn) {
        mockDataStore.alerts = mockDataStore.alerts.filter(a => a.id !== tempCritId);
        mockDataStore.alerts.push({
          id: tempWarnId,
          type: 'temperature',
          severity: 'medium',
          message: `High temperature needs attention in ${s.name}`,
          value: `${s.temperature} °C`,
          timestamp: new Date().toISOString(),
          enabled: true
        });
        logAction('ALERT_ADDED', { alertId: tempWarnId, type: 'temperature', severity: 'medium' });
        changed = true;
      } else {
        mockDataStore.alerts = mockDataStore.alerts.map(a => 
          a.id === tempWarnId ? { ...a, value: `${s.temperature} °C` } : a
        );
      }
    } else {
      const lenBefore = mockDataStore.alerts.length;
      mockDataStore.alerts = mockDataStore.alerts.filter(a => a.id !== tempCritId && a.id !== tempWarnId);
      if (mockDataStore.alerts.length !== lenBefore) {
        logAction('ALERT_CLEARED', { sensorId: s.id, type: 'temperature' });
        changed = true;
      }
    }
  });

  return changed;
}

function simulateCropHealth() {
  if (!mockDataStore.cropHealth || !mockDataStore.sensors) return;
  
  let hasStress = false;
  let hasCrit = false;
  
  mockDataStore.sensors.forEach(s => {
    const isFlowSensor = s.sensorType === 'flow' || /flow/i.test(s.name || '');
    if (isFlowSensor) return;
    if (s.moisture < 30) hasStress = true;
    if (s.moisture < 20 || s.temperature >= 38) hasCrit = true;
  });

  let nextScore = mockDataStore.cropHealth.overallScore;
  let nextWaterStress = mockDataStore.cropHealth.waterStress;

  if (hasCrit) {
    nextScore = Math.max(40, nextScore - 1.2);
    nextWaterStress = Math.min(100, nextWaterStress + 2);
  } else if (hasStress) {
    nextScore = Math.max(60, nextScore - 0.4);
    nextWaterStress = Math.min(100, nextWaterStress + 1);
  } else {
    nextScore = Math.min(96, nextScore + 0.3);
    nextWaterStress = Math.max(2, nextWaterStress - 1.2);
  }

  mockDataStore.cropHealth = {
    ...mockDataStore.cropHealth,
    overallScore: Math.round(nextScore),
    waterStress: Math.round(nextWaterStress),
    nutrientLevel: Math.round(80 + (Math.sin(mockDataStore.simTimeOfDay / 4) * 2)),
    lastAnalysis: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}

export function isSimulationActive() { return mockDataStore.simulationActive; }

export function startMockPump() {
  mockDataStore.pumpActive = true;
  logAction('PUMP_STARTED', { source: 'simulation' });
  notifyUpdate();
}

export function stopMockPump() {
  mockDataStore.pumpActive = false;
  logAction('PUMP_STOPPED', { source: 'simulation' });
  notifyUpdate();
}

export function getMockPumpActive() {
  return !!mockDataStore.pumpActive;
}

export function setSimulationActive(val) {
  mockDataStore.simulationActive = !!val;

  try {
    localStorage.setItem('ss_simulation_active', JSON.stringify(mockDataStore.simulationActive));
  } catch (e) {
    console.error('Failed to persist simulation state', e);
  }
  
  if (mockDataStore.simulationActive) {
    if (mockDataStore._timer) clearInterval(mockDataStore._timer);
    
    if (mockDataStore.pumpActive === undefined) mockDataStore.pumpActive = false;
    if (mockDataStore.simTimeOfDay === undefined) mockDataStore.simTimeOfDay = 8.0;

    logAction('DRIFT_ON', { sensorCount: mockDataStore.sensors?.length || 0 });
    mockDataStore._timer = setInterval(() => {
      if (!mockDataStore.sensors) return;
      
      let changed = false;
      
      // Advance simulated time of day (15 simulated minutes every 3 seconds)
      mockDataStore.simTimeOfDay = (mockDataStore.simTimeOfDay + 0.25) % 24;
      const t = mockDataStore.simTimeOfDay;
      
      // Diurnal cycle profiles
      let sunFactor = 0;
      if (t >= 6 && t <= 18) {
        sunFactor = Math.sin((t - 6) / 12 * Math.PI); // Noon peak
      }
      
      const tempCycle = Math.sin((t - 9) / 24 * 2 * Math.PI); // Mid-afternoon peak
      const targetAmbientTemp = 22 + (tempCycle * 6);
      const targetAmbientHumidity = 75 - (tempCycle * 15);
      const evapRate = 0.04 + (sunFactor * 0.08) + (Math.max(0, targetAmbientTemp - 20) * 0.003);

      mockDataStore.sensors = mockDataStore.sensors.map(s => {
        if (s.status !== 'active') return s;

        const isFlowSensor = s.sensorType === 'flow' || /flow/i.test(s.name || '');
        if (isFlowSensor) {
          let nextRate = 0;
          if (mockDataStore.pumpActive) {
            nextRate = 140 + (Math.sin((s.activityIndex || 0) / 2) * 5) + ((Math.random() - 0.5) * 4);
          } else {
            nextRate = 0;
          }
          
          const volumeIncrement = (nextRate / 60) * 3;
          const nextVolume = Number(s.flowVolume || 0) + volumeIncrement;

          changed = true;
          return {
            ...s,
            flowRate: +nextRate.toFixed(1),
            flowVolume: +nextVolume.toFixed(1),
            activityIndex: (s.activityIndex || 0) + 1,
            lastUpdate: 'pulsing',
          };
        }
        
        let nextMoisture = s.moisture;
        if (mockDataStore.pumpActive) {
          nextMoisture = Math.min(100, s.moisture + 2.5);
        } else {
          // Add micro-noise and evaporation drift
          const noiseMoisture = (Math.random() - 0.5) * 0.25; // ±0.125% fluctuation
          nextMoisture = Math.max(0, Math.min(100, s.moisture - evapRate + noiseMoisture));
        }

        const zoneTempOffset = s.id === 'S001' ? 0.8 : s.id === 'S002' ? -1.2 : s.id === 'S003' ? 0.3 : -0.5;
        const targetTemp = targetAmbientTemp + zoneTempOffset;
        const currentTemp = s.temperature || 24;
        const noiseTemp = (Math.random() - 0.5) * 0.4; // ±0.2°C fluctuation
        const nextTemp = currentTemp + (targetTemp - currentTemp) * 0.15 + noiseTemp;

        const zoneHumOffset = s.id === 'S001' ? -3 : s.id === 'S002' ? 4 : s.id === 'S003' ? -1 : 2;
        const targetHum = targetAmbientHumidity + zoneHumOffset;
        const currentHum = s.humidity || 70;
        const noiseHum = (Math.random() - 0.5) * 0.6; // ±0.3% fluctuation
        const nextHum = currentHum + (targetHum - currentHum) * 0.15 + noiseHum;

        const zoneLightOffset = s.id === 'S001' ? 1.05 : s.id === 'S002' ? 0.85 : s.id === 'S003' ? 1.15 : 0.70;
        const targetLight = sunFactor * 1400 * zoneLightOffset;
        const currentLight = s.light || 0;
        const noiseLight = (Math.random() - 0.5) * 30; // ±15 lux fluctuation
        const nextLight = currentLight + (targetLight - currentLight) * 0.25 + noiseLight;

        changed = true;
        return {
          ...s,
          moisture: +nextMoisture.toFixed(1),
          temperature: +nextTemp.toFixed(1),
          humidity: Math.max(0, Math.min(100, Math.round(nextHum))),
          light: Math.max(0, Math.round(nextLight)),
          activityIndex: (s.activityIndex || 0) + 1,
          lastUpdate: 'pulsing'
        };
      });

      const alertsChanged = syncMockAlerts();
      simulateCropHealth();
      
      if (changed || alertsChanged) notifyUpdate();
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
export function getMockAlerts() {
  return (mockDataStore.alerts ?? []).map(a => {
    let uiType = 'info';
    if (a.severity === 'high' || a.type === 'error' || a.type === 'critical') {
      uiType = 'error';
    } else if (a.severity === 'medium' || a.type === 'warning' || a.type === 'attention') {
      uiType = 'warning';
    } else if (a.severity === 'low' || a.type === 'info') {
      uiType = 'info';
    } else {
      if (a.type === 'moisture' && a.severity === 'high') uiType = 'error';
      else if (a.type === 'temperature' && a.severity === 'medium') uiType = 'warning';
      else if (a.type === 'system' && a.severity === 'low') uiType = 'info';
    }

    return {
      ...a,
      type: uiType,
      value: a.value || (a.type === 'moisture' ? '18%' : a.type === 'temperature' ? '39.2 °C' : ''),
      time: a.timestamp || 'just now',
      timestamp: a.timestamp || 'just now',
      enabled: a.enabled !== undefined ? a.enabled : true,
    };
  });
}
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
      ? { sensorType: 'flow', moisture: 0, temperature: 0, humidity: 0, flowRate: 120, flowVolume: 0, light: 0 }
      : { sensorType: 'plant', light: 1200 }),
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
  const newAlert = { id: `A${Date.now()}`, enabled: true, timestamp: new Date().toISOString(), ...alert };
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

// Auto-start simulation if mock mode is active on initialization
if (mockDataStore.enabled && mockDataStore.simulationActive) {
  setTimeout(() => {
    setSimulationActive(true);
  }, 100);
}