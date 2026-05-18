/**
 * App.jsx — src/
 * Root application component for SproutSense.
 *
 * Responsibilities:
 *  - Global state: sensors, pumpActive, systemStatus, alerts, theme, sidebar
 *  - WebSocket connection via useWebSocket hook
 *  - Polling: sensor data every 5 s, disease detections every 60 s
 *  - Theme toggle with View Transitions API + CSS fallback
 *  - Route definitions via react-router-dom <Routes>
 *  - Renders <Layout> (sidebar + navbar + page content)
 *  - Aurora animated background (WebGL, fixed layer, z-index 0)
 *
 * Import order:
 *  1. React + hooks
 *  2. Router utilities
 *  3. Custom hooks
 *  4. API utilities
 *  5. Layout & shared components
 *  6. Pages (each page lives in its own pages/<Name>/ folder)
 *  7. Styles
 */
import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster, toast as hotToast } from 'react-hot-toast';
import { useWebSocket } from './hooks/useWebSocket';
import { useDevices } from './hooks/useDevices';
import PageSkeleton from './components/PageSkeleton';

import { configAPI, sensorAPI, wateringAPI, aiAPI } from './utils/api';
import { isMockEnabled, getMockSensors, getMockAlerts, subscribeToMockUpdates } from './services/mockDataService';

// ── Background ─────────────────────────────────────────────────────────────
import Aurora from './components/background/Aurora';

// ── Admin auth ─────────────────────────────────────────────────────────────
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { PERMISSION, ROLE, ACCOUNT_STATUS } from './auth/permissions';

// ── Shared components ──────────────────────────────────────────────────────
import { Navbar } from './components/layout/Navbar';
import { SensorCard } from './components/SensorCard';
import { ControlCard } from './components/ControlCard';
import { AIRecommendation } from './components/AIRecommendation';
import { Notification } from './components/Notification';
import { GlassIcon } from './components/bits/GlassIcon';
import SproutSenseLogo from './components/SproutSenseLogo';
import MockBanner from './components/layout/MockBanner';

// ── Pages ────────────────────────────────────────────────────────────────
const HomePage = lazy(() => import('./pages/Home/HomePage.jsx'));
const SettingsPage = lazy(() => import('./pages/Settings/SettingsPage.jsx'));
const AnalyticsPage = lazy(() => import('./pages/Analytics/AnalyticsPage.jsx'));
const AlertsPage = lazy(() => import('./pages/Alerts/AlertsPage.jsx'));
const IntelligenceHub = lazy(() => import('./pages/Intelligence/IntelligenceHub.jsx'));
const AdminPanelPage = lazy(() => import('./pages/Admin/AdminPanelPage.jsx'));
const ViewerReportsPage = lazy(() => import('./pages/Viewer/ViewerReportsPage.jsx'));
const ESP32StatusPage = lazy(() => import('./pages/ESP32Status/ESP32StatusPage.jsx'));
const LoginPage = lazy(() => import('./pages/Auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/Auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/Auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/Auth/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('./pages/Auth/VerifyEmailPage'));
const VerifyPendingPage = lazy(() => import('./pages/Auth/VerifyPendingPage'));
const AccessDeniedPage = lazy(() => import('./pages/Auth/AccessDeniedPage'));
const PublicHomePage = lazy(() => import('./pages/Public/PublicPages').then((module) => ({ default: module.PublicHomePage })));
const PublicAboutPage = lazy(() => import('./pages/Public/PublicPages').then((module) => ({ default: module.PublicAboutPage })));
const PublicContactPage = lazy(() => import('./pages/Public/PublicPages').then((module) => ({ default: module.PublicContactPage })));
const PublicDemoPage = lazy(() => import('./pages/Public/PublicPages').then((module) => ({ default: module.PublicDemoPage })));
const PublicFeaturesPage = lazy(() => import('./pages/Public/PublicPages').then((module) => ({ default: module.PublicFeaturesPage })));
const PublicPlantLibraryPage = lazy(() => import('./pages/Public/PublicPages').then((module) => ({ default: module.PublicPlantLibraryPage })));

// ── Styles ─────────────────────────────────────────────────────────────────
import './App.css';
import './components/layout/styles/Sidebar.css';
import './components/layout/styles/Layout.css';

// ── Aurora colour stops (matched to Home hero palette) ────────────────────
//
// DARK  : Deep obsidian base + teal/green hero blobs.
// LIGHT : Soft mint base + deeper teal/green accents for better visibility.
//
const AURORA_DARK  = ['#040E09', '#00B4A6', '#66BB6A', '#020905'];
const AURORA_LIGHT = ['#F2FAF4', '#0F8F84', '#3F9D4D', '#D7EEDF'];
const AURORA_AMPLITUDE = 1.28;
const AURORA_SPEED = 0.28;

// ───────────────────────────────────────────────────────────────────────────
// PROTECTED ADMIN ROUTE
// ───────────────────────────────────────────────────────────────────────────
function ProtectedAdminRoute({ children }) {
  const auth = useAuth();
  const allowed = auth.isAuthenticated && [ROLE.ADMIN, ROLE.VIEWER].includes(auth.role);
  return allowed ? children : <Navigate to="/access-denied" replace />;
}

// ───────────────────────────────────────────────────────────────────────────
// SIDEBAR NAVIGATION STRUCTURE
// ───────────────────────────────────────────────────────────────────────────
const sidebarCategories = [
  {
    label: 'Main',
    items: [
      { path: '/home', label: 'Overview', icon: 'home' },
    ]
  },
  {
    label: 'Monitor',
    items: [
      { path: '/sensors', label: 'Sensors', icon: 'sensors' },
      { path: '/analytics', label: 'Analytics', icon: 'analytics' },
      { path: '/alerts', label: 'Alerts', icon: 'bell' },
    ]
  },
  {
    label: 'Control',
    items: [
      { path: '/controls', label: 'Controls', icon: 'controls' },
    ]
  },
  {
    label: 'Intelligence',
    items: [
      { path: '/intelligence', label: 'Intelligence Hub', icon: 'brain' },
    ]
  },
  {
    label: 'System',
    items: [
      { path: '/esp32', label: 'Device Connected', icon: 'esp32' },
      { path: '/settings', label: 'Settings', icon: 'settings' },
    ]
  },
];

const allSidebarItems = sidebarCategories.flatMap(c => c.items);

const publicSidebarCategories = [
  {
    label: 'Public',
    items: [
      { path: '/', label: 'Home', icon: 'home' },
      { path: '/about', label: 'About', icon: 'insights' },
      { path: '/features', label: 'Features', icon: 'analytics' },
      { path: '/plant-library', label: 'Plant Library', icon: 'sprout' },
      { path: '/demo', label: 'Demo', icon: 'monitoring' },
      { path: '/contact', label: 'Contact', icon: 'bell' },
    ]
  },
];

const allPublicSidebarItems = publicSidebarCategories.flatMap((c) => c.items);

const routePermissions = {
  '/home': [PERMISSION.DASHBOARD_READ],
  '/sensors': [PERMISSION.SENSORS_READ],
  '/analytics': [PERMISSION.ANALYTICS_READ],
  '/alerts': [PERMISSION.ANALYTICS_READ],
  '/controls': [PERMISSION.WATERING_START],
  '/intelligence': [PERMISSION.AI_CHAT],
  '/esp32': [PERMISSION.CONFIG_READ],
  '/settings': [PERMISSION.CONFIG_READ],
  '/viewer/dashboard': [PERMISSION.DASHBOARD_READ],
  '/viewer/analytics': [PERMISSION.ANALYTICS_READ],
  '/viewer/reports': [PERMISSION.ANALYTICS_READ],
};

const publicRoutes = [
  '/',
  '/about',
  '/features',
  '/contact',
  '/plant-library',
  '/demo',
  '/preview/dashboard',
  '/preview/analytics',
  '/reports-preview',
];

const DEFAULT_UI_PREFERENCES = {
  dashboardSections: {
    sensors: true,
    analytics: true,
    alerts: true,
    controls: true,
    ai: true,
    insights: true,
  },
  sidebarVisibility: {
    home: true,
    sensors: true,
    analytics: true,
    alerts: true,
    controls: true,
    ai: true,
    insights: true,
    esp32: true,
    settings: true,
  },
  widgets: {
    showAlertBadge: true,
    showStatusDots: true,
    showSystemStatusPanel: true,
  }
};

const SIDEBAR_KEY_BY_PATH = {
  '/home': 'home',
  '/sensors': 'sensors',
  '/analytics': 'analytics',
  '/alerts': 'alerts',
  '/controls': 'controls',
  '/intelligence': 'ai',
  '/esp32': 'esp32',
  '/settings': 'settings',
};

// ───────────────────────────────────────────────────────────────────────────
// HELPER UTILITIES & COMPONENTS
// ───────────────────────────────────────────────────────────────────────────

if (!import.meta.env.VITE_API_BASE_URL) {
  console.warn('VITE_API_BASE_URL environment variable is missing. API calls will default to /api.');
}

const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -15 }}
    transition={{ duration: 0.3, ease: 'easeInOut' }}
    style={{ height: '100%', width: '100%' }}
  >
    {children}
  </motion.div>
);

const RouteFallback = () => <PageSkeleton />;

function normalizeSensorPayload(payload) {
  if (!payload || typeof payload !== 'object') return payload;
  return {
    ...payload,
    soilMoisture: payload.soilMoisture ?? payload.moisture,
    moisture: payload.moisture ?? payload.soilMoisture,
    temperature: payload.temperature,
    humidity: payload.humidity,
    light: payload.light ?? payload.lightIntensity,
    pH: payload.pH ?? payload.ph,
    flowRate: payload.flowRate ?? payload.flowRateMlPerMin ?? payload.waterFlowRate,
    flowVolume: payload.flowVolume ?? payload.cycleVolumeML ?? payload.waterFlowVolume,
    leafCount: payload.leafCount ?? payload.leaf_count ?? payload.canopyLeafCount,
    timestamp: payload.timestamp ?? payload.lastSeen ?? new Date().toISOString(),
  };
}

function extractData(result) {
  if (!result || typeof result !== 'object') return result;
  return result.data || result;
}

function onlineToStatus(isOnline) {
  return isOnline ? 'online' : 'offline';
}

function statusLabel(status) {
  switch (status) {
    case 'online': return 'Online';
    case 'offline': return 'Offline';
    default: return 'Checking';
  }
}

function formatLastSeen(timestamp) {
  if (!timestamp) return 'Never';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleString();
}

function formatDiseaseName(name) {
  if (!name) return 'Unknown';
  return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ───────────────────────────────────────────────────────────────────────────
// APP COMPONENT
// ───────────────────────────────────────────────────────────────────────────
import { getCSSVariableValue } from './utils/colorUtils';

function App() {
  const location = useLocation();
  const auth = useAuth();
  const canReadSensorData = auth.hasPermission(PERMISSION.SENSORS_READ);
  const canFetchSystemData = auth.isAuthenticated;

  // Resolve real admin-assigned device IDs for this user
  const { sensorDeviceId, camDeviceId } = useDevices({ enabled: auth.isAuthenticated });

  const isAdminRoute = location.pathname.startsWith('/admin');
  const authPages = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/verify-email-pending', '/access-denied'];
  const isAuthPage = authPages.some((path) => location.pathname === path);
  const isPublicPage = publicRoutes.includes(location.pathname);
  const isGuestPublic = !auth.isAuthenticated && isPublicPage;

  useEffect(() => {
    if (sensorDeviceId && sensorDeviceId !== 'ESP32-SENSOR') {
      localStorage.setItem('selectedDeviceId', sensorDeviceId);
    }
  }, [sensorDeviceId]);

  // ── State ──────────────────────────────────────────────────────────────
  const [sensors, setSensors] = useState(null);
  const [pumpActive, setPumpActive] = useState(false);
  const [systemStatus, setSystemStatus] = useState({
    backend: 'checking',
    database: 'checking',
    esp32: 'checking',
    esp32Cam: 'checking',
    esp32LastSeen: null,
    esp32CamLastSeen: null,
    lastUpdated: null,
  });
  const [notification, setNotification] = useState({ message: '', type: 'info' });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef(null);
  const [moistureThreshold, setMoistureThreshold] = useState(30);
  const [isThresholdSaving, setIsThresholdSaving] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [plantGrowthEnabled, setPlantGrowthEnabled] = useState(true);
  const [plantGrowthStage, setPlantGrowthStage] = useState('vegetative');
  const [aiInsightsMode, setAiInsightsMode] = useState('snapshots');
  const [uiPreferences, setUiPreferences] = useState(DEFAULT_UI_PREFERENCES);
  const [isAiControlSaving, setIsAiControlSaving] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [palette, setPalette] = useState(() => localStorage.getItem('palette') || 'emerald');
  const themeTransitionTimeoutRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // ── Effects ────────────────────────────────────────────────────────────

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    // Match theme throughout website except admin sections
    if (isAdminRoute) {
      document.documentElement.setAttribute('data-palette', 'emerald');
    } else {
      document.documentElement.setAttribute('data-palette', palette);
    }
    localStorage.setItem('palette', palette);
  }, [palette, isAdminRoute]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) setIsSidebarCollapsed(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    return () => {
      if (themeTransitionTimeoutRef.current) clearTimeout(themeTransitionTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (isGuestPublic) return;
    if (isMockEnabled()) {
      setAlerts(getMockAlerts());
      return;
    }

    if (!sensors) return;
    const newAlerts = [];
    const now = new Date();
    if (sensors.soilMoisture !== undefined && sensors.soilMoisture < 20)
      newAlerts.push({ id: 'low-moisture', type: 'warning', message: 'Soil moisture critically low', value: `${sensors.soilMoisture}%`, time: now });
    if (sensors.temperature !== undefined && sensors.temperature > 38)
      newAlerts.push({ id: 'high-temp', type: 'error', message: 'High temperature detected', value: `${sensors.temperature} °C`, time: now });
    if (sensors.pH !== undefined && (sensors.pH < 5.5 || sensors.pH > 7.5))
      newAlerts.push({ id: 'ph-out', type: 'warning', message: 'pH level out of optimal range', value: `pH ${sensors.pH}`, time: now });
    if (sensors.humidity !== undefined && sensors.humidity < 30)
      newAlerts.push({ id: 'low-humidity', type: 'info', message: 'Low ambient humidity', value: `${sensors.humidity}%`, time: now });
    if (pumpActive && sensors.flowRate !== undefined && sensors.flowRate < 1)
      newAlerts.push({ id: 'no-flow', type: 'error', message: 'Pump active but flow is near zero', value: `${sensors.flowRate} mL/min`, time: now });
    setAlerts(prev => [
      ...newAlerts,
      ...prev.filter(a => a.source === 'ESP32-CAM'),
    ]);
  }, [sensors, pumpActive, isGuestPublic]);

  const fetchDiseaseAlerts = useCallback(async () => {
    if (isGuestPublic) return;
    if (isMockEnabled()) return;
    if (!auth.isAuthenticated) return;
    try {
      const end = new Date();
      const start = new Date(end.getTime() - 60 * 60 * 1000);
      const aiResp = await aiAPI.getDiseaseDetections({
        deviceId: camDeviceId,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        limit: 5,
      });
      const aiData = aiResp?.data || aiResp;
      const detections = Array.isArray(aiData?.detections) ? aiData.detections : [];
      if (!detections.length) return;
      const latest = detections[0];
      const isHealthy = !latest.detectedDisease ||
        ['healthy', 'unknown'].includes(latest.detectedDisease.toLowerCase());
      const newAlert = isHealthy
        ? { id: 'disease-healthy', type: 'info', message: 'ESP32-CAM: Plant appears healthy', value: latest.confidence !== undefined ? `Confidence: ${Math.round(latest.confidence * 100)}%` : 'No disease detected', source: 'ESP32-CAM', time: latest.timestamp ? new Date(latest.timestamp) : new Date() }
        : { id: `disease-${latest._id || latest.timestamp}`, type: 'error', message: `Plant disease detected: ${formatDiseaseName(latest.detectedDisease)}`, value: latest.confidence !== undefined ? `Confidence: ${Math.round(latest.confidence * 100)}%` : 'ESP32-CAM Detection', source: 'ESP32-CAM', time: latest.timestamp ? new Date(latest.timestamp) : new Date() };
      setAlerts(prev => [
        ...prev.filter(a => !(a.source === 'ESP32-CAM' && a.id.startsWith('disease-'))),
        newAlert,
      ]);
    } catch { /* Silently ignore */ }
  }, [isGuestPublic, camDeviceId]);

  useEffect(() => {
    fetchDiseaseAlerts();
    const interval = setInterval(fetchDiseaseAlerts, 5 * 60_000);
    return () => clearInterval(interval);
  }, [fetchDiseaseAlerts]);

  /*
   * changeTheme(newTheme)
   * - Applies a short visual transition using CSS custom properties
   * - Persists `data-theme` via `setTheme()` and updates runtime tokens
   * - Updates mobile `meta[name="theme-color"]` using the computed
   *   `--bg-color` token so the browser UI matches the selected theme.
   */
  const changeTheme = (newTheme) => {
    if (newTheme === theme) return;
    const root = document.documentElement;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTheme(newTheme);
      return;
    }
    const directions = [
      { fromX: '-140%', fromY: '0%', toX: '140%', toY: '0%', angle: '90deg' },
      { fromX: '140%', fromY: '0%', toX: '-140%', toY: '0%', angle: '270deg' },
      { fromX: '0%', fromY: '-140%', toX: '0%', toY: '140%', angle: '180deg' },
      { fromX: '0%', fromY: '140%', toX: '0%', toY: '-140%', angle: '0deg' },
      { fromX: '-140%', fromY: '-140%', toX: '140%', toY: '140%', angle: '135deg' },
      { fromX: '140%', fromY: '-140%', toX: '-140%', toY: '140%', angle: '225deg' },
    ];
    const d = directions[Math.floor(Math.random() * directions.length)];
    const driftX = d.toX.startsWith('-') ? '-32px' : d.toX.startsWith('1') ? '32px' : '0px';
    const driftY = d.toY.startsWith('-') ? '-32px' : d.toY.startsWith('1') ? '32px' : '0px';
    root.style.setProperty('--theme-ease', 'cubic-bezier(0.25, 0.46, 0.45, 0.94)');
    root.style.setProperty('--theme-scale', '1.02');
    root.style.setProperty('--theme-blur', '1.5px');
    root.style.setProperty('--theme-drift-x', driftX);
    root.style.setProperty('--theme-drift-y', driftY);
    root.style.setProperty('--theme-sweep-from-x', d.fromX);
    root.style.setProperty('--theme-sweep-from-y', d.fromY);
    root.style.setProperty('--theme-sweep-to-x', d.toX);
    root.style.setProperty('--theme-sweep-to-y', d.toY);
    root.style.setProperty('--theme-sweep-angle', d.angle);
    root.classList.remove('theme-transitioning');
    void root.offsetWidth;
    root.classList.add('theme-transitioning');
    setTheme(newTheme);
    // Update mobile browser theme color meta tags to match chosen theme
    try {
      const metaColor = getCSSVariableValue('--bg-color') || (newTheme === 'dark' ? '#050d14' : '#f0f8ff');
      document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.setAttribute('content', metaColor));
    } catch (e) { /* ignore */ }
    if (themeTransitionTimeoutRef.current) clearTimeout(themeTransitionTimeoutRef.current);
    themeTransitionTimeoutRef.current = setTimeout(() => {
      root.classList.remove('theme-transitioning');
      ['--theme-ease', '--theme-scale', '--theme-blur', '--theme-drift-x', '--theme-drift-y']
        .forEach(p => root.style.removeProperty(p));
    }, 4000);
  };

  const toggleTheme = () => changeTheme(theme === 'dark' ? 'light' : 'dark');

  const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);
  const closeSidebar  = () => { if (isMobile) setIsSidebarCollapsed(true); };

  // ── Edge Swipe Support for Mobile ──
  useEffect(() => {
    if (!isMobile) return;

    let touchStartX = 0;
    let touchStartTime = 0;

    const handleTouchStart = (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartTime = Date.now();
    };

    const handleTouchEnd = (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const duration = Date.now() - touchStartTime;
      const distance = touchEndX - touchStartX;

      // Detect swipe from left edge (within 50px) to right
      if (touchStartX < 50 && distance > 100 && duration < 300) {
        if (isSidebarCollapsed) setIsSidebarCollapsed(false);
      }
      // Detect swipe to left to close
      if (!isSidebarCollapsed && distance < -80 && duration < 300) {
        setIsSidebarCollapsed(true);
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, isSidebarCollapsed]);

  // ── Scroll Listener for Sidebar Stealth Mode ──
  useEffect(() => {
    const handleScroll = () => {
      if (!isSidebarCollapsed) return;
      
      setIsScrolling(true);
      
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 1000); // Hide for 1s after scroll stops
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [isSidebarCollapsed]);

  const filteredSidebarCategories = sidebarCategories
    .map((category) => ({
      ...category,
      items: category.items.filter((item) => {
        const permissions = routePermissions[item.path] || [];
        const key = SIDEBAR_KEY_BY_PATH[item.path];
        const allowedByRole = true;
        const allowedByPermission = permissions.every((permission) => auth.hasPermission(permission));
        const allowedBySidebarVisibility = key ? uiPreferences?.sidebarVisibility?.[key] !== false : true;
        const allowedByDashboardSection = key && key in (uiPreferences?.dashboardSections || {})
          ? uiPreferences?.dashboardSections?.[key] !== false
          : true;
        return allowedByRole && allowedByPermission && allowedBySidebarVisibility && allowedByDashboardSection;
      }),
    }))
    .filter((category) => category.items.length > 0);

  const filteredAllSidebarItems = filteredSidebarCategories.flatMap((category) => category.items);
  const activeSidebarCategories = isGuestPublic ? publicSidebarCategories : filteredSidebarCategories;
  const activeSidebarItems = isGuestPublic ? allPublicSidebarItems : filteredAllSidebarItems;
  const pageTitle = activeSidebarItems.find((i) => i.path === location.pathname)?.label || 'SproutSense';

  // ── WebSocket ──────────────────────────────────────────────────────────
  const handleWebSocketMessage = useCallback((data) => {
    if (isMockEnabled()) return; 
    const { type, data: payload } = data;
    switch (type) {
      case 'sensor_update':    setSensors(normalizeSensorPayload(payload)); break;
      case 'watering_started': 
        setPumpActive(true);  
        if (!isGuestPublic) showNotification('Watering started', 'success'); 
        break;
      case 'watering_stopped': 
        setPumpActive(false); 
        if (!isGuestPublic) showNotification('Watering stopped', 'info');    
        break;
      case 'config_updated':   
        if (!isGuestPublic) showNotification('Configuration updated', 'success'); 
        break;
      default: console.log('[WS] Unknown event:', type);
    }
  }, [isGuestPublic]);

  const { isConnected } = useWebSocket(handleWebSocketMessage);

  useEffect(() => {
    let offlineTimeout;
    if (isConnected) {
      setSystemStatus(prev => ({ ...prev, backend: onlineToStatus(true) }));
    } else {
      offlineTimeout = setTimeout(() => {
        setSystemStatus(prev => ({ ...prev, backend: onlineToStatus(false) }));
      }, 5000);
    }
    return () => { if (offlineTimeout) clearTimeout(offlineTimeout); };
  }, [isConnected]);

  useEffect(() => {
    if (isGuestPublic) return;
    let esp32OfflineTimeout, esp32CamOfflineTimeout;
    let lastEsp32Online = true, lastEsp32CamOnline = true;

    const fetchData = async () => {
      if (isMockEnabled()) {
        const mockSensorsArr = getMockSensors();
        const mockPrimary = mockSensorsArr.length > 0 ? mockSensorsArr[0] : null;

        setSensors(normalizeSensorPayload(mockPrimary));
        setAlerts(getMockAlerts()); // Instantly update alerts from mock
        setSystemStatus({
          backend: 'online', database: 'online', esp32: 'online', esp32Cam: 'online',
          esp32LastSeen: new Date().toISOString(), esp32CamLastSeen: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
        });
        return; 
      }

      if (!canFetchSystemData) return;

      try {
        const [sensorData, wateringStatus, configResponse, esp32StatusResponse, esp32CamStatusResponse, healthResponse] =
          await Promise.all([
            canReadSensorData ? sensorAPI.getLatest(sensorDeviceId) : Promise.resolve(null),
            wateringAPI.getStatus(sensorDeviceId),
            configAPI.get(sensorDeviceId),
            configAPI.getStatus(sensorDeviceId),
            configAPI.getStatus(camDeviceId),
            configAPI.getHealth(),
          ]);

        const configData         = extractData(configResponse);
        const latestSensorData   = extractData(sensorData);
        const latestWatering     = extractData(wateringStatus);
        const esp32Status        = extractData(esp32StatusResponse);
        const esp32CamStatus     = extractData(esp32CamStatusResponse);
        const healthData         = extractData(healthResponse);

        setSensors(canReadSensorData ? normalizeSensorPayload(latestSensorData) : null);
        setPumpActive(latestWatering?.pumpActive || false);
        setMoistureThreshold(configData?.soilMoistureThreshold ?? 30);
        setPlantGrowthEnabled(configData?.plantGrowthEnabled ?? true);
        setPlantGrowthStage(configData?.plantGrowthStage || 'vegetative');
        setAiInsightsMode(configData?.aiInsightsMode || 'snapshots');
        const userPrefs = auth.user?.uiPreferences || {};
        const globalPrefs = configData?.uiPreferences || {};

        setUiPreferences({
          dashboardSections: {
            ...DEFAULT_UI_PREFERENCES.dashboardSections,
            ...(globalPrefs.dashboardSections || {}),
            ...(userPrefs.dashboardSections || {}),
          },
          sidebarVisibility: {
            ...DEFAULT_UI_PREFERENCES.sidebarVisibility,
            ...(globalPrefs.sidebarVisibility || {}),
            ...(userPrefs.sidebarVisibility || {}),
          },
          widgets: {
            ...DEFAULT_UI_PREFERENCES.widgets,
            ...(globalPrefs.widgets || {}),
            ...(userPrefs.widgets || {}),
          },
          appearance: {
            ...DEFAULT_UI_PREFERENCES.appearance,
            ...(globalPrefs.appearance || {}),
            ...(userPrefs.appearance || {}),
          },
          notifications: {
            ...DEFAULT_UI_PREFERENCES.notifications,
            ...(globalPrefs.notifications || {}),
            ...(userPrefs.notifications || {}),
          },
          dataDisplay: {
            ...DEFAULT_UI_PREFERENCES.dataDisplay,
            ...(globalPrefs.dataDisplay || {}),
            ...(userPrefs.dataDisplay || {}),
          },
          accessibility: {
            ...DEFAULT_UI_PREFERENCES.accessibility,
            ...(globalPrefs.accessibility || {}),
            ...(userPrefs.accessibility || {}),
          },
          sensorRegistry: {
            ...DEFAULT_UI_PREFERENCES.sensorRegistry,
            ...(globalPrefs.sensorRegistry || {}),
            ...(userPrefs.sensorRegistry || {}),
          }
        });

        const isDeviceOnline = (s) => {
          if (!s?.online || !s?.lastSeen) return false;
          return new Date(s.lastSeen).getTime() > Date.now() - 5 * 60 * 1000;
        };

        const esp32IsOnline    = isDeviceOnline(esp32Status);
        const esp32CamIsOnline = isDeviceOnline(esp32CamStatus);

        if (esp32IsOnline) {
          if (esp32OfflineTimeout) clearTimeout(esp32OfflineTimeout);
          lastEsp32Online = true;
        } else if (lastEsp32Online) {
          esp32OfflineTimeout = setTimeout(() => {
            setSystemStatus(prev => ({ ...prev, esp32: onlineToStatus(false), esp32LastSeen: esp32Status?.lastSeen || null }));
          }, 5000);
          lastEsp32Online = false;
        }

        if (esp32CamIsOnline) {
          if (esp32CamOfflineTimeout) clearTimeout(esp32CamOfflineTimeout);
          lastEsp32CamOnline = true;
        } else if (lastEsp32CamOnline) {
          esp32CamOfflineTimeout = setTimeout(() => {
            setSystemStatus(prev => ({ ...prev, esp32Cam: onlineToStatus(false), esp32CamLastSeen: esp32CamStatus?.lastSeen || null }));
          }, 5000);
          lastEsp32CamOnline = false;
        }

        setSystemStatus(prev => ({
          ...prev,
          backend:          healthData?.backend === 'healthy' ? 'online' : onlineToStatus(isConnected),
          database:         healthData?.database === 'connected' ? 'online' : 'offline',
          esp32:            esp32IsOnline ? onlineToStatus(true) : prev.esp32,
          esp32Cam:         esp32CamIsOnline ? onlineToStatus(true) : prev.esp32Cam,
          esp32LastSeen:    esp32Status?.lastSeen || null,
          esp32CamLastSeen: esp32CamStatus?.lastSeen || null,
          lastUpdated:      new Date().toISOString(),
        }));
      } catch (error) {
        console.error('[App] Failed to fetch initial data:', error);
        setSystemStatus(prev => ({ ...prev, backend: onlineToStatus(isConnected), database: 'offline', esp32: 'offline', esp32Cam: 'offline', esp32LastSeen: null, esp32CamLastSeen: null, lastUpdated: new Date().toISOString() }));
      }
    };

    // ── LISTEN FOR INSTANT MOCK UPDATES ──
    const unsubscribe = subscribeToMockUpdates(() => {
      if (isMockEnabled()) {
        fetchData(); // Triggers immediately when mock panel saves a change
      }
    });

    fetchData();
    const interval = isConnected ? null : setInterval(fetchData, 15000);
    return () => {
      if (interval) clearInterval(interval);
      unsubscribe();
      if (esp32OfflineTimeout)    clearTimeout(esp32OfflineTimeout);
      if (esp32CamOfflineTimeout) clearTimeout(esp32CamOfflineTimeout);
    };
  }, [isGuestPublic, isConnected, canReadSensorData, sensorDeviceId, camDeviceId]);

  // ── Watering & Config handlers ─────────────────────────────────────────
  const handleStartWatering = async () => {
    if(isMockEnabled()) { showNotification('Mock: Pump Started', 'success'); setPumpActive(true); return; }
    try { await wateringAPI.start(); showNotification('Watering command sent', 'success'); }
    catch { showNotification('Failed to start watering', 'error'); }
  };
  const handleStopWatering = async () => {
    if(isMockEnabled()) { showNotification('Mock: Pump Stopped', 'info'); setPumpActive(false); return; }
    try { await wateringAPI.stop(); showNotification('Stop command sent', 'success'); }
    catch { showNotification('Failed to stop watering', 'error'); }
  };
  const handleSaveMoistureThreshold = async () => {
    if(isMockEnabled()) { showNotification('Mock: Threshold Saved', 'success'); return; }
    setIsThresholdSaving(true);
    try { await configAPI.update(sensorDeviceId, { soilMoistureThreshold: moistureThreshold }); showNotification('Moisture threshold saved', 'success'); }
    catch { showNotification('Failed to save moisture threshold', 'error'); }
    finally { setIsThresholdSaving(false); }
  };
  const handleSaveAiControls = async () => {
    if(isMockEnabled()) { showNotification('Mock: AI Settings Saved', 'success'); return; }
    setIsAiControlSaving(true);
    try { await configAPI.update(sensorDeviceId, { plantGrowthEnabled, plantGrowthStage, aiInsightsMode }); showNotification('Growth and AI insight settings saved', 'success'); }
    catch { showNotification('Failed to save growth and AI settings', 'error'); }
    finally { setIsAiControlSaving(false); }
  };

  const showNotification = (message, type = 'info') => {
    if (isGuestPublic) return; // Silent notifications for guest/public pages
    setNotification({ message, type });
  };
  const closeNotification = () => setNotification({ message: '', type: 'info' });
  const handleClearAlert    = useCallback((id) => setAlerts(prev => prev.filter(a => a.id !== id)), []);
  const handleClearAllAlerts = useCallback(() => setAlerts([]), []);

  // ── Aurora colour stops (react to theme) ──────────────────────────────
  const getAuroraStops = (t) => {
    if (t === 'light') return AURORA_LIGHT;
    if (t === 'midnight') return ['#050814', '#2b1b54', '#1f3e7a', '#050814'];
    if (t === 'forest') return ['#020b05', '#164024', '#0d5930', '#020b05'];
    return AURORA_DARK;
  };
  const auroraStops = getAuroraStops(theme);
  const auroraBlend = theme === 'light' ? 0.58 : 0.50;

  // ── Render ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!auth.loading) {
      // Signal the loading screen to dismiss once auth is resolved and UI is updating.
      // Double rAF ensures the browser has committed the first paint,
      // then a 150 ms buffer guarantees the initial layout is visible.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            window.dispatchEvent(new Event('sproutsense:ready'));
          }, 150);
        });
      });
    }
  }, [auth.loading]);

  if (auth.loading) {
    return null; // The #ss-loader in index.html will remain visible during this time
  }

  if (isAuthPage) {
    if (auth.isAuthenticated && !['/access-denied', '/verify-email-pending', '/verify-email'].includes(location.pathname)) {
      return <Navigate to={auth.homeForRole()} replace />;
    }

    return (
      <>
        <Aurora
          colorStops={auroraStops}
          amplitude={AURORA_AMPLITUDE}
          blend={auroraBlend}
          speed={AURORA_SPEED}
        />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/verify-email-pending" element={<VerifyPendingPage />} />
              <Route path="/access-denied" element={<AccessDeniedPage />} />
            </Routes>
          </Suspense>
        </div>
      </>
    );
  }

  if (isPublicPage && auth.isAuthenticated) {
    return <Navigate to={auth.homeForRole()} replace />;
  }

  if (!auth.isAuthenticated && !isPublicPage) {
    return <Navigate to="/login" replace />;
  }

  if (auth.accountStatus === ACCOUNT_STATUS.PENDING_VERIFICATION) {
    return <Navigate to="/verify-email-pending" replace />;
  }

  if ([ACCOUNT_STATUS.SUSPENDED, ACCOUNT_STATUS.DISABLED].includes(auth.accountStatus)) {
    return <Navigate to="/access-denied" replace state={{ reason: auth.accountStatus }} />;
  }

  if (isAdminRoute) {
    return (
      <>
        <Aurora
          colorStops={auroraStops}
          amplitude={AURORA_AMPLITUDE}
          blend={auroraBlend}
          speed={AURORA_SPEED}
        />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/admin/login" element={<Navigate to="/login" replace />} />
              <Route path="/admin/panel" element={
                <ProtectedAdminRoute>
                  <AdminPanelPage />
                </ProtectedAdminRoute>
              } />
              <Route path="/admin" element={<Navigate to="/admin/panel" replace />} />
              <Route path="/admin/*" element={<Navigate to="/admin/panel" replace />} />
            </Routes>
          </Suspense>
        </div>
      </>
    );
  }

  return (
    <>
      {/* ── Aurora: fixed full-screen WebGL background layer ── */}
      <Aurora
        colorStops={auroraStops}
        amplitude={AURORA_AMPLITUDE}
        blend={auroraBlend}
        speed={AURORA_SPEED}
      />

      <div className={`app-shell${isSidebarCollapsed ? ' sidebar-collapsed' : ''}${isPublicPage ? ' public-shell' : ''}${isScrolling ? ' is-scrolling' : ''}`} style={{ position: 'relative', zIndex: 1 }}>

        {!isSidebarCollapsed && isMobile && (
          <div className="sidebar-overlay" onClick={closeSidebar} />
        )}

        <Navbar
          currentPage={pageTitle}
          isMobile={isMobile}
          isSidebarCollapsed={isSidebarCollapsed}
          toggleSidebar={toggleSidebar}
          theme={theme}
          toggleTheme={toggleTheme}
          alertCount={isGuestPublic || uiPreferences?.widgets?.showAlertBadge === false ? 0 : alerts.length}
          isConnected={isConnected}
          auth={auth}
          isPublicView={isGuestPublic}
        />

        {/* ── Fixed sidebar ── */}
        <aside className={`sidebar ${isScrolling ? 'scrolling-hidden' : ''}`} role="navigation" aria-label="Main navigation">
          <div className="sidebar-brand">
            <img src="/assets/icon.png" className="sidebar-brand-icon" alt="SproutSense logo" />
            <span className="sidebar-brand-text">SproutSense</span>
          </div>

          <nav className="sidebar-nav">
            {activeSidebarCategories.map((category) => (
              <div key={category.label} className="sidebar-category">
                {!isGuestPublic && <span className="sidebar-cat-label">{category.label}</span>}
                {category.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                    title={isSidebarCollapsed ? item.label : ''}
                    onClick={closeSidebar}
                  >
                    <span className="sidebar-icon-wrap">
                      <GlassIcon name={item.icon} className="sidebar-icon" />
                      {item.path === '/alerts' && alerts.length > 0 && (
                        <span className="sidebar-badge">{alerts.length}</span>
                      )}
                      {uiPreferences?.widgets?.showStatusDots !== false && item.path === '/backend' && (
                        <span className={`sidebar-status-dot ${systemStatus.backend}`} />
                      )}
                      {uiPreferences?.widgets?.showStatusDots !== false && item.path === '/esp32' && (
                        <span className={`sidebar-status-dot ${
                          systemStatus.esp32Cam === 'online' || systemStatus.esp32 === 'online' ? 'online' : 'offline'
                        }`} />
                      )}
                    </span>
                    <span className="sidebar-label">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>

          <div className="sidebar-footer">
            <button className="sidebar-logout-btn" onClick={auth.logout} aria-label="Sign out">
              <span className="sidebar-icon-wrap">
                <GlassIcon name="logout" className="sidebar-icon" />
              </span>
              <span className="sidebar-label">Sign Out</span>
              <div className="logout-glow" />
            </button>
          </div>
        </aside>

        {/* ── Main content area ── */}
        <div className="container" style={{ display: 'flex', flexDirection: 'column' }}>
          
          <MockBanner />


          {notification.message && (
            <Notification message={notification.message} type={notification.type} onClose={closeNotification} />
          )}

          {/* Toaster — styled to match current theme palette */}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'var(--toast-bg)',
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
                color: 'var(--toast-text)',
                border: '1px solid var(--border-soft)',
                borderRadius: '12px',
                boxShadow: 'var(--toast-shadow)',
                fontSize: '0.88rem',
              },
              success: {
                iconTheme: {
                  primary: 'var(--success-primary)',
                  secondary: 'var(--success-secondary)',
                },
              },
              error: {
                iconTheme: {
                  primary: 'var(--error-primary)',
                  secondary: 'var(--error-secondary)',
                },
              },
            }}
          />

          <AnimatePresence mode="wait">
            <Suspense fallback={<RouteFallback />}>
              <Routes location={location} key={location.pathname}>
              {isGuestPublic ? (
                <>
                  <Route path="/" element={<PageWrapper><section className="dashboard-section"><PublicHomePage /></section></PageWrapper>} />
                  <Route path="/about" element={<PageWrapper><section className="dashboard-section"><PublicAboutPage /></section></PageWrapper>} />
                  <Route path="/features" element={<PageWrapper><section className="dashboard-section"><PublicFeaturesPage /></section></PageWrapper>} />
                  <Route path="/contact" element={<PageWrapper><section className="dashboard-section"><PublicContactPage /></section></PageWrapper>} />
                  <Route path="/plant-library" element={<PageWrapper><section className="dashboard-section"><PublicPlantLibraryPage /></section></PageWrapper>} />
                  <Route path="/demo" element={<PageWrapper><section className="dashboard-section"><PublicDemoPage /></section></PageWrapper>} />
                  <Route path="/preview/dashboard" element={<Navigate to="/demo" replace />} />
                  <Route path="/preview/analytics" element={<Navigate to="/demo" replace />} />
                  <Route path="/reports-preview" element={<Navigate to="/demo" replace />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </>
              ) : (
                <>
              <Route path="/" element={<Navigate to="/home" replace />} />

              <Route path="/home" element={
                <ProtectedRoute requiredPermissions={[PERMISSION.DASHBOARD_READ]}>
                  <PageWrapper><HomePage theme={theme} sensors={sensors} isConnected={isConnected} /></PageWrapper>
                </ProtectedRoute>
              } />

              <Route path="/backend" element={
                <ProtectedRoute requiredPermissions={[PERMISSION.CONFIG_READ]}>
                  <PageWrapper>
                    <section className="dashboard-section">
                      <div className="dashboard dashboard-single">
                        <div className="card">
                          <h2 className="card-title"><GlassIcon name="server" className="card-title-icon" /> Backend Status</h2>
                          <div className="status-grid">
                            {[['server', 'API Server', systemStatus.backend], ['database', 'Database', systemStatus.database]]
                              .map(([icon, label, status]) => (
                                <div key={label} className="status-item">
                                  <div className="status-item-header"><GlassIcon name={icon} /><span className="status-item-label">{label}</span></div>
                                  <span className={`status-badge status-${status}`}>{statusLabel(status)}</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    </section>
                  </PageWrapper>
                </ProtectedRoute>
              } />

              <Route path="/esp32" element={
                <ProtectedRoute>
                  <PageWrapper>
                    <section className="dashboard-section">
                      <div className="dashboard dashboard-single">
                        <React.Suspense fallback={<div>Loading...</div>}>
                          <ESP32StatusPage 
                            isConnected={isConnected} 
                            systemStatus={systemStatus} 
                          />
                        </React.Suspense>
                      </div>
                    </section>
                  </PageWrapper>
                </ProtectedRoute>
              } />

              <Route path="/sensors" element={
                <ProtectedRoute requiredPermissions={[PERMISSION.SENSORS_READ]}>
                  <PageWrapper>
                    <section className="dashboard-section dashboard-section-wide">
                      <div className="dashboard dashboard-single dashboard-wide">
                        <SensorCard sensors={sensors} isConnected={isConnected} />
                      </div>
                    </section>
                  </PageWrapper>
                </ProtectedRoute>
              } />

              <Route path="/analytics" element={
                <ProtectedRoute requiredPermissions={[PERMISSION.ANALYTICS_READ]}>
                  <PageWrapper><section className="dashboard-section"><AnalyticsPage /></section></PageWrapper>
                </ProtectedRoute>
              } />

              <Route path="/alerts" element={
                <ProtectedRoute requiredPermissions={[PERMISSION.ANALYTICS_READ]}>
                  <PageWrapper>
                    <section className="dashboard-section">
                      <div style={{ marginTop: '2rem' }}>
                        <AlertsPage alerts={alerts} sensors={sensors} onClearAlert={handleClearAlert} onClearAllAlerts={handleClearAllAlerts} />
                      </div>
                    </section>
                  </PageWrapper>
                </ProtectedRoute>
              } />

              <Route path="/controls" element={
                <ProtectedRoute requiredPermissions={[PERMISSION.WATERING_START]}>
                  <PageWrapper>
                    <section className="dashboard-section dashboard-section-wide">
                      <div className="dashboard dashboard-single dashboard-wide">
                        <ControlCard
                          pumpActive={pumpActive} onStartWatering={handleStartWatering} onStopWatering={handleStopWatering}
                          moistureThreshold={moistureThreshold} onMoistureThresholdChange={setMoistureThreshold}
                          onSaveMoistureThreshold={handleSaveMoistureThreshold} isThresholdSaving={isThresholdSaving}
                          plantGrowthEnabled={plantGrowthEnabled} onPlantGrowthEnabledChange={setPlantGrowthEnabled}
                          plantGrowthStage={plantGrowthStage} onPlantGrowthStageChange={setPlantGrowthStage}
                          aiInsightsMode={aiInsightsMode} onAiInsightsModeChange={setAiInsightsMode}
                          onSaveAiControls={handleSaveAiControls} isAiControlSaving={isAiControlSaving}
                          sensors={sensors} onNotification={showNotification}
                        />
                      </div>
                    </section>
                  </PageWrapper>
                </ProtectedRoute>
              } />

              <Route path="/intelligence" element={
                <ProtectedRoute requiredPermissions={[PERMISSION.AI_CHAT]} requireLinkedDevice>
                  <PageWrapper><section className="dashboard-section dashboard-section-wide"><IntelligenceHub sensors={sensors} sensorDeviceId={sensorDeviceId} /></section></PageWrapper>
                </ProtectedRoute>
              } />
              <Route path="/ai" element={<Navigate to="/intelligence?tab=chat" replace />} />
              <Route path="/insights" element={<Navigate to="/intelligence?tab=insights" replace />} />

              <Route path="/viewer/dashboard" element={<Navigate to="/sensors" replace />} />
              <Route path="/viewer/analytics" element={<Navigate to="/analytics" replace />} />
              <Route path="/viewer/reports" element={
                <ProtectedRoute requiredPermissions={[PERMISSION.ANALYTICS_READ]}>
                  <PageWrapper><ViewerReportsPage /></PageWrapper>
                </ProtectedRoute>
              } />

              <Route path="/config" element={<Navigate to="/settings" replace />} />

              <Route path="/settings" element={
                <ProtectedRoute requiredPermissions={[PERMISSION.CONFIG_READ]}>
                  <PageWrapper>
                    <section className="dashboard-section">
                      <SettingsPage theme={theme} setTheme={changeTheme} palette={palette} setPalette={setPalette} toggleTheme={toggleTheme} onNotification={showNotification} />
                    </section>
                  </PageWrapper>
                </ProtectedRoute>
              } />

              <Route path="*" element={<Navigate to="/home" replace />} />
                </>
              )}
              </Routes>
            </Suspense>
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}

export default App; 