import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useWebSocket } from './hooks/useWebSocket';
import { configAPI, sensorAPI, wateringAPI, aiAPI } from './utils/api';
import { Navbar } from './components/Navbar';
import { SensorCard } from './components/SensorCard';
import { ControlCard } from './components/ControlCard';
import { AIRecommendation } from './components/AIRecommendation';
import { ConfigCard } from './components/ConfigCard';
import { Notification } from './components/Notification';
import { GlassIcon } from './components/GlassIcon';
import HomePage from './pages/HomePage';
import SettingsPage from './pages/SettingsPage';
import RecordsPage from './pages/RecordsPage';
import AlertsPage from './pages/AlertsPage';
import AIChat from './pages/AIChat';
import InsightsPage from './pages/InsightsPage';
import './App.css';

// Sidebar category structure
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
      { path: '/records', label: 'Records', icon: 'records' },
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
      { path: '/ai', label: 'AI Assistant', icon: 'bot' },
      { path: '/insights', label: 'Insights', icon: 'insights' },
    ]
  },
  {
    label: 'System',
    items: [
      { path: '/backend', label: 'Backend', icon: 'server' },
      { path: '/esp32', label: 'Device Connected', icon: 'esp32' },
      { path: '/config', label: 'Config', icon: 'config' },
      { path: '/settings', label: 'Settings', icon: 'settings' },
    ]
  },
];

const allSidebarItems = sidebarCategories.flatMap(c => c.items);

function normalizeSensorPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  return {
    ...payload,
    pH: payload.pH ?? payload.ph,
    flowRate: payload.flowRate ?? payload.flowRateMlPerMin ?? payload.waterFlowRate,
    flowVolume: payload.flowVolume ?? payload.cycleVolumeML ?? payload.waterFlowVolume,
    leafCount: payload.leafCount ?? payload.leaf_count ?? payload.canopyLeafCount,
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
    case 'online':
      return 'Online';
    case 'offline':
      return 'Offline';
    default:
      return 'Checking';
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

function App() {
  const location = useLocation();
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
  const [moistureThreshold, setMoistureThreshold] = useState(30);
  const [isThresholdSaving, setIsThresholdSaving] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [plantGrowthEnabled, setPlantGrowthEnabled] = useState(true);
  const [plantGrowthStage, setPlantGrowthStage] = useState('vegetative');
  const [aiInsightsMode, setAiInsightsMode] = useState('snapshots');
  const [isAiControlSaving, setIsAiControlSaving] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });
  const themeTransitionTimeoutRef = useRef(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Apply theme on mount and when it changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Handle window resize
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
      if (themeTransitionTimeoutRef.current) {
        clearTimeout(themeTransitionTimeoutRef.current);
      }
    };
  }, []);

  // Auto-generate alerts from sensor readings + ESP32-CAM disease detections
  useEffect(() => {
    if (!sensors) return;
    const newAlerts = [];
    const now = new Date();
    if (sensors.soilMoisture !== undefined && sensors.soilMoisture < 20) {
      newAlerts.push({ id: 'low-moisture', type: 'warning', message: 'Soil moisture critically low', value: `${sensors.soilMoisture}%`, time: now });
    }
    if (sensors.temperature !== undefined && sensors.temperature > 38) {
      newAlerts.push({ id: 'high-temp', type: 'error', message: 'High temperature detected', value: `${sensors.temperature} °C`, time: now });
    }
    if (sensors.pH !== undefined && (sensors.pH < 5.5 || sensors.pH > 7.5)) {
      newAlerts.push({ id: 'ph-out', type: 'warning', message: 'pH level out of optimal range', value: `pH ${sensors.pH}`, time: now });
    }
    if (sensors.humidity !== undefined && sensors.humidity < 30) {
      newAlerts.push({ id: 'low-humidity', type: 'info', message: 'Low ambient humidity', value: `${sensors.humidity}%`, time: now });
    }
    if (pumpActive && sensors.flowRate !== undefined && sensors.flowRate < 1) {
      newAlerts.push({ id: 'no-flow', type: 'error', message: 'Pump active but flow is near zero', value: `${sensors.flowRate} mL/min`, time: now });
    }
    setAlerts(prev => {
      // Preserve disease alerts from ESP32-CAM, replace sensor alerts
      const diseaseAlerts = prev.filter(a => a.source === 'ESP32-CAM');
      return [...newAlerts, ...diseaseAlerts];
    });
  }, [sensors, pumpActive]);

  // Fetch latest ESP32-CAM disease detection and inject as alert
  const fetchDiseaseAlerts = useCallback(async () => {
    try {
      const end = new Date();
      const start = new Date(end.getTime() - 60 * 60 * 1000); // last 1 hour
      const aiResp = await aiAPI.getDiseaseDetections({
        deviceId: 'ESP32-CAM',
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        limit: 5,
      });
      const aiData = aiResp?.data || aiResp;
      const detections = Array.isArray(aiData?.detections) ? aiData.detections : [];
      if (detections.length === 0) return;

      const latest = detections[0];
      const isHealthy = !latest.detectedDisease ||
        latest.detectedDisease.toLowerCase() === 'healthy' ||
        latest.detectedDisease.toLowerCase() === 'unknown';

      if (!isHealthy) {
        const diseaseAlert = {
          id: `disease-${latest._id || latest.timestamp}`,
          type: 'error',
          message: `Plant disease detected: ${formatDiseaseName(latest.detectedDisease)}`,
          value: latest.confidence !== undefined
            ? `Confidence: ${Math.round(latest.confidence * 100)}%`
            : 'ESP32-CAM Detection',
          source: 'ESP32-CAM',
          time: latest.timestamp ? new Date(latest.timestamp) : new Date(),
        };
        setAlerts(prev => {
          const withoutOldDisease = prev.filter(
            a => !(a.source === 'ESP32-CAM' && a.id.startsWith('disease-'))
          );
          return [...withoutOldDisease, diseaseAlert];
        });
      } else {
        // Plant is healthy — add info alert
        const healthyAlert = {
          id: 'disease-healthy',
          type: 'info',
          message: 'ESP32-CAM: Plant appears healthy',
          value: latest.confidence !== undefined
            ? `Confidence: ${Math.round(latest.confidence * 100)}%`
            : 'No disease detected',
          source: 'ESP32-CAM',
          time: latest.timestamp ? new Date(latest.timestamp) : new Date(),
        };
        setAlerts(prev => {
          const withoutOldDisease = prev.filter(
            a => !(a.source === 'ESP32-CAM' && a.id.startsWith('disease-'))
          );
          return [...withoutOldDisease, healthyAlert];
        });
      }
    } catch (e) {
      // Silently ignore; disease API may be unavailable
    }
  }, []);

  // Poll disease alerts every 60 seconds
  useEffect(() => {
    fetchDiseaseAlerts();
    const interval = setInterval(fetchDiseaseAlerts, 60000);
    return () => clearInterval(interval);
  }, [fetchDiseaseAlerts]);

  const toggleTheme = () => {
    const root = document.documentElement;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
      return;
    }

    const transitionDirections = [
      { fromX: '-140%', fromY: '0%', toX: '140%', toY: '0%', angle: '90deg' },
      { fromX: '140%', fromY: '0%', toX: '-140%', toY: '0%', angle: '270deg' },
      { fromX: '0%', fromY: '-140%', toX: '0%', toY: '140%', angle: '180deg' },
      { fromX: '0%', fromY: '140%', toX: '0%', toY: '-140%', angle: '0deg' },
      { fromX: '-140%', fromY: '-140%', toX: '140%', toY: '140%', angle: '135deg' },
      { fromX: '140%', fromY: '-140%', toX: '-140%', toY: '140%', angle: '225deg' },
      { fromX: '-140%', fromY: '140%', toX: '140%', toY: '-140%', angle: '45deg' },
      { fromX: '140%', fromY: '140%', toX: '-140%', toY: '-140%', angle: '315deg' },
      { fromX: '-100%', fromY: '-100%', toX: '100%', toY: '100%', angle: '45deg' },
      { fromX: '100%', fromY: '100%', toX: '-100%', toY: '-100%', angle: '225deg' }
    ];

    const direction = transitionDirections[Math.floor(Math.random() * transitionDirections.length)];
    const driftX = direction.toX.startsWith('-') ? '-10px' : direction.toX.startsWith('1') ? '10px' : '0px';
    const driftY = direction.toY.startsWith('-') ? '-10px' : direction.toY.startsWith('1') ? '10px' : '0px';

    root.style.setProperty('--theme-ease', 'cubic-bezier(0.25, 0.46, 0.45, 0.94)');
    root.style.setProperty('--theme-scale', '1.02');
    root.style.setProperty('--theme-blur', '1.5px');
    root.style.setProperty('--theme-drift-x', driftX);
    root.style.setProperty('--theme-drift-y', driftY);
    root.style.setProperty('--theme-sweep-from-x', direction.fromX);
    root.style.setProperty('--theme-sweep-from-y', direction.fromY);
    root.style.setProperty('--theme-sweep-to-x', direction.toX);
    root.style.setProperty('--theme-sweep-to-y', direction.toY);
    root.style.setProperty('--theme-sweep-angle', direction.angle);
    root.classList.remove('theme-transitioning');
    void root.offsetWidth;
    root.classList.add('theme-transitioning');

    const applyTheme = () => {
      setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    };

    if (document.startViewTransition) {
      document.startViewTransition(applyTheme);
    } else {
      applyTheme();
    }

    if (themeTransitionTimeoutRef.current) {
      clearTimeout(themeTransitionTimeoutRef.current);
    }

    themeTransitionTimeoutRef.current = setTimeout(() => {
      root.classList.remove('theme-transitioning');
      root.style.removeProperty('--theme-ease');
      root.style.removeProperty('--theme-scale');
      root.style.removeProperty('--theme-blur');
      root.style.removeProperty('--theme-drift-x');
      root.style.removeProperty('--theme-drift-y');
    }, 1350);
  };
  const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);
  const closeSidebar = () => { if (isMobile) setIsSidebarCollapsed(true); };

  const pageTitle = allSidebarItems.find(i => i.path === location.pathname)?.label || 'SproutSense';

  // WebSocket message handler
  const handleWebSocketMessage = useCallback((data) => {
    const { type, data: payload } = data;
    switch (type) {
      case 'sensor_update':
        setSensors(normalizeSensorPayload(payload));
        break;
      case 'watering_started':
        setPumpActive(true);
        showNotification('Watering started', 'success');
        break;
      case 'watering_stopped':
        setPumpActive(false);
        showNotification('Watering stopped', 'info');
        break;
      case 'config_updated':
        showNotification('Configuration updated', 'success');
        break;
      default:
        console.log('Unknown WebSocket event:', type);
    }
  }, []);

  const { isConnected } = useWebSocket(handleWebSocketMessage);

  useEffect(() => {
    setSystemStatus((prev) => ({
      ...prev,
      backend: onlineToStatus(isConnected),
    }));
  }, [isConnected]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sensorData, wateringStatus, configResponse, esp32StatusResponse, esp32CamStatusResponse, healthResponse] = await Promise.all([
          sensorAPI.getLatest(),
          wateringAPI.getStatus(),
          configAPI.get(),
          configAPI.getStatus('ESP32-SENSOR'),
          configAPI.getStatus('ESP32-CAM'),
          configAPI.getHealth('ESP32-SENSOR'),
        ]);
        const configData = extractData(configResponse);
        const latestSensorData = extractData(sensorData);
        const latestWateringStatus = extractData(wateringStatus);
        const esp32Status = extractData(esp32StatusResponse);
        const esp32CamStatus = extractData(esp32CamStatusResponse);
        const healthData = extractData(healthResponse);

        setSensors(normalizeSensorPayload(latestSensorData));
        setPumpActive(latestWateringStatus?.pumpActive || false);
        setMoistureThreshold(configData?.soilMoistureThreshold ?? 30);
        setPlantGrowthEnabled(configData?.plantGrowthEnabled ?? true);
        setPlantGrowthStage(configData?.plantGrowthStage || 'vegetative');
        setAiInsightsMode(configData?.aiInsightsMode || 'snapshots');

        // Determine online status: device is online if online flag is true
        // AND lastSeen within the last 5 minutes (consistent with backend stale check)
        const isDeviceOnline = (statusObj) => {
          if (!statusObj?.online) return false;
          if (!statusObj?.lastSeen) return false;
          const fiveMinAgo = Date.now() - 5 * 60 * 1000;
          return new Date(statusObj.lastSeen).getTime() > fiveMinAgo;
        };

        setSystemStatus((prev) => ({
          ...prev,
          backend: healthData?.backend === 'healthy' ? 'online' : onlineToStatus(isConnected),
          database: healthData?.database === 'connected' ? 'online' : 'offline',
          esp32: onlineToStatus(isDeviceOnline(esp32Status)),
          esp32Cam: onlineToStatus(isDeviceOnline(esp32CamStatus)),
          esp32LastSeen: esp32Status?.lastSeen || null,
          esp32CamLastSeen: esp32CamStatus?.lastSeen || null,
          lastUpdated: new Date().toISOString(),
        }));
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
        setSystemStatus((prev) => ({
          ...prev,
          backend: onlineToStatus(isConnected),
          database: 'offline',
          esp32: 'offline',
          esp32Cam: 'offline',
          esp32LastSeen: null,
          esp32CamLastSeen: null,
          lastUpdated: new Date().toISOString(),
        }));
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStartWatering = async () => {
    try {
      await wateringAPI.start();
      showNotification('Watering command sent', 'success');
    } catch {
      showNotification('Failed to start watering', 'error');
    }
  };

  const handleStopWatering = async () => {
    try {
      await wateringAPI.stop();
      showNotification('Stop command sent', 'success');
    } catch {
      showNotification('Failed to stop watering', 'error');
    }
  };

  const handleSaveMoistureThreshold = async () => {
    setIsThresholdSaving(true);
    try {
      await configAPI.update('ESP32-SENSOR', { soilMoistureThreshold: moistureThreshold });
      showNotification('Moisture threshold saved', 'success');
    } catch {
      showNotification('Failed to save moisture threshold', 'error');
    } finally {
      setIsThresholdSaving(false);
    }
  };

  const handleSaveAiControls = async () => {
    setIsAiControlSaving(true);
    try {
      await configAPI.update('ESP32-SENSOR', {
        plantGrowthEnabled,
        plantGrowthStage,
        aiInsightsMode,
      });
      showNotification('Growth and AI insight settings saved', 'success');
    } catch {
      showNotification('Failed to save growth and AI settings', 'error');
    } finally {
      setIsAiControlSaving(false);
    }
  };

  const showNotification = (message, type = 'info') => setNotification({ message, type });
  const closeNotification = () => setNotification({ message: '', type: 'info' });

  // Alert handlers
  const handleClearAlert = useCallback((id) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  const handleClearAllAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  return (
    <div className={`app-shell${isSidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      {/* Overlay for mobile */}
      {!isSidebarCollapsed && isMobile && (
        <div className="sidebar-overlay" onClick={closeSidebar} />
      )}

      <aside className="sidebar" role="navigation" aria-label="Main navigation">
        {/* Sidebar brand */}
        <div className="sidebar-brand">
          <GlassIcon name="sprout" className="sidebar-brand-icon" />
          <span className="sidebar-brand-text">SproutSense</span>
        </div>

        <nav className="sidebar-nav">
          {sidebarCategories.map((category) => (
            <div key={category.label} className="sidebar-category">
              <span className="sidebar-cat-label">{category.label}</span>
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
                    {item.path === '/backend' && (
                      <span className={`sidebar-status-dot ${systemStatus.backend}`} title={`Backend: ${statusLabel(systemStatus.backend)}`} />
                    )}
                    {item.path === '/esp32' && (
                      <span className={`sidebar-status-dot ${systemStatus.esp32Cam === 'online' || systemStatus.esp32 === 'online' ? 'online' : 'offline'}`} title={`ESP32: ${statusLabel(systemStatus.esp32)} | ESP32-CAM: ${statusLabel(systemStatus.esp32Cam)}`} />
                    )}
                  </span>
                  <span className="sidebar-label">{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-system-status" aria-label="System status overview">
          <div className="sidebar-system-row">
            <span className="sidebar-system-label">Backend</span>
            <span className={`sidebar-system-pill ${systemStatus.backend}`}>{statusLabel(systemStatus.backend)}</span>
          </div>
          <div className="sidebar-system-row">
            <span className="sidebar-system-label">ESP32</span>
            <span className={`sidebar-system-pill ${systemStatus.esp32}`}>{statusLabel(systemStatus.esp32)}</span>
          </div>
          <div className="sidebar-system-row">
            <span className="sidebar-system-label">ESP32-CAM</span>
            <span className={`sidebar-system-pill ${systemStatus.esp32Cam}`}>{statusLabel(systemStatus.esp32Cam)}</span>
          </div>
        </div>
      </aside>

      <div className="container">
        <Navbar
          currentPage={pageTitle}
          isMobile={isMobile}
          isSidebarCollapsed={isSidebarCollapsed}
          toggleSidebar={toggleSidebar}
          theme={theme}
          toggleTheme={toggleTheme}
          alertCount={alerts.length}
        />

        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<HomePage theme={theme} sensors={sensors} isConnected={isConnected} />} />
          <Route
            path="/backend"
            element={
              <section className="dashboard-section">
                <div className="dashboard dashboard-single">
                  <div className="card">
                    <h2 className="card-title">
                      <GlassIcon name="server" className="card-title-icon" />
                      Backend Status
                    </h2>
                    <div className="status-grid">
                      <div className="status-item">
                        <div className="status-item-header">
                          <GlassIcon name="server" />
                          <span className="status-item-label">API Server</span>
                        </div>
                        <span className={`status-badge status-${systemStatus.backend}`}>
                          {statusLabel(systemStatus.backend)}
                        </span>
                      </div>
                      <div className="status-item">
                        <div className="status-item-header">
                          <GlassIcon name="database" />
                          <span className="status-item-label">Database</span>
                        </div>
                        <span className={`status-badge status-${systemStatus.database}`}>
                          {statusLabel(systemStatus.database)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            }
          />
          <Route
            path="/esp32"
            element={
              <section className="dashboard-section">
                <div className="dashboard dashboard-single">
                  <div className="card">
                    <h2 className="card-title">
                      <GlassIcon name="esp32" className="card-title-icon" />
                      ESP32 Device Status
                    </h2>
                    <div className="status-grid">
                      <div className="status-item">
                        <div className="status-item-header">
                          <GlassIcon name="esp32" />
                          <span className="status-item-label">ESP32 Sensor Board</span>
                        </div>
                        <div>
                          <span className={`status-badge status-${systemStatus.esp32}`}>
                            {statusLabel(systemStatus.esp32)}
                          </span>
                          <div className="status-subtext">Last seen: {formatLastSeen(systemStatus.esp32LastSeen)}</div>
                        </div>
                      </div>
                      <div className="status-item">
                        <div className="status-item-header">
                          <GlassIcon name="image" />
                          <span className="status-item-label">ESP32-CAM</span>
                        </div>
                        <div>
                          <span className={`status-badge status-${systemStatus.esp32Cam}`}>
                            {statusLabel(systemStatus.esp32Cam)}
                          </span>
                          <div className="status-subtext">Last seen: {formatLastSeen(systemStatus.esp32CamLastSeen)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            }
          />
          <Route
            path="/sensors"
            element={
              <section className="dashboard-section dashboard-section-wide">
                <div className="dashboard dashboard-single dashboard-wide">
                  <SensorCard sensors={sensors} isConnected={isConnected} />
                </div>
              </section>
            }
          />
          <Route
            path="/records"
            element={
              <section className="dashboard-section">
                <RecordsPage />
              </section>
            }
          />
          <Route
            path="/alerts"
            element={
              <section className="dashboard-section">
                <AlertsPage
                  alerts={alerts}
                  sensors={sensors}
                  onClearAlert={handleClearAlert}
                  onClearAllAlerts={handleClearAllAlerts}
                />
              </section>
            }
          />
          <Route
            path="/controls"
            element={
              <section className="dashboard-section dashboard-section-wide">
                <div className="dashboard dashboard-single dashboard-wide">
                  <ControlCard
                    pumpActive={pumpActive}
                    onStartWatering={handleStartWatering}
                    onStopWatering={handleStopWatering}
                    moistureThreshold={moistureThreshold}
                    onMoistureThresholdChange={setMoistureThreshold}
                    onSaveMoistureThreshold={handleSaveMoistureThreshold}
                    isThresholdSaving={isThresholdSaving}
                    plantGrowthEnabled={plantGrowthEnabled}
                    onPlantGrowthEnabledChange={setPlantGrowthEnabled}
                    plantGrowthStage={plantGrowthStage}
                    onPlantGrowthStageChange={setPlantGrowthStage}
                    aiInsightsMode={aiInsightsMode}
                    onAiInsightsModeChange={setAiInsightsMode}
                    onSaveAiControls={handleSaveAiControls}
                    isAiControlSaving={isAiControlSaving}
                    sensors={sensors}
                    onNotification={showNotification}
                  />
                </div>
              </section>
            }
          />
          <Route
            path="/ai"
            element={
              <section className="dashboard-section">
                <AIChat sensors={sensors} />
              </section>
            }
          />
          <Route
            path="/insights"
            element={
              <section className="dashboard-section">
                <InsightsPage />
              </section>
            }
          />
          <Route
            path="/config"
            element={
              <section className="dashboard-section">
                <div className="dashboard dashboard-single">
                  <ConfigCard onNotification={showNotification} systemStatus={systemStatus} />
                </div>
              </section>
            }
          />
          <Route
            path="/settings"
            element={
              <section className="dashboard-section">
                <SettingsPage
                  theme={theme}
                  toggleTheme={toggleTheme}
                  onNotification={showNotification}
                />
              </section>
            }
          />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>

        {notification.message && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={closeNotification}
          />
        )}
      </div>
    </div>
  );
}

export default App;
