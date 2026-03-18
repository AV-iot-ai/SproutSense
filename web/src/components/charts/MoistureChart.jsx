/**
 * MoistureChart.jsx — components/charts/
 * Line chart for soil moisture readings over time.
 *
 * Uses Recharts' <ResponsiveContainer> + <LineChart>.
 * Fetches its own data via sensorAPI so it can be embedded
 * anywhere — AnalyticsPage, HomePage summary, etc.
 *
 * Props:
 *  - data     {Array}  — [{ timestamp, soilMoisture }]  (optional: pass pre-fetched)
 *  - height   {number} — chart height in px (default 240)
 *  - color    {string} — stroke color (default var(--plant-teal))
 */
import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

// Formats ISO timestamp → 'HH:MM' for the X axis
function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export function MoistureChart({
  data = [],
  height = 240,
  color = 'var(--plant-teal)',
}) {
  if (!data.length) {
    return (
      <div className="chart-empty" style={{ height }}>
        No moisture data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
        {/* Grid lines */}
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />

        {/* X axis — time labels */}
        <XAxis
          dataKey="timestamp"
          tickFormatter={formatTime}
          tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />

        {/* Y axis — percentage */}
        <YAxis
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
          tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={36}
        />

        {/* Tooltip */}
        <Tooltip
          contentStyle={{
            background: 'var(--glass-color)',
            border: 'var(--glass-border)',
            borderRadius: '0.75rem',
            color: 'var(--text-color)',
          }}
          formatter={(v) => [`${v}%`, 'Moisture']}
          labelFormatter={formatTime}
        />

        {/* Soil moisture line */}
        <Line
          type="monotone"
          dataKey="soilMoisture"
          stroke={color}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: color }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default MoistureChart;
