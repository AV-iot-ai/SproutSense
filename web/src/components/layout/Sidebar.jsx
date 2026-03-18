/**
 * Sidebar.jsx — components/layout/
 * Main navigation sidebar for SproutSense.
 *
 * Responsibilities:
 *  - Renders category groups with nav links
 *  - Shows alert badge count on Alerts link
 *  - Shows online/offline status dots on Backend & Device links
 *  - Shows system status pills at the bottom (Backend, ESP32, ESP32-CAM)
 *
 * Props:
 *  - sidebarCategories  {Array}   — list of { label, items[] } objects
 *  - systemStatus       {Object}  — { backend, esp32, esp32Cam }
 *  - alerts             {Array}   — current active alerts list
 *  - closeSidebar       {fn}      — called on link click (closes on mobile)
 *  - isSidebarCollapsed {boolean}
 */
import React from 'react';
import { NavLink } from 'react-router-dom';
import { GlassIcon } from '../GlassIcon';
import '../layout/Sidebar.css';

// Converts a status string to a human-readable label
function statusLabel(status) {
  switch (status) {
    case 'online':   return 'Online';
    case 'offline':  return 'Offline';
    default:         return 'Checking';
  }
}

export function Sidebar({
  sidebarCategories,
  systemStatus,
  alerts,
  closeSidebar,
}) {
  return (
    <aside className="sidebar" role="navigation" aria-label="Main navigation">

      {/* ── Brand logo ── */}
      <div className="sidebar-brand">
        <GlassIcon name="sprout" className="sidebar-brand-icon" />
        <span className="sidebar-brand-text">SproutSense</span>
      </div>

      {/* ── Nav links grouped by category ── */}
      <nav className="sidebar-nav">
        {sidebarCategories.map((category) => (
          <div key={category.label} className="sidebar-category">
            <span className="sidebar-cat-label">{category.label}</span>

            {category.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-link${isActive ? ' active' : ''}`
                }
                title={item.label}
                onClick={closeSidebar}
              >
                {/* Icon with optional badge / status dot */}
                <span className="sidebar-icon-wrap">
                  <GlassIcon name={item.icon} className="sidebar-icon" />

                  {/* Alert count badge */}
                  {item.path === '/alerts' && alerts.length > 0 && (
                    <span className="sidebar-badge">{alerts.length}</span>
                  )}

                  {/* Backend online/offline dot */}
                  {item.path === '/backend' && (
                    <span
                      className={`sidebar-status-dot ${systemStatus.backend}`}
                      title={`Backend: ${statusLabel(systemStatus.backend)}`}
                    />
                  )}

                  {/* Device (ESP32 + CAM) online/offline dot */}
                  {item.path === '/esp32' && (
                    <span
                      className={`sidebar-status-dot ${
                        systemStatus.esp32Cam === 'online' || systemStatus.esp32 === 'online'
                          ? 'online'
                          : 'offline'
                      }`}
                      title={`ESP32: ${statusLabel(systemStatus.esp32)} | CAM: ${statusLabel(systemStatus.esp32Cam)}`}
                    />
                  )}
                </span>

                <span className="sidebar-label">{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* ── System status pills ── */}
      <div className="sidebar-system-status" aria-label="System status overview">
        <div className="sidebar-system-row">
          <span className="sidebar-system-label">Backend</span>
          <span className={`sidebar-system-pill ${systemStatus.backend}`}>
            {statusLabel(systemStatus.backend)}
          </span>
        </div>
        <div className="sidebar-system-row">
          <span className="sidebar-system-label">ESP32</span>
          <span className={`sidebar-system-pill ${systemStatus.esp32}`}>
            {statusLabel(systemStatus.esp32)}
          </span>
        </div>
        <div className="sidebar-system-row">
          <span className="sidebar-system-label">ESP32-CAM</span>
          <span className={`sidebar-system-pill ${systemStatus.esp32Cam}`}>
            {statusLabel(systemStatus.esp32Cam)}
          </span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
