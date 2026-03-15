import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassIcon } from '../components/GlassIcon';
import '../styles/HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const homeRef = useRef(null);

  useEffect(() => {
    const root = homeRef.current;
    if (!root) {
      return undefined;
    }

    const revealElements = root.querySelectorAll('.reveal-on-scroll');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: '0px 0px -10% 0px',
        threshold: 0.15,
      },
    );

    revealElements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const root = homeRef.current;
    if (!root) {
      return undefined;
    }

    let frameId = null;

    const onScroll = () => {
      if (frameId) {
        return;
      }
      frameId = window.requestAnimationFrame(() => {
        root.style.setProperty('--scroll-y', `${window.scrollY}px`);
        frameId = null;
      });
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  const features = [
    {
      title: 'Multi-Sensor Monitoring',
      description:
        "Live tracking of soil moisture, pH, temperature, humidity, and light so you always know your plant's exact condition.",
      icon: 'monitoring',
    },
    {
      title: 'Smart Auto-Watering',
      description:
        'Automatically waters when soil is dry, checks weather forecasts to avoid watering before rain, and prevents overwatering.',
      icon: 'watering',
    },
    {
      title: 'AI Disease Detection',
      description:
        'On-device ML model analyzes leaf images and distinguishes healthy vs diseased plants with over 80% real-world accuracy.',
      icon: 'disease',
    },
    {
      title: 'Weather-Aware Decisions',
      description:
        'Integrates with weather APIs to adjust watering based on local rainfall forecasts, reducing water waste.',
      icon: 'weather',
    },
    {
      title: 'Voice Control',
      description:
        'Use simple Google Assistant commands like “water my plant” or “how is my plant?” to control and check status hands-free.',
      icon: 'voice',
    },
    {
      title: 'AI-Powered Insights',
      description:
        'Gemini-based messages translate sensor readings into friendly advice, as if your plant is talking to you.',
      icon: 'insights',
    },
    {
      title: 'Mobile Dashboard',
      description:
        'View live readings, historical charts, camera feed, and control the pump from anywhere with an internet connection.',
      icon: 'mobile',
    },
    {
      title: 'Real-Time Alerts',
      description:
        'Get instant notifications for health issues, disease detection, and pump failures to catch problems before they escalate.',
      icon: 'alerts',
    },
  ];

  const benefits = [
    {
      title: 'Healthier Plants',
      description:
        'More consistent plant health thanks to timely watering, early disease alerts, and fewer extreme condition swings.',
    },
    {
      title: 'Water Conservation',
      description:
        'Reduces water usage by about 15–20% compared to manual watering by avoiding unnecessary irrigation.',
    },
    {
      title: 'Time Savings',
      description:
        'SproutSense takes over repetitive, time-sensitive tasks so you can enjoy the fun part of plant care.',
    },
    {
      title: 'Peace of Mind',
      description:
        'Monitor and control your plants remotely from anywhere, even when traveling or away from home for extended periods.',
    },
  ];

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div ref={homeRef} className="homepage">
      {/* Hero Section */}
      <section id="hero" className="hero-section">
        <div className="hero-orb orb-right scroll-float" aria-hidden="true" />
        <div className="hero-orb orb-left scroll-flat" aria-hidden="true" />
        <div className="hero-layout">
          <div className="hero-content">
            <div className="hero-kicker reveal-on-scroll">IoT + AI Plant Intelligence</div>
            <h1 className="hero-headline reveal-on-scroll" style={{ '--reveal-delay': '80ms' }}>Smart Plant Care, Without the Guesswork</h1>
            <p className="hero-subheadline">
              SproutSense is an IoT-powered plant care assistant that monitors your plants 24×7, 
              waters them automatically, and detects diseases using AI—so your plants stay healthy 
              even when you are busy.
            </p>
            <div className="hero-ctas reveal-on-scroll" style={{ '--reveal-delay': '140ms' }}>
              <button className="btn btn-primary hero-btn" onClick={() => navigate('/controls')}>
                Get Started with SproutSense
              </button>
              <button className="btn btn-secondary hero-btn" onClick={() => scrollToSection('how-it-works')}>
                Watch SproutSense in Action
              </button>
            </div>
          </div>
          <div className="hero-image-container reveal-on-scroll" style={{ '--reveal-delay': '100ms' }}>
            <img 
              src="/demo.jpg" 
              alt="SproutSense IoT Plant Care System - ESP32 microcontroller with soil moisture sensors, temperature/humidity monitoring, and automated water pump connected to plant pot" 
              className="hero-image"
            />
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section id="who-for" className="content-section reveal-on-scroll">
        <div className="section-container">
          <div className="section-card star-border">
            <h2>Who SproutSense is for</h2>
            <p>
              SproutSense is designed for urban gardeners, plant lovers, and busy professionals 
              who struggle to keep their plants consistently healthy. Whether you care for a single 
              balcony plant or a mini indoor jungle, SproutSense makes plant care simple, automated, 
              and stress-free.
            </p>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section id="problem" className="content-section problem-bg reveal-on-scroll">
        <div className="section-container">
          <div className="section-card section-card-alt star-border">
            <h2>The Problem We Solve</h2>
            <p>
              Most plant owners lose plants because they water at the wrong time, miss early disease 
              signs, or cannot monitor conditions while they are away from home. Traditional methods 
              depend on guesswork—SproutSense replaces that with real-time data, automation, and 
              intelligent alerts.
            </p>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="content-section reveal-on-scroll">
        <div className="section-container">
          <div className="section-card star-border">
            <h2>How SproutSense Works</h2>
            <div className="how-it-works-content">
              <div className="how-item scroll-flat">
                <div className="how-step">1</div>
                <h3>Continuous Monitoring</h3>
                <p>
                  Smart sensors track soil moisture, pH, temperature, humidity, and light around 
                  your plant in real-time.
                </p>
              </div>
              <div className="how-item scroll-flat">
                <div className="how-step">2</div>
                <h3>Cloud Intelligence</h3>
                <p>
                  The ESP32 controller sends data to the cloud, where automations, weather checks, 
                  and AI models decide when to water and when to alert you.
                </p>
              </div>
              <div className="how-item scroll-flat">
                <div className="how-step">3</div>
                <h3>Smart Control</h3>
                <p>
                  See everything in your mobile dashboard, control the pump remotely, and talk to 
                  your plant through Google Assistant and AI-generated messages.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section id="features" className="content-section features-bg reveal-on-scroll">
        <div className="section-container">
          <h2 className="section-center-title">Key Features</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={feature.title} className="feature-card scroll-flat star-border" style={{ '--reveal-delay': `${100 + index * 45}ms` }}>
                <GlassIcon name={feature.icon} className="feature-icon" animated />
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="content-section reveal-on-scroll">
        <div className="section-container">
          <div className="section-card star-border">
            <h2>Benefits for Home Gardeners</h2>
            <div className="benefits-list">
              {benefits.map((benefit, index) => (
                <div key={benefit.title} className="benefit-item scroll-flat" style={{ '--reveal-delay': `${120 + index * 40}ms` }}>
                  <GlassIcon name="check" className="benefit-check" />
                  <div>
                    <h3>{benefit.title}</h3>
                    <p>{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* For Students */}
      <section id="students" className="content-section students-bg reveal-on-scroll">
        <div className="section-container">
          <div className="section-card section-card-alt star-border">
            <h2>Built for Students and Makers Too</h2>
            <p>
              SproutSense is not just a gadget—it is a complete end-to-end IoT and AI project, 
              perfect for engineering students and hobbyists. It covers sensors, microcontrollers, 
              cloud dashboards, APIs, and machine learning on real hardware, making it a strong 
              portfolio project for internships and placements.
            </p>
            <div className="tech-stack">
              <h3>Technology Stack</h3>
              <ul>
                <li>ESP32 & ESP32-CAM Microcontrollers</li>
                <li>Multi-sensor Integration (Moisture, pH, Temperature, Humidity, Light)</li>
                <li>Real-time Cloud Backend (Node.js + MongoDB)</li>
                <li>Machine Learning Model (TensorFlow Lite)</li>
                <li>Weather API Integration</li>
                <li>Google Assistant Integration</li>
                <li>React Web Dashboard</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Proven Technology */}
      <section id="proven" className="content-section reveal-on-scroll">
        <div className="section-container">
          <div className="section-card star-border">
            <h2>Proven, Affordable Technology</h2>
            <p>
              The entire system is designed to be affordable, with a total hardware cost under ₹2,000 
              using off-the-shelf components.
            </p>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">97%</div>
                <div className="stat-label">Uptime in Testing</div>
                <p>30-day stable operation with minimal interruptions</p>
              </div>
              <div className="stat-card">
                <div className="stat-number">85%+</div>
                <div className="stat-label">Disease Detection</div>
                <p>Accuracy on test data with efficient on-device inference</p>
              </div>
              <div className="stat-card">
                <div className="stat-number">&lt;2s</div>
                <div className="stat-label">App Response Time</div>
                <p>Fast dashboard updates and cloud interactions</p>
              </div>
              <div className="stat-card">
                <div className="stat-number">₹2000</div>
                <div className="stat-label">Hardware Cost</div>
                <p>Complete system with all sensors and components</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      
      
    </div>
  );
};

export default HomePage;
