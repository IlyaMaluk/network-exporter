import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, X, Clock } from 'lucide-react';
import { useDashboard, TIME_RANGE_OPTIONS } from '../context/DashboardContext';
import { format } from 'date-fns';

// Helper: convert a local datetime-local input value ("2026-05-11T09:00") to Unix seconds
const localInputToUnix = (value: string): number =>
  Math.floor(new Date(value).getTime() / 1000);

// Helper: format Unix seconds → value suitable for datetime-local input
const unixToLocalInput = (unix: number): string => {
  const d = new Date(unix * 1000);
  // datetime-local format: "YYYY-MM-DDTHH:mm"
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

import { useTranslation } from 'react-i18next';

export const TimeRangePicker = () => {
  const { t } = useTranslation();
  const {
    timeRangeMinutes,
    absoluteRange,
    isPaused,
    setTimeRange,
    setAbsoluteRange,
    clearAbsoluteRange,
  } = useDashboard();

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Absolute range local state (controlled inputs)
  const now = Math.floor(Date.now() / 1000);
  const [fromValue, setFromValue] = useState(() =>
    unixToLocalInput(absoluteRange?.start ?? now - timeRangeMinutes * 60)
  );
  const [toValue, setToValue] = useState(() =>
    unixToLocalInput(absoluteRange?.end ?? now)
  );
  const [rangeError, setRangeError] = useState<string | null>(null);

  // Sync input fields when an absolute range is already active
  useEffect(() => {
    if (absoluteRange) {
      setFromValue(unixToLocalInput(absoluteRange.start));
      setToValue(unixToLocalInput(absoluteRange.end));
    }
  }, [absoluteRange]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleApplyAbsolute = () => {
    const start = localInputToUnix(fromValue);
    const end   = localInputToUnix(toValue);
    if (isNaN(start) || isNaN(end)) {
      setRangeError('Invalid date/time values.');
      return;
    }
    if (end <= start) {
      setRangeError('"To" must be after "From".');
      return;
    }
    if (end - start > 7 * 24 * 3600) {
      setRangeError('Range cannot exceed 7 days.');
      return;
    }
    setRangeError(null);
    setAbsoluteRange(start, end);
    setOpen(false);
  };

  const handleClearAbsolute = () => {
    setRangeError(null);
    clearAbsoluteRange();
    setOpen(false);
  };

  // Label shown on the trigger button
  const triggerLabel = absoluteRange
    ? `${format(absoluteRange.start * 1000, 'MMM d HH:mm')} → ${format(absoluteRange.end * 1000, 'MMM d HH:mm')}`
    : isPaused
    ? t('dashboard.paused')
    : timeRangeMinutes === 15 ? t('common.last_15m') : t(`dashboard.time_${timeRangeMinutes}m`);

  const isAbsoluteActive = !!absoluteRange;

  return (
    <div className="relative" ref={ref}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
          isAbsoluteActive
            ? 'bg-violet-500/20 text-violet-300 border-violet-500/40 hover:bg-violet-500/30'
            : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
        }`}
      >
        {isAbsoluteActive ? <Calendar size={14} /> : <Clock size={14} />}
        <span className="max-w-[200px] truncate">{triggerLabel}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute left-0 top-full mt-2 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Quick Ranges */}
          <div className="p-3 border-b border-slate-700">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2">{t('dashboard.quickRanges')}</p>
            <div className="grid grid-cols-4 gap-1">
              {TIME_RANGE_OPTIONS.map(opt => (
                <button
                  key={opt.minutes}
                  onClick={() => { setTimeRange(opt.minutes); setOpen(false); }}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    !isAbsoluteActive && timeRangeMinutes === opt.minutes
                      ? 'bg-primary/20 text-primary border border-primary/40'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {opt.minutes === 15 ? t('common.last_15m') : t(`dashboard.time_${opt.minutes}m`)}
                </button>
              ))}
            </div>
          </div>

          {/* Absolute Range */}
          <div className="p-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-3">{t('dashboard.absoluteRange')}</p>

            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-slate-400 font-medium mb-1 block">{t('dashboard.from')}</label>
                <input
                  type="datetime-local"
                  value={fromValue}
                  onChange={e => setFromValue(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-medium mb-1 block">{t('dashboard.to')}</label>
                <input
                  type="datetime-local"
                  value={toValue}
                  onChange={e => setToValue(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            </div>

            {rangeError && (
              <p className="text-red-400 text-[10px] mt-2">{rangeError}</p>
            )}

            <div className="flex gap-2 mt-3">
              <button
                onClick={handleApplyAbsolute}
                className="flex-1 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 rounded-lg py-1.5 text-xs font-medium transition-colors"
              >
                {t('dashboard.applyRange')}
              </button>
              {isAbsoluteActive && (
                <button
                  onClick={handleClearAbsolute}
                  className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-slate-300 border border-slate-600 rounded-lg px-3 py-1.5 text-xs transition-colors"
                >
                  <X size={12} />
                  {t('dashboard.clear')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
