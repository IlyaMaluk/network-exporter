import { useState, useEffect, useCallback, useRef } from 'react';
import { queryRange, formatTimeSeriesData, buildZeroSkeleton, SCRAPE_INTERVAL } from '../lib/prometheus';
import { useDashboard } from '../context/DashboardContext';

interface UsePrometheusOptions {
  query: string;
  stepSeconds?: number;
  metricNameKey?: string;
  /**
   * Extra zero-value series keys to pre-populate in the skeleton when
   * Prometheus returns an empty result. Must match the `dataKey` props used
   * in the chart's `<Line>` / `<Area>` elements.
   *
   * The `baseline` key is always injected automatically — do not include it here.
   */
  skeletonKeys?: string[];
  /**
   * Fallback name for single-series queries without a `metricNameKey`.
   * Must match the chart's `dataKey`.
   */
  fallbackSeriesName?: string;
}

export const usePrometheus = ({
  query,
  stepSeconds = SCRAPE_INTERVAL,
  metricNameKey,
  skeletonKeys = [],
  fallbackSeriesName = 'Series 1',
}: UsePrometheusOptions) => {
  const { getEffectiveWindow, refreshTick, timeRangeMinutes, absoluteRange, frozenRange } = useDashboard();

  const isFirstLoad = useRef(true);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const prevDataRef = useRef<string>('[]');

  const fetchData = useCallback(async () => {
    try {
      const window = getEffectiveWindow();
      // Rule 1: Time Quantization (endTimestamp / 5) * 5
      const end = Math.floor(window.end / 5) * 5;
      const start = end - (window.end - window.start);

      // Rule 1: Explicitly send step: 5 in the query parameters
      const step = 5;
      const results = await queryRange(query, start, end, step);

      const newData =
        results.length === 0
          ? buildZeroSkeleton(start, end, stepSeconds, skeletonKeys)
          : formatTimeSeriesData(results, metricNameKey, fallbackSeriesName);

      const newDataStr = JSON.stringify(newData);
      if (newDataStr !== prevDataRef.current) {
        prevDataRef.current = newDataStr;
        setData(newData);
      }
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      if (isFirstLoad.current) {
        isFirstLoad.current = false;
        setLoading(false);
      }
    }
  }, [query, stepSeconds, metricNameKey, fallbackSeriesName,
      // skeletonKeys is an array — stringify to make it a stable dep
      // eslint-disable-next-line react-hooks/exhaustive-deps
      JSON.stringify(skeletonKeys), getEffectiveWindow]);

  useEffect(() => {
    isFirstLoad.current = true;
    prevDataRef.current = '[]';
    setLoading(true);
    fetchData();
  }, [timeRangeMinutes, absoluteRange, frozenRange, fetchData]);

  useEffect(() => {
    if (refreshTick === 0) return;
    fetchData();
  }, [refreshTick, fetchData]);

  return { data, loading, error, refetch: fetchData };
};
