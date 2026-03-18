/**
 * TempHumidityChart.jsx — components/charts/
 * Dual-line chart for temperature and humidity readings over time.
 *
 * Renders two <Line> traces on the same chart:
 *  - Temperature (°C)  — sky blue
 *  - Humidity    (%)   — emerald green
 *
 * Props:
 *  - data     {Array}  — [{ timestamp, temperature, humidity }]
 *  - height   {number} — chart height in px (default 240)
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
  Legend,
} from 'recharts';

// Formats ISO timestamp → 'HH:MM' for the X axis
function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export function TempHumidityChart({ data = [], height = 240 }) {
  if (!data.length) {
    return (
      <div className="chart-empty" style={{ height }}>
        No temperature / humidity data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
        {/* Grid */}
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />

        {/* X axis */}
        <XAxis
          dataKey="timestamp"
          tickFormatter={formatTime}
          tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />

        {/* Y axis (shared scale) */}
        <YAxis
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
          labelFormatter={formatTime}
        />

        {/* Legend */}
        <Legend
          wrapperStyle={{ color: 'var(--text-secondary)', fontSize: 12 }}
        />

        {/* Temperature line */}
        <Line
          type="monotone"
          dataKey="temperature"
          stroke="var(--primary-color)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
          name="Temp (°C)"
        />

        {/* Humidity line */}
        <Line
          type="monotone"
          dataKey="humidity"
          stroke="var(--success-color)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
          name="Humidity (%)"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default TempHumidityChart;
