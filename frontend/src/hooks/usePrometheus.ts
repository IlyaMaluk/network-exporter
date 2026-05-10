import { useState, useEffect, useCallback } from 'react';
import { queryRange, formatTimeSeriesData } from '../lib/prometheus';

interface UsePrometheusOptions {
  query: string;
  timeRangeMinutes?: number;
  stepSeconds?: number;
  metricNameKey?: string;
  refreshIntervalSeconds?: number;
}

export const usePrometheus = ({
  query,
  timeRangeMinutes = 5,
  stepSeconds = 15,
  metricNameKey,
  refreshIntervalSeconds = 15,
}: UsePrometheusOptions) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const end = Math.floor(Date.now() / 1000);
      const start = end - timeRangeMinutes * 60;
      
      const results = await queryRange(query, start, end, stepSeconds);
      const formattedData = formatTimeSeriesData(results, metricNameKey);
      
      setData(formattedData);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [query, timeRangeMinutes, stepSeconds, metricNameKey]);

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, refreshIntervalSeconds * 1000);
    return () => clearInterval(intervalId);
  }, [fetchData, refreshIntervalSeconds]);

  return { data, loading, error, refetch: fetchData };
};
