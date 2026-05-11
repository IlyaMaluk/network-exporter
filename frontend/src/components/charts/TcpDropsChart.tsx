import { memo, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { usePrometheus } from '../../hooks/usePrometheus';
import { BASELINE_KEY } from '../../lib/prometheus';
import { ChartLegend } from '../ChartLegend';
import { InfoTooltip } from '../InfoTooltip';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

export const TcpDropsChart = memo(() => {
  const { t } = useTranslation();
  const { data, loading } = usePrometheus({
    query: 'sum by (dst_ip) (rate(node_tcp_drops_total[2m]))',
    metricNameKey: 'dst_ip',
  });

  // Dynamic extraction: filter out localhost noise for Drops to maintain clean scale
  const destinations = useMemo(() => 
    Array.from(new Set(data.flatMap(d => Object.keys(d))))
      .filter(k => k !== 'timestamp' && k !== 'value' && k !== BASELINE_KEY && k !== '127.0.0.1' && k !== '0.0.0.0'),
    [data]
  );

  const colors = ['#EF4444', '#F97316', '#F59E0B', '#E11D48', '#EA580C'];

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-slate-400">{t('dashboard.refreshing')}</div>;
  }

  return (
    <div className="card col-span-1 border-red-500/20 bg-red-950/5 flex flex-col">
      <div className="inline-flex items-center mb-4">
        <h3 className="text-lg font-semibold text-red-400 flex items-center">
          {t('metrics.tcpDrops')}
          <InfoTooltip text={t('descriptions.tcpDrops')} />
        </h3>
      </div>
      <div style={{ height: 300 }} className="flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis dataKey="timestamp" stroke="#94A3B8" tickFormatter={ts => format(ts, 'HH:mm')} tick={{ fill: '#94A3B8', fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={true} domain={[0, (dataMax: number) => Math.max(dataMax, 0.01)]} tickFormatter={(val) => val.toFixed(3)} />
            <Tooltip wrapperStyle={{ zIndex: 1000 }} contentStyle={{ backgroundColor: '#0F172A', borderColor: '#EF4444', color: '#F8FAFC' }} labelFormatter={l => format(l, 'HH:mm:ss')} formatter={(v: any, name: any) => [Number(v).toFixed(3), name]} />
            <Line dataKey={BASELINE_KEY} type="linear" stroke="none" dot={false} legendType="none" isAnimationActive={false} />
            {destinations.map((dst, idx) => (
              <Line key={`drop-${dst}`} type="linear" dataKey={String(dst)} name={String(dst)}
                stroke={colors[idx % colors.length]} strokeWidth={2} dot={false}
                connectNulls isAnimationActive={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend 
        entries={destinations.map((dst, idx) => ({
          name: dst,
          color: colors[idx % colors.length],
          currentValue: data[data.length - 1]?.[dst]
        }))}
      />
    </div>
  );
});
TcpDropsChart.displayName = 'TcpDropsChart';
