import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { publicAPI } from '../../utils/api';
import ScrollReveal from '../../components/bits/ScrollReveal';
import './PublicPages.css';

const CORE_CAPABILITIES = [
  {
    title: 'Smart Sensor Network',
    description: 'Six parameters monitored simultaneously: soil moisture, temperature, humidity, pH, NPK, and light intensity via a dual-ESP32 architecture.',
    icon: 'fa-solid fa-wave-square',
  },
  {
    title: 'Automated Irrigation',
    description: 'Precision pump control driven by moisture thresholds and scheduling windows to prevent both overwatering and underwatering.',
    icon: 'fa-solid fa-droplet',
  },
  {
    title: 'On-Device AI Diagnostics',
    description: 'ESP32-CAM and edge-model workflows support early disease awareness without cloud-only dependency for core detection cycles.',
    icon: 'fa-solid fa-camera',
  },
  {
    title: 'Live Analytics Dashboard',
    description: 'WebSocket-powered visibility across trend analysis, history, and operational insights from any connected device.',
    icon: 'fa-solid fa-chart-line',
  },
];

const ABOUT_STORY = [
  {
    title: 'The Problem',
    description: 'Inconsistent watering, delayed disease detection, and low sensor visibility cause avoidable plant loss in small and medium setups.',
    icon: 'fa-solid fa-bullseye',
  },
  {
    title: 'Our Approach',
    description: 'SproutSense combines sensor telemetry, an AI-capable camera node, and a web dashboard with role-safe workflows.',
    icon: 'fa-solid fa-microchip',
  },
  {
    title: 'What You Get',
    description: 'Practical irrigation guidance, transparent monitoring, and safer operations through clear role-based boundaries.',
    icon: 'fa-solid fa-layer-group',
  },
];

const ARCHITECTURE_LAYERS = [
  {
    title: 'ESP32-SENSOR',
    description: 'Reads moisture, temperature, humidity, pH, and related telemetry while driving relay-based irrigation control.',
    icon: 'fa-solid fa-microchip',
  },
  {
    title: 'ESP32-CAM',
    description: 'Captures plant imagery and posts disease-related inference outputs for monitoring and review.',
    icon: 'fa-solid fa-camera',
  },
  {
    title: 'Node.js Backend',
    description: 'Express API and WebSocket bridge persist readings, watering logs, and AI events to MongoDB Atlas.',
    icon: 'fa-solid fa-server',
  },
  {
    title: 'React Dashboard',
    description: 'Public and authenticated interfaces deliver real-time data, trends, and control experiences by role.',
    icon: 'fa-solid fa-desktop',
  },
];

const TECHNOLOGY_STACK = [
  {
    title: 'Hardware Layer',
    description: 'ESP32-WROOM, ESP32-CAM, DHT22, capacitive moisture, pH, and NPK sensors.',
    icon: 'fa-solid fa-microchip',
  },
  {
    title: 'Backend Layer',
    description: 'Node.js, Express, WebSocket streaming, MongoDB Atlas, and Render deployment.',
    icon: 'fa-solid fa-server',
  },
  {
    title: 'Frontend Layer',
    description: 'React 18, Vite, React Router, charting workflows, and Netlify hosting.',
    icon: 'fa-solid fa-window-maximize',
  },
  {
    title: 'AI and Insights',
    description: 'Edge Impulse/TFLite pathways plus advisory AI integrations for richer diagnosis context.',
    icon: 'fa-solid fa-brain',
  },
];

function Hero({ kicker, title, description, image, actions = null }) {
  return (
    <section className="pp-hero">
      <div className="pp-hero-glow" />
      <div className="pp-hero-content">
        {kicker && <span className="pp-kicker">{kicker}</span>}
        <h1>{title}</h1>
        <p>{description}</p>
        {actions && <div className="pp-actions">{actions}</div>}
      </div>
      <div className="pp-hero-visual">
        <img src={image} alt="SproutSense Platform" />
        <div className="pp-visual-overlay" />
      </div>

      <div className="pp-scroll-hint">
        <span>EXPLORE SPROUTSENSE</span>
        <i className="fa-solid fa-chevron-down" />
      </div>
    </section>
  );
}


function AmbientBlobs() {
  return (
    <div className="pp-ambient-blobs">
      <div className="pp-blob pp-blob-1" />
      <div className="pp-blob pp-blob-2" />
      <div className="pp-blob pp-blob-3" />
    </div>
  );
}

export function PublicHomePage() {
  const [stats, setStats] = useState({ sensors: '14+', uptime: '99.9%', users: '2k+' });

  return (
    <div className="pp-page">
      <AmbientBlobs />
      <Hero
        kicker="The Future of Smart Agriculture"
        title="SproutSense: Precision Care for Every Plant."
        description="Leverage a dual-ESP32 architecture and edge AI diagnostics to monitor soil, light, and disease in real-time. Transparent, reliable, and built for modern growers."
        image="/assets/P1.png"
        actions={
          <>
            <Link className="pp-btn pp-btn-primary" to="/demo"><i className="fa-solid fa-bolt" /> Explore Demo</Link>
            <Link className="pp-btn pp-btn-ghost" to="/features"><i className="fa-solid fa-leaf" /> System Specs</Link>
          </>
        }
      />

      <ScrollReveal baseOpacity={0} blurStrength={10}>
        <section className="pp-section pp-glass pp-metrics-strip">
          <div className="pp-metric-item">
            <span className="pp-metric-val">{stats.sensors}</span>
            <span className="pp-metric-label">Active Sensors</span>
          </div>
          <div className="pp-metric-item">
            <span className="pp-metric-val">{stats.uptime}</span>
            <span className="pp-metric-label">System Uptime</span>
          </div>
          <div className="pp-metric-item">
            <span className="pp-metric-val">{stats.users}</span>
            <span className="pp-metric-label">Satisfied Growers</span>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal baseOpacity={0} blurStrength={15} baseRotation={3}>
        <section className="pp-section">
          <div className="pp-section-header">
            <h2>Intelligent Monitoring</h2>
            <p>Everything you need to ensure your plants thrive, from deep-soil metrics to advanced visual diagnostics.</p>
          </div>

          <div className="pp-bento">
            <article className="pp-bento-item pp-bento-item--large pp-glass">
              <div className="pp-bento-icon"><i className="fa-solid fa-wave-square" /></div>
              <h3>Smart Sensor Network</h3>
              <p>Six parameters monitored simultaneously: moisture, temp, humidity, pH, NPK, and light via our custom dual-ESP32 architecture.</p>
            </article>
            <article className="pp-bento-item pp-glass">
              <div className="pp-bento-icon"><i className="fa-solid fa-brain" /></div>
              <h3>Edge AI</h3>
              <p>On-device plant disease awareness with ESP32-CAM processing.</p>
            </article>
            <article className="pp-bento-item pp-glass">
              <div className="pp-bento-icon"><i className="fa-solid fa-droplet" /></div>
              <h3>Smart Irrigation</h3>
              <p>Threshold-driven pump control for precision watering cycles.</p>
            </article>
            <article className="pp-bento-item pp-bento-item--large pp-glass">
              <div className="pp-bento-icon"><i className="fa-solid fa-shield-halved" /></div>
              <h3>Role-Safe Operations</h3>
              <p>Public discovery, visitor views, and admin-only controls stay strictly separated for maximum security and ease of use.</p>
            </article>
          </div>
        </section>
      </ScrollReveal>

      {/* Philosophical Scroll Reveal */}
      <section className="pp-quote-section">
        <div className="pp-quote-bg" />

        <div className="pp-quote-wrap">
          <div className="pp-quote-circle" aria-hidden="true" />

          <ScrollReveal baseOpacity={0} enableBlur baseRotation={0} blurStrength={6}>
            <h2 className="pp-quote-main pp-typing-text">When does a plant die?</h2>
          </ScrollReveal>

          <div className="pp-quote-lines">
            <ScrollReveal baseOpacity={0} enableBlur baseRotation={0} blurStrength={8}>
              <p className="pp-quote-line" style={{ animationDelay: '5s' }}>When it is hit by a storm? No!</p>
            </ScrollReveal>

            <ScrollReveal baseOpacity={0} enableBlur baseRotation={0} blurStrength={8}>
              <p className="pp-quote-line" style={{ animationDelay: '10s' }}>When it suffers a disease? No!</p>
            </ScrollReveal>

            <ScrollReveal baseOpacity={0} enableBlur baseRotation={0} blurStrength={8}>
              <p className="pp-quote-line" style={{ animationDelay: '15s' }}>When it is left in the dark? No!</p>
            </ScrollReveal>

            <ScrollReveal baseOpacity={0} enableBlur baseRotation={0} blurStrength={10}>
              <p className="pp-quote-line pp-quote-final" style={{ animationDelay: '20s' }}>A plant dies when it is forgotten!</p>
            </ScrollReveal>
          </div>
        </div>

        
      </section>

    </div>
  );
}

export function PublicAboutPage() {
  return (
    <div className="pp-page">
      <AmbientBlobs />
      <Hero
        title="Pioneering Precision Plant Intelligence."
        description="SproutSense is an end-to-end IoT platform dedicated to high-fidelity monitoring and automated irrigation, ensuring your plants grow in their optimal environment."
        image="/assets/P2.png"
      />

      <ScrollReveal baseOpacity={0} blurStrength={10} baseRotation={2}>
        <section className="pp-section">
          <div className="pp-section-header">
            <h2>Our Core Mission</h2>
            <p>We solve the most common challenges in plant care through integrated hardware and intelligent software.</p>
          </div>
          <div className="pp-bento">
            {ABOUT_STORY.map((item, idx) => (
              <article key={item.title} className={`pp-bento-item pp-glass ${idx === 1 ? 'pp-bento-item--large' : ''}`}>
                <div className="pp-bento-icon"><i className={item.icon} /></div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal baseOpacity={0} blurStrength={15} baseRotation={-1} scrollOffset={0.2}>
        <section className="pp-section">
          <div className="pp-section-header">
            <h2>System Architecture</h2>
            <p>A robust stack built for reliability, transparency, and real-time performance.</p>
          </div>
          <div className="pp-tech-grid">
            {ARCHITECTURE_LAYERS.map((item) => (
              <article key={item.title} className="pp-glass pp-card">
                <div className="pp-bento-icon"><i className={item.icon} /></div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>
      </ScrollReveal>

    </div>
  );
}

export function PublicFeaturesPage() {
  return (
    <div className="pp-page">
      <AmbientBlobs />
      <Hero
        title="Enterprise-Grade Capabilities."
        description="From multi-sensor telemetry to real-time analytics, SproutSense delivers a comprehensive suite of tools for the modern grower."
        image="/assets/P3.png"
      />

      <ScrollReveal baseOpacity={0} blurStrength={10}>
        <section className="pp-section">
          <div className="pp-section-header">
            <h2>Core Capabilities</h2>
            <p>Designed for precision, built for scale.</p>
          </div>
          <div className="pp-bento">
            {CORE_CAPABILITIES.map((item, idx) => (
              <article key={item.title} className={`pp-bento-item pp-glass ${idx % 3 === 0 ? 'pp-bento-item--large' : ''}`}>
                <div className="pp-bento-icon"><i className={item.icon} /></div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal baseOpacity={0} blurStrength={10} baseRotation={2} scrollOffset={0.2}>
        <section className="pp-section">
          <div className="pp-section-header">
            <h2>The Tech Stack</h2>
            <p>Leveraging cutting-edge technologies to bridge the gap between soil and screen.</p>
          </div>
          <div className="pp-tech-grid">
            {TECHNOLOGY_STACK.map((item) => (
              <article key={item.title} className="pp-glass pp-card">
                <div className="pp-bento-icon"><i className={item.icon} /></div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>
      </ScrollReveal>
    </div>
  );
}

export function PublicContactPage() {
  return (
    <div className="pp-page">
      <AmbientBlobs />
      <Hero
        title="Get in Touch."
        description="For partnerships, large-scale deployments, or general support, our team is here to help you scale your agricultural intelligence."
        image="/assets/P4.png"
      />

      <section className="pp-section">
        <div className="pp-bento">
          <article className="pp-bento-item pp-glass">
            <div className="pp-bento-icon"><i className="fa-solid fa-envelope" /></div>
            <h3>Direct Email</h3>
            <p>sproutsense.iot@gmail.com</p>
          </article>
          <article className="pp-bento-item pp-bento-item--large pp-glass">
            <div className="pp-bento-icon"><i className="fa-solid fa-clock" /></div>
            <h3>Operational Hours</h3>
            <p>Our technical team is available Mon-Sat, 10:00 to 18:00 IST for deployment assistance.</p>
          </article>
        </div>
      </section>
    </div>
  );
}

const PLANT_PROFILES = [
  {
    title: 'Tomato',
    icon: 'fa-solid fa-seedling',
    tags: ['pH 6.0–6.8', 'Temp 20–27 °C', 'Moisture 55–70%'],
    desc: 'Keep soil consistently moist — never waterlogged. Watch for blossom-end rot from calcium deficiency linked to irregular watering. SproutSense moisture alerts catch this early.',
  },
  {
    title: 'Chili Pepper',
    icon: 'fa-solid fa-pepper-hot',
    tags: ['pH 6.0–6.8', 'Temp 21–29 °C', 'Humidity 55–70%'],
    desc: 'Excellent drainage is critical. Humidity above 80% invites fungal issues. Light above 20 000 lux accelerates capsaicin development and fruit set.',
  },
  {
    title: 'Spinach',
    icon: 'fa-solid fa-leaf',
    tags: ['pH 6.5–7.0', 'Temp 10–20 °C', 'Moisture 60–70%'],
    desc: 'Cool-weather crop. Bolt risk rises sharply above 24 °C — SproutSense temperature alerts help you harvest before quality degrades. Consistent moisture prevents tip burn.',
  },
  {
    title: 'Basil',
    icon: 'fa-solid fa-mortar-pestle',
    tags: ['pH 6.0–7.0', 'Temp 20–27 °C', 'Light > 12 000 lux'],
    desc: 'Light-hungry herb that wilts quickly under drought. Keep soil evenly moist but let the surface dry slightly between waterings to prevent root rot.',
  },
];

const CONDITION_ITEMS = [
  {
    title: 'Soil Moisture',
    icon: 'fa-solid fa-droplet',
    large: true,
    desc: 'Single readings are misleading. SproutSense tracks moisture trends over time — catching slow drying cycles before visible wilting appears. The system alerts you when you deviate from your configured threshold.',
  },
  {
    title: 'Light Intensity',
    icon: 'fa-solid fa-sun',
    desc: 'Measured in lux via the CAM node. Most fruiting crops need 20 000–40 000 lux for peak productivity. Low readings trigger grow-light recommendations in the AI hub.',
  },
  {
    title: 'Disease Watch',
    icon: 'fa-solid fa-eye',
    desc: 'ESP32-CAM scans for discolouration, spots, and leaf deformation. Early visual flags post to Alerts before the infection can spread.',
  },
  {
    title: 'Humidity & Temperature',
    icon: 'fa-solid fa-temperature-half',
    large: true,
    desc: 'High humidity + high temperature simultaneously creates fungal breeding conditions. SproutSense cross-analyses both sensors and fires a compound alert when both thresholds are exceeded.',
  },
];

export function PublicPlantLibraryPage() {
  return (
    <div className="pp-page">
      <AmbientBlobs />
      <Hero
        kicker="Growing Intelligence"
        title="Plant Insights Library."
        description="Science-backed care guides for every plant SproutSense monitors — from optimal pH ranges to disease early-warning signs."
        image="/assets/P5.png"
      />

      <ScrollReveal baseOpacity={0} blurStrength={10} baseRotation={-1}>
        <section className="pp-section">
          <div className="pp-section-header">
            <h2>Plant Profiles</h2>
            <p>Optimal ranges, stress indicators, and care priorities for the crops SproutSense tracks.</p>
          </div>
          <div className="pp-tech-grid">
            {PLANT_PROFILES.map(item => (
              <article key={item.title} className="pp-glass pp-card">
                <div className="pp-bento-icon"><i className={item.icon} /></div>
                <h3>{item.title}</h3>
                <div className="pp-tag-wrap">
                  {item.tags.map(tag => (
                    <span key={tag} className="pp-tag">{tag}</span>
                  ))}
                </div>
                <p>{item.desc}</p>
              </article>
            ))}
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal baseOpacity={0} blurStrength={15} baseRotation={1} scrollOffset={0.2}>
        <section className="pp-section">
          <div className="pp-section-header">
            <h2>Growing Conditions</h2>
            <p>Understand every environmental parameter SproutSense monitors and why each one matters.</p>
          </div>
          <div className="pp-bento">
            {CONDITION_ITEMS.map(item => (
              <article
                key={item.title}
                className={`pp-bento-item pp-glass${item.large ? ' pp-bento-item--large' : ''}`}
              >
                <div className="pp-bento-icon"><i className={item.icon} /></div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </article>
            ))}
          </div>
        </section>
      </ScrollReveal>
    </div>
  );
}

export function PublicDemoPage() {
  const [overview, setOverview] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [reportRows, setReportRows] = useState([]);

  useEffect(() => {
    publicAPI.getOverview().then((res) => setOverview(res || res?.data || null)).catch(() => setOverview(null));
    publicAPI.getAnalyticsPreview(24).then((res) => setAnalytics(res?.summary || res?.data?.summary || null)).catch(() => setAnalytics(null));
    publicAPI.getReportsPreview().then((res) => setReportRows(res?.weeklyWatering || res?.data?.weeklyWatering || [])).catch(() => setReportRows([]));
  }, []);

  const previewRows = useMemo(() => reportRows.slice(-5), [reportRows]);

  return (
    <div className="pp-page">
      <AmbientBlobs />
      <Hero
        title="Experience the Interface."
        description="Explore live sensor telemetry and analytics in this read-only interactive demonstration of the SproutSense environment."
        image="/assets/P1.png"
      />

      <section className="pp-section">
        <div className="pp-section-header">
          <h2>Live Telemetry</h2>
          <p>Real-time readings from our active sensor network.</p>
        </div>
        <div className="pp-bento">
          <article className="pp-bento-item pp-glass">
            <span className="pp-metric-label">Soil Moisture</span>
            <span className="pp-metric-val">{overview?.latest?.soilMoisture ?? '--'}%</span>
          </article>
          <article className="pp-bento-item pp-glass">
            <span className="pp-metric-label">Temperature</span>
            <span className="pp-metric-val">{overview?.latest?.temperature ?? '--'} C</span>
          </article>
          <article className="pp-bento-item pp-glass">
            <span className="pp-metric-label">Humidity</span>
            <span className="pp-metric-val">{overview?.latest?.humidity ?? '--'}%</span>
          </article>
        </div>
      </section>

      <section className="pp-section">
        <div className="pp-glass pp-card">
          <div className="pp-section-header" style={{ marginBottom: '2rem' }}>
            <h3><i className="fa-solid fa-table" /> Weekly Watering Snapshot</h3>
          </div>
          <div className="pp-table-wrapper">
            <table className="pp-table">
              <thead><tr><th>Day</th><th>Watering Cycles</th><th>Volume (mL)</th></tr></thead>
              <tbody>
                {previewRows.length === 0 ? (
                  <tr><td colSpan={3}>No preview data available</td></tr>
                ) : previewRows.map((row) => (
                  <tr key={row.day}><td>{row.day}</td><td>{row.cycles}</td><td>{row.volumeML}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
