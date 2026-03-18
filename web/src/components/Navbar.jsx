import React from 'react';
import { NavLink } from 'react-router-dom';
import { GlassIcon } from './bits/GlassIcon';
import './styles/Navbar.css';

export function Navbar({ 
  currentPage, 
  isMobile, 
  isSidebarCollapsed, 
  toggleSidebar, 
  theme, 
  toggleTheme,
  alertCount = 0,
}) {
  return (
    <nav className="top-navbar" role="banner">
      <div className="navbar-left">
        <button
          className="navbar-toggle"
          onClick={toggleSidebar}
          aria-label={isSidebarCollapsed ? 'Open sidebar' : 'Close sidebar'}
          aria-expanded={!isSidebarCollapsed}
        >
          <GlassIcon
            name={isSidebarCollapsed ? 'menu' : 'close'}
            className="theme-icon navbar-icon"
          />
        </button>

        {/* Brand — shown when sidebar is collapsed or on mobile */}
        {(isSidebarCollapsed || isMobile) && (
          <NavLink
            to="/home"
            className="navbar-brand"
            aria-label="SproutSense Home"
          >
            <GlassIcon name="sprout" className="navbar-brand-icon" animated />
            <span className="navbar-brand-text">SproutSense</span>
          </NavLink>
        )}

        {/* Current page title — truncated via CSS if too wide */}
        <h3 className="navbar-page-title" title={currentPage}>
          {currentPage}
        </h3>
      </div>

      <div className="navbar-right">
        {/* Alert Bell */}
        <NavLink
          to="/alerts"
          className="navbar-alert-btn"
          aria-label={alertCount > 0 ? `${alertCount} unread alerts` : 'Alerts'}
          title="View Alerts"
        >
          <GlassIcon
            name="bell"
            className="navbar-icon"
            animated={alertCount > 0}
          />
          {alertCount > 0 && (
            <span className="navbar-alert-badge" aria-hidden="true">
              {alertCount > 99 ? '99+' : alertCount}
            </span>
          )}
        </NavLink>

        {/* Theme Toggle — hidden on smallest screens via CSS */}
        <button
          className="navbar-theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          <GlassIcon
            name={theme === 'dark' ? 'sun' : 'moon'}
            className="theme-icon navbar-icon"
          />
        </button>
      </div>
    </nav>
  );
}
