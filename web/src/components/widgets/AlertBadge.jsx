/**
 * AlertBadge.jsx — components/widgets/
 * Small pill badge that shows an alert type and message.
 *
 * Used inside AlertsPage list rows and the Topbar alert dropdown.
 *
 * Props:
 *  - type     {string}  — 'error' | 'warning' | 'info' | 'success'
 *  - message  {string}  — short alert description
 *  - value    {string}  — optional sensor reading that triggered the alert
 *  - onClear  {fn}      — callback to dismiss this alert
 */
import React from 'react';

// Maps alert type → CSS modifier and accessible label
const TYPE_META = {
  error:   { cls: 'alert-badge--error',   label: 'Critical' },
  warning: { cls: 'alert-badge--warning', label: 'Warning'  },
  info:    { cls: 'alert-badge--info',    label: 'Info'     },
  success: { cls: 'alert-badge--success', label: 'OK'       },
};

export function AlertBadge({ type = 'info', message, value, onClear }) {
  const meta = TYPE_META[type] || TYPE_META.info;

  return (
    <div
      className={`alert-badge ${meta.cls}`}
      role="alert"
      aria-label={`${meta.label}: ${message}`}
    >
      {/* Type label */}
      <span className="alert-badge__type">{meta.label}</span>

      {/* Message */}
      <span className="alert-badge__message">{message}</span>

      {/* Optional sensor reading value */}
      {value && (
        <span className="alert-badge__value">{value}</span>
      )}

      {/* Dismiss button */}
      {onClear && (
        <button
          className="alert-badge__clear"
          onClick={onClear}
          aria-label="Dismiss alert"
        >
          ✕
        </button>
      )}
    </div>
  );
}

export default AlertBadge;
