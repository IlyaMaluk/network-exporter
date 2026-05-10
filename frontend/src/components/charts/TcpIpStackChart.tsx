import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { usePrometheus } from '../../hooks/usePrometheus';
import { format } from 'date-fns';

export const TcpIpStackChart = () => {
  const { t } = useTranslation();
  
  // Example query for TCP passive opens, if it's exported
  const { data: passiveData, loading: loadingPassive } = usePrometheus({
    query: 'rate(node_tcp_passive_opens_total[5m])',
  });

  const { data: activeData, loading: loadingActive } = usePrometheus({
    query: 'rate(node_tcp_active_opens_total[5m])',
  });

  // Merge the two datasets assuming single series each without labels
  const mergedData = passiveData.map((pPoint: any) => {
    const aPoint = activeData.find((a: any) => a.timestamp === pPoint.timestamp);
    return {
      timestamp: pPoint.timestamp,
      passive: pPoint['Series 1'] || 0,
      active: aPoint ? aPoint['Series 1'] : 0,
    };
  });

  const loading = loadingPassive || loadingActive;

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-textMuted">{t('dashboard.refreshing')}</div>;
  }

  return (
    <div className="card col-span-1">
      <div className="relative group inline-flex items-center mb-4 cursor-help">
        <h3 className="text-lg font-semibold text-textPrimary border-b border-dashed border-slate-600">
          {t('metrics.tcpIpStack')}
        </h3>
        <div className="absolute left-0 top-full mt-2 w-72 p-3 bg-[#0F172A] border border-[#1E293B] rounded-lg shadow-xl text-sm text-[#F8FAFC] opacity-0 group-hover:opacity-100 transition-opacity z-[1000] pointer-events-none">
          {t('descriptions.tcpIpStack')}
        </div>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mergedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis 
              dataKey="timestamp" 
              stroke="#94A3B8" 
              tickFormatter={(unixTime) => format(unixTime, 'HH:mm')}
              tick={{ fill: '#94A3B8', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#94A3B8" 
              tick={{ fill: '#94A3B8', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              wrapperStyle={{ zIndex: 1000 }}
              contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', color: '#F8FAFC' }}
              labelFormatter={(label) => format(label, 'HH:mm:ss')}
            />
            <Legend verticalAlign="bottom" align="center" />
            <Line type="monotone" dataKey="passive" name={t('metrics.passiveOpens')} stroke="#3B82F6" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="active" name={t('metrics.activeOpens')} stroke="#F59E0B" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
