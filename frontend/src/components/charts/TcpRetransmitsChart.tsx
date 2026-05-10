import { useTranslation } from 'react-i18next';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { usePrometheus } from '../../hooks/usePrometheus';
import { format } from 'date-fns';

export const TcpRetransmitsChart = () => {
  const { t } = useTranslation();
  
  const { data, loading } = usePrometheus({
    query: 'rate(node_tcp_retransmit_total[30s])',
    metricNameKey: 'dst_ip',
    refreshIntervalSeconds: 3,
  });

  // Unique dst_ip addresses
  const allDestinations = Array.from(new Set(data.flatMap((d: any) => Object.keys(d).filter(k => k !== 'timestamp'))));
  
  // Filter out destinations where sum of all values is 0
  const destinations = allDestinations.filter(dst => {
    return data.some((d: any) => Number(d[dst]) > 0);
  });
  
  // Warm colors for retransmits (anomaly detection)
  const colors = ['#EF4444', '#F97316', '#F59E0B', '#E11D48', '#EA580C'];

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-textMuted">{t('dashboard.refreshing')}</div>;
  }

  return (
    <div className="card col-span-1 border-orange-500/30 bg-orange-950/10">
      <div className="relative group inline-flex items-center mb-4 cursor-help">
        <h3 className="text-lg font-semibold text-orange-400 border-b border-dashed border-orange-500/50">
          {t('metrics.tcpRetransmits')}
        </h3>
        <div className="absolute left-0 top-full mt-2 w-72 p-3 bg-[#0F172A] border border-[#F97316] rounded-lg shadow-xl text-sm text-[#F8FAFC] opacity-0 group-hover:opacity-100 transition-opacity z-[1000] pointer-events-none">
          {t('descriptions.tcpRetransmits')}
        </div>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
            <defs>
              {destinations.map((dst, idx) => (
                <linearGradient key={`color-${dst}`} id={`color-${dst}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors[idx % colors.length]} stopOpacity={0.6} />
                  <stop offset="95%" stopColor={colors[idx % colors.length]} stopOpacity={0.1} />
                </linearGradient>
              ))}
            </defs>
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
              contentStyle={{ backgroundColor: '#0F172A', borderColor: '#F97316', color: '#F8FAFC' }}
              labelFormatter={(label) => format(label, 'HH:mm:ss')}
              formatter={(value: any) => [Number(value).toFixed(2)]}
            />
            <Legend verticalAlign="bottom" align="center" />
            {destinations.map((dst, idx) => (
              <Area 
                key={`dst-${dst}`}
                type="monotone" 
                dataKey={String(dst)} 
                name={String(dst)}
                stroke={colors[idx % colors.length]} 
                fill={`url(#color-${dst})`}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
