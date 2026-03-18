/**
 * HomePage.jsx — pages/Home/
 * Dashboard overview page for SproutSense.
 *
 * Shows:
 *  - Animated ScrollVelocity hero banner
 *  - Live sensor summary (passed from App state via props)
 *  - Quick-link buttons to Sensors, Controls, AI sections
 *  - AI recommendation panel
 *
 * Props:
 *  - theme       {string}  — 'dark' | 'light'
 *  - sensors     {Object}  — latest sensor readings from WebSocket
 *  - isConnected {boolean} — WebSocket live status
 */
import React from 'react';
import './HomePage.css';
// Re-export from the original implementation — avoids duplicating code
export { default } from '../HomePage';
