import React from 'react';
import './glassicon.css';

const iconPaths = {
  home: 'M3 11.2 12 3.8l9 7.4 M6.5 10.2V20h11V10.2',
  sensors: 'M3 13.5h4l2.5-8 4 13 2.5-5H21',
  controls: 'M6 4v16 M12 4v16 M18 4v16 M4 9h4 M10 14h4 M16 7h4',
  ai: 'M12 3 4 7v6c0 4.2 3.6 7.5 8 8 4.4-.5 8-3.8 8-8V7l-8-4Z M9.5 11h5M12 8.5v5',
  config: 'M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Z M4 12h2.1 M17.9 12H20 M12 4v2.1 M12 17.9V20 M6.3 6.3l1.5 1.5 M16.2 16.2l1.5 1.5 M17.7 6.3l-1.5 1.5 M7.8 16.2l-1.5 1.5',
  sun: 'M12 4V2 M12 22v-2 M4 12H2 M22 12h-2 M6.3 6.3 4.9 4.9 M19.1 19.1l-1.4-1.4 M17.7 6.3l1.4-1.4 M6.3 17.7l-1.4 1.4 M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z',
  moon: 'M20 14.5A8.5 8.5 0 1 1 9.5 4 7 7 0 0 0 20 14.5Z',
  menu: 'M4 7h16 M4 12h16 M4 17h16',
  close: 'M6 6l12 12 M18 6 6 18',
  sprout: 'M12 21v-8 M12 13c0-3.8 2.6-6.1 6-7-0.2 4.3-2.8 6.6-6 7Z M12 15c0-3-2-5-5.2-5.5 0.1 3.8 2.1 5.8 5.2 5.5Z',
  monitoring: 'M3 13.5h4l2.5-8 4 13 2.5-5H21',
  watering: 'M12 2.5C9 7 6.5 9.75 6.5 13a5.5 5.5 0 1 0 11 0c0-3.25-2.5-6-5.5-10.5Z',
  disease: 'M8 4h8v4H8z M8 12h8v8H8z M4 8h4v8H4z M16 8h4v8h-4z',
  weather: 'M7 16a4 4 0 1 1 1-7.88A5 5 0 1 1 17.5 15H7Z',
  voice: 'M12 3a3 3 0 0 1 3 3v6a3 3 0 1 1-6 0V6a3 3 0 0 1 3-3Z M5 11a7 7 0 0 0 14 0 M12 18v3 M9 21h6',
  insights: 'M4 18V9m6 9V5m6 13v-7m4 7H2',
  mobile: 'M9 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm3 15h.01',
  alerts: 'M12 4a5 5 0 0 1 5 5v3.5l1.75 2.5h-13l1.75-2.5V9a5 5 0 0 1 5-5Z M10 18h4a2 2 0 0 1-4 0Z',
  check: 'M5 13l4 4L19 7',
  kit: 'M3 9.5h18v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9Z M8 9.5V7a4 4 0 1 1 8 0v2.5',
  demo: 'M8 5h8v14l-4-2-4 2V5Z',
  guide: 'M6 4h9a3 3 0 0 1 3 3v12H9a3 3 0 0 0-3 3V4Z M6 22a3 3 0 0 1 3-3h9',
  // New icons for upgrade
  bell: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0',
  bellDot: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0 M19 3a1 1 0 1 0 2 0 1 1 0 0 0-2 0',
  database: 'M12 3a9 3 0 1 0 0 1 M3 6c0 1.66 4.03 3 9 3s9-1.34 9-3 M3 6v12c0 1.66 4.03 3 9 3s9-1.34 9-3V6 M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3',
  chart: 'M4 20h16 M4 20V10l6-4 5 3 5-5v16',
  chartBar: 'M12 20V10 M18 20V4 M6 20v-4',
  analytics: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
  records: 'M3 3h18v18H3V3z M7 8h10 M7 12h10',
  'arrow-right': 'M5 12h14 M13 5l7 7-7 7',
  water: 'M12 2.5C9 7 6.5 9.75 6.5 13a5.5 5.5 0 1 0 11 0c0-3.25-2.5-6-5.5-10.5Z',
  settings: 'M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Z M4 12h2.1 M17.9 12H20 M12 4v2.1 M12 17.9V20 M6.3 6.3l1.5 1.5 M16.2 16.2l1.5 1.5 M17.7 6.3l-1.5 1.5 M7.8 16.2l-1.5 1.5',
  wifi: 'M5 12.5a10.1 10.1 0 0 1 14 0 M1.5 9A14.5 14.5 0 0 1 22.5 9 M8.5 16a5 5 0 0 1 7 0 M12 20h.01',
  wifiOff: 'M1.5 1.5l21 21 M16.7 16.7A8 8 0 0 0 5.3 5.3 M10.7 5.1A14.5 14.5 0 0 1 22.5 9 M8.5 16a5 5 0 0 1 7 0 M12 20h.01',
  temperature: 'M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0Z',
  humidity: 'M12 2.5C9 7 6.5 9.75 6.5 13a5.5 5.5 0 1 0 11 0c0-3.25-2.5-6-5.5-10.5Z M9.5 15.5l5-5',
  light: 'M12 5V3 M12 21v-2 M4.22 8.22l-1.42-1.42 M20 20l-1.42-1.42 M2 14h2 M20 14h2 M6.34 17.66l-1.42 1.42 M19.08 4.92l-1.42 1.42 M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z',
  ph: 'M6 4v16 M6 12h6 M12 4v8 M18 8v10 M15 14a3 3 0 1 0 6 0 3 3 0 0 0-6 0',
  pump: 'M20 9V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2 M20 15v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2 M12 7v10 M8 11l4-4 4 4 M8 13l4 4 4-4',
  schedule: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z M12 6v6l4 2',
  esp32: 'M4 7h16a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z M7 7V5 M10 7V5 M14 7V5 M17 7V5 M7 17v2 M10 17v2 M14 17v2 M17 17v2',
  bot: 'M12 8V4H8 M9 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-4L12 8Z M9 12h6 M9 16h6',
  chat: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  image: 'M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2Z M8.5 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z M21 15l-5-5L5 21',
  send: 'M22 2L11 13 M22 2l-7 20-4-9-9-4 20-7Z',
  refresh: 'M1 4v6h6 M23 20v-6h-6 M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z M12 8h.01 M12 11v5',
  warning: 'M12 2L2 19h20L12 2Z M12 9v4 M12 17h.01',
  error: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z M15 9l-6 6 M9 9l6 6',
  success: 'M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4 12 14.01l-3-3',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
  filter: 'M22 3H2l8 9.46V19l4 2v-8.54L22 3Z',
  calendar: 'M3 4h18a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z M16 2v4 M8 2v4 M3 10h18',
  leaf: 'M2 22c0-6 4-10 10-12S22 4 22 4c0 6-4 10-10 12S2 22 2 22Z',
  tag: 'M12 2H4a2 2 0 0 0-2 2v7.59a2 2 0 0 0 .59 1.42l8 8a2 2 0 0 0 2.82 0l7.59-7.59a2 2 0 0 0 0-2.83l-8-8A2 2 0 0 0 12 2Z M7 7h.01',
  activity: 'M22 12h-4l-3 9L9 3l-3 9H2',
  server: 'M4 4h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z M4 12h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2Z M8 8h.01 M8 16h.01',
  trash: 'M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6 M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2 M10 11v6 M14 11v6',
  clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z M12 6v6l4 2',
};

export function GlassIcon({ name, className = '', animated = false, size = 'md' }) {
  const animClass = animated ? 'glass-icon-animated' : '';
  const sizeClass = `glass-icon-${size}`;
  return (
    <span
      className={`glass-icon ${animClass} ${sizeClass} ${className}`.trim()}
      aria-hidden="true"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d={iconPaths[name] || iconPaths.home} />
      </svg>
    </span>
  );
}
