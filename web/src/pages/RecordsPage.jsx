// File removed after migration to AnalyticsPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { aiAPI, sensorAPI } from '../utils/api';
import { formatDiseaseName } from '../utils/formatters';
import { GlassIcon } from '../components/GlassIcon';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import './RecordsPage.css';

const TIME_RANGES = [
  { label: '1h', hours: 1 },
  { label: '6h', hours: 6 },
  { label: '24h', hours: 24 },
  { label: '7d', hours: 168 },
  { label: '30d', hours: 720 },
];

const METRIC_OPTIONS = [
  { key: 'soilMoisture', label: 'Soil Moisture', unit: '%', icon: 'humidity', color: '#22c55e' },
  { key: 'temperature', label: 'Temperature', unit: '°C', icon: 'temperature', color: '#f59e0b' },
  { key: 'humidity', label: 'Humidity', unit: '%', icon: 'weather', color: '#22d3ee' },
  { key: 'light', label: 'Light', unit: 'lux', icon: 'light', color: '#fbbf24' },
  { key: 'pH', label: 'pH', unit: '', icon: 'ph', color: '#a78bfa' },
  { key: 'flowRate', label: 'Flow Rate', unit: 'mL/min', icon: 'activity', color: '#38bdf8' },
  { key: 'flowVolume', label: 'Flow Volume', unit: 'mL', icon: 'pump', color: '#06b6d4' },
  { key: 'leafCount', label: 'Leaf Count', unit: 'leaves', icon: 'leaf', color: '#34d399' },
];

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="chart-tooltip-label">{formatTimestamp(label)}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }}>
            <strong>{entry.name}:</strong> {entry.value.toFixed(1)}{entry.unit || ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function formatTimestamp(ts) {
  if (!ts) return '--';
  const d = new Date(ts);
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatShortTime(ts) {
  if (!ts) return '--';
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
  const hours = Math.floor(diff / 3600000);
  
  if (hours < 1) {
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  } else if (hours < 24) {
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  } else {
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
}

function getMetricValue(record, key) {
  if (key === 'pH') {
    return record.pH ?? record.ph ?? null;
  }
  if (key === 'flowRate') {
    return record.flowRate ?? record.flowRateMlPerMin ?? record.waterFlowRate ?? null;
  }
  if (key === 'flowVolume') {
    return record.flowVolume ?? record.cycleVolumeML ?? record.waterFlowVolume ?? null;
  }
  if (key === 'leafCount') {
    return record.leafCount ?? record.leaf_count ?? record.canopyLeafCount ?? null;
  }
  return record[key] ?? null;
}

function stageLabel(stage) {
  if (!stage) return 'Unknown';
  return stage.charAt(0).toUpperCase() + stage.slice(1);
}

export default function RecordsPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRange, setSelectedRange] = useState(TIME_RANGES[2]); // 24h default
  const [activeMetric, setActiveMetric] = useState('soilMoisture');
  const [diseaseDetections, setDiseaseDetections] = useState([]);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const PAGE_SIZE = 20;

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const end = new Date();
      const start = new Date(end.getTime() - selectedRange.hours * 3600 * 1000);
      const resp = await sensorAPI.getHistory(start.toISOString(), end.toISOString());
      const data = resp.data || resp || [];
      setRecords(Array.isArray(data) ? data : data.readings || []);
      setTotalRecords(Array.isArray(data) ? data.length : data.total || data.length || 0);

      const aiResp = await aiAPI.getDiseaseDetections({
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        limit: 300,
      });
      const aiData = aiResp?.data || aiResp;
      setDiseaseDetections(Array.isArray(aiData?.detections) ? aiData.detections : []);
      setPage(1);
    } catch (e) {
      setError('Failed to load records. Ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  }, [selectedRange]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  // Pagination
  const startIdx = (page - 1) * PAGE_SIZE;
  const pageRecords = records.slice(startIdx, startIdx + PAGE_SIZE);
  const totalPages = Math.ceil(records.length / PAGE_SIZE);

  function metricValues(key) {
    return records.map((r) => getMetricValue(r, key)).filter((v) => v !== undefined && v !== null);
  }

  function avg(arr) {
    return arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : '--';
  }

  function minVal(arr) {
    return arr.length ? Math.min(...arr).toFixed(1) : '--';
  }

  function maxVal(arr) {
    return arr.length ? Math.max(...arr).toFixed(1) : '--';
  }

  const activeMetricInfo = useMemo(
    () => METRIC_OPTIONS.find((m) => m.key === activeMetric) || METRIC_OPTIONS[0],
    [activeMetric]
  );

  const activeMetricValues = useMemo(() => metricValues(activeMetric), [records, activeMetric]);

  const activeMetricChartData = useMemo(
    () => records
      .map((r) => ({
        timestamp: r.timestamp,
        value: getMetricValue(r, activeMetric),
      }))
      .reverse()
      .filter((d) => d.value !== undefined && d.value !== null),
    [records, activeMetric]
  );

  const leafCountSeries = useMemo(
    () => records
      .map((r) => ({ timestamp: r.timestamp, value: getMetricValue(r, 'leafCount') }))
      .reverse()
      .filter((d) => d.value !== undefined && d.value !== null),
    [records]
  );

  const growthTimeline = useMemo(
    () => diseaseDetections
      .map((d) => ({
        id: d._id || `${d.timestamp}-${d.detectedDisease}`,
        timestamp: d.timestamp,
        stage: d.growthStage || 'unknown',
        disease: d.detectedDisease || 'unknown',
        confidence: d.confidence,
      }))
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
    [diseaseDetections]
  );

  const latestGrowth = growthTimeline.length ? growthTimeline[growthTimeline.length - 1] : null;

  return (
    <div className="records-page">
      {/* Header */}
      <div className="records-header">
        <div className="records-header-left">
          <GlassIcon name="records" />
          <div>
            <h1 className="records-title">Data Records</h1>
            <p className="records-subtitle">
              {totalRecords} readings stored &mdash; MongoDB IoT database
            </p>
          </div>
        </div>
        <div className="records-header-right">
          <div className="records-range-tabs">
            {TIME_RANGES.map(r => (
              <button
                key={r.label}
                className={`records-range-tab${selectedRange.label === r.label ? ' active' : ''}`}
                onClick={() => setSelectedRange(r)}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button className="records-refresh-btn" onClick={fetchRecords} title="Refresh">
            <GlassIcon name="refresh" />
          </button>
        </div>
      </div>

      <div className="records-metric-switcher">
        {METRIC_OPTIONS.map((metric) => (
          <button
            key={metric.key}
            className={`records-metric-pill${activeMetric === metric.key ? ' active' : ''}`}
            onClick={() => setActiveMetric(metric.key)}
            style={{ '--metric-pill-color': metric.color }}
          >
            <GlassIcon name={metric.icon} />
            <span>{metric.label}</span>
          </button>
        ))}
      </div>

      {/* Sensor-focused chart */}
      {!loading && records.length > 0 && (
        <>
          <div className="records-main-chart-card" key={activeMetric}>
            <div className="chart-header">
              <h2>{activeMetricInfo.label} Trend</h2>
              <p>Switch sensors above to view separate graphs</p>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={activeMetricChartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                <defs>
                  <linearGradient id="activeMetricGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={activeMetricInfo.color} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={activeMetricInfo.color} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatShortTime}
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fontSize: 12 }}
                  label={{
                    value: activeMetricInfo.unit
                      ? `${activeMetricInfo.label} (${activeMetricInfo.unit})`
                      : activeMetricInfo.label,
                    angle: -90,
                    position: 'insideLeft',
                    style: { fontSize: 12 },
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={activeMetricInfo.color}
                  strokeWidth={2.4}
                  fill="url(#activeMetricGradient)"
                  name={`${activeMetricInfo.label}${activeMetricInfo.unit ? ` (${activeMetricInfo.unit})` : ''}`}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone" 
                  dataKey="value"
                  stroke={activeMetricInfo.color}
                  strokeWidth={2.4}
                  name={activeMetricInfo.label}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
            </div>

            <div className="records-focused-stats">
              <div className="records-focused-stat" style={{ animationDelay: '0.1s' }}>
                <span>Average</span>
                <strong>{avg(activeMetricValues)}{activeMetricInfo.unit}</strong>
              </div>
              <div className="records-focused-stat" style={{ animationDelay: '0.15s' }}>
                <span>Minimum</span>
                <strong>{minVal(activeMetricValues)}{activeMetricInfo.unit}</strong>
              </div>
              <div className="records-focused-stat" style={{ animationDelay: '0.2s' }}>
                <span>Maximum</span>
                <strong>{maxVal(activeMetricValues)}{activeMetricInfo.unit}</strong>
              </div>
            </div>
          </div>

          <div className="records-growth-card">
            <div className="chart-header">
              <h2>Plant Growth Trend</h2>
              <p>Leaf count trend with AI growth stage timeline</p>
            </div>

            <div className="records-focused-stats">
              <div className="records-focused-stat">
                <span>Latest Stage</span>
                <strong>{latestGrowth ? stageLabel(latestGrowth.stage) : '--'}</strong>
              </div>
              <div className="records-focused-stat">
                <span>Latest Leaf Count</span>
                <strong>{leafCountSeries.length ? leafCountSeries[leafCountSeries.length - 1].value : '--'}</strong>
              </div>
              <div className="records-focused-stat">
                <span>AI Detections</span>
                <strong>{growthTimeline.length}</strong>
              </div>
            </div>

            <div className="chart-container">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={leafCountSeries} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="timestamp" tickFormatter={formatShortTime} stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 12 }} />
                  <YAxis stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="value" stroke="#34d399" strokeWidth={2.2} name="Leaf Count" dot={false} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="records-growth-timeline">
              {growthTimeline.slice(-8).map((entry) => (
                <div key={entry.id} className="records-growth-item">
                  <div className="records-growth-dot" />
                  <div className="records-growth-content">
                    <span className="records-growth-time">{formatTimestamp(entry.timestamp)}</span>
                    <strong>{stageLabel(entry.stage)}</strong>
                    <span>{formatDiseaseName(entry.disease)} {entry.confidence !== undefined ? `(${Math.round(entry.confidence * 100)}%)` : ''}</span>
                  </div>
                </div>
              ))}
              {growthTimeline.length === 0 && (
                <div className="records-growth-empty">No AI growth stage detections for selected range.</div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Records table */}
      <div className="records-table-card">
        <div className="records-table-header">
          <span>Recent Sensor Readings</span>
          <span className="records-count">{records.length} records</span>
        </div>

        {loading && (
          <div className="records-loading">
            <div className="records-spinner" />
            Loading records from MongoDB...
          </div>
        )}

        {error && !loading && (
          <div className="records-error">
            <GlassIcon name="warning" />
            {error}
          </div>
        )}

        {!loading && !error && records.length === 0 && (
          <div className="records-empty">
            <GlassIcon name="database" />
            <p>No records found for the selected time range.</p>
            <p className="records-empty-hint">Data is stored automatically 5x per day via scheduled job.</p>
          </div>
        )}

        {!loading && !error && pageRecords.length > 0 && (
          <>
            <div className="records-table-wrap">
              <table className="records-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Soil Moisture</th>
                    <th>Temperature</th>
                    <th>Humidity</th>
                    <th>Light</th>
                    <th>pH</th>
                    <th>Flow Rate</th>
                    <th>Flow Volume</th>
                    <th>Leaf Count</th>
                    <th>Device</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRecords.map((rec, i) => (
                    <tr key={rec._id || i}>
                      <td className="records-ts">{formatTimestamp(rec.timestamp)}</td>
                      <td>
                        <span className={`records-val${rec.soilMoisture < 20 ? ' warn' : ''}`}>
                          {rec.soilMoisture !== undefined ? `${rec.soilMoisture}%` : '--'}
                        </span>
                      </td>
                      <td>
                        <span className={`records-val${rec.temperature > 38 ? ' warn' : ''}`}>
                          {rec.temperature !== undefined ? `${rec.temperature} °C` : '--'}
                        </span>
                      </td>
                      <td>{rec.humidity !== undefined ? `${rec.humidity}%` : '--'}</td>
                      <td>{rec.light !== undefined ? `${rec.light} lux` : '--'}</td>
                      <td>
                        <span className={`records-val${rec.pH !== undefined && (rec.pH < 5.5 || rec.pH > 7.5) ? ' warn' : ''}`}>
                          {rec.pH !== undefined ? rec.pH : '--'}
                        </span>
                      </td>
                      <td>{getMetricValue(rec, 'flowRate') !== null ? `${getMetricValue(rec, 'flowRate')} mL/min` : '--'}</td>
                      <td>{getMetricValue(rec, 'flowVolume') !== null ? `${getMetricValue(rec, 'flowVolume')} mL` : '--'}</td>
                      <td>{getMetricValue(rec, 'leafCount') !== null ? `${getMetricValue(rec, 'leafCount')}` : '--'}</td>
                      <td className="records-device">{rec.deviceId || 'ESP32-SENSOR'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="records-pagination">
                <button
                  className="records-page-btn"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </button>
                <span className="records-page-info">
                  Page {page} of {totalPages}
                </span>
                <button
                  className="records-page-btn"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

