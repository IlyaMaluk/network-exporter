import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { usePrometheus } from '../../hooks/usePrometheus';
import { format } from 'date-fns';

export const SocketStatesChart = () => {
  const { t } = useTranslation();
  
  // Example query assuming standard node_exporter-like metrics or custom exporter socket states
  const { data, loading } = usePrometheus({
    query: 'node_sockets_used', 
  });

  const { data: inuse } = usePrometheus({
    query: 'node_tcp_sockets_inuse',
  });

  const mergedData = data.map((dPoint: any) => {
    const iPoint = inuse.find((i: any) => i.timestamp === dPoint.timestamp);
    return {
      timestamp: dPoint.timestamp,
      used: dPoint['Series 1'] || 0,
      inuse: iPoint ? iPoint['Series 1'] : 0,
    };
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-textMuted">{t('dashboard.refreshing')}</div>;
  }

  return (
    <div className="card col-span-1">
      <div className="relative group inline-flex items-center mb-4 cursor-help">
        <h3 className="text-lg font-semibold text-textPrimary border-b border-dashed border-slate-600">
          {t('metrics.socketStates')}
        </h3>
        <div className="absolute left-0 top-full mt-2 w-72 p-3 bg-[#0F172A] border border-[#1E293B] rounded-lg shadow-xl text-sm text-[#F8FAFC] opacity-0 group-hover:opacity-100 transition-opacity z-[1000] pointer-events-none">
          {t('descriptions.socketStates')}
        </div>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mergedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
              cursor={{ fill: '#1E293B' }}
            />
            <Legend verticalAlign="bottom" align="center" />
            <Bar dataKey="used" name="Used" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="inuse" name="In Use" fill="#22C55E" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
