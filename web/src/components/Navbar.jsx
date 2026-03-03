import React from 'react';
import { NavLink } from 'react-router-dom';
import { GlassIcon } from './GlassIcon';

export function Navbar({ 
  currentPage, 
  isConnected, 
  isMobile, 
  isSidebarCollapsed, 
  toggleSidebar, 
  theme, 
  toggleTheme,
  alertCount = 0,
  deviceOnline = false,
}) {
  return (
    <nav className="top-navbar">
      <div className="navbar-left">
        <button
          className="navbar-toggle"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          <GlassIcon name={isSidebarCollapsed ? 'menu' : 'close'} className="theme-icon navbar-icon" />
        </button>

        {/* SproutSense brand logo — shown when sidebar is collapsed or on mobile */}
        {(isSidebarCollapsed || isMobile) && (
          <NavLink to="/home" className="navbar-brand" aria-label="SproutSense Home">
            <GlassIcon name="sprout" className="navbar-brand-icon" />
            <span className="navbar-brand-text">SproutSense</span>
          </NavLink>
        )}

        <h3 className="navbar-page-title">{currentPage}</h3>
      </div>

      <div className="navbar-right">
        {/* Backend Server connection status */}
        <span className={`navbar-connection ${isConnected ? 'connected' : 'disconnected'}`} title="Backend server connection">
          <GlassIcon name="server" className="connection-icon" />
          <span className="connection-text">
            {isConnected ? 'Backend' : 'Offline'}
          </span>
        </span>

        {/* ESP32 Device connection status */}
        <span className={`navbar-connection ${deviceOnline ? 'connected' : 'disconnected'}`} title="ESP32 device status">
          <GlassIcon name="wifi" className="connection-icon" />
          <span className="connection-text">
            {deviceOnline ? 'ESP32' : 'No Device'}
          </span>
        </span>

        {/* Alert Bell */}
        <NavLink to="/alerts" className="navbar-alert-btn" aria-label={`${alertCount} alerts`} title="View Alerts">
          <GlassIcon name="bell" className="navbar-icon" />
          {alertCount > 0 && (
            <span className="navbar-alert-badge">{alertCount}</span>
          )}
        </NavLink>

        {/* Theme Toggle */}
        <button 
          className="navbar-theme-toggle" 
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          <GlassIcon name={theme === 'dark' ? 'sun' : 'moon'} className="theme-icon navbar-icon" />
        </button>
      </div>
    </nav>
  );
}

