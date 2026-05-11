import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';

export interface TimeRangeOption {
  label: string;
  minutes: number;
}

export interface RefreshOption {
  label: string;
  seconds: number; // 0 = off
}

export interface TimeWindow {
  start: number; // Unix seconds
  end: number;   // Unix seconds
}

export const TIME_RANGE_OPTIONS: TimeRangeOption[] = [
  { label: 'Last 5m',  minutes: 5   },
  { label: 'Last 15m', minutes: 15  },
  { label: 'Last 1h',  minutes: 60  },
  { label: 'Last 6h',  minutes: 360 },
];

export const REFRESH_OPTIONS: RefreshOption[] = [
  { label: 'Off', seconds: 0  },
  { label: '5s',  seconds: 5  },
  { label: '15s', seconds: 15 },
  { label: '30s', seconds: 30 },
];

interface DashboardContextValue {
  // Relative range
  timeRangeMinutes: number;
  // Auto-refresh
  refreshInterval: number;
  refreshTick: number;
  // Pause / Live state
  isPaused: boolean;
  frozenRange: TimeWindow | null;   // captured window when Live→Pause was clicked
  // Absolute range (user-typed From/To)
  absoluteRange: TimeWindow | null;
  // Actions
  setTimeRange: (minutes: number) => void;
  setRefreshInterval: (seconds: number) => void;
  manualRefresh: () => void;
  togglePause: () => void;
  setAbsoluteRange: (start: number, end: number) => void;
  clearAbsoluteRange: () => void;
  /** Compute the effective [start, end] window that all charts must use. */
  getEffectiveWindow: () => TimeWindow;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export const useDashboard = (): DashboardContextValue => {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used inside DashboardProvider');
  return ctx;
};

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
  const [timeRangeMinutes, setTimeRangeMinutes] = useState(15);
  const [refreshInterval, setRefreshIntervalState] = useState(5);
  const [refreshTick, setRefreshTick] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [frozenRange, setFrozenRange] = useState<TimeWindow | null>(null);
  const [absoluteRange, setAbsoluteRangeState] = useState<TimeWindow | null>(null);

  // Keep a stable ref to timeRangeMinutes for use inside togglePause callback
  const timeRangeMinutesRef = useRef(timeRangeMinutes);
  useEffect(() => { timeRangeMinutesRef.current = timeRangeMinutes; }, [timeRangeMinutes]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Derived helpers ─────────────────────────────────────────────────────────

  const getEffectiveWindow = useCallback((): TimeWindow => {
    if (absoluteRange) return absoluteRange;
    if (frozenRange)   return frozenRange;
    const end   = Math.floor(Date.now() / 1000);
    const start = end - timeRangeMinutesRef.current * 60;
    return { start, end };
  }, [absoluteRange, frozenRange]);

  // ─── Actions ─────────────────────────────────────────────────────────────────

  const manualRefresh = useCallback(() => {
    setRefreshTick(t => t + 1);
  }, []);

  const setTimeRange = useCallback((minutes: number) => {
    // Switching quick range always clears absolute mode and unpauses
    setAbsoluteRangeState(null);
    setFrozenRange(null);
    setIsPaused(false);
    setTimeRangeMinutes(minutes);
    setRefreshTick(t => t + 1);
  }, []);

  const setRefreshInterval = useCallback((seconds: number) => {
    setRefreshIntervalState(seconds);
  }, []);

  const togglePause = useCallback(() => {
    setIsPaused(prev => {
      if (!prev) {
        // Live → Pause: snapshot the current window now
        const end   = Math.floor(Date.now() / 1000);
        const start = end - timeRangeMinutesRef.current * 60;
        setFrozenRange({ start, end });
        setAbsoluteRangeState(null); // absolute range takes over from frozen when set explicitly
      } else {
        // Pause → Live: release the freeze
        setFrozenRange(null);
        setAbsoluteRangeState(null);
        // Trigger an immediate re-fetch with a fresh sliding window
        setRefreshTick(t => t + 1);
      }
      return !prev;
    });
  }, []);

  const setAbsoluteRange = useCallback((start: number, end: number) => {
    setAbsoluteRangeState({ start, end });
    setFrozenRange(null);
    setIsPaused(true); // absolute range implies paused (static window)
    setRefreshTick(t => t + 1); // fetch the new static window once
  }, []);

  const clearAbsoluteRange = useCallback(() => {
    setAbsoluteRangeState(null);
    setFrozenRange(null);
    setIsPaused(false);
    setRefreshTick(t => t + 1);
  }, []);

  // ─── Auto-refresh interval (disabled while paused) ───────────────────────────

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    // Do not auto-poll when paused or on a static absolute window
    if (refreshInterval > 0 && !isPaused) {
      intervalRef.current = setInterval(() => {
        setRefreshTick(t => t + 1);
      }, refreshInterval * 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refreshInterval, isPaused]);

  return (
    <DashboardContext.Provider value={{
      timeRangeMinutes,
      refreshInterval,
      refreshTick,
      isPaused,
      frozenRange,
      absoluteRange,
      setTimeRange,
      setRefreshInterval,
      manualRefresh,
      togglePause,
      setAbsoluteRange,
      clearAbsoluteRange,
      getEffectiveWindow,
    }}>
      {children}
    </DashboardContext.Provider>
  );
};
