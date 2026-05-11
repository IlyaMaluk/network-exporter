

/**
 * ChartLegend — Grafana-style scrollable table legend.
 * Renders a compact grid: [Color swatch] [Series name] [Current value].
 */

interface LegendEntry {
  name: string;
  color: string;
  currentValue?: number;
  formatter?: (v: number) => string;
}

interface ChartLegendProps {
  entries: LegendEntry[];
  maxHeight?: number; // px, default 140
}

const defaultFormatter = (v: number) => {
  if (v === undefined || v === null) return '0.000';
  return Number(v).toFixed(3);
};

export const ChartLegend = ({ entries, maxHeight = 140 }: ChartLegendProps) => {
  if (entries.length === 0) return null;

  return (
    <div
      className="mt-2 border-t border-slate-700/60 overflow-y-auto custom-scrollbar"
      style={{ maxHeight }}
    >
      <div className="grid gap-0">
        {entries.map(entry => (
          <div
            key={entry.name}
            className="flex items-center gap-2 px-2 py-[5px] hover:bg-slate-700/40 rounded transition-colors"
          >
            {/* Color swatch */}
            <span
              className="flex-shrink-0 w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            {/* Series name */}
            <span className="flex-grow text-[11px] text-slate-300 truncate font-mono">
              {entry.name}
            </span>
            {/* Current value */}
            {entry.currentValue !== undefined && (
              <span className="flex-shrink-0 text-[11px] text-slate-400 font-mono tabular-nums">
                {(entry.formatter ?? defaultFormatter)(entry.currentValue)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/** Helper: extract the last value for a named key from a data array. */
export const getLastValue = (data: any[], key: string): number => {
  if (!data || data.length === 0) return 0;
  for (let i = data.length - 1; i >= 0; i--) {
    const v = data[i]?.[key];
    if (v !== undefined && !isNaN(Number(v))) return Number(v);
  }
  return 0;
};
