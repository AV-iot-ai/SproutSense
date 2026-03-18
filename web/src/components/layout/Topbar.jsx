/**
 * Topbar.jsx — components/layout/
 * Top navigation bar shown above every page.
 *
 * Features:
 *  - Hamburger button to toggle sidebar (desktop collapse / mobile slide)
 *  - Current page title
 *  - WebSocket connection status pill
 *  - Alert bell with unread count badge
 *  - Dark/Light theme toggle
 *
 * Props:
 *  - currentPage        {string}   — active route label shown as title
 *  - isMobile           {boolean}  — true when viewport ≤ 768 px
 *  - isSidebarCollapsed {boolean}
 *  - toggleSidebar      {fn}
 *  - theme              {string}   — 'dark' | 'light'
 *  - toggleTheme        {fn}
 *  - alertCount         {number}   — number of active alerts
 *  - isConnected        {boolean}  — WebSocket / backend live connection
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { GlassIcon } from '../GlassIcon';

export function Topbar({
  currentPage,
  isMobile,
  isSidebarCollapsed,
  toggleSidebar,
  theme,
  toggleTheme,
  alertCount,
  isConnected,
}) {
  return (
    <header className="top-navbar" role="banner">

      {/* ── Left: hamburger + page title ── */}
      <div className="navbar-left">
        <button
          className="navbar-toggle"
          onClick={toggleSidebar}
          aria-label={isSidebarCollapsed ? 'Open sidebar' : 'Close sidebar'}
          aria-expanded={!isSidebarCollapsed}
        >
          {/* Show X on mobile when sidebar open, otherwise hamburger */}
          {isMobile && !isSidebarCollapsed ? '✕' : '☰'}
        </button>

        {/* Brand logo — visible when sidebar is collapsed on desktop */}
        {isSidebarCollapsed && !isMobile && (
          <Link to="/home" className="navbar-brand" aria-label="SproutSense home">
            <GlassIcon name="sprout" className="navbar-brand-icon" />
            <span className="navbar-brand-text">SproutSense</span>
          </Link>
        )}

        {/* Active page title */}
        <h1 className="navbar-title">{currentPage}</h1>
      </div>

      {/* ── Right: connection status, alerts, theme toggle ── */}
      <div className="navbar-right">

        {/* Live connection status */}
        <div
          className={`navbar-connection ${isConnected ? 'connected' : 'disconnected'}`}
          role="status"
          aria-live="polite"
        >
          <GlassIcon
            name={isConnected ? 'wifi' : 'wifi-off'}
            className="connection-icon"
          />
          <span className="connection-text">
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>

        {/* Alert bell */}
        <Link
          to="/alerts"
          className="navbar-alert-btn"
          aria-label={`${alertCount} active alerts`}
        >
          <GlassIcon name="bell" className="glass-icon" />
          {alertCount > 0 && (
            <span className="navbar-alert-badge">{alertCount}</span>
          )}
        </Link>

        {/* Theme toggle */}
        <button
          className="navbar-theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          <span className="theme-icon">
            {theme === 'dark' ? '🌙' : '☀️'}
          </span>
        </button>
      </div>
    </header>
  );
}

export default Topbar;
