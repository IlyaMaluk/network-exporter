import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { instantQuery } from '../../lib/prometheus';
import { useDashboard } from '../../context/DashboardContext';
import { InfoTooltip } from '../InfoTooltip';

interface ConntrackData { count: number; max: number; }

export const ConntrackGauge = () => {
  const { t } = useTranslation();
  const { refreshTick } = useDashboard();
  const [d, setD] = useState<ConntrackData>({ count: 0, max: 1 });
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const [countRes, maxRes] = await Promise.all([
      instantQuery('node_network_conntrack_count'),
      instantQuery('node_network_conntrack_max'),
    ]);
    const parse = (r: any[]) => r.length > 0 && r[0].value ? parseFloat(r[0].value[1]) : 0;
    setD({ count: parse(countRes), max: parse(maxRes) || 1 });
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch, refreshTick]);

  const pct = Math.min((d.count / d.max) * 100, 100);
  const color = pct >= 90 ? '#EF4444' : pct >= 70 ? '#F59E0B' : '#22C55E';

  // SVG arc math
  const r = 54, cx = 64, cy = 64;
  const startAngle = -210, totalArc = 240;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const arcEnd = startAngle + (pct / 100) * totalArc;
  const largeArc = arcEnd - startAngle > 180 ? 1 : 0;
  const sx = cx + r * Math.cos(toRad(startAngle));
  const sy = cy + r * Math.sin(toRad(startAngle));
  const ex = cx + r * Math.cos(toRad(arcEnd));
  const ey = cy + r * Math.sin(toRad(arcEnd));
  const bgEx = cx + r * Math.cos(toRad(startAngle + totalArc));
  const bgEy = cy + r * Math.sin(toRad(startAngle + totalArc));

  const statusLabel = pct >= 90 ? 'Critical' : pct >= 70 ? 'Warning' : 'Healthy';
  const badgeBg = pct >= 90 ? 'bg-red-500/20' : pct >= 70 ? 'bg-yellow-500/20' : 'bg-green-500/20';
  const badgeText = pct >= 90 ? 'text-red-400' : pct >= 70 ? 'text-yellow-400' : 'text-green-400';
  const badgeBorder = pct >= 90 ? 'border-red-500/30' : pct >= 70 ? 'border-yellow-500/30' : 'border-green-500/30';
  const dotBg = pct >= 90 ? 'bg-red-400' : pct >= 70 ? 'bg-yellow-400' : 'bg-green-400';

  return (
    <div className="card col-span-1 flex flex-col items-center justify-between p-6 h-full">
      <h3 className="text-lg font-semibold text-[#F8FAFC] self-start mb-4 flex items-center">
        {t('metrics.conntrackUsage')}
        <InfoTooltip text={t('descriptions.conntrackUsage')} />
      </h3>
      
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">Loading...</div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center w-full gap-6">
          <div className="relative flex items-center justify-center">
            <svg width="160" height="110" viewBox="0 0 128 88" className="transform scale-125">
              {/* Background arc */}
              <path
                d={`M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${r} ${r} 0 1 1 ${bgEx.toFixed(2)} ${bgEy.toFixed(2)}`}
                fill="none" stroke="#1E293B" strokeWidth="10" strokeLinecap="round"
              />
              {/* Value arc */}
              {pct > 0 && (
                <path
                  d={`M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`}
                  fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
                  style={{ 
                    transition: 'all 0.5s ease',
                    filter: `drop-shadow(0 0 6px ${color}44)` 
                  }}
                />
              )}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center pt-4">
              <span 
                className="text-4xl font-extrabold text-white tracking-tight"
                style={{ 
                  textShadow: `0 0 20px ${color}66`,
                  color: '#FFFFFF'
                }}
              >
                {pct.toFixed(1)}<span className="text-xl ml-0.5 text-slate-400 font-medium">%</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="text-center">
              <p className="text-xs text-slate-400 font-mono">
                {d.count.toLocaleString()} / {d.max.toLocaleString()}
              </p>
            </div>

            <span className={`px-3 py-1 ${badgeBg} ${badgeText} border ${badgeBorder} rounded-full text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-black/20`}>
              <span className={`w-2 h-2 rounded-full ${dotBg} animate-pulse shadow-[0_0_8px_rgba(0,0,0,0.5)]`}></span>
              {statusLabel}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
