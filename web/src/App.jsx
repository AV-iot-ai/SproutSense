import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useWebSocket } from './hooks/useWebSocket';
import { configAPI, sensorAPI, wateringAPI } from './utils/api';
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
    ]
  },
  {
    label: 'System',
    items: [
      { path: '/config', label: 'Config', icon: 'config' },
      { path: '/settings', label: 'Settings', icon: 'settings' },
    ]
  },
];

const allSidebarItems = sidebarCategories.flatMap(c => c.items);

function App() {
  const location = useLocation();
  const [sensors, setSensors] = useState(null);
  const [pumpActive, setPumpActive] = useState(false);
  const [deviceOnline, setDeviceOnline] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: 'info' });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [moistureThreshold, setMoistureThreshold] = useState(30);
  const [isThresholdSaving, setIsThresholdSaving] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

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

  // Auto-generate alerts based on sensor readings
  useEffect(() => {
    if (!sensors) return;
    const newAlerts = [];
    const now = new Date();
    if (sensors.soilMoisture !== undefined && sensors.soilMoisture < 20) {
      newAlerts.push({ id: 'low-moisture', type: 'warning', message: 'Soil moisture critically low', value: `${sensors.soilMoisture}%`, time: now });
    }
    if (sensors.temperature !== undefined && sensors.temperature > 38) {
      newAlerts.push({ id: 'high-temp', type: 'error', message: 'High temperature detected', value: `${sensors.temperature}°C`, time: now });
    }
    if (sensors.pH !== undefined && (sensors.pH < 5.5 || sensors.pH > 7.5)) {
      newAlerts.push({ id: 'ph-out', type: 'warning', message: 'pH level out of optimal range', value: `pH ${sensors.pH}`, time: now });
    }
    if (sensors.humidity !== undefined && sensors.humidity < 30) {
      newAlerts.push({ id: 'low-humidity', type: 'info', message: 'Low ambient humidity', value: `${sensors.humidity}%`, time: now });
    }
    setAlerts(newAlerts);
  }, [sensors]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);
  const closeSidebar = () => { if (isMobile) setIsSidebarCollapsed(true); };

  const pageTitle = allSidebarItems.find(i => i.path === location.pathname)?.label || 'SproutSense';

  // WebSocket message handler
  const handleWebSocketMessage = useCallback((data) => {
    const { type, data: payload } = data;
    switch (type) {
      case 'sensor_update':
        setSensors(payload);
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

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sensorData, statusData] = await Promise.all([
          sensorAPI.getLatest(),
          wateringAPI.getStatus()
        ]);
        const configResponse = await configAPI.get();
        const configData = configResponse.data || configResponse;
        setSensors(sensorData.data || sensorData);
        setPumpActive(statusData.data?.pumpActive || false);
        setMoistureThreshold(configData?.soilMoistureThreshold ?? 30);
        
        // Check if ESP32 device is online based on recent sensor data
        const deviceIsOnline = !!(sensorData && (sensorData.data || sensorData).timestamp);
        setDeviceOnline(deviceIsOnline);
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
        setDeviceOnline(false);
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
      await configAPI.update('ESP32-001', { soilMoistureThreshold: moistureThreshold });
      showNotification('Moisture threshold saved', 'success');
    } catch {
      showNotification('Failed to save moisture threshold', 'error');
    } finally {
      setIsThresholdSaving(false);
    }
  };

  const showNotification = (message, type = 'info') => setNotification({ message, type });
  const closeNotification = () => setNotification({ message: '', type: 'info' });

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
                  </span>
                  <span className="sidebar-label">{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <div className="container">
        <Navbar
          currentPage={pageTitle}
          isConnected={isConnected}
          deviceOnline={deviceOnline}
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
            path="/sensors"
            element={
              <section className="dashboard-section">
                <div className="dashboard dashboard-single">
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
                <AlertsPage alerts={alerts} sensors={sensors} />
              </section>
            }
          />
          <Route
            path="/controls"
            element={
              <section className="dashboard-section">
                <div className="dashboard dashboard-single">
                  <ControlCard
                    pumpActive={pumpActive}
                    onStartWatering={handleStartWatering}
                    onStopWatering={handleStopWatering}
                    moistureThreshold={moistureThreshold}
                    onMoistureThresholdChange={setMoistureThreshold}
                    onSaveMoistureThreshold={handleSaveMoistureThreshold}
                    isThresholdSaving={isThresholdSaving}
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
            path="/config"
            element={
              <section className="dashboard-section">
                <div className="dashboard dashboard-single">
                  <ConfigCard onNotification={showNotification} />
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
