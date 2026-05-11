import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { usePrometheus } from '../../hooks/usePrometheus';
import { BASELINE_KEY } from '../../lib/prometheus';
import { ChartLegend, getLastValue } from '../ChartLegend';
import { InfoTooltip } from '../InfoTooltip';
import { format } from 'date-fns';

export const NetworkRxChart = memo(({ selectedInterfaces = [] }: { selectedInterfaces?: string[] }) => {
  const { t } = useTranslation();
  const interfaceFilter = selectedInterfaces.length > 0
    ? `{interface=~"${selectedInterfaces.join('|')}"}`
    : '{interface=~".*"}';

  const { data, loading } = usePrometheus({
    query: `rate(node_network_receive_bytes_total${interfaceFilter}[2m])`,
    metricNameKey: 'interface',
  });

  const devices = useMemo(() =>
    Array.from(new Set(
      data.flatMap((d: any) => Object.keys(d).filter(k => k !== 'timestamp' && k !== BASELINE_KEY))
    )),
    [data]
  );
  const colors = ['#22C55E', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-slate-400">{t('dashboard.refreshing')}</div>;
  }

  return (
    <div className="card col-span-1 flex flex-col">
      <div className="inline-flex items-center mb-4">
        <h3 className="text-lg font-semibold text-textPrimary flex items-center">
          {t('metrics.networkRx')}
          <InfoTooltip text={t('descriptions.networkTraffic')} />
        </h3>
      </div>
      <div style={{ height: 300 }} className="flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              {devices.map((device, idx) => (
                <linearGradient key={`grad-rx-${device}`} id={`color-rx-${device}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors[idx % colors.length]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={colors[idx % colors.length]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis dataKey="timestamp" stroke="#94A3B8" tickFormatter={ts => format(ts, 'HH:mm')} tick={{ fill: '#94A3B8', fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis stroke="#94A3B8" tickFormatter={val => val < 102.4 ? `${(val / 1024).toFixed(3)} KB/s` : `${(val / 1024).toFixed(1)} KB/s`} tick={{ fill: '#94A3B8', fontSize: 12 }} tickLine={false} axisLine={false} domain={[0, 'auto']} allowDecimals={true} />
            <Tooltip wrapperStyle={{ zIndex: 1000 }} contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', color: '#F8FAFC' }} labelFormatter={l => format(l, 'HH:mm:ss')} formatter={(v: any, name: any) => [`${(Number(v) / 1024).toFixed(3)} KB/s`, name]} />
            <Area dataKey={BASELINE_KEY} type="linear" stroke="none" fill="none" fillOpacity={0} legendType="none" isAnimationActive={false} />
            {devices.map((device, idx) => (
              <Area key={`rx-${device}`} type="linear" dataKey={String(device)} name={String(device)}
                stroke={colors[idx % colors.length]} fillOpacity={1} fill={`url(#color-rx-${device})`}
                connectNulls isAnimationActive={false} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend
        entries={devices.map((device, idx) => ({
          name: device,
          color: colors[idx % colors.length],
          currentValue: getLastValue(data, device),
          formatter: (v: number) => `${(v / 1024).toFixed(2)} KB/s`
        }))}
      />
    </div>
  );
});
NetworkRxChart.displayName = 'NetworkRxChart';
