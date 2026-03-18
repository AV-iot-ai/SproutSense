import React, { useEffect, useState } from 'react';
import { aiAPI } from '../utils/api';
import { GlassIcon } from './bits/GlassIcon';
import './styles/AIRecommendation.css';

export function AIRecommendation({ showHeader = true, sensors = null }) {
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchRecommendation = async () => {
    setLoading(true);
    try {
      const data = await aiAPI.getRecommendation();
      setRecommendation(data.data || data);
    } catch (error) {
      console.error('Failed to fetch AI recommendation:', error);
      setRecommendation({ message: 'Failed to load AI recommendation' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendation();
    // Refresh every 30 seconds
    const interval = setInterval(fetchRecommendation, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card">
      {showHeader && <h2 className="card-title">
        <GlassIcon name="ai" className="card-title-icon" />
        AI Recommendation
      </h2>}
      <div className="recommendation">
        {loading ? (
          'Analyzing...'
        ) : (
          <>
            {recommendation?.message || 'Loading AI insights...'}
            {recommendation?.action && (
              <div className="ai-details">
                <p><strong>Action:</strong> {recommendation.action}</p>
                {recommendation.priority && (
                  <p><strong>Priority:</strong> {recommendation.priority}</p>
                )}
                {recommendation.confidence && (
                  <p><strong>Confidence:</strong> {recommendation.confidence}%</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
      <button 
        className="btn btn-secondary" 
        onClick={fetchRecommendation}
        disabled={loading}
      >
        <GlassIcon name="insights" className="btn-icon" />
        Refresh AI Analysis
      </button>
    </div>
  );
}
