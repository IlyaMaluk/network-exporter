import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { instantQuery } from '../../lib/prometheus';
import { useDashboard } from '../../context/DashboardContext';
import { AlertTriangle, ShieldOff, HardDrive } from 'lucide-react';

const formatBytes = (bytes: number) => {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(2)} MB`;
  if (bytes >= 1024)      return `${(bytes / 1024).toFixed(2)} KB`;
  return `${bytes} B`;
};

export const UdpStatsPanel = () => {
  const { t } = useTranslation();
  const { refreshTick } = useDashboard();
  const [stats, setStats] = useState({ errors: 0, noports: 0, mem: 0 });
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const [errRes, nopRes, memRes] = await Promise.all([
      instantQuery('node_udp_inerrors_total'),
      instantQuery('node_udp_noports_total'),
      instantQuery('node_udp_memory_bytes'),
    ]);
    const p  = (r: any[]) => r.length > 0 && r[0].value ? parseFloat(r[0].value[1]) : 0;
    setStats({ errors: p(errRes), noports: p(nopRes), mem: p(memRes) });
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch, refreshTick]);

  if (loading) return <div className="col-span-3 text-slate-400 text-sm p-4">Loading UDP stats...</div>;

  return (
    <>
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 flex flex-col gap-2 hover:bg-slate-700 transition-colors">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/20 text-red-400"><AlertTriangle size={18} /></div>
        <p className="text-xs text-slate-400 font-medium">{t('metrics.udpInErrors')}</p>
        <p className="text-2xl font-bold text-white">{stats.errors.toLocaleString()}</p>
      </div>
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 flex flex-col gap-2 hover:bg-slate-700 transition-colors">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-orange-500/20 text-orange-400"><ShieldOff size={18} /></div>
        <p className="text-xs text-slate-400 font-medium">{t('metrics.udpNoPorts')}</p>
        <p className="text-2xl font-bold text-white">{stats.noports.toLocaleString()}</p>
      </div>
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 flex flex-col gap-2 hover:bg-slate-700 transition-colors">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-500/20 text-blue-400"><HardDrive size={18} /></div>
        <p className="text-xs text-slate-400 font-medium">{t('metrics.udpMemory')}</p>
        <p className="text-2xl font-bold text-white">{formatBytes(stats.mem)}</p>
      </div>
    </>
  );
};
