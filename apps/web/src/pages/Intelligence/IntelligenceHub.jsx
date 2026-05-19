// apps/web/src/pages/Intelligence/IntelligenceHub.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { aiAPI } from '../../utils/api';
import { formatDiseaseName } from '../../utils/formatters';
import { getCSSVariableValue } from '../../utils/colorUtils';
import PageSkeleton from '../../components/PageSkeleton';
import './IntelligenceHub.css';

// ─── Constants & Meta ────────────────────────────────────────────────────────
const SEV_META = {
  critical: { color: 'var(--rec-critical)', bg: 'var(--alert-error-bg)',  border: 'var(--alert-error-border)',  fa: 'fa-circle-exclamation',      label: 'Critical' },
  high:     { color: 'var(--rec-high)',     bg: 'var(--alert-warning-bg)', border: 'var(--alert-warning-border)', fa: 'fa-triangle-exclamation',    label: 'High'     },
  medium:   { color: 'var(--rec-medium)',   bg: 'var(--alert-warning-bg)', border: 'var(--alert-warning-border)', fa: 'fa-circle-info',             label: 'Medium'   },
  low:      { color: 'var(--rec-medium)',   bg: 'var(--alert-info-bg)',    border: 'var(--alert-info-border)',    fa: 'fa-circle-info',             label: 'Low'      },
  none:     { color: 'var(--health-healthy)', bg: 'var(--success-bg)',     border: 'var(--success-border)',      fa: 'fa-circle-check',            label: 'Healthy'  },
};

const CAT_FA = {
  soil_moisture: 'fa-droplet',
  temperature:   'fa-temperature-half',
  light:         'fa-sun',
  watering:      'fa-faucet-drip',
  disease:       'fa-bug',
  health:        'fa-heart-pulse',
};

const GRAPH_TABS = [
  { key: 'soilMoisture', label: 'Soil',    unit: '%',    fa: 'fa-droplet',          color: '#22c55e' },
  { key: 'temperature',  label: 'Temp',    unit: '°C',  fa: 'fa-temperature-half', color: '#f97316' },
  { key: 'humidity',     label: 'Humidity',unit: '%',    fa: 'fa-cloud-rain',       color: '#22d3ee' },
  { key: 'lightLevel',   label: 'Light',   unit: ' lux', fa: 'fa-sun',              color: '#fbbf24' },
];

const QUICK_PROMPTS = [
  { icon: 'fa-heart-pulse', label: 'Is my plant healthy right now?', intent: 'health_check' },
  { icon: 'fa-faucet-drip', label: 'Should I water the plant now?', intent: 'irrigation' },
  { icon: 'fa-bug', label: 'Any signs of disease or stress?', intent: 'disease' },
  { icon: 'fa-wave-square', label: 'Analyze all sensor readings', intent: 'full_analysis' },
];

const PLANT_TYPES = [
  { name: 'Tomato', icon: 'fa-leaf', optimalMoisture: '60-70%', optimalTemp: '20-25°C' },
  { name: 'Lettuce', icon: 'fa-leaf', optimalMoisture: '40-60%', optimalTemp: '15-20°C' },
  { name: 'Basil', icon: 'fa-leaf', optimalMoisture: '50-70%', optimalTemp: '20-27°C' },
  { name: 'Pepper', icon: 'fa-leaf', optimalMoisture: '60-70%', optimalTemp: '21-29°C' },
];

// ─── Sub-Components ──────────────────────────────────────────────────────────

const MarkdownText = ({ text }) => {
  if (!text) return null;
  const paragraphs = text.split(/\n\s*\n/);
  const parseInline = (t) => {
    let parts = t.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
      let subParts = part.split(/(\*.*?\*)/g);
      return subParts.map((sub, j) => (sub.startsWith('*') && sub.endsWith('*')) ? <em key={j}>{sub.slice(1, -1)}</em> : sub);
    });
  };

  return paragraphs.map((p, i) => {
    const trimmed = p.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      return <ul key={i} className="ih-chat-list">{trimmed.split('\n').map((item, j) => <li key={j}>{parseInline(item.replace(/^[-*]\s+/, ''))}</li>)}</ul>;
    }
    return <p key={i} className="ih-chat-para">{parseInline(trimmed)}</p>;
  });
};

const HealthRing = ({ score = 0 }) => {
  const R = 58, C = 2 * Math.PI * R;
  // Resolve health/severity tokens to concrete colors for the SVG ring.
  // We use the resulting color for stroke and drop-shadow filters so the
  // ring matches the active theme visually.
  const color = score >= 80 ? getCSSVariableValue('--health-healthy') : score >= 60 ? getCSSVariableValue('--rec-high') : getCSSVariableValue('--rec-critical');
  return (
    <div className="ih-ring-wrap">
      <svg viewBox="0 0 140 140" width="100%" height="100%">
        <circle cx="70" cy="70" r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
        <circle cx="70" cy="70" r={R} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${(score / 100) * C} ${C}`} strokeDashoffset={C * 0.25}
          style={{ filter: `drop-shadow(0 0 8px ${color})`, transition: 'stroke-dasharray 1s ease-out' }} />
      </svg>
      <div className="ih-ring-inner">
        <span className="ih-ring-score" style={{ color }}>{score}</span>
        <span className="ih-ring-label">Health</span>
      </div>
    </div>
  );
};

const LineChart = ({ data, unit, color, label }) => {
  const [tooltip, setTooltip] = useState(null);
  const svgRef = useRef(null);
  if (!data || data.length < 2) return <div className="ih-chart-empty"><i className="fa-solid fa-chart-line" /> No data points</div>;
  const pts = data.slice(-40);
  const vals = pts.map(d => d.value);
  const minV = Math.min(...vals), maxV = Math.max(...vals), rangeV = (maxV - minV) || 1;
  const W = 600, H = 200, PAD = { t: 10, r: 10, b: 20, l: 40 };
  const cW = W - PAD.l - PAD.r, cH = H - PAD.t - PAD.b;
  const xOf = i => PAD.l + (i / (pts.length - 1)) * cW;
  const yOf = v => PAD.t + cH - ((v - minV) / rangeV) * cH;
  const linePath = pts.map((p, i) => `${xOf(i)},${yOf(p.value)}`).join(' ');

  return (
    <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="ih-chart-svg" onMouseLeave={() => setTooltip(null)}
      onMouseMove={(e) => {
        const rect = svgRef.current.getBoundingClientRect();
        const idx = Math.round(((e.clientX - rect.left) / rect.width * W - PAD.l) / cW * (pts.length - 1));
        if (idx >= 0 && idx < pts.length) setTooltip({ x: xOf(idx), y: yOf(pts[idx].value), val: pts[idx].value });
      }}>
      <polyline points={linePath} fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 5px ${color}40)` }} />
      {tooltip && <g><circle cx={tooltip.x} cy={tooltip.y} r="5" fill={color} /><text x={tooltip.x} y={tooltip.y - 10} textAnchor="middle" fill={color} fontSize="12">{tooltip.val}{unit}</text></g>}
    </svg>
  );
};

// ─── Main Hub Component ──────────────────────────────────────────────────────

const IntelligenceHub = ({ sensors, sensorDeviceId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState(null);
  const [chatMessages, setChatMessages] = useState([{ role: 'assistant', content: "I'm SproutSense AI. How can I help with your plants today?", time: new Date() }]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState('Tomato');
  const [pyTrends, setPyTrends] = useState(null);

  const messagesEndRef = useRef(null);

  // Sync tab with URL if needed
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['dashboard', 'insights', 'trends', 'chat'].includes(tab)) setActiveTab(tab);
  }, [location]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [insRes, pyRes] = await Promise.all([
        aiAPI.getInsights({ days, deviceId: sensorDeviceId }),
        axios.get('/api/intelligence/analysis', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      ]);
      setInsights(insRes?.data || insRes);
      setPyTrends(pyRes?.data?.data || pyRes?.data || pyRes);
    } catch (err) {
      console.error("Hub data fetch failed", err);
    } finally {
      setLoading(false);
    }
  }, [days, sensorDeviceId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  const handleSendMessage = async (textOverride) => {
    const text = (textOverride || chatInput).trim();
    if (!text || chatLoading) return;
    const userMsg = { role: 'user', content: text, time: new Date() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await aiAPI.chat({ message: text, history: chatMessages.map(m => ({ role: m.role, content: m.content })) });
      setChatMessages(prev => [...prev, { role: 'assistant', content: res.reply, time: new Date() }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: "Error: " + err.message, time: new Date(), isError: true }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading && !insights) return <PageSkeleton />;

  return (
    <div className="ih-root">
      <header className="ih-hero">
        <div className="ih-hero-content">
          <div className="ih-badge"><i className="fa-solid fa-microchip" /> NEURAL ENGINE ACTIVE</div>
          <p className="ih-subtitle">Advanced botanical diagnostics, predictive trends, and AI plant care assistance.</p>
        </div>
        <nav className="ih-nav">
          {['dashboard', 'insights', 'trends', 'chat'].map(t => (
            <button key={t} className={`ih-nav-btn ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
              <i className={`fa-solid ${t==='dashboard'?'fa-gauge-high':t==='insights'?'fa-microscope':t==='trends'?'fa-chart-line':'fa-comments'}`} />
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </nav>
      </header>

      <main className="ih-main">
        {activeTab === 'dashboard' && (
          <div className="ih-view ih-dashboard">
            <div className="ih-grid">
              <section className="ih-card ih-health-card">
                <HealthRing score={insights?.overallHealth?.score || 0} />
                <div className="ih-card-body">
                  <div className="ih-badge"><i className="fa-solid fa-bolt" /> REAL-TIME ANALYSIS</div>
                  <h3 style={{ fontSize: '2.5rem', marginTop: '0.5rem' }}>
                    {insights?.overallHealth?.status || 'Active Scan'}
                  </h3>
                  <div className="ih-factors" style={{ marginTop: '1.5rem' }}>
                    {Object.entries(insights?.overallHealth?.factors || {}).map(([k, v]) => (
                      <span key={k} className={`ih-factor ${v}`}>
                        <i className={`fa-solid ${v==='good'?'fa-check-circle':'fa-circle-exclamation'}`} /> 
                        {k.replace(/_/g,' ')}
                      </span>
                    ))}
                  </div>
                </div>
              </section>

              <section className="ih-card ih-quick-actions">
                <div className="ih-badge" style={{ background: 'var(--success-bg)', color: 'var(--plant-green)', borderColor: 'var(--success-border)' }}>
                  <i className="fa-solid fa-comment-dots" /> AI ASSISTANT
                </div>
                <h3 style={{ fontSize: '1.8rem', margin: '1rem 0 1.5rem' }}>Neural Consultation</h3>
                <div className="ih-prompts-grid">
                  {QUICK_PROMPTS.map(p => (
                    <button key={p.label} className="ih-prompt-btn" onClick={() => { setActiveTab('chat'); handleSendMessage(p.label); }}>
                      <div className="ih-prompt-icon">
                        <i className={`fa-solid ${p.icon}`} />
                      </div>
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="ih-card ih-summary-strip">
                {/* Moisture */}
                <div className="ih-stat-card" style={{ '--stat-color': 'var(--chart-moisture)' }}>
                  <div className="ih-stat-card-top">
                    <div className="ih-stat-icon"><i className="fa-solid fa-droplet" /></div>
                    <div className="ih-stat-status-dot" />
                  </div>
                  <div className="ih-stat-card-mid">
                    <span className="ih-stat-label">Soil Moisture</span>
                    <span className="ih-stat-val">{sensors?.soilMoisture ?? '--'}<small style={{ fontSize: '1rem', opacity: 0.6 }}>%</small></span>
                  </div>
                  <div className="ih-stat-card-bot">
                    <div className="ih-stat-bar-track"><div className="ih-stat-bar-fill" style={{ width: `${sensors?.soilMoisture ?? 0}%` }} /></div>
                    <span className="ih-stat-sub">Optimal: 55–70%</span>
                  </div>
                </div>

                {/* Temperature */}
                <div className="ih-stat-card" style={{ '--stat-color': 'var(--chart-temp)' }}>
                  <div className="ih-stat-card-top">
                    <div className="ih-stat-icon"><i className="fa-solid fa-temperature-half" /></div>
                    <div className="ih-stat-status-dot" />
                  </div>
                  <div className="ih-stat-card-mid">
                    <span className="ih-stat-label">Temperature</span>
                    <span className="ih-stat-val">{sensors?.temperature ?? '--'}<small style={{ fontSize: '1rem', opacity: 0.6 }}>°C</small></span>
                  </div>
                  <div className="ih-stat-card-bot">
                    <div className="ih-stat-bar-track"><div className="ih-stat-bar-fill" style={{ width: `${Math.min((sensors?.temperature / 50) * 100, 100) ?? 0}%` }} /></div>
                    <span className="ih-stat-sub">Optimal: 20–27°C</span>
                  </div>
                </div>

                {/* Humidity */}
                <div className="ih-stat-card" style={{ '--stat-color': 'var(--chart-humidity)' }}>
                  <div className="ih-stat-card-top">
                    <div className="ih-stat-icon"><i className="fa-solid fa-cloud-rain" /></div>
                    <div className="ih-stat-status-dot" />
                  </div>
                  <div className="ih-stat-card-mid">
                    <span className="ih-stat-label">Humidity</span>
                    <span className="ih-stat-val">{sensors?.humidity ?? '--'}<small style={{ fontSize: '1rem', opacity: 0.6 }}>%</small></span>
                  </div>
                  <div className="ih-stat-card-bot">
                    <div className="ih-stat-bar-track"><div className="ih-stat-bar-fill" style={{ width: `${sensors?.humidity ?? 0}%` }} /></div>
                    <span className="ih-stat-sub">Optimal: 50–70%</span>
                  </div>
                </div>

                {/* AI Alerts */}
                <div className="ih-stat-card" style={{ '--stat-color': insights?.diseaseAnalysis?.activeAlerts > 0 ? 'var(--rec-critical)' : 'var(--health-healthy)' }}>
                  <div className="ih-stat-card-top">
                    <div className="ih-stat-icon"><i className="fa-solid fa-triangle-exclamation" /></div>
                    <div className="ih-stat-status-dot" />
                  </div>
                  <div className="ih-stat-card-mid">
                    <span className="ih-stat-label">AI Alerts</span>
                    <span className="ih-stat-val">{insights?.diseaseAnalysis?.activeAlerts ?? 0}</span>
                  </div>
                  <div className="ih-stat-card-bot">
                    <div className="ih-stat-bar-track"><div className="ih-stat-bar-fill" style={{ width: insights?.diseaseAnalysis?.activeAlerts > 0 ? '100%' : '0%' }} /></div>
                    <span className="ih-stat-sub">{insights?.diseaseAnalysis?.activeAlerts > 0 ? 'Action required' : 'All clear'}</span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="ih-view ih-insights">
            <div className="ih-insights-scroll">
              {insights?.insights?.map((ins, i) => (
                <div key={i} className={`ih-insight-item ${ins.severity}`} style={{'--is-color': SEV_META[ins.severity].color, '--is-bg': SEV_META[ins.severity].bg}}>
                  <div className="ih-insight-head">
                    <i className={`fa-solid ${CAT_FA[ins.category] || 'fa-leaf'}`} />
                    <span className="cat">{ins.category.replace(/_/g,' ')}</span>
                    <span className="sev-pill">{ins.severity}</span>
                  </div>
                  <p>{ins.message}</p>
                </div>
              ))}
            </div>
            <div className="ih-disease-panel">
               <h3>Disease Detection Breakdown</h3>
               {insights?.diseaseAnalysis?.diseaseBreakdown?.map(d => (
                 <div key={d._id} className="ih-disease-row">
                   <span>{formatDiseaseName(d._id)}</span>
                   <div className="ih-bar"><div className="fill" style={{width:`${d.avgConfidence*100}%`}} /></div>
                   <span>{Math.round(d.avgConfidence*100)}%</span>
                 </div>
               ))}
            </div>
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="ih-view ih-trends">
            <div className="ih-trends-grid">
              <div className="ih-card ih-chart-card">
                 <h3>Sensor History (Last 40 Points)</h3>
                 <LineChart data={insights?.graphData?.soilMoisture} color={getCSSVariableValue('--chart-moisture')} unit="%" label="Moisture" />
              </div>
              <div className="ih-card ih-python-card">
                 <h3>Python Predictive Modeling</h3>
                 {pyTrends ? <img src={`${pyTrends.chartUrl}?t=${Date.now()}`} alt="Trends" /> : <PageSkeleton />}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="ih-view ih-chat-container">
            <div className="ih-chat-header">
              <div className="ih-chat-header-info">
                <div className="ih-chat-status-glow"></div>
                <div>
                  <h4>Neural Intelligence Assistant</h4>
                  <p>Powered by SproutSense AI • Multi-model Analysis</p>
                </div>
              </div>
              <button className="ih-clear-chat" onClick={() => setChatMessages([{ role: 'assistant', content: "I've cleared our history. How else can I help?", time: new Date() }])}>
                <i className="fa-solid fa-trash-can" /> Clear
              </button>
            </div>

            <div className="ih-chat">
              <div className="ih-chat-messages">
                {chatMessages.map((m, i) => (
                  <div key={i} className={`ih-msg ${m.role}`}>
                    <div className="ih-msg-bubble">
                      <MarkdownText text={m.content} />
                      <span className="ih-msg-time">{new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="ih-msg assistant">
                    <div className="ih-msg-bubble">
                      <div className="typing">
                        <span/><span/><span/>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              <div className="ih-chat-input-area">
                <div className="ih-chat-input-wrap">
                  <textarea 
                    placeholder="Ask about soil health, lighting, or disease prevention..." 
                    value={chatInput} 
                    onChange={e => setChatInput(e.target.value)} 
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }} 
                  />
                  <button onClick={() => handleSendMessage()} disabled={chatLoading || !chatInput.trim()}>
                    <i className="fa-solid fa-paper-plane" />
                  </button>
                </div>
                <p className="ih-chat-disclaimer">AI can make mistakes. Verify critical botanical advice.</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default IntelligenceHub;
