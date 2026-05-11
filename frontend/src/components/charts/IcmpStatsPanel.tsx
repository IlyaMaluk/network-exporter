import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { instantQuery } from '../../lib/prometheus';
import { useDashboard } from '../../context/DashboardContext';
import { AlertTriangle, AlertOctagon } from 'lucide-react';

export const IcmpStatsPanel = () => {
  const { t } = useTranslation();
  const { refreshTick } = useDashboard();
  const [stats, setStats] = useState({ inErrors: 0, outErrors: 0 });
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const [inRes, outRes] = await Promise.all([
      instantQuery('node_icmp_inerrors_total'),
      instantQuery('node_icmp_outerrors_total'),
    ]);
    const p = (r: any[]) => r.length > 0 && r[0].value ? parseFloat(r[0].value[1]) : 0;
    setStats({ inErrors: p(inRes), outErrors: p(outRes) });
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch, refreshTick]);

  if (loading) return <div className="col-span-2 text-slate-400 text-sm p-4">Loading ICMP stats...</div>;

  return (
    <>
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 flex flex-col gap-2 hover:bg-slate-700 transition-colors">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/20 text-red-400"><AlertTriangle size={18} /></div>
        <p className="text-xs text-slate-400 font-medium">{t('metrics.icmpInErrors')}</p>
        <p className="text-2xl font-bold text-white">{stats.inErrors.toLocaleString()}</p>
      </div>
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 flex flex-col gap-2 hover:bg-slate-700 transition-colors">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-orange-500/20 text-orange-400"><AlertOctagon size={18} /></div>
        <p className="text-xs text-slate-400 font-medium">{t('metrics.icmpOutErrors')}</p>
        <p className="text-2xl font-bold text-white">{stats.outErrors.toLocaleString()}</p>
      </div>
    </>
  );
};
