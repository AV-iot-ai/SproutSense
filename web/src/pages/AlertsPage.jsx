import React, { useState } from 'react';
import { GlassIcon } from '../components/GlassIcon';
import './AlertsPage.css';

const SEVERITY_ORDER = { error: 0, warning: 1, info: 2 };

const SENSOR_THRESHOLDS = [
  {
    metric: 'Soil Moisture',
    icon: 'humidity',
    min: 20,
    max: 80,
    unit: '%',
    key: 'soilMoisture',
    color: '#22c55e',
    description: 'Optimal range: 20–80%. Below 20% is critically dry.',
  },
  {
    metric: 'Temperature',
    icon: 'temperature',
    min: 15,
    max: 38,
    unit: '°C',
    key: 'temperature',
    color: '#f59e0b',
    description: 'Optimal range: 15–38°C. Plants exposed to >38°C may wilt.',
  },
  {
    metric: 'Humidity',
    icon: 'weather',
    min: 30,
    max: 90,
    unit: '%',
    key: 'humidity',
    color: '#22d3ee',
    description: 'Optimal: 30–90%. Low humidity dries leaves faster.',
  },
  {
    metric: 'pH',
    icon: 'ph',
    min: 5.5,
    max: 7.5,
    unit: '',
    key: 'pH',
    color: '#a78bfa',
    description: 'Optimal: 5.5–7.5. Outside this range inhibits nutrient uptake.',
  },
  {
    metric: 'Light',
    icon: 'light',
    min: 200,
    max: 80000,
    unit: ' lux',
    key: 'light',
    color: '#fbbf24',
    description: 'Indoor plants: 200–5000 lux; outdoor: up to 80000 lux.',
  },
];

function formatTime(ts) {
  if (!ts) return 'Now';
  const d = new Date(ts);
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export default function AlertsPage({ alerts = [], sensors, onClearAlert, onClearAllAlerts }) {
  const [filter, setFilter] = useState('all');
  const [dismissed, setDismissed] = useState(new Set());

  const visibleAlerts = alerts.filter(a => !dismissed.has(a.id));

  const filtered = filter === 'all'
    ? visibleAlerts
    : visibleAlerts.filter(a => a.type === filter);

  const sorted = [...filtered].sort((a, b) =>
    (SEVERITY_ORDER[a.type] ?? 9) - (SEVERITY_ORDER[b.type] ?? 9)
  );

  const counts = visibleAlerts.reduce((acc, a) => {
    acc[a.type] = (acc[a.type] || 0) + 1;
    return acc;
  }, {});

  const handleDismiss = (id) => {
    setDismissed(prev => new Set([...prev, id]));
    if (onClearAlert) onClearAlert(id);
  };

  const handleClearAll = () => {
    const allIds = new Set(visibleAlerts.map(a => a.id));
    setDismissed(prev => new Set([...prev, ...allIds]));
    if (onClearAllAlerts) onClearAllAlerts();
  };

  return (
    <div className="alerts-page">
      {/* Header */}
      <div className="alerts-header">
        <div className="alerts-header-left">
          <GlassIcon name="bell" />
          <div>
            <h1 className="alerts-title">Alerts</h1>
            <p className="alerts-subtitle">Real-time sensor threshold monitoring</p>
          </div>
        </div>
        <div className="alerts-counts">
          {counts.error > 0 && (
            <span className="alerts-badge error">{counts.error} Critical</span>
          )}
          {counts.warning > 0 && (
            <span className="alerts-badge warning">{counts.warning} Warning</span>
          )}
          {counts.info > 0 && (
            <span className="alerts-badge info">{counts.info} Info</span>
          )}
          {visibleAlerts.length === 0 && (
            <span className="alerts-badge success">All Clear</span>
          )}
          {visibleAlerts.length > 0 && (
            <button
              className="alerts-clear-btn"
              onClick={handleClearAll}
              title="Clear all alerts"
            >
              <GlassIcon name="close" />
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="alerts-filters">
        {['all', 'error', 'warning', 'info'].map(f => (
          <button
            key={f}
            className={`alerts-filter-tab${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? `All (${visibleAlerts.length})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${counts[f] || 0})`}
          </button>
        ))}
      </div>

      <div className="alerts-body">
        {/* Active Alerts */}
        <div className="alerts-list-section">
          <h2 className="alerts-section-title">
            <GlassIcon name="warning" />
            Active Alerts
          </h2>
          {sorted.length === 0 ? (
            <div className="alerts-empty">
              <GlassIcon name="success" />
              <p>No {filter === 'all' ? '' : filter + ' '}alerts — all sensors within normal range.</p>
            </div>
          ) : (
            <div className="alerts-list">
              {sorted.map(alert => (
                <div key={alert.id} className={`alert-item ${alert.type}`}>
                  <div className="alert-item-icon">
                    <GlassIcon name={alert.type === 'error' ? 'error' : alert.type === 'warning' ? 'warning' : 'info'} />
                  </div>
                  <div className="alert-item-content">
                    <span className="alert-item-msg">{alert.message}</span>
                    <span className="alert-item-val">{alert.value}</span>
                    {alert.source && (
                      <span className="alert-item-source">{alert.source}</span>
                    )}
                  </div>
                  <span className="alert-item-time">{formatTime(alert.time)}</span>
                  <button
                    className="alert-dismiss-btn"
                    onClick={() => handleDismiss(alert.id)}
                    title="Dismiss alert"
                    aria-label="Dismiss"
                  >
                    <GlassIcon name="close" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Threshold reference */}
        <div className="alerts-thresholds-section">
          <h2 className="alerts-section-title">
            <GlassIcon name="chart" />
            Threshold Reference
          </h2>
          <div className="alerts-thresholds-grid">
            {SENSOR_THRESHOLDS.map(t => {
              const current = sensors?.[t.key];
              const inRange = current !== undefined
                ? (current >= t.min && current <= t.max)
                : null;
              return (
                <div
                  key={t.key}
                  className={`threshold-card ${inRange === false ? 'out-of-range' : inRange === true ? 'in-range' : ''}`}
                  style={{ '--t-color': t.color }}
                >
                  <div className="tc-header">
                    <GlassIcon name={t.icon} />
                    <span className="tc-metric">{t.metric}</span>
                    {inRange !== null && (
                      <span className={`tc-status ${inRange ? 'ok' : 'alert'}`}>
                        <GlassIcon name={inRange ? 'success' : 'warning'} />
                        {inRange ? 'OK' : 'Alert'}
                      </span>
                    )}
                  </div>
                  <div className="tc-current">
                    {current !== undefined
                      ? <><strong>{current}{t.unit}</strong> <span className="tc-current-label">current</span></>
                      : <span className="tc-no-data">No data</span>
                    }
                  </div>
                  <div className="tc-range">
                    Optimal: {t.min}–{t.max}{t.unit}
                  </div>
                  {current !== undefined && (
                    <div className="tc-bar-wrap">
                      <div className="tc-bar">
                        <div
                          className={`tc-bar-fill ${inRange ? 'ok' : 'alert'}`}
                          style={{ width: `${Math.min(100, Math.max(0, ((current - t.min) / (t.max - t.min)) * 100))}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <p className="tc-desc">{t.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
