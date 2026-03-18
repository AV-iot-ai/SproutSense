/**
 * Layout.jsx — components/layout/
 * App shell wrapper: composes the fixed Sidebar + scrollable main content.
 *
 * Renders:
 *  1. Mobile overlay (tapping it closes the sidebar)
 *  2. <Sidebar> — fixed to the left on desktop, slide-in on mobile
 *  3. <div className="container"> — right-side content area with margin offset
 *
 * The main content area receives `children` from App.jsx which contains
 * the <Navbar> and all <Routes>.
 *
 * Props:
 *  - children           {ReactNode}
 *  - isSidebarCollapsed {boolean}
 *  - isMobile           {boolean}
 *  - closeSidebar       {fn}       — closes overlay on mobile tap
 *  - sidebarCategories  {Array}
 *  - systemStatus       {Object}
 *  - alerts             {Array}
 */
import React from 'react';
import Sidebar from './Sidebar';
import './styles/Layout.css';

export function Layout({
  children,
  isSidebarCollapsed,
  isMobile,
  closeSidebar,
  sidebarCategories,
  systemStatus,
  alerts,
}) {
  return (
    <div
      className={`app-shell${isSidebarCollapsed ? ' sidebar-collapsed' : ''}`}
    >
      {/* ── Mobile backdrop overlay ── */}
      {!isSidebarCollapsed && isMobile && (
        <div
          className="sidebar-overlay"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* ── Fixed sidebar ── */}
      <Sidebar
        sidebarCategories={sidebarCategories}
        systemStatus={systemStatus}
        alerts={alerts}
        closeSidebar={closeSidebar}
      />

      {/* ── Main content: navbar + routes ── */}
      <div className="container">
        {children}
      </div>
    </div>
  );
}

export default Layout;
