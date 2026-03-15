// web/src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassIcon } from '../components/GlassIcon';
import '../styles/HomePage.css';

const HomePage = ({ theme, sensors, isConnected }) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const soilMoisture = sensors?.soilMoisture ?? 0;
  const temperature = sensors?.temperature ?? 0;
  const humidity = sensors?.humidity ?? 0;
  const pH = sensors?.pH ?? 0;

  const quickStats = [
    {
      label: 'Soil Moisture',
      value: `${soilMoisture}%`,
      icon: 'watering',
      status: soilMoisture < 30 ? 'warning' : soilMoisture < 50 ? 'info' : 'success',
    },
    {
      label: 'Temperature',
      value: `${temperature}°C`,
      icon: 'temperature',
      status: temperature > 35 ? 'warning' : 'success',
    },
    {
      label: 'Humidity',
      value: `${humidity}%`,
      icon: 'humidity',
      status: humidity < 30 ? 'info' : 'success',
    },
    {
      label: 'pH Level',
      value: pH.toFixed(1),
      icon: 'ph',
      status: pH < 5.5 || pH > 7.5 ? 'warning' : 'success',
    },
  ];

  const features = [
    {
      title: 'Smart Monitoring',
      description:
        '6 sensors track soil moisture, temperature, humidity, pH, NPK, and light intensity in real-time via dual ESP32 architecture.',
      icon: 'monitoring',
      path: '/sensors',
    },
    {
      title: 'Auto Watering',
      description:
        'Intelligent pump control with moisture thresholds, timed watering, and daily scheduling – no overwatering or underwatering.',
      icon: 'watering',
      path: '/controls',
    },
    {
      title: 'AI Disease Detection',
      description:
        'Edge Impulse ML model on ESP32-CAM identifies 9 plant diseases (leaf spot, rust, blight, etc.) at the edge.',
      icon: 'disease',
      path: '/insights',
    },
    {
      title: 'Real-time Dashboard',
      description:
        'WebSocket live data streaming, interactive charts, historical analytics, and instant alerts for critical conditions.',
      icon: 'bell',
      path: '/analytics',
    },
  ];

  const techStack = [
    {
      category: 'Hardware',
      items: ['ESP32-SENSOR-001', 'ESP32-CAM-001', 'Soil Moisture', 'DHT22', 'pH Sensor', 'NPK Sensor'],
    },
    {
      category: 'Backend',
      items: ['Node.js', 'Express', 'MongoDB Atlas', 'WebSocket', 'REST API', 'Render'],
    },
    {
      category: 'Frontend',
      items: ['React 18', 'Vite', 'Recharts', 'React Router', 'Netlify'],
    },
    {
      category: 'AI / ML',
      items: ['Edge Impulse', 'TensorFlow Lite', 'On-device Inference', 'Image Classification'],
    },
  ];

  return (
    <div className={`homepage-new ${isVisible ? 'visible' : ''}`} data-theme={theme}>
      {/* HERO */}
      <section className="hero-modern">
        <div className="hero-inner">
          <div className="hero-content-modern">
            <div className="hero-badge">
              <GlassIcon name="sprout" className="hero-badge-icon" />
              <span>IoT + AI Plant Care System</span>
            </div>

            <h1 className="hero-title-modern">
              SproutSense:
              <br />
              <span className="gradient-text">Smart Plant Care Without the Guesswork</span>
            </h1>

            <p className="hero-subtitle-modern">
              Dual ESP32 microcontrollers, multi-sensor monitoring, AI-powered disease detection, and automated watering –
              keeping your plants healthy 24/7.
            </p>

            <div className="hero-actions">
              <button className="btn-hero btn-hero-primary" onClick={() => navigate('/controls')}>
                <GlassIcon name="controls" />
                <span>Control System</span>
              </button>
              <button className="btn-hero btn-hero-secondary" onClick={() => navigate('/sensors')}>
                <GlassIcon name="sensors" />
                <span>Live Dashboard</span>
              </button>
            </div>
          </div>

          {/* RIGHT SIDE: CREATIVE SYSTEM CARDS (no images) */}
          <div className="hero-media">
            <div className="hero-media-card hero-media-hardware">
              <div className="hero-media-chip">
                <GlassIcon name="esp32" />
                <span>ESP32-SENSOR-001</span>
              </div>
              <p className="hero-media-text">
                Reads soil moisture, temperature, humidity, pH, NPK and controls the water pump with safe ADC1 pins and
                external relay supply.
              </p>
              <div className="hero-media-tags">
                <span>Soil</span>
                <span>Climate</span>
                <span>pH</span>
                <span>Pump</span>
              </div>
            </div>

            <div className="hero-media-card hero-media-ai">
              <div className="hero-media-chip hero-media-chip-ai">
                <GlassIcon name="ai" />
                <span>ESP32-CAM-001</span>
              </div>
              <p className="hero-media-text">
                Captures leaf images and runs Edge Impulse models on-device for early disease detection in 9 classes.
              </p>
              <div className="hero-media-tags">
                <span>Disease</span>
                <span>Leaf Spot</span>
                <span>Rust</span>
              </div>
            </div>

            <div className="hero-media-status-card">
              <div className="hero-status-row">
                <GlassIcon name="esp32" />
                <span>Dual ESP32 nodes online</span>
              </div>
              <div className="hero-status-row">
                <GlassIcon name="watering" />
                <span>Smart watering ready</span>
              </div>
              <div className="hero-status-row">
                <GlassIcon name="server" />
                <span>Cloud dashboard & MongoDB</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LIVE STATS */}
      <section className="stats-section">
        <div className="section-header-center">
          <h2>Live Plant Health Metrics</h2>
          <p className="section-subtitle">
            {isConnected ? (
              <span className="status-online">
                <GlassIcon name="check" /> System Online • Real-time WebSocket Data
              </span>
            ) : (
              <span className="status-offline">
                <GlassIcon name="close" /> Connecting to ESP32 sensors...
              </span>
            )}
          </p>
        </div>

        <div className="stats-grid">
          {quickStats.map((stat, index) => (
            <div
              key={stat.label}
              className={`stat-card stat-card-${stat.status}`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="stat-icon-wrapper">
                <GlassIcon name={stat.icon} className="stat-icon" />
              </div>
              <div className="stat-content">
                <span className="stat-label">{stat.label}</span>
                <span className="stat-value">{stat.value}</span>
              </div>
              <div className={`stat-indicator stat-indicator-${stat.status}`} />
            </div>
          ))}
        </div>
      </section>

      {/* OVERVIEW */}
      <section className="overview-section">
        <div className="section-container">
          <div className="overview-content">
            <h2 className="section-title">About SproutSense</h2>
            <div className="overview-grid">
              <div className="overview-card">
                <GlassIcon name="leaf" className="overview-icon" />
                <h3>The Problem</h3>
                <p>
                  Overwatering, underwatering, poor soil conditions and undetected diseases cause huge losses. Manual
                  monitoring is time‑consuming and error‑prone.
                </p>
              </div>
              <div className="overview-card">
                <GlassIcon name="sprout" className="overview-icon" />
                <h3>Our Solution</h3>
                <p>
                  SproutSense automates plant care with multi‑sensor data, AI disease detection on ESP32‑CAM, and smart
                  irrigation controlled from a cloud dashboard.
                </p>
              </div>
              <div className="overview-card">
                <GlassIcon name="check" className="overview-icon" />
                <h3>Key Benefits</h3>
                <ul className="benefits-list">
                  <li>✓ Precision irrigation and water savings</li>
                  <li>✓ Early disease alerts from on‑device AI</li>
                  <li>✓ Real‑time monitoring via WebSocket</li>
                  <li>✓ Automatic logs and analytics in MongoDB</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features-section-new">
        <div className="section-header-center">
          <h2>Core Features</h2>
          <p className="section-subtitle">Everything you need for intelligent, automated plant care</p>
        </div>

        <div className="features-grid-new">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="feature-card-new"
              style={{ animationDelay: `${index * 150}ms` }}
              onClick={() => navigate(feature.path)}
            >
              <div className="feature-icon-bg">
                <GlassIcon name={feature.icon} className="feature-icon-new" />
              </div>
              <h3 className="feature-title-new">{feature.title}</h3>
              <p className="feature-desc-new">{feature.description}</p>
              <div className="feature-arrow">
                <GlassIcon name="arrow-right" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ARCHITECTURE */}
      <section className="architecture-section">
        <div className="section-container">
          <h2 className="section-title">System Architecture</h2>
          <div className="architecture-grid">
            <div className="arch-card">
              <h3>Dual ESP32 Setup</h3>
              <ul>
                <li>
                  <strong>ESP32-SENSOR-001:</strong> ADC1 sensors + relay pump control.
                </li>
                <li>
                  <strong>ESP32-CAM-001:</strong> Disease detection with Edge Impulse model.
                </li>
                <li>
                  <strong>Link:</strong> WiFi → REST API + WebSocket to backend.
                </li>
              </ul>
            </div>
            <div className="arch-card">
              <h3>Backend Infrastructure</h3>
              <ul>
                <li>
                  <strong>Server:</strong> Node.js + Express on Render.
                </li>
                <li>
                  <strong>Database:</strong> MongoDB Atlas (SensorReading, WateringLog, DiseaseDetection collections).
                </li>
                <li>
                  <strong>APIs:</strong> /api/sensors, /api/watering, /api/ai, /api/config.
                </li>
              </ul>
            </div>
            <div className="arch-card">
              <h3>Frontend Dashboard</h3>
              <ul>
                <li>React + Vite single‑page app.</li>
                <li>Analytics, alerts, AI insights, and controls.</li>
                <li>Deployed to Netlify for fast previews.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* TECH STACK */}
      <section className="tech-stack-section">
        <div className="section-container">
          <h2 className="section-title">Technology Stack</h2>
          <div className="tech-stack-grid">
            {techStack.map((stack, index) => (
              <div
                key={stack.category}
                className="tech-stack-card"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <h3>{stack.category}</h3>
                <div className="tech-items">
                  {stack.items.map((item) => (
                    <span key={item} className="tech-badge">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QUICK ACTIONS */}
      <section className="quick-actions-section">
        <div className="quick-actions-card">
          <div className="quick-actions-header">
            <h2>Quick Actions</h2>
            <p>Control your SproutSense system</p>
          </div>
          <div className="quick-actions-grid">
            <button className="quick-action-btn" onClick={() => navigate('/controls')}>
              <GlassIcon name="watering" className="qa-icon" />
              <span>Water Now</span>
            </button>
            <button className="quick-action-btn" onClick={() => navigate('/sensors')}>
              <GlassIcon name="sensors" className="qa-icon" />
              <span>View Sensors</span>
            </button>
            <button className="quick-action-btn" onClick={() => navigate('/analytics')}>
              <GlassIcon name="records" className="qa-icon" />
              <span>History</span>
            </button>
            <button className="quick-action-btn" onClick={() => navigate('/settings')}>
              <GlassIcon name="settings" className="qa-icon" />
              <span>Settings</span>
            </button>
          </div>
        </div>
      </section>

      {/* STATUS */}
      <section className="system-status-section">
        <div className="status-card-compact">
          <h3>System Status</h3>
          <div className="status-indicators">
            <div className="status-indicator-item">
              <span className="status-dot status-online" />
              <span>Backend API (Render)</span>
            </div>
            <div className="status-indicator-item">
              <span className="status-dot status-online" />
              <span>MongoDB Atlas</span>
            </div>
            <div className="status-indicator-item">
              <span className="status-dot status-online" />
              <span>ESP32 Devices</span>
            </div>
            <div className="status-indicator-item">
              <span className="status-dot status-online" />
              <span>WebSocket Live</span>
            </div>
          </div>
          <p className="status-footer">
            All systems operational • Last updated: {new Date().toLocaleString()}
          </p>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
