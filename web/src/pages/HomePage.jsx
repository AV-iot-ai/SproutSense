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
  const light = sensors?.lightIntensity ?? 0;

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
      description: '6 sensors tracking soil, environment, and plant health in real-time',
      icon: 'monitoring',
      path: '/sensors',
    },
    {
      title: 'Auto Watering',
      description: 'Intelligent watering based on soil moisture and weather forecasts',
      icon: 'watering',
      path: '/controls',
    },
    {
      title: 'AI Disease Detection',
      description: 'On-device ML model identifies plant diseases with 85%+ accuracy',
      icon: 'disease',
      path: '/insights',
    },
    {
      title: 'Real-time Alerts',
      description: 'Instant notifications for critical plant health issues',
      icon: 'bell',
      path: '/alerts',
    },
  ];

  return (
    <div className={`homepage-new ${isVisible ? 'visible' : ''}`}>
      {/* Hero Section */}
      <section className="hero-modern">
        <div className="hero-content-modern">
          <div className="hero-badge">
            <GlassIcon name="sprout" className="hero-badge-icon" />
            <span>IoT + AI Plant Care</span>
          </div>
          <h1 className="hero-title-modern">
            Smart Plant Care,
            <br />
            <span className="gradient-text">Without the Guesswork</span>
          </h1>
          <p className="hero-subtitle-modern">
            SproutSense monitors your plants 24/7, waters them automatically, and detects diseases using AI—so your plants stay healthy even when you're busy.
          </p>
          <div className="hero-actions">
            <button className="btn-hero btn-hero-primary" onClick={() => navigate('/controls')}>
              <GlassIcon name="controls" />
              <span>Start Monitoring</span>
            </button>
            <button className="btn-hero btn-hero-secondary" onClick={() => navigate('/sensors')}>
              <GlassIcon name="sensors" />
              <span>View Dashboard</span>
            </button>
          </div>
        </div>
      </section>

      {/* Live Stats Grid */}
      <section className="stats-section">
        <div className="section-header-center">
          <h2>Live Plant Health</h2>
          <p className="section-subtitle">
            {isConnected ? (
              <span className="status-online">
                <GlassIcon name="check" /> System Online • Real-time data
              </span>
            ) : (
              <span className="status-offline">
                <GlassIcon name="close" /> Connecting to sensors...
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

      {/* Features Grid */}
      <section className="features-section-new">
        <div className="section-header-center">
          <h2>Powerful Features</h2>
          <p className="section-subtitle">
            Everything you need for healthy, thriving plants
          </p>
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

      {/* Quick Actions */}
      <section className="quick-actions-section">
        <div className="quick-actions-card">
          <div className="quick-actions-header">
            <h2>Quick Actions</h2>
            <p>Control your plant care system</p>
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
            <button className="quick-action-btn" onClick={() => navigate('/records')}>
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

      {/* System Status */}
      <section className="system-status-section">
        <div className="status-card-compact">
          <h3>System Status</h3>
          <div className="status-indicators">
            <div className="status-indicator-item">
              <span className="status-dot status-online" />
              <span>Backend Online</span>
            </div>
            <div className="status-indicator-item">
              <span className="status-dot status-online" />
              <span>ESP32 Connected</span>
            </div>
            <div className="status-indicator-item">
              <span className="status-dot status-online" />
              <span>Database Active</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
