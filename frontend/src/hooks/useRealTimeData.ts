import { useState, useEffect } from 'react';
import { reportApi } from '../services/reportApi';
import type { AnalyticsData } from '../types';

export const useRealTimeData = (intervalMs: number = 60000) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // Change to string

  const fetchData = async () => {
    try {
      setError(null);
      const response = await reportApi.getAnalytics();
      setData(response.data);
    } catch (err) {
      // Convert error to string
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Failed to fetch real-time data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const interval = setInterval(fetchData, intervalMs);
    return () => clearInterval(interval);
  }, [intervalMs]);

  const refreshData = () => {
    setLoading(true);
    fetchData();
  };

  return { data, loading, error, refreshData };
};