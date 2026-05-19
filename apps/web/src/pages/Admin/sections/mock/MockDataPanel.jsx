import { useState, useCallback, useEffect } from 'react';
import {
  mockDataStore,
  addSensor, updateSensor, deleteSensor,
  addAlert, updateAlert, deleteAlert,
  updateCropHealth, updateWeather,
  addUser, updateUser, deleteUser,
  applyScenario, resetToDefaults,
  exportMockData, importMockData,
  isSimulationActive, setSimulationActive, subscribeToMockUpdates
} from '../../../../services/mockDataService';
import './MockDataPanel.css';

const TABS = [
  { id: 'Sensors',     icon: 'fa-microchip',   label: 'Plant Sensors' },
  { id: 'Alerts',      icon: 'fa-bell',        label: 'System Alerts' },
  { id: 'Crop Health', icon: 'fa-leaf',        label: 'Crop Analytics' },
  { id: 'Weather',     icon: 'fa-cloud-sun',   label: 'Weather Station' },
  { id: 'Users',       icon: 'fa-users-gear',  label: 'User Management' },
  { id: 'Scenarios',   icon: 'fa-layer-group', label: 'Preset Scenarios' },
  { id: 'Instructions', icon: 'fa-circle-question', label: 'Help & Guide' },
];

export default function MockDataPanel() {
  const [activeTab, setActiveTab] = useState('Sensors');
  const [, forceUpdate] = useState(0);
  const isSimActive = isSimulationActive();

  useEffect(() => {
    return subscribeToMockUpdates(() => forceUpdate(n => n + 1));
  }, []);

  const refresh = useCallback(() => forceUpdate(n => n + 1), []);

  return (
    <div className="mock-panel">
      {/* Simulation Internal Sidebar */}
      <aside className="mock-sidebar">
        <div className="mock-sidebar-header">
          <h4>Simulation Registry</h4>
        </div>
        
        <nav className="mock-nav">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`mock-nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <i className={`fa-solid ${tab.icon}`} />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="mock-sidebar-footer">
          <div className="mock-sim-toggle">
            <span>Drift Mode</span>
            <label className="adm-toggle-sm">
              <input 
                type="checkbox" 
                checked={isSimActive} 
                onChange={(e) => setSimulationActive(e.target.checked)}
              />
              <span className="slider-sm" />
            </label>
          </div>
        </div>
      </aside>

      {/* Main Simulation Content */}
      <main className="mock-content">
        <header className="mock-header">
          <div className="mock-header-title">
            <i className={`fa-solid ${TABS.find(t => t.id === activeTab)?.icon}`} style={{ color: '#22d3ee' }} />
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#fff' }}>{activeTab}</h3>
          </div>
          
          {isSimActive && (
            <div className="mock-indicator">
              <span className="mock-pulse-dot" />
              Live Simulation Active
            </div>
          )}
        </header>

        <div className="mock-tab-pane">
          {activeTab === 'Sensors'     && <SensorsTab    refresh={refresh} />}
          {activeTab === 'Alerts'      && <AlertsTab     refresh={refresh} />}
          {activeTab === 'Crop Health'  && <CropHealthTab refresh={refresh} />}
          {activeTab === 'Weather'     && <WeatherTab    refresh={refresh} />}
          {activeTab === 'Users'       && <UsersTab      refresh={refresh} />}
          {activeTab === 'Scenarios'   && <ScenariosTab  refresh={refresh} />}
          {activeTab === 'Instructions' && <HelpTab />}
        </div>
      </main>
    </div>
  );
}

// ─── SENSORS TAB (Card Based) ────────────────────────────────────────────────
function SensorsTab({ refresh }) {
  const [form, setForm] = useState({ name: '', moisture: 60, temperature: 28, humidity: 70, light: 1200, flowRate: 120, flowVolume: 0, sensorType: 'plant' });
  const sensors = mockDataStore.sensors || [];

  function handleAdd(e) {
    e.preventDefault();
    addSensor({
      ...form,
      sensorType: form.sensorType === 'flow' ? 'flow' : 'plant',
      name: form.name || (form.sensorType === 'flow' ? 'Irrigation Flow Sensor' : 'Field Node'),
      flowRate: form.sensorType === 'flow' ? Number(form.flowRate) : undefined,
      flowVolume: form.sensorType === 'flow' ? Number(form.flowVolume) : undefined,
      light: form.sensorType === 'flow' ? undefined : Number(form.light),
      humidity: form.sensorType === 'flow' ? undefined : Number(form.humidity),
    });
    setForm({ name: '', moisture: 60, temperature: 28, humidity: 70, light: 1200, flowRate: 120, flowVolume: 0, sensorType: 'plant' });
    refresh();
  }

  return (
    <div className="mock-tab-wrapper">
      <div className="mock-form-glass">
        <h4 style={{ margin: '0 0 1rem', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>Provision New Node</h4>
        <form onSubmit={handleAdd} className="mock-field-group">
          <div className="mock-input-field">
            <label>Sensor Type</label>
            <select value={form.sensorType} onChange={e => setForm(p => ({ ...p, sensorType: e.target.value }))}>
              <option value="plant">Plant Sensor</option>
              <option value="flow">Flow Sensor</option>
            </select>
          </div>
          <div className="mock-input-field">
            <label>Node Name</label>
            <input type="text" placeholder="Zone identifier" value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
          </div>
          {form.sensorType === 'plant' ? (
            <>
              <div className="mock-input-field">
                <label>Moisture %</label>
                <input type="number" min="0" max="100" value={form.moisture}
                  onChange={e => setForm(p => ({ ...p, moisture: +e.target.value }))} />
              </div>
              <div className="mock-input-field">
                <label>Temp °C</label>
                <input type="number" step="0.1" value={form.temperature}
                  onChange={e => setForm(p => ({ ...p, temperature: +e.target.value }))} />
              </div>
              <div className="mock-input-field">
                <label>Humidity %</label>
                <input type="number" min="0" max="100" value={form.humidity}
                  onChange={e => setForm(p => ({ ...p, humidity: +e.target.value }))} />
              </div>
              <div className="mock-input-field">
                <label>Light (lux)</label>
                <input type="number" min="0" max="100000" value={form.light}
                  onChange={e => setForm(p => ({ ...p, light: +e.target.value }))} />
              </div>
            </>
          ) : (
            <>
              <div className="mock-input-field">
                <label>Flow Rate mL/min</label>
                <input type="number" min="0" step="0.1" value={form.flowRate}
                  onChange={e => setForm(p => ({ ...p, flowRate: +e.target.value }))} />
              </div>
              <div className="mock-input-field">
                <label>Flow Volume mL</label>
                <input type="number" min="0" step="1" value={form.flowVolume}
                  onChange={e => setForm(p => ({ ...p, flowVolume: +e.target.value }))} />
              </div>
            </>
          )}
          <button type="submit" className="adm-refresh-btn" style={{ height: '40px', alignSelf: 'flex-end', width: 'auto', padding: '0 1.5rem', borderRadius: '0.5rem' }}>
            {form.sensorType === 'flow' ? 'Provision Flow Sensor' : 'Provision Node'}
          </button>
        </form>
      </div>

      <div className="mock-grid">
        {sensors.map(s => (
          <div key={s.id} className={`mock-record-card ${s.lastUpdate === 'pulsing' ? 'mock-flash-update' : ''}`}>
            <div className="mock-card-header">
              <div>
                <span className="mock-card-id">{s.id}</span>
                <h3 className="mock-card-title">{s.name}</h3>
              </div>
              <span className={`mock-status-chip mock-status--${s.status}`}>{s.status}</span>
            </div>
            
            <div className="mock-card-metrics">
              {s.sensorType === 'flow' ? (
                <>
                  <div className="mock-metric">
                    <span className="mock-metric-label">Flow Rate</span>
                    <span className="mock-metric-value">{Number(s.flowRate || 0).toFixed(1)} mL/min</span>
                  </div>
                  <div className="mock-metric">
                    <span className="mock-metric-label">Flow Volume</span>
                    <span className="mock-metric-value">{Number(s.flowVolume || 0).toFixed(0)} mL</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="mock-metric">
                    <span className="mock-metric-label">Moisture</span>
                    <span className="mock-metric-value">{s.moisture}%</span>
                  </div>
                  <div className="mock-metric">
                    <span className="mock-metric-label">Temp</span>
                    <span className="mock-metric-value">{s.temperature}°C</span>
                  </div>
                  <div className="mock-metric">
                    <span className="mock-metric-label">Humidity</span>
                    <span className="mock-metric-value">{s.humidity}%</span>
                  </div>
                  <div className="mock-metric">
                    <span className="mock-metric-label">Light</span>
                    <span className="mock-metric-value">{s.light || 0} lux</span>
                  </div>
                </>
              )}
            </div>

            <div className="mock-card-footer">
              <select className="mock-select-sm" value={s.status}
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)' }}
                onChange={e => { updateSensor(s.id, { status: e.target.value }); refresh(); }}>
                <option value="active">Active</option>
                <option value="warning">Warning</option>
                <option value="offline">Offline</option>
              </select>
              <button className="adm-btn-danger" style={{ padding: '0.4rem', borderRadius: '0.4rem' }}
                onClick={() => { deleteSensor(s.id); refresh(); }}>
                <i className="fa-solid fa-trash" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ALERTS TAB ──────────────────────────────────────────────────────────────
function AlertsTab({ refresh }) {
  const [form, setForm] = useState({ type: 'moisture', severity: 'medium', message: '' });
  const alerts = mockDataStore.alerts || [];

  function handleAdd(e) {
    e.preventDefault();
    addAlert(form);
    setForm({ type: 'moisture', severity: 'medium', message: '' });
    refresh();
  }

  return (
    <div className="mock-tab-wrapper">
      <div className="mock-form-glass">
        <form onSubmit={handleAdd} className="mock-field-group">
          <div className="mock-input-field">
            <label>Alert Type</label>
            <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
              <option value="moisture">Soil Moisture</option>
              <option value="temperature">Temperature</option>
              <option value="system">System Health</option>
              <option value="disease">Crop Disease</option>
            </select>
          </div>
          <div className="mock-input-field">
            <label>Severity</label>
            <select value={form.severity} onChange={e => setForm(p => ({ ...p, severity: e.target.value }))}>
              <option value="low">Low Impact</option>
              <option value="medium">Medium Priority</option>
              <option value="high">Critical Risk</option>
            </select>
          </div>
          <div className="mock-input-field" style={{ gridColumn: 'span 2' }}>
            <label>Internal Message</label>
            <input type="text" placeholder="Description of the event..." value={form.message}
              onChange={e => setForm(p => ({ ...p, message: e.target.value }))} required />
          </div>
          <button type="submit" className="adm-refresh-btn" style={{ height: '40px', alignSelf: 'flex-end', width: 'auto', padding: '0 1.5rem', borderRadius: '0.5rem' }}>
            Broadcast Alert
          </button>
        </form>
      </div>

      <div className="mock-grid">
        {alerts.map(a => (
          <div key={a.id} className="mock-record-card">
            <div className="mock-card-header">
              <div>
                <span className="mock-card-id">{a.id} • {a.timestamp}</span>
                <h3 className="mock-card-title">{a.type.toUpperCase()}</h3>
              </div>
              <span className={`mock-status-chip mock-status--${a.severity === 'high' ? 'warning' : 'active'}`}>{a.severity}</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0.5rem 0' }}>{a.message}</p>
            <div className="mock-card-footer">
              <label className="mock-sim-toggle" style={{ border: 'none', background: 'none', padding: 0 }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Active</span>
                <label className="adm-toggle-sm">
                  <input type="checkbox" checked={a.enabled}
                    onChange={e => { updateAlert(a.id, { enabled: e.target.checked }); refresh(); }} />
                  <span className="slider-sm" />
                </label>
              </label>
              <button className="adm-btn-danger" style={{ padding: '0.4rem', borderRadius: '0.4rem' }}
                onClick={() => { deleteAlert(a.id); refresh(); }}>
                <i className="fa-solid fa-trash" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CROP HEALTH TAB ──────────────────────────────────────────────────────────
function CropHealthTab({ refresh }) {
  const ch = mockDataStore.cropHealth || {};
  function handleChange(field, v) { updateCropHealth({ [field]: v }); refresh(); }

  return (
    <div className="mock-tab-wrapper">
      <div className="mock-form-glass">
        <h4 style={{ margin: '0 0 1.5rem', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>Analytic Overrides</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <SimulationSlider label="Overall Health Index" value={ch.overallScore} onChange={v => handleChange('overallScore', v)} unit="%" />
          <SimulationSlider label="Disease Probability" value={ch.diseaseProbability} onChange={v => handleChange('diseaseProbability', v)} unit="%" />
          <SimulationSlider label="Water Stress Level" value={ch.waterStress} onChange={v => handleChange('waterStress', v)} unit="%" />
          <SimulationSlider label="Nutrient Saturation" value={ch.nutrientLevel} onChange={v => handleChange('nutrientLevel', v)} unit="%" />
          
          <div className="mock-input-field">
            <label>Current Growth Stage</label>
            <select value={ch.growthStage} onChange={e => handleChange('growthStage', e.target.value)}>
              {['Germination', 'Seedling', 'Vegetative', 'Budding', 'Flowering', 'Ripening', 'Harvest'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── WEATHER TAB ──────────────────────────────────────────────────────────────
function WeatherTab({ refresh }) {
  const w = mockDataStore.weather || {};
  function handleChange(field, v) { updateWeather({ [field]: v }); refresh(); }

  return (
    <div className="mock-tab-wrapper">
      <div className="mock-form-glass">
        <h4 style={{ margin: '0 0 1.5rem', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>Simulation Environment</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <SimulationSlider label="Temperature" value={w.temperature} min={-10} max={55} onChange={v => handleChange('temperature', v)} unit="°C" />
          <SimulationSlider label="Relative Humidity" value={w.humidity} onChange={v => handleChange('humidity', v)} unit="%" />
          <SimulationSlider label="Atmospheric Rainfall" value={w.rainfall} max={300} onChange={v => handleChange('rainfall', v)} unit="mm" />
          <SimulationSlider label="Wind Velocity" value={w.windSpeed} max={120} onChange={v => handleChange('windSpeed', v)} unit="km/h" />
          
          <div className="mock-input-field">
            <label>Sky Condition</label>
            <select value={w.forecast} onChange={e => handleChange('forecast', e.target.value)}>
              {['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Heavy Rain', 'Thunderstorm', 'Windy'].map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── USERS TAB ────────────────────────────────────────────────────────────────
function UsersTab({ refresh }) {
  const users = mockDataStore.users || [];
  const [form, setForm] = useState({ name: '', email: '', role: 'viewer' });

  function handleAdd(e) {
    e.preventDefault();
    addUser(form);
    setForm({ name: '', email: '', role: 'viewer' });
    refresh();
  }

  return (
    <div className="mock-tab-wrapper">
      <div className="mock-form-glass">
        <form onSubmit={handleAdd} className="mock-field-group">
          <div className="mock-input-field">
            <label>User Name</label>
            <input type="text" placeholder="Identity" value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
          </div>
          <div className="mock-input-field">
            <label>Email Address</label>
            <input type="email" placeholder="contact@domain.com" value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
          </div>
          <div className="mock-input-field">
            <label>System Role</label>
            <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
              <option value="admin">Administrator</option>
              <option value="operator">Operator</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <button type="submit" className="adm-refresh-btn" style={{ height: '40px', alignSelf: 'flex-end', width: 'auto', padding: '0 1.5rem', borderRadius: '0.5rem' }}>
            Create Ident
          </button>
        </form>
      </div>

      <div className="mock-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
        {users.map(u => (
          <div key={u.id} className="mock-record-card">
            <div className="mock-card-header">
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', color: '#22d3ee' }}>
                  <i className="fa-solid fa-user" />
                </div>
                <div>
                  <h3 className="mock-card-title">{u.name}</h3>
                  <span className="mock-card-id">{u.email}</span>
                </div>
              </div>
              <span className={`mock-status-chip ${u.active ? 'mock-status--active' : 'mock-status--offline'}`}>
                {u.active ? 'Active' : 'Locked'}
              </span>
            </div>
            
            <div className="mock-card-footer">
              <select className="mock-select-sm" value={u.role}
                onChange={e => { updateUser(u.id, { role: e.target.value }); refresh(); }}>
                <option value="admin">Admin</option>
                <option value="operator">Operator</option>
                <option value="viewer">Viewer</option>
              </select>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <label className="adm-toggle-sm">
                  <input type="checkbox" checked={u.active}
                    onChange={e => { updateUser(u.id, { active: e.target.checked }); refresh(); }} />
                  <span className="slider-sm" />
                </label>
                <button className="adm-btn-danger" style={{ padding: '0.4rem', borderRadius: '0.4rem' }}
                  onClick={() => { deleteUser(u.id); refresh(); }}>
                  <i className="fa-solid fa-user-minus" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SCENARIOS TAB ────────────────────────────────────────────────────────────
function ScenariosTab({ refresh }) {
  const currentScenario = mockDataStore.scenario;
  const scenarios = [
    { key: 'normal',   label: 'Baseline Stability', desc: 'Standard operating conditions with nominal readings.', icon: 'fa-check-circle' },
    { key: 'empty',    label: 'Null State',        desc: 'Simulate first-time user experience or data loss.', icon: 'fa-folder-open' },
    { key: 'error',    label: 'Critical Fault',     desc: 'Force API errors and sensor failure states.', icon: 'fa-triangle-exclamation' },
    { key: 'highLoad', label: 'Enterprise Stress', desc: 'Large scale deployment simulation (20+ nodes).', icon: 'fa-server' },
    { key: 'demo',     label: 'Elite Showcase',    desc: 'Optimized readings for high-end presentations.', icon: 'fa-star' },
  ];

  return (
    <div className="mock-tab-wrapper">
      <div className="mock-scenario-grid">
        {scenarios.map(s => (
          <div key={s.key} 
            className={`mock-scenario-action ${currentScenario === s.key ? 'active' : ''}`}
            onClick={() => { applyScenario(s.key); refresh(); }}>
            <i className={`fa-solid ${s.icon}`} style={{ fontSize: '1.5rem', marginBottom: '1rem', display: 'block', color: currentScenario === s.key ? '#22d3ee' : '#94a3b8' }} />
            <span className="mock-scenario-name">{s.label}</span>
            <span className="mock-scenario-desc">{s.desc}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '3rem', padding: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '1px dashed rgba(255,255,255,0.1)' }}>
        <h4 style={{ margin: '0 0 1rem', color: '#fff' }}>Kernel Maintenance</h4>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="adm-refresh-btn" style={{ width: 'auto', padding: '0 1.5rem' }} onClick={() => { exportMockData(); }}>
             Export Architecture
          </button>
          <button className="adm-btn-danger" style={{ width: 'auto', padding: '0 1.5rem', border: 'none' }} onClick={() => { resetToDefaults(); refresh(); }}>
             Factory Reset Simulation
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── INSTRUCTIONS / HELP TAB ──────────────────────────────────────────────────
function HelpTab() {
  const tips = [
    {
      title: 'Getting Started',
      icon: 'fa-rocket',
      items: [
        '1. Choose a Preset Scenario (right now it\'s "' + mockDataStore.scenario + '")',
        '2. Enable "Drift Mode" in sidebar for live simulation',
        '3. Watch dashboard auto-update with mock data',
        '4. Customize sensors/alerts in their tabs',
      ]
    },
    {
      title: 'Drift Simulation',
      icon: 'fa-wind',
      items: [
        '✓ Enables real-time sensor value changes (every 3 seconds)',
        '✓ Moisture: ±0.5%, Temperature: ±0.2°C, Humidity: ±0.6%',
          '✓ Flow sensors pulse their rate and accumulate volume over time',
        '✓ Realistic for testing charts, alerts, auto-watering logic',
        '✓ Disable to freeze values for stable screenshots',
      ]
    },
    {
      title: 'About This System',
      icon: 'fa-info',
      items: [
        '• Mock mode works 100% in browser (no backend needed)',
        '• Data lives in memory only (cleared on page refresh)',
        '• For important configs: Export JSON before refreshing',
        '• All dashboard pages support mock data automatically',
      ]
    },
  ];

  const scenarios = [
    { name: 'Normal', desc: 'Baseline readings, all sensors active (DEFAULT)' },
    { name: 'Empty', desc: 'No data - test empty state UI' },
    { name: 'Error', desc: 'Sensors offline, multiple alerts - test error handling' },
    { name: 'High Load', desc: '10+ sensors, 5+ alerts - stress test performance' },
    { name: 'Demo', desc: 'Impressive health scores - perfect for presentations' },
  ];

  return (
    <div className="mock-tab-wrapper" style={{ fontSize: '0.95rem', lineHeight: 1.6 }}>
      {/* Quick Tips Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {tips.map((tip, idx) => (
          <div key={idx} style={{ background: 'rgba(34, 211, 238, 0.05)', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid rgba(34, 211, 238, 0.2)' }}>
            <h4 style={{ margin: '0 0 1rem', color: '#22d3ee', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className={`fa-solid ${tip.icon}`} />
              {tip.title}
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#cbd5e1' }}>
              {tip.items.map((item, i) => (
                <li key={i} style={{ marginBottom: '0.5rem' }}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Scenarios Reference */}
      <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '0.75rem', borderLeft: '3px solid #22d3ee' }}>
        <h4 style={{ margin: '0 0 1rem', color: '#22d3ee' }}>📊 Scenario Reference</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          {scenarios.map((s, idx) => (
            <div key={idx} style={{ padding: '1rem', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '0.5rem', borderLeft: '2px solid #4ade80' }}>
              <strong style={{ color: '#4ade80' }}>{s.name}</strong>
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Key Features */}
      <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(139, 92, 246, 0.05)', borderRadius: '0.75rem' }}>
        <h4 style={{ margin: '0 0 1rem', color: '#c084fc' }}>✨ Key Features</h4>
        <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#cbd5e1' }}>
          <li><strong>Time-Series History:</strong> Charts auto-populate with realistic historical data</li>
          <li><strong>Watering Logs:</strong> Synthetic logs appear in Records page</li>
          <li><strong>Disease Detection:</strong> AI insights section shows mock detections</li>
          <li><strong>Export/Import:</strong> Save and restore test configurations anytime</li>
          <li><strong>CRUD Operations:</strong> Add, edit, delete sensors/alerts/users in real-time</li>
          <li><strong>No Backend Required:</strong> Fully offline-capable development</li>
        </ul>
      </div>

      {/* Troubleshooting */}
      <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '0.75rem' }}>
        <h4 style={{ margin: '0 0 1rem', color: '#fca5a5' }}>🔧 Troubleshooting</h4>
        <dl style={{ margin: 0, color: '#cbd5e1', fontSize: '0.9rem' }}>
          <dt style={{ color: '#fca5a5', fontWeight: 600, marginTop: '0.5rem' }}>No data showing?</dt>
          <dd style={{ marginLeft: '1rem', marginBottom: '1rem' }}>Verify Mock is ON (green label), apply a scenario, then refresh.</dd>
          
          <dt style={{ color: '#fca5a5', fontWeight: 600, marginTop: '0.5rem' }}>Data disappeared?</dt>
          <dd style={{ marginLeft: '1rem', marginBottom: '1rem' }}>Page refresh clears in-memory data. Export first!</dd>
          
          <dt style={{ color: '#fca5a5', fontWeight: 600, marginTop: '0.5rem' }}>Drift not working?</dt>
          <dd style={{ marginLeft: '1rem', marginBottom: '1rem' }}>Ensure Mock is ON + at least 1 sensor exists + toggle Drift off/on.</dd>
          
          <dt style={{ color: '#fca5a5', fontWeight: 600, marginTop: '0.5rem' }}>Changes not syncing?</dt>
          <dd style={{ marginLeft: '1rem' }}>Close and reopen affected pages (Home, Analytics) to refresh subscriptions.</dd>
        </dl>
      </div>

      {/* External Resources */}
      <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '0.75rem', textAlign: 'center' }}>
        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>
          📖 Full documentation available at:<br />
          <code style={{ background: 'rgba(0,0,0,0.5)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', color: '#22d3ee', fontSize: '0.85rem' }}>docs/MOCK_MODE_GUIDE.md</code>
        </p>
      </div>
    </div>
  );
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function SimulationSlider({ label, value, min = 0, max = 100, onChange, unit }) {
  return (
    <div className="mock-slider-box">
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8' }}>{label}</label>
        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#22d3ee' }}>{value}{unit}</span>
      </div>
      <input 
        type="range" 
        className="mock-range-input" 
        min={min} max={max} value={value} 
        onChange={e => onChange(+e.target.value)} 
      />
    </div>
  );
}