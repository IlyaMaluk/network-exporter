import axios from 'axios';

const API_BASE = '/api/v1';

/** Recharts ALWAYS sees this key in every data point — it is the invisible
 *  anchor series that prevents Recharts from unmounting chart elements when
 *  the data transitions between empty and non-empty states.
 */
export const BASELINE_KEY = 'baseline';
export const SCRAPE_INTERVAL = 5;

export interface PromResult {
  metric: Record<string, string>;
  values: [number, string][];
}

export interface PromResponse {
  status: string;
  data: {
    resultType: string;
    result: PromResult[];
  };
}

export const instantQuery = async (query: string): Promise<PromResult[]> => {
  try {
    const response = await axios.get<PromResponse>(`${API_BASE}/query`, { params: { query } });
    if (response.data.status === 'success') return response.data.data.result;
    throw new Error('Prometheus query failed');
  } catch (error) {
    console.error('Error querying Prometheus:', error);
    return [];
  }
};

export const queryRange = async (
  query: string,
  start: number,
  end: number,
  step: number,
): Promise<PromResult[]> => {
  try {
    const response = await axios.get<PromResponse>(`${API_BASE}/query_range`, {
      params: { query, start, end, step },
    });
    if (response.data.status === 'success') return response.data.data.result;
    throw new Error('Prometheus query failed');
  } catch (error) {
    console.error('Error querying Prometheus:', error);
    return [];
  }
};

/**
 * Format Prometheus range-query results into a Recharts-compatible array.
 *
 * Every returned point always contains `{ baseline: 0, ...realSeries }`.
 * The `baseline` key is consumed by a hidden, permanently-mounted
 * `<Area dataKey="baseline">` in every chart, preventing Recharts from
 * unmounting chart elements when data transitions.
 *
 * @param results           The `data.result` array from Prometheus.
 * @param metricNameKey     Label key used to name each series (e.g. 'interface').
 * @param fallbackSeriesName  Name for unlabeled / single series.
 */
export const formatTimeSeriesData = (
  results: PromResult[],
  metricNameKey?: string,
  fallbackSeriesName: string = 'Series 1',
) => {
  const seriesNames: string[] = results.map((result, idx) =>
    metricNameKey && result.metric[metricNameKey]
      ? result.metric[metricNameKey]
      : (results.length === 1 ? fallbackSeriesName : `Series ${idx + 1}`)
  );

  if (!results.length) return [];

  const timeMap = new Map<number, Record<string, number>>();

  results.forEach((result, idx) => {
    const seriesName = seriesNames[idx];
    result.values.forEach(([timestamp, value]) => {
      const ts = timestamp * 1000;
      if (!timeMap.has(ts)) {
        const slot: Record<string, number> = { timestamp: ts, [BASELINE_KEY]: 0 };
        seriesNames.forEach(n => { slot[n] = 0; });
        timeMap.set(ts, slot);
      }
      timeMap.get(ts)![seriesName] = parseFloat(value);
    });
  });

  const allTimestamps = Array.from(timeMap.keys()).sort((a, b) => a - b);
  allTimestamps.forEach(ts => {
    const slot = timeMap.get(ts)!;
    seriesNames.forEach(n => { if (slot[n] === undefined) slot[n] = 0; });
  });

  return allTimestamps.map(ts => timeMap.get(ts)!);
};

/**
 * Generate a zero-value skeleton spanning [start, end].
 *
 * Every point includes `baseline: 0` plus the specified extra keys so that
 * Recharts can render flat lines without any component unmounting.
 *
 * @param extraKeys  Additional series keys to include (each set to 0).
 */
export const buildZeroSkeleton = (
  start: number,
  end: number,
  stepSeconds: number,
  extraKeys: string[] = [],
): Record<string, number>[] => {
  const points: Record<string, number>[] = [];
  for (let ts = start; ts <= end; ts += stepSeconds) {
    const point: Record<string, number> = { timestamp: ts * 1000, [BASELINE_KEY]: 0 };
    extraKeys.forEach(k => { point[k] = 0; });
    points.push(point);
  }
  return points;
};

// Keep for backward compat — wraps buildZeroSkeleton
export const buildMultiSeriesZeroSkeleton = buildZeroSkeleton;
