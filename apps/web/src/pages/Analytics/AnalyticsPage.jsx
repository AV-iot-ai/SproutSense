import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getCSSVariableValue } from '../../utils/colorUtils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ComposedChart
} from 'recharts';
import { aiAPI, sensorAPI, wateringAPI, configAPI } from '../../utils/api';
import { getAnalyticsSensors, getSensorValue, getStatusForValue } from '../../utils/sensorRegistry';
import { isMockEnabled } from '../../services/mockDataService';
import { GlassIcon } from '../../components/bits/GlassIcon';
import styles from './AnalyticsPage.module.css';
import { SkeletonLoader } from '../../components/layout/SkeletonLoader';
import { format } from 'date-fns';

// ─── Constants ────────────────────────────────────────────────────────────────
const TIME_RANGES = [
  { label: '1h',  hours: 1   },
  { label: '24h', hours: 24  },
  { label: '7d',  hours: 168 },
  { label: '30d', hours: 720 },
];

const AVERAGE_SERIES_KEYS = [
  'soilMoisture',
  'temperature',
  'humidity',
  'light',
  'flowVolume',
  'flowRate',
  'pH',
  'vpd',
  'diseaseRisk',
  'et',
  'dli',
];

const getAggregationBucketMs = (hours) => {
  if (hours <= 1) return 5 * 60 * 1000;
  if (hours <= 24) return 60 * 60 * 1000;
  if (hours <= 168) return 6 * 60 * 60 * 1000;
  return 24 * 60 * 60 * 1000;
};

const buildAggregatedSeries = (rows, hours) => {
  if (!Array.isArray(rows) || rows.length <= 1) return rows;

  const bucketMs = getAggregationBucketMs(hours);
  const buckets = new Map();

  rows.forEach((row) => {
    const timestampMs = row.timestampMs || new Date(row.timestamp || Date.now()).getTime();
    const bucketKey = Math.floor(timestampMs / bucketMs);
    if (!buckets.has(bucketKey)) buckets.set(bucketKey, []);
    buckets.get(bucketKey).push({ ...row, timestampMs });
  });

  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, items]) => {
      const aggregate = { ...items[items.length - 1] };

      AVERAGE_SERIES_KEYS.forEach((key) => {
        const values = items
          .map((item) => Number(item[key]))
          .filter((value) => Number.isFinite(value));

        if (values.length) {
          aggregate[key] = values.reduce((sum, value) => sum + value, 0) / values.length;
        }
      });

      aggregate.timestampMs = items[0].timestampMs;
      aggregate.timestamp = new Date(items[0].timestampMs).toISOString();
      aggregate.timeLabel = format(
        new Date(items[0].timestampMs),
        hours <= 24 ? 'HH:mm' : 'MMM d'
      );
      aggregate.sampleCount = items.length;

      return aggregate;
    });
};

// Helper function to get chart colors from CSS variables.
// Charts render inside JS (Recharts) and therefore need concrete color
// strings at runtime — use `getCSSVariableValue()` so themes apply.
const getChartColors = () => ({
  moisture : getCSSVariableValue('--chart-moisture'),
  temp     : getCSSVariableValue('--chart-temp'),
  humidity : getCSSVariableValue('--chart-humidity'),
  light    : getCSSVariableValue('--chart-light'),
  flow     : getCSSVariableValue('--chart-flow'),
  disease  : getCSSVariableValue('--chart-disease'),
  ph       : getCSSVariableValue('--chart-ph'),
  healthy  : getCSSVariableValue('--chart-healthy'),
});

const getChartColorsArray = () => [
  getCSSVariableValue('--chart-moisture'),
  getCSSVariableValue('--chart-temp'),
  getCSSVariableValue('--chart-humidity'),
  getCSSVariableValue('--chart-light'),
  getCSSVariableValue('--chart-flow'),
  getCSSVariableValue('--chart-ph'),
  getCSSVariableValue('--chart-healthy'),
  getCSSVariableValue('--chart-disease')
];

const LOCAL_UI_PREFS_KEY = 'ss_ui_visual_preferences';

function loadVisualPrefs() {
  try {
    const raw = localStorage.getItem(LOCAL_UI_PREFS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function colorForSensor(sensorKey, index = 0, palette = null, chartPalette = null) {
  const defaultPalette = palette || getChartColors();
  const defaultChartPalette = chartPalette || getChartColorsArray();
  
  if (sensorKey?.toLowerCase().includes('moisture')) return defaultPalette.moisture;
  if (sensorKey?.toLowerCase().includes('temp')) return defaultPalette.temp;
  if (sensorKey?.toLowerCase().includes('humid')) return defaultPalette.humidity;
  if (sensorKey?.toLowerCase().includes('light')) return defaultPalette.light;
  if (sensorKey?.toLowerCase().includes('flow')) return defaultPalette.flow;
  if (sensorKey?.toLowerCase().includes('ph')) return defaultPalette.ph;
  return defaultChartPalette[index % defaultChartPalette.length];
}



const containerVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden:  { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.45, ease: 'easeOut' } },
};

function formatTooltipLabel(label) {
  if (typeof label === 'string') return label;
  if (label == null) return 'Unknown time';

  const date = new Date(label);
  if (Number.isNaN(date.getTime())) return 'Unknown time';

  return format(date, 'MMM d, HH:mm');
}

function getSensorValues(rows, sensor) {
  if (!Array.isArray(rows) || !sensor) return [];
  return rows
    .map((row) => getSensorValue(row, sensor))
    .filter((value) => Number.isFinite(value));
}

function summarizeValues(values) {
  if (!values.length) {
    return { min: 0, max: 0, avg: 0, delta: 0 };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
  const delta = values[values.length - 1] - values[0];
  return { min, max, avg, delta };
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  
  // Custom detection for Pie Chart items (which don't have a label/timestamp but do have name/value)
  const isPie = payload[0]?.payload?.name !== undefined && payload[0]?.payload?.value !== undefined && !payload[0]?.payload?.timestamp;
  
  if (isPie) {
    const entry = payload[0];
    const nameStr = String(entry.name || entry.payload.name);
    return (
      <div className={styles.chartTooltip}>
        <p className={styles.tooltipLabel} style={{ textTransform: 'uppercase', fontWeight: 700 }}>
          {nameStr} Status
        </p>
        <p style={{ color: entry.color || entry.fill }}>
          <span className={styles.tooltipDot} style={{ backgroundColor: entry.color || entry.fill }} />
          <strong>Sensors Count:</strong>&nbsp;{entry.value}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.chartTooltip}>
      <p className={styles.tooltipLabel}>
        {formatTooltipLabel(label)}
      </p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color || entry.fill }}>
          <span className={styles.tooltipDot} style={{ backgroundColor: entry.color || entry.fill }} />
          <strong>{entry.name}:</strong>&nbsp;
          {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
          {entry.unit}
        </p>
      ))}
    </div>
  );
};

const WEATHER_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || '';

const weatherIconMap = {
  Clear: '☀️',
  Clouds: '☁️',
  Rain: '🌧️',
  Drizzle: '🌦️',
  Thunderstorm: '⛈️',
  Snow: '❄️',
  Mist: '🌫️',
  Fog: '🌫️',
  Haze: '🌫️',
  default: '🌡️',
};

function WeatherCard() {
  const [weather, setWeather] = useState(null);
  const [wError, setWError] = useState(false);
  const [wCity, setWCity] = useState('Rourkela');

  const fetchWeather = useCallback(async (lat, lon) => {
    if (!WEATHER_KEY) { setWError(true); return; }
    try {
      const url = (lat != null && lon != null)
        ? `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_KEY}`
        : `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(wCity)}&units=metric&appid=${WEATHER_KEY}`;
      const res = await fetch(url, { credentials: 'omit' });
      const data = await res.json();
      if (data.cod !== 200) throw new Error(data.message);
      setWeather(data);
      setWCity(data.name);
    } catch {
      setWError(true);
    }
  }, [wCity]);

  useEffect(() => {
    if (!navigator.geolocation) { fetchWeather(null, null); return; }
    navigator.geolocation.getCurrentPosition(
      pos => fetchWeather(pos.coords.latitude, pos.coords.longitude),
      () => fetchWeather(null, null),
      { timeout: 5000 }
    );
    const id = setInterval(() => fetchWeather(null, null), 12 * 60 * 1000);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const icon = weather ? (weatherIconMap[weather.weather?.[0]?.main] ?? weatherIconMap.default) : '🌡️';

  if (!WEATHER_KEY) {
    return (
      <div className={styles.weatherCard}>
        <span className={styles.weatherEmoji}>🌡️</span>
        <div className={styles.weatherInfo}>
          <span className={styles.weatherCity}>Weather</span>
          <span className={styles.weatherDesc}>Add VITE_OPENWEATHER_API_KEY to .env</span>
        </div>
      </div>
    );
  }

  if (wError) {
    return (
      <div className={styles.weatherCard}>
        <span className={styles.weatherEmoji}>🌡️</span>
        <div className={styles.weatherInfo}>
          <span className={styles.weatherCity}>{wCity}</span>
          <span className={styles.weatherDesc}>Weather unavailable</span>
        </div>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className={styles.weatherCard}>
        <SkeletonLoader width="200px" height="54px" />
      </div>
    );
  }

  return (
    <div className={styles.weatherCard}>
      <span className={styles.weatherEmoji}>{icon}</span>
      <div className={styles.weatherInfo}>
        <span className={styles.weatherTemp}>{Math.round(weather.main.temp)}°C</span>
        <span className={styles.weatherCity}>{wCity}</span>
        <span className={styles.weatherDesc}>{weather.weather?.[0]?.description} · 💧 {weather.main.humidity}%</span>
      </div>
      <div className={styles.weatherExtra}>
        <span>Feels {Math.round(weather.main.feels_like)}°C</span>
        <span>💨 {Math.round((weather.wind?.speed || 0) * 3.6)} km/h</span>
      </div>
    </div>
  );
}

function Sparkline({ data, dataKey, color }) {
  if (!data?.length) return null;
  return (
    <ResponsiveContainer width="100%" height={44}>
      <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`spark-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.35} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#spark-${dataKey})`} dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [loading,       setLoading]       = useState(true);
  const [visualPrefs, setVisualPrefs] = useState(() => loadVisualPrefs());
  
  const [selectedRange, setSelectedRange] = useState(TIME_RANGES[1]);
  const [sensorData,    setSensorData]    = useState([]);
  const [diseaseData,   setDiseaseData]   = useState([]);
  const [wateringData,  setWateringData]  = useState([]);
  const [sensorConfigs, setSensorConfigs] = useState([]);
  const [activeSensorId, setActiveSensorId] = useState('');
  const [kpi, setKpi] = useState({ waterUsed: 0, avgMoisture: 0, diseaseCount: 0, uptime: 0 });
  const [activeFarmingChart, setActiveFarmingChart] = useState('water');
  const [isLive, setIsLive] = useState(false);
  const [lastOnline, setLastOnline] = useState(null);

  useEffect(() => {
    const syncVisualPrefs = () => setVisualPrefs(loadVisualPrefs());
    window.addEventListener('storage', syncVisualPrefs);
    return () => window.removeEventListener('storage', syncVisualPrefs);
  }, []);

  const palette = useMemo(() => {
    const custom = visualPrefs?.colors || {};
    const defaultColors = getChartColors();
    return {
      moisture: custom.moisture || defaultColors.moisture,
      temp: custom.temperature || defaultColors.temp,
      humidity: custom.humidity || defaultColors.humidity,
      light: defaultColors.light,
      flow: defaultColors.flow,
      disease: defaultColors.disease,
      ph: defaultColors.ph,
      healthy: defaultColors.healthy,
    };
  }, [visualPrefs]);

  const chartPalette = useMemo(() => [
    palette.moisture,
    palette.temp,
    palette.humidity,
    palette.light,
    palette.flow,
    palette.ph,
    palette.healthy,
    palette.disease,
  ], [palette]);

  const chartPrefs = useMemo(() => ({
    showGrid: visualPrefs?.charts?.showGrid ?? true,
    animate: visualPrefs?.charts?.animate ?? true,
    lineType: visualPrefs?.charts?.chartStyle === 'straight' ? 'linear' : 'monotone',
  }), [visualPrefs]);

  const viewMode = isLive ? 'realtime' : 'comprehensive';

  // Get selected deviceId from localStorage
  const getSelectedDeviceId = () => localStorage.getItem('selectedDeviceId') || 'ESP32-SENSOR';

  useEffect(() => {
    const loadSensors = () => {
      const configured = getAnalyticsSensors();
      setSensorConfigs(configured);
      if (!configured.some(s => s.id === activeSensorId)) {
        setActiveSensorId(configured[0]?.id || '');
      }
    };

    loadSensors();
    window.addEventListener('storage', loadSensors);
    return () => window.removeEventListener('storage', loadSensors);
  }, [activeSensorId]);

  // ─── Fetch / mock data ──────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    const controller = new AbortController();

    try {
      const end   = new Date();
      const start = new Date(end.getTime() - selectedRange.hours * 3_600_000);
      const deviceId = getSelectedDeviceId();

      let isDeviceOnline = false;
      let statusPayload = null;

      if (isMockEnabled()) {
        isDeviceOnline = true;
        statusPayload = { online: true, lastSeen: new Date().toISOString() };
      } else {
        // When the physical device is online, force live API calls so analytics reads DB-backed data.
        const statusResponse = await configAPI.getStatus(deviceId, {
          signal: controller.signal,
          forceLive: true,
        });
        statusPayload = statusResponse?.data || statusResponse;
        const lastSeenMs = statusPayload?.lastSeen ? new Date(statusPayload.lastSeen).getTime() : 0;
        isDeviceOnline = Boolean(statusPayload?.online) && Number.isFinite(lastSeenMs) && (Date.now() - lastSeenMs < 5 * 60 * 1000);
      }

      setIsLive(isDeviceOnline);
      setLastOnline(statusPayload?.lastSeen || null);

      const requestOptions = {
        signal: controller.signal,
        forceLive: isMockEnabled() ? false : isDeviceOnline,
      };

      const [sensorResp, diseaseResp, wateringResp] = await Promise.all([
        sensorAPI.getHistory(start.toISOString(), end.toISOString(), deviceId, requestOptions),
        aiAPI.getDiseaseDetections({ startDate: start.toISOString(), endDate: end.toISOString(), deviceId }, requestOptions),
        wateringAPI.getLogs(500, deviceId, requestOptions),
      ]);

      let sensors = [];
      if (sensorResp) {
        if (Array.isArray(sensorResp)) {
          sensors = sensorResp;
        } else if (Array.isArray(sensorResp.readings)) {
          sensors = sensorResp.readings;
        } else if (Array.isArray(sensorResp.data)) {
          sensors = sensorResp.data;
        }
      }

      const diseases  = diseaseResp?.detections || diseaseResp?.data?.detections || [];

      let waterLogs = [];
      if (wateringResp) {
        if (Array.isArray(wateringResp)) {
          waterLogs = wateringResp;
        } else if (Array.isArray(wateringResp.history)) {
          waterLogs = wateringResp.history;
        } else if (Array.isArray(wateringResp.data)) {
          waterLogs = wateringResp.data;
        }
      }

      const parsed = sensors.map(s => ({
        ...s,
        soilMoisture: s.soilMoisture ?? s.moisture ?? 0,
        light       : s.light ?? s.lightIntensity ?? 0,
        flowVolume  : s.flowVolume ?? s.cycleVolumeML ?? s.waterFlowVolume ?? 0,
        flowRate    : s.flowRate   ?? s.flowRateMlPerMin ?? s.waterFlowRate ?? 0,
        pH          : s.pH ?? s.ph ?? 7.0,
        timestamp   : s.timestamp ?? new Date().toISOString(),
        timestampMs : new Date(s.timestamp ?? Date.now()).getTime(),
      })).sort((a, b) => a.timestampMs - b.timestampMs);

      setSensorData(parsed);
      setDiseaseData(diseases);
      setWateringData(waterLogs);

      const avgMoisture      = parsed.length ? parsed.reduce((a, c) => a + (c.soilMoisture || 0), 0) / parsed.length : 0;
      const totalWater       = parsed.reduce((a, c) => a + (c.flowVolume || 0), 0);
      const expectedPayloads = (selectedRange.hours * 3600) / 15; // Assuming payload every 15s
      const uptimeCalc       = parsed.length > 0 ? Math.min(100, (parsed.length / expectedPayloads) * 100) : 0;

      setKpi({
        waterUsed   : totalWater,
        avgMoisture,
        diseaseCount: diseases.length,
        uptime      : uptimeCalc.toFixed(1),
      });

    } catch (e) {
      if (e.name !== 'CanceledError' && e.message !== 'canceled') {
        console.warn('[AnalyticsPage] API failed: ', e);
      }
    } finally {
      setLoading(false);
    }

    return () => controller.abort();
  }, [selectedRange]);

  useEffect(() => {
    const handleStorage = () => {
      fetchData();
    };
    window.addEventListener('storage', handleStorage);
    const cleanup = fetchData();
    return () => {
      window.removeEventListener('storage', handleStorage);
      cleanup.then(c => c && c());
    };
  }, [fetchData]);

  // ─── Derived / memoised data ────────────────────────────────────────────────
  const timeFormattedData = useMemo(() => sensorData.map(d => {
    const temp = d.temperature || 25;
    const humidity = d.humidity || 50;
    const light = d.light || 0;
    
    // Derived farming metrics
    const es = 0.6108 * Math.exp((17.27 * temp) / (temp + 237.3));
    const ea = es * (humidity / 100);
    const vpd = es - ea;
    const diseaseRisk = Math.min(100, Math.max(0, (humidity > 60 ? (humidity - 60) * 1.5 : 0) + (temp > 20 && temp < 30 ? 10 : 0)));
    const et = Math.max(0, (vpd * 0.3) + (light * 0.0005));
    const dli = (light / 1000) * 2.5;

    return {
      ...d,
      vpd: Number(vpd.toFixed(2)),
      diseaseRisk: Number(diseaseRisk.toFixed(1)),
      et: Number(et.toFixed(2)),
      dli: Number(dli.toFixed(2)),
      timeLabel: format(
        new Date(d.timestamp),
        selectedRange.hours <= 24 ? 'HH:mm' : 'MMM d'
      ),
    };
  }), [sensorData, selectedRange]);

  const analyticsViewData = useMemo(() => {
    if (viewMode === 'realtime') return timeFormattedData;
    return buildAggregatedSeries(timeFormattedData, selectedRange.hours);
  }, [timeFormattedData, selectedRange.hours, viewMode]);

  // Thin-out for 30d to prevent chart clutter
  const chartData = useMemo(() => {
    if (analyticsViewData.length <= 200) return analyticsViewData;
    const step = Math.ceil(analyticsViewData.length / 200);
    return analyticsViewData.filter((_, i) => i % step === 0);
  }, [analyticsViewData]);

  const selectedSensor = useMemo(() => {
    if (!sensorConfigs.length) return null;
    return sensorConfigs.find(s => s.id === activeSensorId) || sensorConfigs[0];
  }, [sensorConfigs, activeSensorId]);

  const selectedSeries = useMemo(() => {
    if (!selectedSensor) {
      return { key: 'soilMoisture', label: 'Sensor', unit: '', color: palette.moisture, chartType: 'line' };
    }
    return {
      key: selectedSensor.key,
      label: selectedSensor.name,
      unit: selectedSensor.unit || '',
      color: colorForSensor(selectedSensor.key, sensorConfigs.findIndex(s => s.id === selectedSensor.id), palette, chartPalette),
      chartType: selectedSensor.chartType || 'line',
    };
  }, [selectedSensor, sensorConfigs, palette, chartPalette]);

  const rawSensorValues = useMemo(
    () => getSensorValues(timeFormattedData, selectedSensor),
    [timeFormattedData, selectedSensor]
  );

  const displayedSensorValues = useMemo(
    () => getSensorValues(chartData, selectedSensor),
    [chartData, selectedSensor]
  );

  const trendStats = useMemo(() => {
    return viewMode === 'realtime'
      ? summarizeValues(displayedSensorValues)
      : summarizeValues(rawSensorValues);
  }, [displayedSensorValues, rawSensorValues, viewMode]);

  const currentSensorValue = useMemo(() => {
    if (!selectedSensor) return null;

    if (viewMode === 'realtime') {
      return rawSensorValues.length ? rawSensorValues[rawSensorValues.length - 1] : null;
    }

    return rawSensorValues.length
      ? rawSensorValues.reduce((sum, value) => sum + value, 0) / rawSensorValues.length
      : null;
  }, [rawSensorValues, selectedSensor, viewMode]);

  const selectedSensorStatus = useMemo(
    () => getStatusForValue(selectedSensor, currentSensorValue),
    [selectedSensor, currentSensorValue]
  );

  const sensorAnomalyCount = useMemo(() => {
    if (!selectedSensor) return 0;
    const sourceValues = viewMode === 'realtime' ? displayedSensorValues : rawSensorValues;
    return sourceValues.reduce((count, value) => {
      const outOfRange = value < Number(selectedSensor.minThreshold) || value > Number(selectedSensor.maxThreshold);
      return outOfRange ? count + 1 : count;
    }, 0);
  }, [displayedSensorValues, rawSensorValues, selectedSensor, viewMode]);

  // Soil status distribution for pie
  const soilPie = useMemo(() => {
    const optimal = chartData.filter(d => d.soilMoisture > 40 && d.soilMoisture < 80).length;
    const dry     = chartData.filter(d => d.soilMoisture <= 40).length;
    const wet     = chartData.filter(d => d.soilMoisture >= 80).length;
    return [
      { name: 'Optimal', value: optimal },
      { name: 'Dry',     value: dry     },
      { name: 'Wet',     value: wet     },
    ].filter(d => d.value > 0);
  }, [chartData]);

  // Radar — latest reading
  const radarData = useMemo(() => {
    if (!analyticsViewData.length) return [];
    const l = analyticsViewData[analyticsViewData.length - 1];
    return [
      { subject: 'Moisture', A: l.soilMoisture || 0,                              fullMark: 100 },
      { subject: 'pH',       A: Math.min(100, ((l.pH || 7) / 14) * 100),          fullMark: 100 },
      { subject: 'Light',    A: Math.min(100, ((l.light || 0) / 2000) * 100),     fullMark: 100 },
      { subject: 'Temp',     A: Math.min(100, ((l.temperature || 0) / 50) * 100), fullMark: 100 },
      { subject: 'Humidity', A: l.humidity || 0,                                  fullMark: 100 },
    ];
  }, [analyticsViewData]);

  // Last 30 points for sparklines
  const sparkTail = chartData.slice(-30);

  // KPI card definitions
  const kpiItems = [
    {
      icon : 'pump',
      label: 'Water Used',
      value: `${(kpi.waterUsed / 1000).toFixed(2)} L`,
      color: palette.flow,
      spark: { data: sparkTail, key: 'flowVolume' },
    },
    {
      icon : 'humidity',
      label: 'Avg Moisture',
      value: `${Math.round(kpi.avgMoisture)}%`,
      color: palette.moisture,
      spark: { data: sparkTail, key: 'soilMoisture' },
    },
    {
      icon  : 'warning',
      label : 'Disease Events',
      value : kpi.diseaseCount,
      color : kpi.diseaseCount > 0 ? palette.disease : palette.healthy,
      danger: kpi.diseaseCount > 0,
      spark : null,
    },
    {
      icon : 'activity',
      label: 'Sensor Uptime',
      value: `${kpi.uptime}%`,
      color: '#14b8a6',
      live : true,
      spark: { data: sparkTail, key: 'temperature' },
    },
  ];

  const selectedSeriesData = useMemo(() => {
    if (!selectedSensor) return [];
    return chartData
      .map(item => ({ ...item, metricValue: getSensorValue(item, selectedSensor) }))
      .filter(item => item.metricValue != null);
  }, [chartData, selectedSensor]);

  const recommendation = useMemo(() => {
    if (!selectedSensor) return 'No configured sensor available for analytics.';
    if (selectedSensorStatus.level === 'critical') {
      return `Critical reading detected for ${selectedSensor.name}. Investigate irrigation, sensor calibration, or environment controls immediately.`;
    }
    if (selectedSensorStatus.level === 'warning') {
      return `${selectedSensor.name} is near threshold limits. Monitor closely and prepare a corrective action if the trend continues.`;
    }
    if (Math.abs(trendStats.delta) > (Number(selectedSensor.warningThreshold || 1) * 0.25)) {
      return `${selectedSensor.name} is trending ${trendStats.delta > 0 ? 'upward' : 'downward'} quickly. Consider adjusting schedules or setpoints.`;
    }
    return `${selectedSensor.name} is stable in the normal operating band. Continue standard monitoring cadence.`;
  }, [selectedSensor, selectedSensorStatus, trendStats]);

  const renderDynamicSensorChart = () => {
    if (!selectedSensor || selectedSeriesData.length === 0) {
      return <p className={styles.emptyMsg}>No readings available for selected sensor.</p>;
    }

    const unitSuffix = selectedSeries.unit ? ` ${selectedSeries.unit}` : '';

    if (selectedSeries.chartType === 'bar') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={selectedSeriesData}>
            {chartPrefs.showGrid && <CartesianGrid strokeDasharray="3 3" stroke={getCSSVariableValue('--divider-color') || 'rgba(255,255,255,0.05)'} vertical={false} />}
            <XAxis dataKey="timeLabel" stroke={getCSSVariableValue('--text-muted') || 'rgba(255,255,255,0.35)'} fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke={getCSSVariableValue('--text-muted') || 'rgba(255,255,255,0.35)'} fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="metricValue" name={selectedSeries.label} fill={selectedSeries.color} radius={[6, 6, 0, 0]} unit={unitSuffix} isAnimationActive={chartPrefs.animate} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (selectedSeries.chartType === 'gauge' || selectedSeries.chartType === 'scorecard' || selectedSeries.chartType === 'status') {
      const min = Number(selectedSensor.minThreshold || 0);
      const max = Number(selectedSensor.maxThreshold || 100);
      const value = Number(currentSensorValue ?? 0);
      const normalized = Math.max(0, Math.min(100, ((value - min) / Math.max(1, max - min)) * 100));
      return (
        <div className={styles.statusPanel}>
          <div className={styles.statusValue} style={{ color: selectedSensorStatus.color }}>
            {value.toFixed(1)}{unitSuffix}
          </div>
          <div className={styles.statusBarTrack}>
            <div className={styles.statusBarFill} style={{ width: `${normalized}%`, background: selectedSensorStatus.color }} />
          </div>
          <div className={styles.statusMeta}>
            <span>Min {min}</span>
            <span>Status: {selectedSensorStatus.label}</span>
            <span>Max {max}</span>
          </div>
        </div>
      );
    }

    if (selectedSeries.chartType === 'table') {
      const tail = selectedSeriesData.slice(-10).reverse();
      return (
        <div className={styles.tableWrap}>
          <table className={styles.metricTable}>
            <thead>
              <tr><th>Time</th><th>{selectedSeries.label}</th></tr>
            </thead>
            <tbody>
              {tail.map((row) => (
                <tr key={row.timestamp}>
                  <td>{row.timeLabel}</td>
                  <td>{Number(row.metricValue).toFixed(2)}{unitSuffix}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (selectedSeries.chartType === 'sparkline') {
      return <Sparkline data={selectedSeriesData.slice(-50)} dataKey="metricValue" color={selectedSeries.color} />;
    }

    if (selectedSeries.chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={selectedSeriesData}>
            {chartPrefs.showGrid && <CartesianGrid strokeDasharray="3 3" stroke={getCSSVariableValue('--divider-color') || 'rgba(255,255,255,0.05)'} vertical={false} />}
            <XAxis dataKey="timeLabel" stroke={getCSSVariableValue('--text-muted') || 'rgba(255,255,255,0.35)'} fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke={getCSSVariableValue('--text-muted') || 'rgba(255,255,255,0.35)'} fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line type={chartPrefs.lineType} dataKey="metricValue" name={selectedSeries.label} stroke={selectedSeries.color} strokeWidth={2.7} dot={false} unit={unitSuffix} isAnimationActive={chartPrefs.animate} />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={selectedSeriesData}>
          <defs>
            <linearGradient id="gradActiveSensor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={selectedSeries.color} stopOpacity={0.28} />
              <stop offset="95%" stopColor={selectedSeries.color} stopOpacity={0} />
            </linearGradient>
          </defs>
            {chartPrefs.showGrid && <CartesianGrid strokeDasharray="3 3" stroke={getCSSVariableValue('--divider-color') || 'rgba(255,255,255,0.05)'} vertical={false} />}
            <XAxis dataKey="timeLabel" stroke={getCSSVariableValue('--text-muted') || 'rgba(255,255,255,0.35)'} fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke={getCSSVariableValue('--text-muted') || 'rgba(255,255,255,0.35)'} fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Area type={chartPrefs.lineType} dataKey="metricValue" name={selectedSeries.label} stroke={selectedSeries.color} strokeWidth={2.7} fill="url(#gradActiveSensor)" dot={false} unit={unitSuffix} isAnimationActive={chartPrefs.animate} />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <motion.div
      className={styles.analyticsContainer}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <WeatherCard />
          <div className={styles.headerActions}>
            <div className={styles.controls}>
              {TIME_RANGES.map(tr => (
                <button
                  key={tr.label}
                  className={`${styles.timeRangeBtn} ${selectedRange.label === tr.label ? styles.active : ''}`}
                  onClick={() => setSelectedRange(tr)}
                >
                  {tr.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bento Grid ── */}
      <div className={styles.bentoGrid}>
        {/* KPI Row */}
        {kpiItems.map((item, idx) => (
          <motion.div
            key={idx}
            className={`${styles.kpiCard} ${styles.bentoKpi} ${item.danger ? styles.kpiDanger : ''}`}
            variants={itemVariants}
            whileHover={{ y: -4, scale: 1.015 }}
          >
            <div className={styles.kpiHeader}>
              <div className={styles.kpiHeaderLeft}>
                <GlassIcon name={item.icon} className={styles.kpiIcon} />
                <span>{item.label}</span>
              </div>
              {item.live && <span className={styles.liveIndicator} />}
            </div>

            <div
              className={`${styles.kpiValue} ${item.danger ? styles.danger : ''}`}
              style={{ color: item.color }}
            >
              {loading ? <SkeletonLoader width="80px" height="32px" /> : item.value}
            </div>

            {item.spark && !loading && (
              <Sparkline data={item.spark.data} dataKey={item.spark.key} color={item.color} />
            )}
          </motion.div>
        ))}

        {/* ── Dynamic Sensor Analytics ── */}
        <motion.div className={`${styles.chartCardWide} ${styles.bentoChartMain}`} variants={itemVariants}>
          <div className={styles.chartHeader}>
            <div>
              <h3 className={styles.chartTitle}>Sensor Analysis</h3>
              <p className={styles.chartSubtitle}>
                {viewMode === 'realtime'
                  ? 'Live readings and thresholds are driven by Admin sensor configuration'
                  : 'Offline or comprehensive view uses averaged readings from collected sensor data'}
              </p>
            </div>
            <div className={styles.sensorSwitcher}>
              {sensorConfigs.map((sensor, index) => {
                const color = colorForSensor(sensor.key, index, palette, chartPalette);
                return (
                  <button
                    key={sensor.id}
                    className={`${styles.sensorSwitchBtn} ${activeSensorId === sensor.id ? styles.activeSensorBtn : ''}`}
                    onClick={() => setActiveSensorId(sensor.id)}
                    style={activeSensorId === sensor.id ? { borderColor: color, color } : undefined}
                  >
                    {sensor.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.chartWrapper}>
            {loading ? <SkeletonLoader height="100%" /> : renderDynamicSensorChart()}
          </div>

          {!loading && selectedSensor && (
            <>
              <div className={styles.sensorStatsRow}>
                <div className={styles.sensorStatTile}><span>{viewMode === 'comprehensive' ? 'Average' : 'Current'}</span><strong>{currentSensorValue != null ? `${currentSensorValue.toFixed(1)} ${selectedSeries.unit}` : '--'}</strong></div>
                <div className={styles.sensorStatTile}><span>Status</span><strong style={{ color: selectedSensorStatus.color }}>{selectedSensorStatus.label}</strong></div>
                <div className={styles.sensorStatTile}><span>Anomalies</span><strong>{sensorAnomalyCount}</strong></div>
                <div className={styles.sensorStatTile}><span>Net Trend</span><strong className={trendStats.delta >= 0 ? styles.positiveTrend : styles.negativeTrend}>{trendStats.delta >= 0 ? '+' : ''}{trendStats.delta.toFixed(1)} {selectedSeries.unit}</strong></div>
              </div>

              <div className={styles.insightRow}>
                <div className={styles.insightCard}>
                  <h4>Thresholds</h4>
                  <p>Min {selectedSensor.minThreshold} · Warn {selectedSensor.warningThreshold} · Critical {selectedSensor.criticalThreshold} · Max {selectedSensor.maxThreshold}</p>
                </div>
                <div className={styles.insightCard}>
                  <h4>Recommendation</h4>
                  <p>{recommendation}</p>
                </div>
              </div>
            </>
          )}
        </motion.div>

        <motion.div className={`${styles.chartCardNarrow} ${styles.bentoChartSide}`} variants={itemVariants}>
          <div className={styles.chartHeader}>
            <div>
              <h3 className={styles.chartTitle}>Sensor Coverage</h3>
              <p className={styles.chartSubtitle}>Enabled analytics sensors by status</p>
            </div>
          </div>
          <div className={styles.chartWrapperCenter}>
            {sensorConfigs.length === 0 ? (
              <p className={styles.emptyMsg}>No analytics sensors configured.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sensorConfigs.reduce((acc, sensor, idx) => {
                      const value = sensorData.length ? getSensorValue(sensorData[sensorData.length - 1], sensor) : null;
                      const level = getStatusForValue(sensor, value).level;
                      const existing = acc.find((item) => item.name === level);
                      if (existing) existing.value += 1;
                      else acc.push({
                        name: level,
                        value: 1,
                        color: level === 'critical'
                          ? palette.disease
                          : level === 'warning'
                            ? palette.temp
                            : level === 'normal'
                              ? palette.healthy
                              : '#94a3b8',
                      });
                      return acc;
                    }, [])}
                    cx="50%"
                    cy="50%"
                    innerRadius="40%"
                    outerRadius="66%"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, value }) => `${name} ${value}`}
                    labelLine={false}
                  >
                    {sensorConfigs
                      .reduce((acc, sensor) => {
                        const value = sensorData.length ? getSensorValue(sensorData[sensorData.length - 1], sensor) : null;
                        const level = getStatusForValue(sensor, value).level;
                        const existing = acc.find((item) => item.name === level);
                        if (existing) existing.value += 1;
                        else acc.push({
                          name: level,
                          value: 1,
                          color: level === 'critical'
                            ? palette.disease
                            : level === 'warning'
                              ? palette.temp
                              : level === 'normal'
                                ? palette.healthy
                                : '#94a3b8',
                        });
                        return acc;
                      }, [])
                      .map((entry, i) => <Cell key={`${entry.name}-${i}`} fill={entry.color} name={entry.name} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>
        {/* ── Advanced Farming Analytics ── */}
        <motion.div className={`${styles.chartCardWide} ${styles.bentoChartFull}`} variants={itemVariants}>
          <div className={styles.chartHeader}>
            <div>
              <h3 className={styles.chartTitle}>Advanced Farming Analytics</h3>
              <p className={styles.chartSubtitle}>Derived metrics and crop stage</p>
            </div>
            <div className={styles.sensorSwitcher}>
              {[
                { id: 'water', label: 'Water' },
                { id: 'vpd', label: 'VPD' },
                { id: 'disease', label: 'Disease' },
                { id: 'dli', label: 'DLI' },
                { id: 'et', label: 'ET Rate' },
                { id: 'growth', label: 'Growth' }
              ].map(tab => (
                <button
                  key={tab.id}
                  className={`${styles.sensorSwitchBtn} ${activeFarmingChart === tab.id ? styles.activeSensorBtn : ''}`}
                  onClick={() => setActiveFarmingChart(tab.id)}
                  style={activeFarmingChart === tab.id ? { borderColor: palette.healthy, color: palette.healthy } : undefined}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.chartWrapper}>
            {activeFarmingChart === 'water' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  {chartPrefs.showGrid && <CartesianGrid strokeDasharray="3 3" stroke={getCSSVariableValue('--divider-color') || 'rgba(255,255,255,0.05)'} vertical={false} />}
                  <XAxis dataKey="timeLabel" stroke={getCSSVariableValue('--text-muted') || 'rgba(255,255,255,0.35)'} fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke={getCSSVariableValue('--text-muted') || 'rgba(255,255,255,0.35)'} fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="flowVolume" name="Water Used" fill={palette.flow} radius={[4, 4, 0, 0]} unit=" L" isAnimationActive={chartPrefs.animate} />
                </BarChart>
              </ResponsiveContainer>
            )}

            {activeFarmingChart === 'vpd' && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="gradVpd" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={palette.temp} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={palette.temp} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  {chartPrefs.showGrid && <CartesianGrid strokeDasharray="3 3" stroke={getCSSVariableValue('--divider-color') || 'rgba(255,255,255,0.05)'} vertical={false} />}
                  <XAxis dataKey="timeLabel" stroke={getCSSVariableValue('--text-muted') || 'rgba(255,255,255,0.35)'} fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke={getCSSVariableValue('--text-muted') || 'rgba(255,255,255,0.35)'} fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="vpd" name="VPD" stroke={palette.temp} strokeWidth={2} fill="url(#gradVpd)" unit=" kPa" isAnimationActive={chartPrefs.animate} />
                </AreaChart>
              </ResponsiveContainer>
            )}

            {activeFarmingChart === 'disease' && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  {chartPrefs.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />}
                  <XAxis dataKey="timeLabel" stroke="rgba(255,255,255,0.35)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.35)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="diseaseRisk" name="Risk Level" stroke={palette.disease} strokeWidth={2} dot={false} unit="%" isAnimationActive={chartPrefs.animate} />
                </LineChart>
              </ResponsiveContainer>
            )}

            {activeFarmingChart === 'dli' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  {chartPrefs.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />}
                  <XAxis dataKey="timeLabel" stroke="rgba(255,255,255,0.35)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.35)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="dli" name="DLI" fill={palette.light} radius={[4, 4, 0, 0]} unit=" mol" isAnimationActive={chartPrefs.animate} />
                </BarChart>
              </ResponsiveContainer>
            )}

            {activeFarmingChart === 'et' && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="gradEt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={palette.healthy} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={palette.healthy} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  {chartPrefs.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />}
                  <XAxis dataKey="timeLabel" stroke="rgba(255,255,255,0.35)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.35)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="et" name="ET Rate" stroke={palette.healthy} strokeWidth={2} fill="url(#gradEt)" unit=" mm" isAnimationActive={chartPrefs.animate} />
                </AreaChart>
              </ResponsiveContainer>
            )}

            {activeFarmingChart === 'growth' && (
              <div className={styles.chartWrapperCenter} style={{ flexDirection: 'column', gap: '1.5rem', height: '100%', justifyContent: 'center' }}>
                <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <span>Seedling</span>
                  <span>Vegetative</span>
                  <span style={{ color: palette.healthy, fontWeight: 'bold' }}>Flowering</span>
                  <span>Fruiting</span>
                  <span>Harvest</span>
                </div>
                <div className={styles.statusBarTrack} style={{ width: '100%', height: '24px' }}>
                  <div className={styles.statusBarFill} style={{ width: '60%', background: `linear-gradient(90deg, ${palette.moisture}, ${palette.healthy})` }} />
                </div>
                <p className={styles.emptyMsg} style={{ marginTop: '0.5rem', fontSize: '1rem' }}>Current Stage: Flowering (Est. 12 days to fruiting)</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>{/* end .bentoGrid */}

      {/* ── System Status Footer ── */}
      <div className={styles.statusFooter}>
        <div className={styles.statusIndicatorWrap}>
          <div className={`${styles.statusDot} ${isLive ? styles.dotLive : styles.dotOffline}`} />
          <span className={styles.statusText}>
            {isLive ? (
              viewMode === 'realtime'
                ? 'SYSTEM_STATUS: REAL-TIME_STREAMING'
                : 'SYSTEM_STATUS: COMPREHENSIVE_AVERAGE_VIEW'
            ) : (
              `SYSTEM_STATUS: CALCULATED_AVERAGE_VIEW (Last Seen: ${lastOnline ? format(new Date(lastOnline), 'MMM d, HH:mm') : 'Unknown'})`
            )}
          </span>
        </div>
        <div className={styles.statusMeta}>
          <span>SS-PROTOCOL-V9</span>
          <span className={styles.divider}>|</span>
          <span>ENCRYPTED_LINK</span>
        </div>
      </div>

    </motion.div>
  );
}   