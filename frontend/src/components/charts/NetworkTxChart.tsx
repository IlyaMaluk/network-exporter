import { useTranslation } from 'react-i18next';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { usePrometheus } from '../../hooks/usePrometheus';
import { format } from 'date-fns';

export const NetworkTxChart = ({ selectedInterfaces = [] }: { selectedInterfaces?: string[] }) => {
  const { t } = useTranslation();
  const interfaceFilter = selectedInterfaces.length > 0 
    ? `{interface=~"${selectedInterfaces.join('|')}"}`
    : '{interface=~".*"}';

  const { data, loading } = usePrometheus({
    query: `rate(node_network_transmit_bytes_total${interfaceFilter}[5m])`,
    metricNameKey: 'interface',
  });

  const devices = Array.from(new Set(data.flatMap((d: any) => Object.keys(d).filter(k => k !== 'timestamp'))));
  const colors = ['#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#22C55E'];

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-textMuted">{t('dashboard.refreshing')}</div>;
  }

  return (
    <div className="card col-span-1">
      <div className="relative group inline-flex items-center mb-4 cursor-help">
        <h3 className="text-lg font-semibold text-textPrimary border-b border-dashed border-slate-600">
          {t('metrics.networkTx')}
        </h3>
        <div className="absolute left-0 top-full mt-2 w-72 p-3 bg-[#0F172A] border border-[#1E293B] rounded-lg shadow-xl text-sm text-[#F8FAFC] opacity-0 group-hover:opacity-100 transition-opacity z-[1000] pointer-events-none">
          {t('descriptions.networkTx')}
        </div>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              {devices.map((device, idx) => (
                <linearGradient key={`color-${device}`} id={`color-${device}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors[idx % colors.length]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={colors[idx % colors.length]} stopOpacity={0} />
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
              tickFormatter={(val) => `${(val / 1024).toFixed(1)} KB/s`}
              tick={{ fill: '#94A3B8', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              wrapperStyle={{ zIndex: 1000 }}
              contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', color: '#F8FAFC' }}
              labelFormatter={(label) => format(label, 'HH:mm:ss')}
              formatter={(value: any) => [`${(Number(value) / 1024).toFixed(2)} KB/s`]}
            />
            <Legend verticalAlign="bottom" align="center" />
            {devices.map((device, idx) => (
              <Area 
                key={`tx-${device}`}
                type="monotone" 
                dataKey={String(device)} 
                name={String(device)}
                stroke={colors[idx % colors.length]} 
                fillOpacity={1} 
                fill={`url(#color-${device})`} 
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
