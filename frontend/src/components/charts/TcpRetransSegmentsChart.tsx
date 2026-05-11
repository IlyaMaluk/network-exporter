import { memo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { usePrometheus } from '../../hooks/usePrometheus';
import { BASELINE_KEY } from '../../lib/prometheus';
import { InfoTooltip } from '../InfoTooltip';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

export const TcpRetransSegmentsChart = memo(() => {
  const { t } = useTranslation();

  const { data, loading } = usePrometheus({
    query: 'rate(node_tcp_retrans_segments_total[2m])',
    fallbackSeriesName: 'retrans',
    skeletonKeys: ['retrans'],
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-slate-400">{t('dashboard.refreshing')}</div>;
  }

  return (
    <div className="card col-span-1">
      <div className="inline-flex items-center mb-4">
        <h3 className="text-lg font-semibold text-[#F8FAFC] flex items-center">
          {t('metrics.tcpRetransSegments')}
          <InfoTooltip text={t('descriptions.tcpRetransSegments')} />
        </h3>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis dataKey="timestamp" stroke="#94A3B8" tickFormatter={ts => format(ts, 'HH:mm')} tick={{ fill: '#94A3B8', fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={true} domain={[0, (dataMax: number) => Math.max(dataMax, 0.01)]} tickFormatter={(val) => val.toFixed(3)} />
            <Tooltip wrapperStyle={{ zIndex: 1000 }} contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', color: '#F8FAFC' }} labelFormatter={l => format(l, 'HH:mm:ss')} formatter={(v: any) => [Number(v).toFixed(3), '']} />
            <Legend verticalAlign="bottom" align="center" />
            <Line dataKey={BASELINE_KEY} type="linear" stroke="none" strokeOpacity={0} legendType="none" dot={false} isAnimationActive={false} />
            <Line type="linear" dataKey="retrans" name="Retrans Segs/s" stroke="#F59E0B" strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});
TcpRetransSegmentsChart.displayName = 'TcpRetransSegmentsChart';
