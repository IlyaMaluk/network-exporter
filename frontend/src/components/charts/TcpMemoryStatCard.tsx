import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { instantQuery } from '../../lib/prometheus';
import { useDashboard } from '../../context/DashboardContext';
import { Cpu } from 'lucide-react';

const formatBytes = (bytes: number) => {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(2)} GB`;
  if (bytes >= 1_048_576)     return `${(bytes / 1_048_576).toFixed(2)} MB`;
  if (bytes >= 1024)          return `${(bytes / 1024).toFixed(2)} KB`;
  return `${bytes} B`;
};

export const TcpMemoryStatCard = () => {
  const { t } = useTranslation();
  const { refreshTick } = useDashboard();
  const [mem, setMem] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const res = await instantQuery('node_tcp_memory_bytes');
    const raw = res.length > 0 && (res[0] as any).value ? parseFloat((res[0] as any).value[1]) : 0;
    setMem(raw);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch, refreshTick]);

  const warnLevel = mem >= 100_000_000 ? 'border-red-500/50 text-red-400' : mem >= 10_000_000 ? 'border-yellow-500/50 text-yellow-400' : 'border-slate-700 text-blue-400';

  return (
    <div className={`bg-slate-800 rounded-xl border ${warnLevel} p-4 flex flex-col gap-2 hover:bg-slate-700 transition-colors`}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-500/20 text-blue-400">
        <Cpu size={18} />
      </div>
      <p className="text-xs text-slate-400 font-medium">{t('metrics.tcpMemory')}</p>
      {loading ? (
        <p className="text-lg text-slate-500">—</p>
      ) : (
        <p className="text-2xl font-bold text-white">{formatBytes(mem)}</p>
      )}
    </div>
  );
};
