import React, { useEffect, useState } from 'react';
import { publicAPI } from '../../utils/api';

export default function ViewerReportsPage() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    publicAPI
      .getReportsPreview()
      .then((res) => setRows(res?.weeklyWatering || res?.data?.weeklyWatering || []))
      .catch(() => setRows([]));
  }, []);

  return (
    <section className="dashboard-section">
      <div className="dashboard dashboard-single">
        <div className="card">
          <h2 className="card-title">
            <i className="fa-solid fa-file-lines" style={{ marginRight: '0.5rem' }} />
            Viewer Reports (Read-only)
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Day</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Watering Cycles</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Volume (mL)</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ padding: '0.5rem' }}>No report data available.</td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.day}>
                      <td style={{ padding: '0.5rem' }}>{row.day}</td>
                      <td style={{ padding: '0.5rem' }}>{row.cycles}</td>
                      <td style={{ padding: '0.5rem' }}>{row.volumeML}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
