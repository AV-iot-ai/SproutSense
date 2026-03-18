import React, { useState } from 'react';
import { GlassIcon } from './bits/GlassIcon';
import ElasticSlider from './bits/ElasticSlider';
import { configAPI, wateringAPI } from '../utils/api';
import './styles/ControlCard.css';

export function ControlCard({
  pumpActive,
  onStartWatering,
  onStopWatering,
  moistureThreshold,
  onMoistureThresholdChange,
  onSaveMoistureThreshold,
  isThresholdSaving,
  plantGrowthEnabled,
  onPlantGrowthEnabledChange,
  plantGrowthStage,
  onPlantGrowthStageChange,
  aiInsightsMode,
  onAiInsightsModeChange,
  onSaveAiControls,
  isAiControlSaving,
  sensors,
  onNotification,
}) {
  const [waterDuration, setWaterDuration] = useState(30);
  const [autoWater, setAutoWater] = useState(true);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleTime, setScheduleTime] = useState('07:00');
  const [savingSchedule, setSavingSchedule] = useState(false);

  const handleAutoWaterToggle = async () => {
    const next = !autoWater;
    setAutoWater(next);
    try {
      await configAPI.update('ESP32-SENSOR', { autoWaterEnabled: next });
      onNotification?.(`Auto-watering ${next ? 'enabled' : 'disabled'}`, 'success');
    } catch {
      onNotification?.('Failed to update auto-water setting', 'error');
      setAutoWater(!next); // revert
    }
  };

  const handleTimedWater = async () => {
    try {
      await wateringAPI.start('ESP32-SENSOR', waterDuration);
      onNotification?.(`Watering for ${waterDuration}s`, 'success');
    } catch {
      onNotification?.('Failed to start timed watering', 'error');
    }
  };

  const handleSaveSchedule = async () => {
    setSavingSchedule(true);
    try {
      await configAPI.update('ESP32-SENSOR', {
        scheduleEnabled,
        scheduleTime,
      });
      onNotification?.(`Schedule ${scheduleEnabled ? 'saved: ' + scheduleTime : 'disabled'}`, 'success');
    } catch {
      onNotification?.('Failed to save schedule', 'error');
    } finally {
      setSavingSchedule(false);
    }
  };

  const soilMoisture = sensors?.soilMoisture;
  const needsWater = soilMoisture !== undefined && soilMoisture < moistureThreshold;

  return (
    <div className="card control-card-enhanced">
      <div className="card-header-row">
        <h2 className="card-title">
          <GlassIcon name="controls" className="card-title-icon" />
          Watering Controls
        </h2>
        <span className={`pump-badge ${pumpActive ? 'active' : 'idle'}`}>
          Pump: {pumpActive ? 'ON' : 'OFF'}
        </span>
      </div>

      {/* Moisture health indicator */}
      {soilMoisture !== undefined && (
        <div className={`moisture-alert ${needsWater ? 'needs-water' : 'ok'}`}>
          <GlassIcon name={needsWater ? 'watering' : 'check'} />
          <span>
            {needsWater
              ? `Soil moisture ${soilMoisture}% - below threshold (${moistureThreshold}%), watering recommended`
              : `Soil moisture ${soilMoisture}% - adequate`}
          </span>
        </div>
      )}

      {/* Manual Control */}
      <div className="control-section">
        <h3 className="control-section-title">
          <GlassIcon name="pump" /> Manual Control
        </h3>
        <div className="control-row">
          <button
            className="btn btn-primary"
            onClick={onStartWatering}
            disabled={pumpActive}
          >
            <GlassIcon name="watering" className="btn-icon" />
            Water Now
          </button>
          <button
            className="btn btn-danger"
            onClick={onStopWatering}
            disabled={!pumpActive}
          >
            <GlassIcon name="close" className="btn-icon" />
            Stop
          </button>
        </div>

        {/* Timed watering */}
        <div className="control-field">
          <label className="control-label">Timed Watering</label>
          <div className="control-row">
            <ElasticSlider
              defaultValue={waterDuration}
              maxValue={300}
              startingValue={5}
              isStepped={true}
              stepSize={5}
              onChange={val => setWaterDuration(Math.round(val))}
            />
            <span className="control-unit">seconds</span>
            <button
              className="btn btn-primary"
              onClick={handleTimedWater}
              disabled={pumpActive}
            >
              <GlassIcon name="schedule" className="btn-icon" />
              Start Timer
            </button>
          </div>
        </div>
      </div>

      {/* Auto-Watering */}
      <div className="control-section">
        <h3 className="control-section-title">
          <GlassIcon name="sensors" /> Auto-Watering
        </h3>
        <div className="control-toggle-row">
          <div className="control-toggle-info">
            <span className="control-label">Auto-Water Mode</span>
            <span className="control-hint">Triggers pump when soil drops below threshold</span>
          </div>
          <button
            className={`toggle-switch ${autoWater ? 'on' : 'off'}`}
            onClick={handleAutoWaterToggle}
            aria-label="Toggle auto-water"
          >
            <span className="toggle-knob" />
          </button>
        </div>

        <div className="control-field">
          <label className="control-label" htmlFor="moisture-threshold-input">
            Moisture Threshold
          </label>
          <div className="control-row">
            <ElasticSlider
              defaultValue={moistureThreshold}
              maxValue={100}
              startingValue={0}
              isStepped={true}
              stepSize={1}
              onChange={val => onMoistureThresholdChange(Math.round(val))}
            />
            <span className="control-unit">%</span>
            <button
              className="btn btn-success threshold-save-btn"
              onClick={onSaveMoistureThreshold}
              disabled={isThresholdSaving}
            >
              <GlassIcon name="check" className="btn-icon" />
              {isThresholdSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Schedule */}
      <div className="control-section">
        <h3 className="control-section-title">
          <GlassIcon name="schedule" /> Daily Schedule
        </h3>
        <div className="control-toggle-row">
          <div className="control-toggle-info">
            <span className="control-label">Enable Schedule</span>
            <span className="control-hint">Water once daily at set time</span>
          </div>
          <button
            className={`toggle-switch ${scheduleEnabled ? 'on' : 'off'}`}
            onClick={() => setScheduleEnabled(s => !s)}
            aria-label="Toggle schedule"
          >
            <span className="toggle-knob" />
          </button>
        </div>

        <div className="control-field">
          <label className="control-label">Schedule Time</label>
          <div className="control-row">
            <input
              type="time"
              className="control-input"
              value={scheduleTime}
              onChange={e => setScheduleTime(e.target.value)}
              disabled={!scheduleEnabled}
            />
            <button
              className="btn btn-success"
              onClick={handleSaveSchedule}
              disabled={savingSchedule || !scheduleEnabled}
            >
              <GlassIcon name={savingSchedule ? 'refresh' : 'check'} className="btn-icon" />
              {savingSchedule ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* AI Growth Controls */}
      <div className="control-section">
        <h3 className="control-section-title">
          <GlassIcon name="leaf" /> Plant Growth & AI Insights
        </h3>

        <div className="control-toggle-row">
          <div className="control-toggle-info">
            <span className="control-label">Plant Growth Tracking</span>
            <span className="control-hint">Enable growth-stage context for automations and AI</span>
          </div>
          <button
            className={`toggle-switch ${plantGrowthEnabled ? 'on' : 'off'}`}
            onClick={() => onPlantGrowthEnabledChange?.(!plantGrowthEnabled)}
            aria-label="Toggle plant growth tracking"
          >
            <span className="toggle-knob" />
          </button>
        </div>

        <div className="control-field">
          <label className="control-label" htmlFor="plant-growth-stage-select">
            Plant Growth Stage
          </label>
          <div className="control-row">
            <select
              id="plant-growth-stage-select"
              className="control-input"
              value={plantGrowthStage}
              onChange={e => onPlantGrowthStageChange?.(e.target.value)}
              disabled={!plantGrowthEnabled}
            >
              <option value="seedling">Seedling</option>
              <option value="vegetative">Vegetative</option>
              <option value="flowering">Flowering</option>
              <option value="fruiting">Fruiting</option>
            </select>
          </div>
        </div>

        <div className="control-field">
          <label className="control-label" htmlFor="ai-insights-mode-select">
            AI Disease Insights Mode
          </label>
          <div className="control-row">
            <select
              id="ai-insights-mode-select"
              className="control-input"
              value={aiInsightsMode}
              onChange={e => onAiInsightsModeChange?.(e.target.value)}
            >
              <option value="live_feed">Live Feed</option>
              <option value="snapshots">Snapshots</option>
            </select>
            <button
              className="btn btn-success"
              onClick={onSaveAiControls}
              disabled={isAiControlSaving}
            >
              <GlassIcon name={isAiControlSaving ? 'refresh' : 'check'} className="btn-icon" />
              {isAiControlSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
