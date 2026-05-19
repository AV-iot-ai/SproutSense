const SENSOR_REGISTRY_KEY = 'sproutsense_sensor_registry_v1';
const ACCESS_TOKEN_KEY = 'ss_access_token';

function getScopedRegistryKey() {
  try {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token || typeof token !== 'string') {
      return SENSOR_REGISTRY_KEY;
    }

    const segments = token.split('.');
    if (segments.length < 2) {
      return SENSOR_REGISTRY_KEY;
    }

    const payload = JSON.parse(atob(segments[1].replace(/-/g, '+').replace(/_/g, '/')));
    const userId = String(payload?.sub || '').trim();
    if (!userId) {
      return SENSOR_REGISTRY_KEY;
    }

    return `${SENSOR_REGISTRY_KEY}:${userId}`;
  } catch {
    return SENSOR_REGISTRY_KEY;
  }
}

const DEFAULT_SENSORS = [
  {
    id: 'soil-moisture',
    name: 'Soil Moisture',
    key: 'soilMoisture',
    unit: '%',
    dataType: 'percent',
    category: 'soil',
    minThreshold: 20,
    maxThreshold: 85,
    warningThreshold: 30,
    criticalThreshold: 20,
    chartType: 'area',
    enabled: true,
    showInDashboard: true,
    showInAnalytics: true,
  },
  {
    id: 'temperature',
    name: 'Temperature',
    key: 'temperature',
    unit: 'C',
    dataType: 'number',
    category: 'environment',
    minThreshold: 10,
    maxThreshold: 45,
    warningThreshold: 35,
    criticalThreshold: 40,
    chartType: 'line',
    enabled: true,
    showInDashboard: true,
    showInAnalytics: true,
  },
  {
    id: 'humidity',
    name: 'Humidity',
    key: 'humidity',
    unit: '%',
    dataType: 'percent',
    category: 'environment',
    minThreshold: 25,
    maxThreshold: 90,
    warningThreshold: 80,
    criticalThreshold: 90,
    chartType: 'line',
    enabled: true,
    showInDashboard: true,
    showInAnalytics: true,
  },
  {
    id: 'light',
    name: 'Light',
    key: 'light',
    unit: 'lux',
    dataType: 'number',
    category: 'environment',
    minThreshold: 100,
    maxThreshold: 2000,
    warningThreshold: 250,
    criticalThreshold: 100,
    chartType: 'bar',
    enabled: true,
    showInDashboard: true,
    showInAnalytics: true,
  },
  {
    id: 'flow-rate',
    name: 'Flow Rate',
    key: 'flowRate',
    unit: 'mL/min',
    dataType: 'number',
    category: 'irrigation',
    minThreshold: 0,
    maxThreshold: 900,
    warningThreshold: 800,
    criticalThreshold: 850,
    chartType: 'sparkline',
    enabled: true,
    showInDashboard: true,
    showInAnalytics: true,
  },
  {
    id: 'flow-volume',
    name: 'Water Volume',
    key: 'flowVolume',
    unit: 'mL',
    dataType: 'number',
    category: 'irrigation',
    minThreshold: 0,
    maxThreshold: 2000,
    warningThreshold: 1500,
    criticalThreshold: 1800,
    chartType: 'sparkline',
    enabled: true,
    showInDashboard: true,
    showInAnalytics: true,
  },
];

const CHART_TYPES = ['line', 'area', 'bar', 'gauge', 'scorecard', 'status', 'table', 'sparkline'];

function normalizeSensor(sensor) {
  return {
    id: sensor.id || `${sensor.key || 'sensor'}-${Date.now()}`,
    name: sensor.name || sensor.key || 'Unnamed Sensor',
    key: sensor.key || 'sensorKey',
    unit: sensor.unit || '',
    dataType: sensor.dataType || 'number',
    category: sensor.category || 'custom',
    minThreshold: Number.isFinite(Number(sensor.minThreshold)) ? Number(sensor.minThreshold) : 0,
    maxThreshold: Number.isFinite(Number(sensor.maxThreshold)) ? Number(sensor.maxThreshold) : 100,
    warningThreshold: Number.isFinite(Number(sensor.warningThreshold)) ? Number(sensor.warningThreshold) : 70,
    criticalThreshold: Number.isFinite(Number(sensor.criticalThreshold)) ? Number(sensor.criticalThreshold) : 85,
    chartType: CHART_TYPES.includes(sensor.chartType) ? sensor.chartType : 'line',
    enabled: sensor.enabled !== false,
    showInDashboard: Boolean(sensor.showInDashboard),
    showInAnalytics: sensor.showInAnalytics !== false,
    faIcon: sensor.faIcon || '',
    color: sensor.color || ''
  };
}

export function getSensorRegistry() {
  try {
    const scopedKey = getScopedRegistryKey();
    const raw = localStorage.getItem(scopedKey);

    if (!raw) return DEFAULT_SENSORS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_SENSORS;

    const normalizedParsed = parsed
      .map(normalizeSensor)
      .filter((sensor) => !['ph', 'pH'].includes(String(sensor.key || '').trim()));
    const existingByKey = new Set(normalizedParsed.map((sensor) => sensor.key));
    const missingCoreSensors = DEFAULT_SENSORS
      .map(normalizeSensor)
      .filter((sensor) => !existingByKey.has(sensor.key));

    if (missingCoreSensors.length === 0) {
      localStorage.setItem(scopedKey, JSON.stringify(normalizedParsed));
      return normalizedParsed;
    }

    const merged = [...normalizedParsed, ...missingCoreSensors];
    localStorage.setItem(scopedKey, JSON.stringify(merged));
    return merged;
  } catch {
    return DEFAULT_SENSORS;
  }
}

export function saveSensorRegistry(sensors) {
  const normalized = (Array.isArray(sensors) ? sensors : []).map(normalizeSensor);
  localStorage.setItem(getScopedRegistryKey(), JSON.stringify(normalized));
  return normalized;
}

export function upsertSensor(sensor) {
  const list = getSensorRegistry();
  const normalized = normalizeSensor(sensor);
  const idx = list.findIndex(s => s.id === normalized.id || s.key === normalized.key);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...normalized };
  } else {
    list.push(normalized);
  }
  return saveSensorRegistry(list);
}

export function removeSensor(id) {
  const next = getSensorRegistry().filter(s => s.id !== id);
  return saveSensorRegistry(next);
}

export function getAnalyticsSensors() {
  return getSensorRegistry().filter(s => s.enabled && s.showInAnalytics);
}

export function getSensorValue(reading, sensor) {
  if (!reading || !sensor) return null;
  const aliases = {
    pH: ['pH', 'ph'],
    light: ['light', 'lightLevel'],
    flowVolume: ['flowVolume', 'cycleVolumeML', 'waterFlowVolume'],
    flowRate: ['flowRate', 'flowRateMlPerMin', 'waterFlowRate'],
  };

  const keys = aliases[sensor.key] || [sensor.key];
  for (const key of keys) {
    const value = reading[key];
    if (value !== undefined && value !== null && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }
  return null;
}

export function getStatusForValue(sensor, value) {
  // Returns a status object for a sensor reading.
  // NOTE: `color` values are CSS custom property strings (e.g. 'var(--rec-critical)').
  // Components should prefer using the CSS token directly, or resolve it via
  // `getCSSVariableValue()` in JS when a concrete color string is required
  // (for concatenation or drop-shadow usage).
  if (!sensor || value == null || !Number.isFinite(Number(value))) {
    return { level: 'offline', color: 'var(--text-muted)', label: 'No data' };
  }

  const numberValue = Number(value);
  const min = Number(sensor.minThreshold);
  const max = Number(sensor.maxThreshold);
  const warn = Number(sensor.warningThreshold);
  const critical = Number(sensor.criticalThreshold);

  const key = String(sensor.key || sensor.id || '').toLowerCase();
  
  // Specific check for flow sensors to prevent legacy threshold bugs
  if (key.includes('flow')) {
    if (numberValue < min || numberValue > max || numberValue >= critical) {
      return { level: 'critical', color: 'var(--rec-critical)', label: 'Critical' };
    }
    if (numberValue >= warn && warn > 10) {
      return { level: 'warning', color: 'var(--warning-color)', label: 'Attention' };
    }
    return { level: 'normal', color: 'var(--chart-healthy)', label: 'Normal' };
  }

  // Determine direction: lower-bound (e.g. moisture, light) vs upper-bound (e.g. temp, humidity)
  const isLowerBound = critical < warn;

  if (isLowerBound) {
    if (numberValue < critical || numberValue < min || numberValue > max) {
      return { level: 'critical', color: 'var(--rec-critical)', label: 'Critical' };
    }
    if (numberValue < warn) {
      return { level: 'warning', color: 'var(--warning-color)', label: 'Attention' };
    }
  } else {
    if (numberValue > critical || numberValue > max || numberValue < min) {
      return { level: 'critical', color: 'var(--rec-critical)', label: 'Critical' };
    }
    if (numberValue > warn) {
      return { level: 'warning', color: 'var(--warning-color)', label: 'Attention' };
    }
  }

  return { level: 'normal', color: 'var(--chart-healthy)', label: 'Normal' };
}

export { SENSOR_REGISTRY_KEY, CHART_TYPES };
