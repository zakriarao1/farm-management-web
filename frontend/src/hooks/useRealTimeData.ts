// src/hooks/useRealTimeData.ts

import { useState, useEffect, useRef } from 'react';
import { reportApi, type AnalyticsData } from '../services/reportApi';

interface UseRealTimeDataReturn {
  data: AnalyticsData | null;
  loading: boolean;
  error: string;
  refreshData: () => void;
}

export const useRealTimeData = (interval: number = 30000): UseRealTimeDataReturn => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const intervalRef = useRef<number | null>(null);

  const fetchData = async () => {
    try {
      const response = await reportApi.getAnalytics();
      setData(response.data);
      setError('');
    } catch (err) {
      console.error('Failed to fetch real-time data:', err);
      setError('Failed to update data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchData();

    // Set up interval for real-time updates
    intervalRef.current = window.setInterval(fetchData, interval);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [interval]);

  const refreshData = () => {
    setLoading(true);
    fetchData();
  };

  return { data, loading, error, refreshData };
};
