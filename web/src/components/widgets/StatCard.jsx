/**
 * StatCard.jsx — components/widgets/
 * Simple metric card showing a single stat value with an icon and label.
 *
 * Used on HomePage summary row and AnalyticsPage quick stats.
 *
 * Props:
 *  - icon    {string}  — GlassIcon name
 *  - label   {string}  — metric name, e.g. 'Soil Moisture'
 *  - value   {string}  — formatted value, e.g. '42 %'
 *  - accent  {string}  — optional CSS color var for value text
 *  - trend   {string}  — optional 'up' | 'down' | 'stable'
 */
import React from 'react';
import { GlassIcon } from '../GlassIcon';

const TREND_ICON = { up: '↑', down: '↓', stable: '→' };
const TREND_COLOR = {
  up:     'var(--success-color)',
  down:   'var(--danger-color)',
  stable: 'var(--text-tertiary)',
};

export function StatCard({ icon, label, value, accent, trend }) {
  return (
    <div className="stat-card card">
      {/* Icon */}
      <div className="stat-card__icon">
        <GlassIcon name={icon} />
      </div>

      {/* Label */}
      <span className="stat-card__label">{label}</span>

      {/* Value + optional trend arrow */}
      <span
        className="stat-card__value"
        style={accent ? { color: accent } : {}}
      >
        {value}
        {trend && (
          <span
            className="stat-card__trend"
            style={{ color: TREND_COLOR[trend] }}
            aria-label={`Trend: ${trend}`}
          >
            {TREND_ICON[trend]}
          </span>
        )}
      </span>
    </div>
  );
}

export default StatCard;
