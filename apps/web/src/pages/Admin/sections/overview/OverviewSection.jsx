import React from 'react';
import ScrollReveal from '../../../../components/bits/ScrollReveal';
import '../SectionStyles.css';

export default function OverviewSection({ systemStats, systemInfo }) {
	return (
		<div className="adm-section">
			<div className="adm-section-header">
				<h2><i className="fa-solid fa-chart-line" /> Dashboard Overview</h2>
				<span className="adm-section-badge">Live Intelligence</span>
			</div>

			<div className="adm-dashboard-grid">
				<div className="adm-glass-box adm-stat-widget">
					<div className="adm-widget-header">
						<div className="adm-widget-icon adm-overview-icon--users">
							<i className="fa-solid fa-users" />
						</div>
						<div className="adm-widget-title">
							<h3>User Activity</h3>
							<p>{systemStats?.users?.online || 0} active in last 15m</p>
						</div>
						<div className="adm-widget-value">{systemStats?.users?.total || 0}</div>
					</div>
					<div className="adm-widget-content">
						<div className="adm-role-bars">
							{Object.entries(systemStats?.users?.roleDistribution || {}).map(([role, data]) => (
								<div key={role} className="adm-role-bar-item">
									<div className="adm-role-label">
										<span>{role.charAt(0).toUpperCase() + role.slice(1)}s</span>
										<span>{data.total}</span>
									</div>
									<div className="adm-progress-bg">
										<div
											className={`adm-progress-fill adm-progress-fill--${role}`}
											style={{ width: `${(data.total / (systemStats?.users?.total || 1)) * 100}%` }}
										/>
									</div>
									<div className="adm-role-online">
										<span className="adm-pulse-dot" /> {data.online} Online
									</div>
								</div>
							))}
						</div>
					</div>
				</div>

				<div className="adm-dashboard-side">
					<div className="adm-glass-box adm-mini-widget">
						<div className="adm-mini-icon adm-overview-icon--leaf">
							<i className="fa-solid fa-leaf" />
						</div>
						<div className="adm-mini-info">
							<span className="adm-mini-label">Popular Growth Choice</span>
							<span className="adm-mini-value">{systemStats?.users?.topPlant || 'None'}</span>
						</div>
					</div>

					<div className="adm-glass-box adm-mini-widget">
						<div className="adm-mini-icon adm-overview-icon--database">
							<i className="fa-solid fa-database" />
						</div>
						<div className="adm-mini-info">
							<span className="adm-mini-label">Database Sync</span>
							<span className="adm-mini-value">{systemInfo?.database || 'Connected'}</span>
						</div>
					</div>

					<div className="adm-glass-box adm-mini-widget">
						<div className="adm-mini-icon adm-overview-icon--kernel">
							<i className="fa-solid fa-code-branch" />
						</div>
						<div className="adm-mini-info">
							<span className="adm-mini-label">System Kernel</span>
							<span className="adm-mini-value">v{systemInfo?.version || '1.0.0'}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}