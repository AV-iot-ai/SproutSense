/**
 * colorUtils.js — CSS Variable Color Resolution
 * Utilities for resolving CSS custom properties to actual color values
 * for use in inline styles, SVG attributes, and dynamic rendering
 */

import React from 'react';

/**
 * Get the computed value of a CSS custom property
 * @param {string} varName - CSS variable name (e.g., '--sensor-moisture', 'var(--sensor-moisture)')
 * @returns {string} - Computed color value or fallback
 */
export function getCSSVariableValue(varName) {
  // Handle both formats: '--varname' and 'var(--varname)'
  let cleanVar = varName;
  if (varName.includes('var(')) {
    cleanVar = varName.replace(/var\((--[^)]+)\)/, '$1');
  }
  if (!cleanVar.startsWith('--')) {
    cleanVar = '--' + cleanVar;
  }

  try {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(cleanVar)
      .trim();
    return value || getFallbackColor(cleanVar);
  } catch (e) {
    console.warn(`Failed to resolve CSS variable ${cleanVar}:`, e);
    return getFallbackColor(cleanVar);
  }
}

/**
 * Fallback color palette for when CSS variables cannot be resolved.
 *
 * Notes:
 * - Many parts of the app read CSS variables at runtime (SVG strokes,
 *   inline styles, chart colors). If the document styles are not yet
 *   available (server-side rendering, early mount, or CSP restrictions),
 *   we fall back to these values so UI remains visually consistent.
 * - Grouped by semantic purpose to make the mapping easy to follow.
 */
function getFallbackColor(varName) {
  const fallbacks = {
    '--sensor-moisture': '#22c55e',
    '--sensor-temperature': '#f97316',
    '--sensor-humidity': '#22d3ee',
    '--sensor-ph': '#a78bfa',
    '--sensor-light': '#fbbf24',
    '--control-manual': '#22d3ee',
    '--control-timed': '#a78bfa',
    '--control-auto': '#22c55e',
    '--control-schedule': '#f59e0b',
    '--control-growth': '#34d399',
    '--health-healthy': '#22c55e',
    '--health-disease': '#ef4444',
    '--health-neutral': '#14b8a6',
    '--rec-critical': '#ef4444',
    '--rec-high': '#f59e0b',
    '--rec-medium': '#22d3ee',
    '--rec-normal': '#22c55e',
    '--gauge-danger': '#ff0000',
    '--gauge-warning': '#ffff00',
    '--gauge-safe': '#00ff00',
    '--aurora-primary': '#06b6d4',
    '--aurora-secondary': '#14b8a6',
    '--aurora-tertiary': '#22c55e',
    '--aurora-bg': '#06131a',
    '--hero-blob-primary': '#4EA852',
    '--hero-blob-secondary': '#00B4A6',
    '--hero-blob-tertiary': '#66BB6A',
    '--hero-badge-text': '#7EC880',
    '--hero-status-on': '#7EC880',
    '--hero-status-off': '#F59E0B',
    '--hero-status-dot-on': '#4EA852',
    '--hero-status-dot-off': '#F59E0B',
    '--admin-badge': '#43a047',
    '--mock-banner-icon-bg': '#06b6d4',
    '--mock-banner-accent': '#22d3ee',
    '--mock-banner-bg-sim': 'linear-gradient(90deg, #dbeafe, #d1fae5)',
    '--mock-banner-bg-normal': '#fef3c7',
    '--mock-banner-border-sim': '1px solid #60a5fa',
    '--mock-banner-border-normal': '1px solid #fbbf24',
    '--mock-banner-text-sim': '#164e63',
    '--mock-banner-text-normal': '#92400e',
    // Mock banner / panel fallbacks (used in admin mock UI)
    '--mock-banner-panel-bg': 'rgba(30, 41, 59, 0.95)',
    '--mock-banner-panel-border': '1px solid rgba(148, 163, 184, 0.2)',
    '--mock-banner-panel-text': '#cbd5e1',
    // Analytics / chart color fallbacks
    '--chart-moisture': '#00f2fe',
    '--chart-temp': '#f97316',
    '--chart-humidity': '#22d3ee',
    '--chart-light': '#facc15',
    '--chart-flow': '#3b82f6',
    '--chart-disease': '#ef4444',
    '--chart-ph': '#a855f7',
    '--chart-healthy': '#22c55e',
    '--chart-neutral': '#14b8a6',
    '--chart-text-muted': '#94a3b8',
    '--aichat-healthy': '#22c55e',
    '--aichat-caution': '#f59e0b',
    '--aichat-critical': '#ef4444',
    '--admin-gradient-cyan-sky': 'linear-gradient(135deg, #22d3ee, #0ea5e9)',
    '--admin-gradient-sky-blue': 'linear-gradient(135deg, #0ea5e9, #3b82f6)',
    '--admin-gradient-teal-cyan': 'linear-gradient(135deg, #14b8a6, #0ea5e9)',
    '--admin-gradient-indigo-blue': 'linear-gradient(135deg, #818cf8, #3b82f6)',
    '--admin-avatar-text': '#fff',
    '--alert-error': '#ef4444',
    '--alert-warning': '#f59e0b',
    '--alert-info': '#3b82f6',
    // Alert / notification colors
    '--alert-error-bg': 'rgba(239,68,68,0.12)',
    '--alert-warning-bg': 'rgba(245,158,11,0.12)',
    '--alert-info-bg': 'rgba(59,130,246,0.12)',
    '--alert-error-border': 'rgba(239,68,68,0.3)',
    '--alert-warning-border': 'rgba(245,158,11,0.3)',
    '--alert-info-border': 'rgba(59,130,246,0.3)',
    // Misc fallbacks
    '--sensor-card-fallback': '#475569',
    '--sensor-flow': '#38bdf8',
    '--sensor-ec': '#34d399',
  };
  return fallbacks[varName] || '#22c55e';
}

/**
 * React Hook to get a CSS variable value with proper reactivity
 * @param {string} varName - CSS variable name
 * @returns {string} - Computed color value
 */
export function useCSSVariableValue(varName) {
  const [value, setValue] = React.useState(() => getCSSVariableValue(varName));

  React.useEffect(() => {
    // Update when theme changes
    const handleThemeChange = () => {
      setValue(getCSSVariableValue(varName));
    };

    // Listen for data-theme attribute changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          handleThemeChange();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    // Initial value
    handleThemeChange();

    return () => observer.disconnect();
  }, [varName]);

  return value;
}
