import React, { useEffect } from 'react';
import './styles/Notification.css';

export function Notification({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!message) return null;

  return (
    <div className={`notification ${type}`}>
      {message}
    </div>
  );
}
