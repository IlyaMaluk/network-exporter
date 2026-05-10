import axios from 'axios';

const API_BASE = '/api/v1';

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
    const response = await axios.get<PromResponse>(`${API_BASE}/query`, {
      params: {
        query,
      },
    });
    
    if (response.data.status === 'success') {
      return response.data.data.result;
    }
    throw new Error('Prometheus query failed');
  } catch (error) {
    console.error('Error querying Prometheus:', error);
    return [];
  }
};

export const queryRange = async (query: string, start: number, end: number, step: number): Promise<PromResult[]> => {
  try {
    const response = await axios.get<PromResponse>(`${API_BASE}/query_range`, {
      params: {
        query,
        start,
        end,
        step,
      },
    });
    
    if (response.data.status === 'success') {
      return response.data.data.result;
    }
    throw new Error('Prometheus query failed');
  } catch (error) {
    console.error('Error querying Prometheus:', error);
    return [];
  }
};

export const formatTimeSeriesData = (results: PromResult[], metricNameKey?: string) => {
  if (!results.length) return [];

  // Group by timestamp
  const timeMap = new Map<number, any>();

  results.forEach((result, idx) => {
    const seriesName = metricNameKey && result.metric[metricNameKey] 
      ? result.metric[metricNameKey] 
      : `Series ${idx + 1}`;

    result.values.forEach(([timestamp, value]) => {
      const ts = timestamp * 1000; // convert to ms
      if (!timeMap.has(ts)) {
        timeMap.set(ts, { timestamp: ts });
      }
      const dataPoint = timeMap.get(ts);
      dataPoint[seriesName] = parseFloat(value);
    });
  });

  return Array.from(timeMap.values()).sort((a, b) => a.timestamp - b.timestamp);
};
