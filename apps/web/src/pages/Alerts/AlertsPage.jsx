import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LineChart, Line
} from 'recharts';
import { GlassIcon } from '../../components/bits/GlassIcon';
import { getCSSVariableValue } from '../../utils/colorUtils';
import styles from './AlertsPage.module.css';
import { aiAPI } from '../../utils/api';
import { format, formatDistanceToNow } from 'date-fns';
import { SkeletonLoader } from '../../components/layout/SkeletonLoader';
import { useWebSocket } from '../../hooks/useWebSocket';
import { toast } from 'react-hot-toast';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDiseaseName(name) {
  if (!name || name === 'healthy') return 'Healthy';
  return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ─── Mock data generators ─────────────────────────────────────────────────────
const MOCK_DISEASES = [
  'healthy', 'healthy', 'healthy',
  'leaf_blight', 'powdery_mildew', 'healthy',
  'early_blight', 'healthy', 'healthy', 'rust',
];

function generateMockDetections() {
  return Array.from({ length: 12 }, (_, i) => {
    const disease = MOCK_DISEASES[i % MOCK_DISEASES.length];
    return {
      _id             : `mock-${i}`,
      detectedDisease : disease,
      confidence      : disease === 'healthy' ? 0.88 + Math.random() * 0.1 : 0.65 + Math.random() * 0.3,
      timestamp       : new Date(Date.now() - i * 5 * 3600_000).toISOString(),
      imageUrl        : null,
      isMock          : true,
    };
  });
}

function generateMockSystemAlerts(sensors) {
  const base = [
    {
      id      : 'mock-moisture',
      type    : 'warning',
      message : 'Soil moisture below threshold',
      value   : '18%',
      time    : new Date(Date.now() - 12 * 60_000),
    },
    {
      id      : 'mock-temp',
      type    : 'error',
      message : 'High temperature detected',
      value   : '39.2 °C',
      time    : new Date(Date.now() - 38 * 60_000),
    },
    {
      id      : 'mock-ph',
      type    : 'warning',
      message : 'pH level out of optimal range',
      value   : 'pH 8.1',
      time    : new Date(Date.now() - 2 * 3600_000),
    },
    {
      id      : 'mock-humidity',
      type    : 'info',
      message : 'Low ambient humidity',
      value   : '26%',
      time    : new Date(Date.now() - 5 * 3600_000),
    },
    {
      id      : 'mock-disease',
      type    : 'error',
      message : 'Plant disease detected: Leaf Blight',
      value   : 'Confidence 82%',
      source  : 'ESP32-CAM',
      time    : new Date(Date.now() - 8 * 3600_000),
    },
  ];
  return base;
}

// ─── Severity config
// Build runtime severity colors from CSS tokens so alert rows and panels
// match the active theme. Use `getCSSVariableValue()` to obtain concrete
// color strings for inline styles and chart tooltips where needed.
// ───────────────────────────────────────────────────────────────────────────
const getSeverityConfig = () => ({
  error  : { 
    label: 'Critical', 
    color: getCSSVariableValue('--alert-error'), 
    bg: getCSSVariableValue('--alert-error-bg'),   
    border: getCSSVariableValue('--alert-error-border')   
  },
  warning: { 
    label: 'Warning',  
    color: getCSSVariableValue('--alert-warning'), 
    bg: getCSSVariableValue('--alert-warning-bg'), 
    border: getCSSVariableValue('--alert-warning-border') 
  },
  info   : { 
    label: 'Info',     
    color: getCSSVariableValue('--alert-info'), 
    bg: getCSSVariableValue('--alert-info-bg'), 
    border: getCSSVariableValue('--alert-info-border') 
  },
});

// ─── Motion variants ──────────────────────────────────────────────────────────
const containerVariants = {
  hidden : { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden : { y: 20, opacity: 0 },
  visible: { y: 0,  opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } },
};
const alertRowVariants = {
  hidden : { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit   : { opacity: 0, x: 16, transition: { duration: 0.2 } },
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.chartTooltip}>
      <p className={styles.tooltipLabel}>{label}</p>
      {payload.map((e, i) => (
        <p key={i} style={{ color: e.color || e.fill }}>
          <strong>{e.name}:</strong> {e.value}
        </p>
      ))}
    </div>
  );
};

// ─── Single Alert Row ─────────────────────────────────────────────────────────
function AlertRow({ alert, onClear }) {
  const severityConfig = getSeverityConfig();
  const sev = severityConfig[alert.type] || severityConfig.info;
  return (
    <motion.div
      className={styles.alertRow}
      variants={alertRowVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
      style={{ borderLeft: `3px solid ${sev.color}`, background: sev.bg }}
    >
      <div className={styles.alertSeverityBadge} style={{ color: sev.color, borderColor: sev.border, background: sev.bg }}>
        {sev.label}
      </div>
      <div className={styles.alertBody}>
        <span className={styles.alertMessage}>{alert.message}</span>
        <span className={styles.alertMeta}>
          {alert.value && <span className={styles.alertValue}>{alert.value}</span>}
          <span className={styles.alertTime}>
            {alert.time ? formatDistanceToNow(new Date(alert.time), { addSuffix: true }) : '—'}
          </span>
          {alert.source && <span className={styles.alertSource}>{alert.source}</span>}
        </span>
      </div>
      {onClear && (
        <button className={styles.alertDismiss} onClick={() => onClear(alert.id)} title="Dismiss">
          ✕
        </button>
      )}
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AlertsPage({ alerts = [], sensors, onClearAlert, onClearAllAlerts }) {
  const [loading,         setLoading]         = useState(true);
  const [isTestMode,      setIsTestMode]       = useState(false);
  const [history,         setHistory]          = useState([]);
  const [latestDetection, setLatestDetection]  = useState(null);
  const [activeFilter,    setActiveFilter]     = useState('all');   // all | error | warning | info
  const [activeTab,       setActiveTab]        = useState('system'); // system | disease

  // ─── Fetch disease detections ─────────────────────────────────────────────
  const fetchDetections = useCallback(async () => {
    try {
      const end   = new Date();
      const start = new Date(end.getTime() - 7 * 24 * 3_600_000);
      const resp  = await aiAPI.getDiseaseDetections({
        startDate: start.toISOString(),
        endDate  : end.toISOString(),
        limit    : 100,
      });
      const detections = resp?.detections || resp?.data?.detections || [];

      if (detections.length === 0) {
        setIsTestMode(false);
        setHistory([]);
        setLatestDetection(null);
      } else {
        setIsTestMode(false);
        setHistory(detections);
        setLatestDetection(detections[0]);
      }
    } catch {
      // Full API failure
      setIsTestMode(false);
      setHistory([]);
      setLatestDetection(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDetections();
    const id = setInterval(fetchDetections, 60_000);
    return () => clearInterval(id);
  }, [fetchDetections]);

  // ─── WebSocket live disease alerts ────────────────────────────────────────
  useWebSocket((message) => {
    if (message.type === 'disease_alert') {
      const payload = message.data;
      if (!payload) return;
      setIsTestMode(false);
      setLatestDetection(payload);
      setHistory(prev => [payload, ...prev].slice(0, 100));
      const isHealthy = payload.detectedDisease === 'healthy';
      toast.custom((t) => (
        <div className={`${styles.toastNotification} ${t.visible ? styles.toastVisible : ''}`}>
          <GlassIcon name={isHealthy ? 'success' : 'warning'} className={isHealthy ? styles.textSuccess : styles.textDanger} />
          <div>
            <strong>{isHealthy ? 'Plant Healthy ✓' : '⚠ Disease Detected!'}</strong>
            <p>{formatDiseaseName(payload.detectedDisease)} ({(payload.confidence * 100).toFixed(0)}%)</p>
          </div>
        </div>
      ));
    }
  });

  // ─── Derived data ─────────────────────────────────────────────────────────

  // System alerts: use real ones from App.jsx, or empty array if none
  const displayAlerts = useMemo(() => {
    // Use real sensor-derived alerts passed down from App.jsx
    if (alerts.length > 0) return alerts;
    return [];
  }, [alerts]);

  // Filter system alerts
  const filteredAlerts = useMemo(() => {
    if (activeFilter === 'all') return displayAlerts;
    return displayAlerts.filter(a => a.type === activeFilter);
  }, [displayAlerts, activeFilter]);

  // 7-day disease bar chart
  const chartData = useMemo(() => {
    const days = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days[format(d, 'MMM dd')] = 0;
    }
    history.forEach(h => {
      const dateLabel = format(new Date(h.timestamp), 'MMM dd');
      if (days[dateLabel] !== undefined && h.detectedDisease !== 'healthy') {
        days[dateLabel]++;
      }
    });
    return Object.entries(days).map(([date, count]) => ({ date, count }));
  }, [history]);

  // KPI summary
  const kpiSummary = useMemo(() => {
    const critical = displayAlerts.filter(a => a.type === 'error').length;
    const warnings = displayAlerts.filter(a => a.type === 'warning').length;
    const diseaseEvents = history.filter(h => h.detectedDisease !== 'healthy').length;
    const healthy  = history.filter(h => h.detectedDisease === 'healthy').length;
    return { critical, warnings, diseaseEvents, healthy };
  }, [displayAlerts, history]);

  const isLatestHealthy     = latestDetection?.detectedDisease === 'healthy' || !latestDetection;
  const confidencePercent   = latestDetection ? Math.round(latestDetection.confidence * 100) : 100;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <motion.div
      className={styles.container}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >

      {/* ── Removed Testmode Banner ── */}
      <AnimatePresence>
      </AnimatePresence>

      {/* ── KPI Strip ── */}
      <motion.div className={styles.kpiStrip} variants={itemVariants}>
        {[
          { label: 'Critical',       value: kpiSummary.critical,      color: getCSSVariableValue('--alert-error'), icon: 'triangle-exclamation'   },
          { label: 'Warnings',       value: kpiSummary.warnings,      color: getCSSVariableValue('--alert-warning'), icon: 'circle-exclamation' },
          { label: 'Disease Events', value: kpiSummary.diseaseEvents, color: getCSSVariableValue('--chart-disease'), icon: 'viruses' },
          { label: 'Healthy Scans',  value: kpiSummary.healthy,       color: getCSSVariableValue('--chart-healthy'), icon: 'check-circle' },
        ].map((k, i) => (
          <motion.div
            key={i}
            className={styles.kpiCard}
            whileHover={{ y: -3, scale: 1.015 }}
            style={{ borderColor: k.color + '44' }}
          >
            <div className={styles.kpiTop}>
              <i className={`fa-solid fa-${k.icon} ${styles.kpiIcon}`} style={{ color: k.color }} />
              <span className={styles.kpiLabel}>{k.label}</span>
            </div>
            <div className={styles.kpiValue} style={{ color: k.color }}>
              {loading ? <SkeletonLoader width="40px" height="28px" /> : k.value}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Main Grid ── */}
      <div className={styles.mainGrid}>

        {/* ── Left: Latest Detection Card ── */}
        <motion.div className={styles.detectionCard} variants={itemVariants}>
          <div className={styles.cardHeaderRow}>
            <h3 className={styles.cardTitle}>Latest Detection</h3>
            {latestDetection && (
              <span className={`${styles.statusPill} ${isLatestHealthy ? styles.pillGreen : styles.pillRed}`}>
                {isLatestHealthy ? '✓ Healthy' : '⚠ Action Required'}
              </span>
            )}
          </div>

          {loading ? <SkeletonLoader height="280px" borderRadius="12px" /> : (
            <>
              <div className={styles.imageWrapper}>
                {latestDetection?.imageUrl ? (
                  <img src={latestDetection.imageUrl} alt="Plant Snapshot" className={styles.camImage} />
                ) : (
                  <div className={styles.placeholderImage}>
                    <GlassIcon name="camera" size={44} />
                    <p>No recent image available</p>
                  </div>
                )}

                {/* Circular confidence overlay */}
                <div className={styles.confidenceOverlay}>
                  <svg viewBox="0 0 36 36" className={styles.circularChart}>
                    <path className={styles.circleBg}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={`${styles.circle} ${isLatestHealthy ? styles.strokeSuccess : styles.strokeDanger}`}
                      strokeDasharray={`${confidencePercent}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <text x="18" y="20.35" className={styles.percentage}>{confidencePercent}%</text>
                  </svg>
                </div>
              </div>

              <div className={styles.detectionMeta}>
                <h2 className={`${styles.diseaseTitle} ${isLatestHealthy ? styles.textSuccess : styles.textDanger}`}>
                  {formatDiseaseName(latestDetection?.detectedDisease)}
                </h2>
                <p className={styles.detectionTime}>
                  {latestDetection
                    ? format(new Date(latestDetection.timestamp), 'MMM d, yyyy · HH:mm:ss')
                    : 'Waiting for data...'}
                </p>
              </div>
            </>
          )}
        </motion.div>

        {/* ── Right: Tabs — System Alerts + Disease History ── */}
        <motion.div className={styles.rightPanel} variants={itemVariants}>

          {/* Tab toggle */}
          <div className={styles.tabBar}>
            <button
              className={`${styles.tabBtn} ${activeTab === 'system' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('system')}
            >
              System Alerts
              {displayAlerts.length > 0 && (
                <span className={styles.tabBadge}>{displayAlerts.length}</span>
              )}
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === 'disease' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('disease')}
            >
              Disease History
            </button>
          </div>

          {/* ── System Alerts Tab ── */}
          {activeTab === 'system' && (
            <div className={styles.tabContent}>
              {/* Filter chips */}
              <div className={styles.filterBar}>
                {['all', 'error', 'warning', 'info'].map(f => (
                  <button
                    key={f}
                    className={`${styles.filterChip} ${activeFilter === f ? styles.filterActive : ''}`}
                    onClick={() => setActiveFilter(f)}
                  >
                    {f === 'all' ? 'All' : f === 'error' ? '🔴 Critical' : f === 'warning' ? '🟡 Warning' : '🔵 Info'}
                  </button>
                ))}
                {onClearAllAlerts && displayAlerts.length > 0 && (
                  <button className={styles.clearAllBtn} onClick={onClearAllAlerts}>
                    Clear All
                  </button>
                )}
              </div>

              {/* Alert list */}
              <div className={styles.alertList}>
                {loading ? <SkeletonLoader height="200px" /> : filteredAlerts.length === 0 ? (
                  <div className={styles.emptyState}>
                    <GlassIcon name="success" size={32} />
                    <p>No {activeFilter !== 'all' ? activeFilter : ''} alerts right now</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {filteredAlerts.map(alert => (
                      <AlertRow
                        key={alert.id}
                        alert={alert}
                        onClear={onClearAlert || null}
                      />
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>
          )}

          {/* ── Disease History Tab ── */}
          {activeTab === 'disease' && (
            <div className={styles.tabContent}>
              <div className={styles.timelineList}>
                {loading ? <SkeletonLoader height="100%" /> : history.length === 0 ? (
                  <div className={styles.emptyState}>No detections in the last 7 days.</div>
                ) : (
                  history.slice(0, 10).map((item, idx) => {
                    const healthy = item.detectedDisease === 'healthy';
                    return (
                      <motion.div
                        key={item._id || idx}
                        className={styles.timelineItem}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04 }}
                      >
                        <div className={`${styles.timelineDot} ${healthy ? styles.dotGreen : styles.dotRed}`} />
                        <div className={styles.timelineContent}>
                          <div className={styles.timelineHeader}>
                            <span className={`${styles.timelineDisease} ${healthy ? styles.textSuccess : styles.textDanger}`}>
                              {formatDiseaseName(item.detectedDisease)}
                            </span>
                            <span className={styles.timelineConfidence}>
                              {Math.round(item.confidence * 100)}%
                            </span>
                          </div>
                          <span className={styles.timelineDate}>
                            {format(new Date(item.timestamp), 'MMM d, HH:mm')}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Bottom: 7-Day Chart ── */}
      <motion.div className={styles.bottomCard} variants={itemVariants}>
        <div className={styles.cardHeaderRow}>
          <div>
            <h3 className={styles.cardTitle}>7-Day Disease Occurrences</h3>
            <p className={styles.cardSubtitle}>Non-healthy detections per day</p>
          </div>
        </div>
        <div className={styles.chartWrapper}>
          {loading ? <SkeletonLoader height="100%" /> : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke={getCSSVariableValue('--divider-color') || 'rgba(255,255,255,0.05)'} vertical={false} />
                <XAxis dataKey="date"  stroke={getCSSVariableValue('--text-muted') || 'rgba(255,255,255,0.4)'} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} stroke={getCSSVariableValue('--text-muted') || 'rgba(255,255,255,0.4)'} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: getCSSVariableValue('--tooltip-cursor') || 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="count" name="Detections" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, i) => {
                    const healthyColor = getCSSVariableValue('--chart-healthy');
                    const errorColor = getCSSVariableValue('--alert-error');
                    const warningColor = getCSSVariableValue('--alert-warning');
                    const barColor = entry.count === 0 ? healthyColor + '80' : entry.count >= 3 ? errorColor : warningColor;
                    return (
                      <Cell
                        key={i}
                        fill={barColor}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>

    </motion.div>
  );
}