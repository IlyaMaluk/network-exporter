import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { usePrometheus } from '../../hooks/usePrometheus';
import { BASELINE_KEY } from '../../lib/prometheus';
import { InfoTooltip } from '../InfoTooltip';
import { format } from 'date-fns';

export const TcpIpStackChart = memo(() => {
  const { t } = useTranslation();

  const { data: passiveData, loading: loadingPassive } = usePrometheus({
    query: 'rate(node_tcp_passive_opens_total[2m])',
    fallbackSeriesName: 'passive',
    skeletonKeys: ['passive'],
  });
  const { data: activeData, loading: loadingActive } = usePrometheus({
    query: 'rate(node_tcp_active_opens_total[2m])',
    fallbackSeriesName: 'active',
    skeletonKeys: ['active'],
  });

  const mergedData = useMemo(() => passiveData.map((pPoint: any) => {
    const aPoint = activeData.find((a: any) => a.timestamp === pPoint.timestamp);
    return {
      timestamp:       pPoint.timestamp,
      [BASELINE_KEY]:  0,
      passive:         pPoint['passive'] ?? 0,
      active:          aPoint ? (aPoint['active'] ?? 0) : 0,
    };
  }), [passiveData, activeData]);

  if (loadingPassive || loadingActive) {
    return <div className="flex items-center justify-center h-64 text-slate-400">{t('dashboard.refreshing')}</div>;
  }

  return (
    <div className="card col-span-1">
      <div className="inline-flex items-center mb-4">
        <h3 className="text-lg font-semibold text-textPrimary flex items-center">
          {t('metrics.tcpIpStack')}
          <InfoTooltip text={t('descriptions.tcpIpStack')} />
        </h3>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mergedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis dataKey="timestamp" stroke="#94A3B8" tickFormatter={ts => format(ts, 'HH:mm')} tick={{ fill: '#94A3B8', fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 12 }} tickLine={false} axisLine={false} domain={[0, 'auto']} allowDecimals={true} />
            <Tooltip wrapperStyle={{ zIndex: 1000 }} contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', color: '#F8FAFC' }} labelFormatter={l => format(l, 'HH:mm:ss')} formatter={(v: any, name: any) => [Number(v).toFixed(2), name]} />
            <Legend verticalAlign="bottom" align="center" />
            <Line dataKey={BASELINE_KEY} type="linear" stroke="none" strokeOpacity={0} legendType="none" dot={false} isAnimationActive={false} />
            <Line type="linear" dataKey="passive" name={t('metrics.passiveOpens')} stroke="#3B82F6" strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />
            <Line type="linear" dataKey="active"  name={t('metrics.activeOpens')}  stroke="#F59E0B" strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});
TcpIpStackChart.displayName = 'TcpIpStackChart';
