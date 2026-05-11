import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { instantQuery } from '../../lib/prometheus';
import { useDashboard } from '../../context/DashboardContext';
import { Network, Activity, Clock, AlertCircle, Radio } from 'lucide-react';

interface SocketStats {
  socketsUsed: number;
  tcpInuse: number;
  tcpTw: number;
  tcpOrphan: number;
  udpInuse: number;
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  threshold?: { warn: number; crit: number };
}

const StatCard = ({ label, value, icon, color, threshold }: StatCardProps) => {
  let borderColor = 'border-slate-700';
  if (threshold) {
    if (value >= threshold.crit) borderColor = 'border-red-500/50';
    else if (value >= threshold.warn) borderColor = 'border-yellow-500/50';
    else borderColor = 'border-green-500/30';
  }
  return (
    <div className={`bg-slate-800 rounded-xl border ${borderColor} p-4 flex flex-col gap-2 hover:bg-slate-700 transition-colors`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <p className="text-xs text-slate-400 font-medium">{label}</p>
      <p className="text-2xl font-bold text-white">{value.toLocaleString()}</p>
    </div>
  );
};

export const SocketsStatPanel = () => {
  const { t } = useTranslation();
  const { refreshTick } = useDashboard();
  const [stats, setStats] = useState<SocketStats>({ socketsUsed: 0, tcpInuse: 0, tcpTw: 0, tcpOrphan: 0, udpInuse: 0 });
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const [sockRes, tcpRes, twRes, orphRes, udpRes] = await Promise.all([
      instantQuery('node_sockets_used'),
      instantQuery('node_tcp_sockets_inuse'),
      instantQuery('node_tcp_sockets_tw'),
      instantQuery('node_tcp_sockets_orphan'),
      instantQuery('node_udp_sockets_inuse'),
    ]);
    const p = (r: any[]) => r.length > 0 && r[0].value ? Math.round(parseFloat(r[0].value[1])) : 0;
    setStats({ socketsUsed: p(sockRes), tcpInuse: p(tcpRes), tcpTw: p(twRes), tcpOrphan: p(orphRes), udpInuse: p(udpRes) });
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch, refreshTick]);

  if (loading) return <div className="col-span-full text-slate-400 text-sm p-4">Loading sockets...</div>;

  return (
    <>
      <StatCard label={t('metrics.socketsUsed')}      value={stats.socketsUsed} icon={<Network size={18} />}      color="bg-blue-500/20 text-blue-400"   />
      <StatCard label={t('metrics.tcpInuse')}          value={stats.tcpInuse}    icon={<Activity size={18} />}     color="bg-green-500/20 text-green-400"  threshold={{ warn: 500, crit: 1000 }} />
      <StatCard label={t('metrics.tcpTw')}             value={stats.tcpTw}       icon={<Clock size={18} />}        color="bg-yellow-500/20 text-yellow-400" threshold={{ warn: 200, crit: 500 }} />
      <StatCard label={t('metrics.tcpOrphan')}          value={stats.tcpOrphan}   icon={<AlertCircle size={18} />}  color="bg-red-500/20 text-red-400"      threshold={{ warn: 50, crit: 200 }} />
      <StatCard label={t('metrics.udpInuse')}          value={stats.udpInuse}    icon={<Radio size={18} />}        color="bg-purple-500/20 text-purple-400" />
    </>
  );
};
