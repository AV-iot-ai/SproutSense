/**
 * SettingsPage.jsx
 * Client-facing settings page that combines configuration and preferences.
 */
import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import './SettingsPage.css';
import { configAPI, sensorAPI, deviceAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import BleProvisioning from '../../components/BleProvisioning';
import DataTools from '../../components/DataTools';

/* ──── Inline SVG icons ───────────────────────────────────────── */
const SVG = {
  gear:        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  palette:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>,
  moon:        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>,
  sun:         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  flask:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6M9 3v8l-4.5 9A1 1 0 005.4 21h13.2a1 1 0 00.9-1.5L15 11V3"/></svg>,
  warning:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  chip:        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="6" height="6"/><path d="M15 2v3M9 2v3M15 19v3M9 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/><rect x="3" y="3" width="18" height="18" rx="2"/></svg>,
  wifi:        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0"/><line x1="12" y1="20" x2="12.01" y2="20" strokeWidth="3"/></svg>,
  hash:        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>,
  timer:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M9 2h6M12 2v3"/></svg>,
  calendar:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  download:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  trash:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
  database:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
  check:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  spinner:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{animation:'sp-spin 0.8s linear infinite',display:'block'}}><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity="0.2"/><path d="M21 12a9 9 0 00-9-9"/></svg>,
  robot:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M12 2a3 3 0 00-3 3v6h6V5a3 3 0 00-3-3z"/><line x1="8" y1="16" x2="8.01" y2="16" strokeWidth="3"/><line x1="16" y1="16" x2="16.01" y2="16" strokeWidth="3"/><line x1="12" y1="11" x2="12" y2="11" strokeWidth="3"/></svg>,
  lock:        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
  key:         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
  cloud:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/></svg>,
  eye:         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  eyeOff:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  user:        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21a8 8 0 10-16 0"/><circle cx="12" cy="7" r="4"/></svg>,
  save:        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  bell:        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  droplet:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>,
  thermometer: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z"/></svg>,
  beaker:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6M9 3v8l-4.5 9A1 1 0 005.4 21h13.2a1 1 0 00.9-1.5L15 11V3"/><path d="M8 16.5h8"/></svg>,
  broadcast:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 010 10.72M5.64 6.64a9 9 0 000 10.72"/><path d="M15.54 9.46a5 5 0 010 5.08M8.46 9.46a5 5 0 000 5.08"/><line x1="12" y1="12" x2="12.01" y2="12" strokeWidth="3"/></svg>,
  info:        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  seedling:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22V12M12 12C12 6 6 3 3 3c0 3 1 9 9 9M12 12c0-6 6-9 9-9 0 3-1 9-9 9"/></svg>,
  cpu:         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>,
  branch:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 01-9 9"/></svg>,
  activity:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  layers:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
};

function Icon({ name, size = 16, className = '' }) {
  return (
    <span className={`sp-icon ${className}`} style={{ width: size, height: size }} aria-hidden="true">
      {SVG[name]}
    </span>
  );
}

/* Icon box with accent class */
function CardIcon({ name, accent }) {
  return (
    <span className={`sp-card-head-icon ${accent}`}>
      <Icon name={name} size={15} />
    </span>
  );
}

/* Section tab IDs */
const TABS = [
  { id: 'profile',    icon: 'user', label: 'Profile' },
  { id: 'appearance', icon: 'palette', label: 'Appearance' },
  { id: 'irrigation', icon: 'droplet', label: 'Irrigation' },
  { id: 'plants',     icon: 'seedling', label: 'Plant Type' },
  { id: 'devices',    icon: 'chip', label: 'Devices' },
  { id: 'data',       icon: 'database',label: 'Data Tools' },
  { id: 'alerts',     icon: 'bell',    label: 'Alerts'     },
  { id: 'about',      icon: 'info',    label: 'About'      },
];

const PLANT_OPTIONS = [
  { key: 'tomato', label: 'Tomato', available: true },
  { key: 'potato', label: 'Potato', available: false },
  { key: 'pepper_bell', label: 'Pepper (Bell)', available: false },
  { key: 'maize', label: 'Maize (Corn)', available: false },
  { key: 'grape', label: 'Grape', available: false },
  { key: 'apple', label: 'Apple', available: false },
  { key: 'peach', label: 'Peach', available: false },
  { key: 'strawberry', label: 'Strawberry', available: false },
];

const QUICK_DEVICES = [
  { model: 'ESP32-SENSOR', displayName: 'Environmental Sensor Node' },
  { model: 'ESP32-CAM', displayName: 'Disease Detection Camera' },
];

const LOCAL_UI_PREFS_KEY = 'ss_ui_visual_preferences';
const DEFAULT_NOTIFICATIONS = {
  lowMoisture: true,
  highTemp: true,
  phAlert: true,
  systemAlerts: true,
};

const DEFAULT_ADVANCED_SETTINGS = {
  irrigation: {
    autoMode: false,
    moistureThreshold: 30,
    maxCyclesPerHour: 4,
    maxCyclesPerDay: 6,
    wateringDurationSec: 10,
  },
  charts: {
    chartStyle: 'smooth',
    showGrid: true,
    animate: true,
  },
  colors: {
    accent: '#22d3ee',
    moisture: '#22c55e',
    temperature: '#f97316',
    humidity: '#22d3ee',
  },
  dashboard: {
    sensors: true,
    analytics: true,
    controls: true,
    alerts: true,
    showAlertBadge: true,
    showStatusDots: true,
    showSystemStatusPanel: true,
  },
};

export default function SettingsPage({
  theme,
  setTheme,
  palette,
  setPalette,
  toggleTheme,
  onNotification,
}) {
  const { user, updateProfile } = useAuth();
  const [activeTab,       setActiveTab]       = useState('profile');
  const [preferredPlant, setPreferredPlant] = useState(user?.preferredPlant || 'tomato');
  const [savingPlant, setSavingPlant] = useState(false);
  const [notifications,   setNotifications]   = useState(DEFAULT_NOTIFICATIONS);
  const [stats, setStats] = useState({
    totalReadings: 0,
    todayReadings: 0,
    lastUpdate: null,
  });
  const [pairingForm, setPairingForm] = useState({
    pairingKey: '',
    deviceModel: 'ESP32-SENSOR',
    displayName: '',
  });
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(() => {
    return localStorage.getItem('selectedDeviceId') || '';
  });
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [pairingDevice, setPairingDevice] = useState(false);
  const [rotatingDeviceId, setRotatingDeviceId] = useState('');
  const [unpairingDeviceId, setUnpairingDeviceId] = useState('');
  const [rotatedTokens, setRotatedTokens] = useState({});
  const [exporting, setExporting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [latestRaw, setLatestRaw] = useState(null);
  const [loadingLatestRaw, setLoadingLatestRaw] = useState(false);
  const [advancedSettings, setAdvancedSettings] = useState(DEFAULT_ADVANCED_SETTINGS);
  const [savingAdvanced, setSavingAdvanced] = useState(false);

  const sectionRefs = {
    profile:   useRef(null),
    appearance: useRef(null),
    irrigation: useRef(null),
    plants:     useRef(null),
    devices:    useRef(null),
    data:       useRef(null),
    alerts:     useRef(null),
    about:      useRef(null),
  };

  useEffect(() => {
    setPreferredPlant(user?.preferredPlant || 'tomato');
  }, [user?.preferredPlant]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const historyRes = await sensorAPI.getHistory(24);
        const readings = Array.isArray(historyRes)
          ? historyRes
          : Array.isArray(historyRes?.data)
            ? historyRes.data
            : [];
        const today = new Date().toDateString();
        setStats({
          totalReadings: readings.length,
          todayReadings: readings.filter(r => new Date(r.timestamp).toDateString() === today).length,
          lastUpdate: readings[0]?.timestamp || null,
        });
      } catch {
        setStats({ totalReadings: 0, todayReadings: 0, lastUpdate: null });
      }
    };

    loadStats();
  }, []);

  const loadDevices = async () => {
    setLoadingDevices(true);
    try {
      const res = await deviceAPI.listMine();
      const list = Array.isArray(res?.devices) ? res.devices : [];
      setDevices(list);
      // If no device selected, default to first device
      if (!selectedDeviceId && list.length > 0) {
        setSelectedDeviceId(list[0].deviceId);
        localStorage.setItem('selectedDeviceId', list[0].deviceId);
      }
    } catch {
      setDevices([]);
      onNotification?.('Unable to load your devices', 'error');
    } finally {
      setLoadingDevices(false);
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  useEffect(() => {
    // load latest raw payload when device selection changes
    loadLatestRaw(selectedDeviceId);
  }, [selectedDeviceId]);

  async function loadLatestRaw(deviceIdParam) {
    try {
      setLoadingLatestRaw(true);
      const dev = deviceIdParam || selectedDeviceId || 'ESP32-SENSOR';
      const res = await sensorAPI.getLatest(dev).catch(() => null);
      const payload = res?.data || res || null;
      setLatestRaw(payload);
    } catch {
      setLatestRaw(null);
      onNotification?.('Failed to load latest payload', 'error');
    } finally {
      setLoadingLatestRaw(false);
    }
  }

  const applyAdvancedColors = (colors) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.style.setProperty('--plant-cyan', colors.accent || DEFAULT_ADVANCED_SETTINGS.colors.accent);
    root.style.setProperty('--sensor-moisture-color', colors.moisture || DEFAULT_ADVANCED_SETTINGS.colors.moisture);
    root.style.setProperty('--sensor-temperature-color', colors.temperature || DEFAULT_ADVANCED_SETTINGS.colors.temperature);
    root.style.setProperty('--sensor-humidity-color', colors.humidity || DEFAULT_ADVANCED_SETTINGS.colors.humidity);
  };

  useEffect(() => {
    const loadAdvancedSettings = async () => {
      try {
        let localPrefs = {};
        try {
          localPrefs = JSON.parse(localStorage.getItem(LOCAL_UI_PREFS_KEY) || '{}');
        } catch {
          localPrefs = {};
        }

        // Use the user's currently selected device, fall back to legacy default
        const activeSensorId = selectedDeviceId || 'ESP32-SENSOR';
        const configRes = await configAPI.get(activeSensorId);
        const configPayload = configRes?.config || configRes?.data?.config || configRes?.data || configRes;

        const nextSettings = {
          irrigation: {
            autoMode: Boolean(configPayload?.autoMode ?? DEFAULT_ADVANCED_SETTINGS.irrigation.autoMode),
            moistureThreshold: Number(configPayload?.moistureThreshold ?? DEFAULT_ADVANCED_SETTINGS.irrigation.moistureThreshold),
            maxCyclesPerHour: Number(configPayload?.wateringSystem?.maxCyclesPerHour ?? DEFAULT_ADVANCED_SETTINGS.irrigation.maxCyclesPerHour),
            maxCyclesPerDay: Number(configPayload?.wateringSystem?.maxCyclesPerDay ?? DEFAULT_ADVANCED_SETTINGS.irrigation.maxCyclesPerDay),
            wateringDurationSec: Math.max(5, Math.round(Number(configPayload?.wateringDurationMs ?? 10000) / 1000)),
          },
          charts: {
            chartStyle: localPrefs?.charts?.chartStyle || DEFAULT_ADVANCED_SETTINGS.charts.chartStyle,
            showGrid: localPrefs?.charts?.showGrid ?? DEFAULT_ADVANCED_SETTINGS.charts.showGrid,
            animate: localPrefs?.charts?.animate ?? DEFAULT_ADVANCED_SETTINGS.charts.animate,
          },
          colors: {
            accent: localPrefs?.colors?.accent || DEFAULT_ADVANCED_SETTINGS.colors.accent,
            moisture: localPrefs?.colors?.moisture || DEFAULT_ADVANCED_SETTINGS.colors.moisture,
            temperature: localPrefs?.colors?.temperature || DEFAULT_ADVANCED_SETTINGS.colors.temperature,
            humidity: localPrefs?.colors?.humidity || DEFAULT_ADVANCED_SETTINGS.colors.humidity,
          },
          dashboard: {
            sensors: configPayload?.uiPreferences?.dashboardSections?.sensors ?? DEFAULT_ADVANCED_SETTINGS.dashboard.sensors,
            analytics: configPayload?.uiPreferences?.dashboardSections?.analytics ?? DEFAULT_ADVANCED_SETTINGS.dashboard.analytics,
            controls: configPayload?.uiPreferences?.dashboardSections?.controls ?? DEFAULT_ADVANCED_SETTINGS.dashboard.controls,
            alerts: configPayload?.uiPreferences?.dashboardSections?.alerts ?? DEFAULT_ADVANCED_SETTINGS.dashboard.alerts,
            showAlertBadge: configPayload?.uiPreferences?.widgets?.showAlertBadge ?? DEFAULT_ADVANCED_SETTINGS.dashboard.showAlertBadge,
            showStatusDots: configPayload?.uiPreferences?.widgets?.showStatusDots ?? DEFAULT_ADVANCED_SETTINGS.dashboard.showStatusDots,
            showSystemStatusPanel: configPayload?.uiPreferences?.widgets?.showSystemStatusPanel ?? DEFAULT_ADVANCED_SETTINGS.dashboard.showSystemStatusPanel,
          },
        };

        setAdvancedSettings(nextSettings);
        applyAdvancedColors(nextSettings.colors);
      } catch {
        applyAdvancedColors(DEFAULT_ADVANCED_SETTINGS.colors);
      }
    };

    loadAdvancedSettings();
  }, []);

  const updateAdvancedSettings = (section, key, value) => {
    setAdvancedSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  const buildConfigPayloadFromAdvanced = (settings) => ({
    autoMode: Boolean(settings.irrigation.autoMode),
    moistureThreshold: Math.min(100, Math.max(0, Number(settings.irrigation.moistureThreshold) || 30)),
    wateringDurationMs: Math.max(5000, (Number(settings.irrigation.wateringDurationSec) || 10) * 1000),
    wateringSystem: {
      maxCyclesPerHour: Math.min(24, Math.max(1, Number(settings.irrigation.maxCyclesPerHour) || 4)),
      maxCyclesPerDay: Math.min(50, Math.max(1, Number(settings.irrigation.maxCyclesPerDay) || 6)),
    },
    uiPreferences: {
      dashboardSections: {
        sensors: Boolean(settings.dashboard.sensors),
        analytics: Boolean(settings.dashboard.analytics),
        controls: Boolean(settings.dashboard.controls),
        alerts: Boolean(settings.dashboard.alerts),
      },
      widgets: {
        showAlertBadge: Boolean(settings.dashboard.showAlertBadge),
        showStatusDots: Boolean(settings.dashboard.showStatusDots),
        showSystemStatusPanel: Boolean(settings.dashboard.showSystemStatusPanel),
      },
    },
  });

  const handleSaveAdvancedSettings = async () => {
    setSavingAdvanced(true);
    const localPrefs = {
      charts: {
        chartStyle: advancedSettings.charts.chartStyle,
        showGrid: Boolean(advancedSettings.charts.showGrid),
        animate: Boolean(advancedSettings.charts.animate),
      },
      colors: {
        accent: advancedSettings.colors.accent,
        moisture: advancedSettings.colors.moisture,
        temperature: advancedSettings.colors.temperature,
        humidity: advancedSettings.colors.humidity,
      },
    };

    localStorage.setItem(LOCAL_UI_PREFS_KEY, JSON.stringify(localPrefs));
    applyAdvancedColors(localPrefs.colors);

    try {
      const payload = buildConfigPayloadFromAdvanced(advancedSettings);

      await configAPI.update(selectedDeviceId || 'ESP32-SENSOR', payload);
      onNotification?.('Irrigation, chart, and sensor color settings saved', 'success');
    } catch (err) {
      if (err?.response?.status === 403) {
        onNotification?.('Display settings were saved locally. Irrigation system settings require admin permissions.', 'info');
      } else {
        const message = err?.response?.data?.message || 'Failed to save advanced settings';
        onNotification?.(message, 'error');
      }
    } finally {
      setSavingAdvanced(false);
    }
  };

  const handleResetAllSettings = async () => {
    const confirmReset = window.confirm('Reset all user settings to defaults? This will overwrite saved preferences.');
    if (!confirmReset) return;

    setSavingAdvanced(true);
    const defaultPlant = 'tomato';

    setPreferredPlant(defaultPlant);
    setNotifications(DEFAULT_NOTIFICATIONS);
    setAdvancedSettings(DEFAULT_ADVANCED_SETTINGS);

    localStorage.removeItem(LOCAL_UI_PREFS_KEY);
    applyAdvancedColors(DEFAULT_ADVANCED_SETTINGS.colors);

    if (theme !== 'dark') {
      toggleTheme?.();
    }

    const resetPayload = buildConfigPayloadFromAdvanced(DEFAULT_ADVANCED_SETTINGS);

    const [profileResult, configResult] = await Promise.allSettled([
      updateProfile({ preferredPlant: defaultPlant }),
      configAPI.update(selectedDeviceId || 'ESP32-SENSOR', resetPayload),
    ]);

    const profileOk = profileResult.status === 'fulfilled';
    const configOk = configResult.status === 'fulfilled';

    if (profileOk && configOk) {
      onNotification?.('All settings reset to defaults', 'success');
    } else if (profileOk || configOk) {
      onNotification?.('Defaults applied partially. Some server settings could not be reset.', 'info');
    } else {
      onNotification?.('Defaults applied locally, but server reset failed.', 'error');
    }

    setSavingAdvanced(false);
  };

  const showSection = (id) => {
    setActiveTab(id);
  };

  const getSectionClass = (id, extra = '') => {
    const hidden = activeTab !== id ? ' sp-card--hidden' : '';
    return `sp-card${extra}${hidden}`;
  };

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const result = await sensorAPI.getHistory(168);
      const readings = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
          ? result.data
          : [];

      if (!readings.length) {
        onNotification?.('No records available to export', 'info');
        return;
      }

      const csv = [
        'Timestamp,Soil Moisture,Temperature,Humidity,Light,pH',
        ...readings.map(r => `${r.timestamp},${r.soilMoisture},${r.temperature},${r.humidity},${r.light},${r.pH}`),
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sproutsense-data-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      onNotification?.(`Exported ${readings.length} records`, 'success');
    } catch {
      onNotification?.('Export failed', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleClearSensorHistory = async () => {
    if (!window.confirm('Clear sensor history older than 90 days?')) return;
    setClearing(true);
    try {
      const res = await configAPI.clearSensorHistory(selectedDeviceId || 'ESP32-SENSOR', 90);
      const deleted = res?.deleted ?? res?.deletedCount ?? res?.recordsDeleted ?? (res?.data?.deleted) ?? 0;
      onNotification?.(`Cleared ${deleted} sensor records`, 'success');
    } catch {
      onNotification?.('Failed to clear sensor history', 'error');
    } finally {
      setClearing(false);
    }
  };

  const toggleNotif = key =>
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));

  const handleSavePlantPreference = async () => {
    setSavingPlant(true);
    try {
      await updateProfile({ preferredPlant });
      onNotification?.('Plant preference updated successfully', 'success');
    } catch {
      onNotification?.('Failed to update plant preference', 'error');
    } finally {
      setSavingPlant(false);
    }
  };

  const handlePairDevice = async () => {
    const pairingKey = pairingForm.pairingKey.trim().toUpperCase();

    if (!pairingKey) {
      onNotification?.('Pairing key is required', 'error');
      return;
    }

    const expectedMarker = pairingForm.deviceModel === 'ESP32-CAM' ? 'CAM' : 'SENSOR';
    if (!pairingKey.includes(expectedMarker)) {
      onNotification?.(`Pairing key does not match selected model (${pairingForm.deviceModel})`, 'error');
      return;
    }

    setPairingDevice(true);
    try {
      const res = await deviceAPI.pairDevice({
        pairingKey,
        displayName: pairingForm.displayName.trim() || pairingForm.deviceModel,
      });
      onNotification?.(`Device '${res.device.displayName}' paired successfully!`, 'success');
      setPairingForm({ pairingKey: '', deviceModel: pairingForm.deviceModel, displayName: '' });
      await loadDevices();
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to pair device';
      onNotification?.(message, 'error');
    } finally {
      setPairingDevice(false);
    }
  };

  const handleQuickDeviceSelect = (preset) => {
    setPairingForm((prev) => ({
      ...prev,
      deviceModel: preset.model,
      displayName: preset.displayName,
    }));
  };

  const handleRotateToken = async (deviceId) => {
    const confirmRotate = window.confirm(`Sync device ID for ${deviceId}?`);
    if (!confirmRotate) return;

    setRotatingDeviceId(deviceId);
    try {
      const res = await deviceAPI.rotateToken(deviceId);
      const newToken = res?.device?.deviceId || res?.device?.deviceToken || deviceId;
      if (newToken) {
        setRotatedTokens((prev) => ({ ...prev, [deviceId]: newToken }));
      }
      onNotification?.('Device ID synced. Use this same ID in your ESP32.', 'success');
      await loadDevices();
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to sync device ID';
      onNotification?.(message, 'error');
    } finally {
      setRotatingDeviceId('');
    }
  };

  const handleCopyRotatedToken = async (deviceId) => {
    const token = rotatedTokens[deviceId];
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      onNotification?.('Device ID copied', 'success');
    } catch {
      onNotification?.('Could not copy device ID', 'error');
    }
  };

  const handleUnpairDevice = async (deviceId) => {
    const confirmUnpair = window.confirm(`Unpair ${deviceId}? This revokes access until paired again.`);
    if (!confirmUnpair) return;

    setUnpairingDeviceId(deviceId);
    try {
      await deviceAPI.unpair(deviceId);
      setRotatedTokens((prev) => {
        const next = { ...prev };
        delete next[deviceId];
        return next;
      });
      onNotification?.('Device unpaired successfully', 'success');
      await loadDevices();
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to unpair device';
      onNotification?.(message, 'error');
    } finally {
      setUnpairingDeviceId('');
    }
  };

  const ALERT_ROWS = [
    { key: 'lowMoisture',  icon: 'droplet',     label: 'Critical Moisture Drop', desc: 'Triggers when soil needs immediate watering' },
    { key: 'highTemp',     icon: 'thermometer', label: 'Thermal Stress Warning',  desc: 'Triggers above 38°C ambient temperature'    },
    { key: 'phAlert',      icon: 'beaker',      label: 'pH Imbalance',            desc: 'Triggers outside the 5.5–7.5 safe range'   },
    { key: 'systemAlerts', icon: 'broadcast',   label: 'Hardware Disconnects',    desc: 'ESP32 WebSocket drops & reconnection events' },
  ];

  const ALERT_ICON_COLORS = {
    lowMoisture:  'accent-blue',
    highTemp:     'accent-rose',
    phAlert:      'accent-green',
    systemAlerts: 'accent-amber',
  };

  const ABOUT_ROWS = [
    { icon: 'cpu',      label: 'Firmware',  value: '2.0.4 (ESP32-WROOM)'      },
    { icon: 'branch',   label: 'Release',   value: 'v1.1.0-beta'               },
    { icon: 'activity', label: 'Sensors',   value: 'DHT22 · Soil Cap · BH1750' },
    { icon: 'layers',   label: 'Stack',     value: 'React · Node · MongoDB'    },
  ];

  return (
    <div className="sp-page">

      {/* SECTION TABS */}
      <nav className="sp-section-tabs" aria-label="Settings sections">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`sp-tab${activeTab === t.id ? ' active' : ''}`}
            onClick={() => showSection(t.id)}
          >
            <span className="sp-tab-dot" />
            <Icon name={t.icon} size={13} />
            {t.label}
          </button>
        ))}
      </nav>

      <div className="sp-action-row" style={{ justifyContent: 'flex-end' }}>
        <button className="sp-btn sp-btn--danger" onClick={handleResetAllSettings} disabled={savingAdvanced || savingPlant}>
          <Icon name={savingAdvanced ? 'spinner' : 'trash'} size={14} />
          {savingAdvanced ? 'Resetting...' : 'Reset All Settings'}
        </button>
      </div>

      {/* GRID */}
      <div className="sp-grid">

        {/* ── PROFILE ── */}
        <div className={getSectionClass('profile')} ref={sectionRefs.profile}>
          <div className="sp-card-head">
            <CardIcon name="user" accent="accent-cyan" />
            <h2>Profile</h2>
            <span className="sp-card-badge">Account</span>
          </div>
          <div className="sp-card-body">
            <div className="sp-field">
              <label className="sp-label">Full Name</label>
              <input className="sp-input sp-input--surface" type="text" value={user?.fullName || ''} readOnly />
            </div>

            <div className="sp-field">
              <label className="sp-label">Email</label>
              <input className="sp-input sp-input--surface" type="email" value={user?.email || ''} readOnly />
            </div>

            <div className="sp-field-grid">
              <div className="sp-field">
                <label className="sp-label">Role</label>
                <input className="sp-input sp-input--surface" type="text" value={user?.role || 'user'} readOnly />
              </div>
              <div className="sp-field">
                <label className="sp-label">Account Status</label>
                <input className="sp-input sp-input--surface" type="text" value={user?.accountStatus || 'active'} readOnly />
              </div>
            </div>

            <div className="sp-field">
              <label className="sp-label">Preferred Plant</label>
              <select className="sp-select" value={preferredPlant} onChange={(e) => setPreferredPlant(e.target.value)}>
                {PLANT_OPTIONS.map((plant) => (
                  <option key={plant.key} value={plant.key} disabled={!plant.available}>
                    {plant.label}{plant.available ? '' : ' (Coming Soon)'}
                  </option>
                ))}
              </select>
            </div>

            <div className="sp-action-row">
              <button className="sp-btn sp-btn--secondary" onClick={handleSavePlantPreference} disabled={savingPlant}>
                <Icon name={savingPlant ? 'spinner' : 'save'} size={14} />
                {savingPlant ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>

        {/* ── APPEARANCE ── */}
        <div className={getSectionClass('appearance')} ref={sectionRefs.appearance}>
          <div className="sp-card-head">
            <CardIcon name="palette" accent="accent-violet" />
            <h2>Appearance</h2>
          </div>
          <div className="sp-card-body">
            <div className="sp-row">
              <div className="sp-row-info">
                <span className="sp-row-label">Interface Theme</span>
                <span className="sp-row-desc">Select a curated visual palette</span>
              </div>
              <div className="sp-theme-selector" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {[
                  { id: 'dark', label: 'Dark', icon: 'moon' },
                  { id: 'light', label: 'Light', icon: 'sun' },
                  { id: 'midnight', label: 'Midnight', icon: 'moon' },
                  { id: 'forest', label: 'Forest', icon: 'moon' },
                ].map(t => (
                  <button
                    key={t.id}
                    className={`sp-theme-pill ${theme === t.id ? 'active' : ''}`}
                    onClick={() => setTheme ? setTheme(t.id) : toggleTheme()}
                    aria-label={`Select ${t.label} theme`}
                    style={{
                      background: theme === t.id ? 'var(--accent-primary)' : 'var(--surface-2)',
                      color: theme === t.id ? '#fff' : 'var(--text-primary)',
                      border: theme === t.id ? '1px solid transparent' : '1px solid var(--border-color)'
                    }}
                  >
                    <Icon name={t.icon} size={13} />
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="sp-field" style={{ marginBottom: '1.5rem' }}>
              <label className="sp-label">Theme Palette</label>
              <div className="sp-palette-grid">
                {[
                  { id: 'emerald', label: 'Emerald', color: '#10b981' },
                  { id: 'violet',  label: 'Violet',  color: '#8b5cf6' },
                  { id: 'sunset',  label: 'Sunset',  color: '#f59e0b' },
                  { id: 'ocean',   label: 'Ocean',   color: '#0ea5e9' },
                  { id: 'rose',    label: 'Rose',    color: '#ec4899' },
                  { id: 'harvest', label: 'Harvest', color: '#f59e0b' },
                  { id: 'glacier', label: 'Glacier', color: '#06b6d4' },
                  { id: 'nightshade', label: 'Nightshade', color: '#6366f1' },
                  { id: 'bloom',   label: 'Bloom',   color: '#f43f5e' },
                ].map(p => (
                  <button
                    key={p.id}
                    className={`sp-palette-btn ${palette === p.id ? 'active' : ''}`}
                    onClick={() => setPalette(p.id)}
                    title={p.label}
                    type="button"
                  >
                    <span className="sp-palette-dot" style={{ background: p.color }} />
                    <span className="sp-palette-label">{p.label}</span>
                    {palette === p.id && <Icon name="check" size={10} className="sp-palette-check" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="sp-field-grid">
              <div className="sp-field">
                <label className="sp-label">Primary Accent Color</label>
                <input
                  className="sp-input sp-input--surface"
                  type="color"
                  value={advancedSettings.colors.accent}
                  onChange={(e) => {
                    updateAdvancedSettings('colors', 'accent', e.target.value);
                    applyAdvancedColors({ ...advancedSettings.colors, accent: e.target.value });
                  }}
                />
              </div>
              <div className="sp-field">
                <label className="sp-label">Chart Style</label>
                <select
                  className="sp-select"
                  value={advancedSettings.charts.chartStyle}
                  onChange={(e) => updateAdvancedSettings('charts', 'chartStyle', e.target.value)}
                >
                  <option value="smooth">Smooth Lines</option>
                  <option value="straight">Straight Lines</option>
                  <option value="minimal">Minimal</option>
                </select>
              </div>
            </div>

            <div className="sp-row">
              <div className="sp-row-info">
                <span className="sp-row-label">Chart Animations</span>
                <span className="sp-row-desc">Animate chart transitions while data updates</span>
              </div>
              <button
                className={`sp-toggle ${advancedSettings.charts.animate ? 'on' : 'off'}`}
                onClick={() => updateAdvancedSettings('charts', 'animate', !advancedSettings.charts.animate)}
                aria-label="Toggle chart animations"
              >
                <span className="sp-toggle-knob" />
              </button>
            </div>

            <div className="sp-row">
              <div className="sp-row-info">
                <span className="sp-row-label">Chart Grid</span>
                <span className="sp-row-desc">Show background grid in analytics charts</span>
              </div>
              <button
                className={`sp-toggle ${advancedSettings.charts.showGrid ? 'on' : 'off'}`}
                onClick={() => updateAdvancedSettings('charts', 'showGrid', !advancedSettings.charts.showGrid)}
                aria-label="Toggle chart grid"
              >
                <span className="sp-toggle-knob" />
              </button>
            </div>

            <div className="sp-action-row">
              <button className="sp-btn sp-btn--secondary" onClick={handleSaveAdvancedSettings} disabled={savingAdvanced}>
                <Icon name={savingAdvanced ? 'spinner' : 'save'} size={14} />
                {savingAdvanced ? 'Saving...' : 'Save Appearance Preferences'}
              </button>
            </div>
          </div>
        </div>

        {/* ── IRRIGATION + CHART + SENSOR SETTINGS ── */}
        <div className={getSectionClass('irrigation')} ref={sectionRefs.irrigation}>
          <div className="sp-card-head">
            <CardIcon name="droplet" accent="accent-blue" />
            <h2>Irrigation & Sensor Display</h2>
          </div>
          <div className="sp-card-body">
            <div className="sp-row">
              <div className="sp-row-info">
                <span className="sp-row-label">Auto Irrigation</span>
                <span className="sp-row-desc">Enable automatic watering based on moisture threshold</span>
              </div>
              <button
                className={`sp-toggle ${advancedSettings.irrigation.autoMode ? 'on' : 'off'}`}
                onClick={() => updateAdvancedSettings('irrigation', 'autoMode', !advancedSettings.irrigation.autoMode)}
                aria-label="Toggle auto irrigation"
              >
                <span className="sp-toggle-knob" />
              </button>
            </div>

            <div className="sp-field-grid">
              <div className="sp-field">
                <label className="sp-label">Moisture Threshold (%)</label>
                <input
                  className="sp-input sp-input--surface"
                  type="number"
                  min="0"
                  max="100"
                  value={advancedSettings.irrigation.moistureThreshold}
                  onChange={(e) => updateAdvancedSettings('irrigation', 'moistureThreshold', e.target.value)}
                />
              </div>
              <div className="sp-field">
                <label className="sp-label">Watering Duration (sec)</label>
                <input
                  className="sp-input sp-input--surface"
                  type="number"
                  min="5"
                  max="300"
                  value={advancedSettings.irrigation.wateringDurationSec}
                  onChange={(e) => updateAdvancedSettings('irrigation', 'wateringDurationSec', e.target.value)}
                />
              </div>
              <div className="sp-field">
                <label className="sp-label">Max Cycles / Hour</label>
                <input
                  className="sp-input sp-input--surface"
                  type="number"
                  min="1"
                  max="24"
                  value={advancedSettings.irrigation.maxCyclesPerHour}
                  onChange={(e) => updateAdvancedSettings('irrigation', 'maxCyclesPerHour', e.target.value)}
                />
              </div>
              <div className="sp-field">
                <label className="sp-label">Max Cycles / Day</label>
                <input
                  className="sp-input sp-input--surface"
                  type="number"
                  min="1"
                  max="50"
                  value={advancedSettings.irrigation.maxCyclesPerDay}
                  onChange={(e) => updateAdvancedSettings('irrigation', 'maxCyclesPerDay', e.target.value)}
                />
              </div>
            </div>

            <div className="sp-field-grid">
              <div className="sp-field">
                <label className="sp-label">Moisture Sensor Color</label>
                <input
                  className="sp-input sp-input--surface"
                  type="color"
                  value={advancedSettings.colors.moisture}
                  onChange={(e) => {
                    updateAdvancedSettings('colors', 'moisture', e.target.value);
                    applyAdvancedColors({ ...advancedSettings.colors, moisture: e.target.value });
                  }}
                />
              </div>
              <div className="sp-field">
                <label className="sp-label">Temperature Sensor Color</label>
                <input
                  className="sp-input sp-input--surface"
                  type="color"
                  value={advancedSettings.colors.temperature}
                  onChange={(e) => {
                    updateAdvancedSettings('colors', 'temperature', e.target.value);
                    applyAdvancedColors({ ...advancedSettings.colors, temperature: e.target.value });
                  }}
                />
              </div>
              <div className="sp-field">
                <label className="sp-label">Humidity Sensor Color</label>
                <input
                  className="sp-input sp-input--surface"
                  type="color"
                  value={advancedSettings.colors.humidity}
                  onChange={(e) => {
                    updateAdvancedSettings('colors', 'humidity', e.target.value);
                    applyAdvancedColors({ ...advancedSettings.colors, humidity: e.target.value });
                  }}
                />
              </div>
            </div>

            <div className="sp-row">
              <div className="sp-row-info">
                <span className="sp-row-label">Show Sensors Section</span>
                <span className="sp-row-desc">Display sensors on your dashboard</span>
              </div>
              <button
                className={`sp-toggle ${advancedSettings.dashboard.sensors ? 'on' : 'off'}`}
                onClick={() => updateAdvancedSettings('dashboard', 'sensors', !advancedSettings.dashboard.sensors)}
                aria-label="Toggle sensors section"
              >
                <span className="sp-toggle-knob" />
              </button>
            </div>

            <div className="sp-row">
              <div className="sp-row-info">
                <span className="sp-row-label">Show Analytics Section</span>
                <span className="sp-row-desc">Display analytics and charts on your dashboard</span>
              </div>
              <button
                className={`sp-toggle ${advancedSettings.dashboard.analytics ? 'on' : 'off'}`}
                onClick={() => updateAdvancedSettings('dashboard', 'analytics', !advancedSettings.dashboard.analytics)}
                aria-label="Toggle analytics section"
              >
                <span className="sp-toggle-knob" />
              </button>
            </div>

            <div className="sp-row">
              <div className="sp-row-info">
                <span className="sp-row-label">Show Watering Controls</span>
                <span className="sp-row-desc">Display irrigation controls in dashboard cards</span>
              </div>
              <button
                className={`sp-toggle ${advancedSettings.dashboard.controls ? 'on' : 'off'}`}
                onClick={() => updateAdvancedSettings('dashboard', 'controls', !advancedSettings.dashboard.controls)}
                aria-label="Toggle controls section"
              >
                <span className="sp-toggle-knob" />
              </button>
            </div>

            <div className="sp-row">
              <div className="sp-row-info">
                <span className="sp-row-label">Show Alert Badge</span>
                <span className="sp-row-desc">Display alert count in top navbar</span>
              </div>
              <button
                className={`sp-toggle ${advancedSettings.dashboard.showAlertBadge ? 'on' : 'off'}`}
                onClick={() => updateAdvancedSettings('dashboard', 'showAlertBadge', !advancedSettings.dashboard.showAlertBadge)}
                aria-label="Toggle alert badge"
              >
                <span className="sp-toggle-knob" />
              </button>
            </div>

            <div className="sp-action-row">
              <button className="sp-btn sp-btn--secondary" onClick={handleSaveAdvancedSettings} disabled={savingAdvanced}>
                <Icon name={savingAdvanced ? 'spinner' : 'save'} size={14} />
                {savingAdvanced ? 'Saving...' : 'Save Irrigation & Chart Settings'}
              </button>
            </div>
          </div>
        </div>

        {/* ── PLANT TYPE ── */}
        <div className={getSectionClass('plants')} ref={sectionRefs.plants}>
          <div className="sp-card-head">
            <CardIcon name="seedling" accent="accent-green" />
            <h2>Plant Type Preference</h2>
          </div>
          <div className="sp-card-body">
            <div className="sp-plant-block">
              <div className="sp-plant-header">
                <span className="sp-row-label">Primary Crop</span>
                <span className="sp-pill sp-pill--green">Tomato Available</span>
              </div>
              <p className="sp-row-desc">Based on PlantVillage crop categories. More plants are listed as Coming Soon.</p>
              <select className="sp-select" value={preferredPlant} onChange={(e) => setPreferredPlant(e.target.value)}>
                {PLANT_OPTIONS.map((plant) => (
                  <option key={plant.key} value={plant.key} disabled={!plant.available}>
                    {plant.label}{plant.available ? '' : ' (Coming Soon)'}
                  </option>
                ))}
              </select>
            </div>
            <div className="sp-action-row">
              <button className="sp-btn sp-btn--secondary" onClick={handleSavePlantPreference} disabled={savingPlant}>
                <Icon name={savingPlant ? 'spinner' : 'save'} size={14} />
                {savingPlant ? 'Saving...' : 'Save Plant Preference'}
              </button>
            </div>
          </div>
        </div>

        {/* ── DEVICES ── */}
        <div className={getSectionClass('devices')} ref={sectionRefs.devices}>
          <div className="sp-card-head">
            <CardIcon name="chip" accent="accent-cyan" />
            <h2>Device Pairing</h2>
          </div>
          <div className="sp-card-body">
            <BleProvisioning />

            {/* Device Selection Dropdown */}
            <div className="sp-field" style={{ marginBottom: '1rem' }}>
              <label className="sp-label">Selected Device</label>
              <select
                className="sp-select"
                value={selectedDeviceId}
                onChange={e => {
                  setSelectedDeviceId(e.target.value);
                  localStorage.setItem('selectedDeviceId', e.target.value);
                }}
                disabled={devices.length === 0}
              >
                {devices.map(device => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.displayName || device.deviceId}
                  </option>
                ))}
              </select>
              <p className="sp-row-desc">This device will be used for dashboard, analytics, and insights.</p>
            </div>

            <div className="sp-device-fields">
              <div className="sp-field">
                <label className="sp-label">Pairing Key</label>
                <input
                  className="sp-input sp-input--surface"
                  type="text"
                  placeholder="Enter pairing key from Admin Panel"
                  value={pairingForm.pairingKey}
                  onChange={(e) => setPairingForm((prev) => ({ ...prev, pairingKey: e.target.value.toUpperCase() }))}
                />
                <p className="sp-row-desc">Use the pairing key generated by Admin Device Keys.</p>
                <div className="sp-action-row" style={{ marginTop: '0.4rem' }}>
                  {QUICK_DEVICES.map((preset) => (
                    <button
                      key={preset.model}
                      type="button"
                      className="sp-btn sp-btn--ghost"
                      onClick={() => handleQuickDeviceSelect(preset)}
                    >
                      <Icon name="chip" size={14} />
                      {preset.model}
                    </button>
                  ))}
                </div>
              </div>
              <div className="sp-field">
                <label className="sp-label">Device Model</label>
                <select
                  className="sp-select"
                  value={pairingForm.deviceModel}
                  onChange={(e) => setPairingForm((prev) => ({ ...prev, deviceModel: e.target.value }))}
                >
                  <option value="ESP32-SENSOR">ESP32-SENSOR</option>
                  <option value="ESP32-CAM">ESP32-CAM</option>
                </select>
                <p className="sp-row-desc">Model must match the pairing key generated from admin panel.</p>
              </div>
              <div className="sp-field">
                <label className="sp-label">Display Name (Optional)</label>
                <input
                  className="sp-input sp-input--surface"
                  type="text"
                  placeholder="Greenhouse Node"
                  value={pairingForm.displayName}
                  onChange={(e) => setPairingForm((prev) => ({ ...prev, displayName: e.target.value }))}
                />
              </div>
            </div>

            <div className="sp-action-row">
              <button
                className="sp-btn sp-btn--secondary"
                onClick={handlePairDevice}
                disabled={pairingDevice}
              >
                <Icon name={pairingDevice ? 'spinner' : 'chip'} size={14} />
                {pairingDevice ? 'Pairing...' : 'Pair Device'}
              </button>
              <button
                className="sp-btn sp-btn--ghost"
                onClick={loadDevices}
                disabled={loadingDevices}
              >
                <Icon name={loadingDevices ? 'spinner' : 'activity'} size={14} />
                {loadingDevices ? 'Refreshing...' : 'Refresh Devices'}
              </button>
            </div>

            <div className="sp-device-list">
              {loadingDevices && !devices.length ? (
                <p className="sp-row-desc">Loading devices...</p>
              ) : devices.length ? (
                devices.map((device) => (
                  <div className="sp-device-item" key={device.id}>
                    <div className="sp-device-title-row">
                      <p className="sp-row-label">{device.displayName || device.deviceId}</p>
                      <span className={`sp-pill ${device.online ? 'sp-pill--green' : 'sp-pill--slate'}`}>
                        {device.online ? 'Online' : 'Offline'}
                      </span>
                    </div>
                    <p className="sp-row-desc">Device ID: {device.deviceId}</p>
                    <p className="sp-row-desc">
                      Last seen: {device.lastSeenAt ? format(new Date(device.lastSeenAt), 'PPpp') : 'Never'}
                    </p>
                    <p className="sp-row-desc">IP: {device.lastSeenIp || 'Unknown'}</p>
                    <p className="sp-row-desc">
                      Firmware: {device.firmwareVersion || 'Unknown'}
                    </p>
                    <div className="sp-device-actions">
                      <button
                        className="sp-btn sp-btn--ghost"
                        onClick={() => handleRotateToken(device.deviceId)}
                        disabled={rotatingDeviceId === device.deviceId || unpairingDeviceId === device.deviceId}
                      >
                        <Icon name={rotatingDeviceId === device.deviceId ? 'spinner' : 'key'} size={14} />
                        {rotatingDeviceId === device.deviceId ? 'Syncing...' : 'Sync Device ID'}
                      </button>
                      <button
                        className="sp-btn sp-btn--danger"
                        onClick={() => handleUnpairDevice(device.deviceId)}
                        disabled={unpairingDeviceId === device.deviceId || rotatingDeviceId === device.deviceId}
                      >
                        <Icon name={unpairingDeviceId === device.deviceId ? 'spinner' : 'trash'} size={14} />
                        {unpairingDeviceId === device.deviceId ? 'Unpairing...' : 'Unpair'}
                      </button>
                    </div>
                    {rotatedTokens[device.deviceId] && (
                      <div className="sp-pair-code-box" role="status" aria-live="polite">
                        <div>
                          <p className="sp-row-label">Device ID</p>
                          <p className="sp-pair-code">{rotatedTokens[device.deviceId]}</p>
                        </div>
                        <button className="sp-btn sp-btn--secondary" onClick={() => handleCopyRotatedToken(device.deviceId)}>
                          <Icon name="hash" size={14} />
                          Copy ID
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="sp-row-desc">No paired devices yet. Connect a device from the section above using your Device Key.</p>
              )}
            </div>
          </div>
        </div>

        {/* ── DATA TOOLS ── */}
        <div className={getSectionClass('data')} ref={sectionRefs.data}>
          <div className="sp-card-head">
            <CardIcon name="database" accent="accent-teal" />
            <h2>Data Tools</h2>
          </div>
          <div className="sp-card-body">
            <DataTools selectedDeviceId={selectedDeviceId || 'ESP32-SENSOR'} stats={stats} onNotification={onNotification} />
          </div>
        </div>

        {/* ── ALERT PREFERENCES ── */}
        <div className={getSectionClass('alerts')} ref={sectionRefs.alerts}>
          <div className="sp-card-head">
            <CardIcon name="bell" accent="accent-rose" />
            <h2>Alert Preferences</h2>
          </div>
          <div className="sp-card-body">
            {ALERT_ROWS.map(({ key, icon, label, desc }) => (
              <div className="sp-row" key={key}>
                <div className="sp-row-left">
                  <span className={`sp-card-head-icon ${ALERT_ICON_COLORS[key]}`} style={{width:32,height:32,borderRadius:9}}>
                    <Icon name={icon} size={13} />
                  </span>
                  <div className="sp-row-info">
                    <span className="sp-row-label">{label}</span>
                    <span className="sp-row-desc">{desc}</span>
                  </div>
                </div>
                <button
                  className={`sp-toggle ${notifications[key] ? 'on' : 'off'}`}
                  onClick={() => toggleNotif(key)}
                  aria-label={`Toggle ${label}`}
                >
                  <span className="sp-toggle-knob" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── ABOUT — WIDE ── */}
        <div className={getSectionClass('about', ' sp-card--wide')} ref={sectionRefs.about}>
          <div className="sp-card-head">
            <CardIcon name="info" accent="accent-teal" />
            <h2>About SproutSense</h2>
          </div>
          <div className="sp-card-body">
            <div className="sp-about-brand">
              <div className="sp-about-logo">
                <Icon name="seedling" size={22} />
              </div>
              <div>
                <p className="sp-about-name">SproutSense OS</p>
                <p className="sp-about-tagline">Smart IoT Plant Care · Edge AI · Real-time Telemetry</p>
              </div>
            </div>
            <div className="sp-about-grid">
              {ABOUT_ROWS.map(({ icon, label, value }) => (
                <div className="sp-about-tile" key={label}>
                  <span className="sp-about-tile-icon"><Icon name={icon} size={14} /></span>
                  <span className="sp-about-tile-label">{label}</span>
                  <span className="sp-about-tile-value">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
