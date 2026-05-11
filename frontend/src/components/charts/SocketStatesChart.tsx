import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { usePrometheus } from '../../hooks/usePrometheus';
import { BASELINE_KEY } from '../../lib/prometheus';
import { InfoTooltip } from '../InfoTooltip';
import { format } from 'date-fns';

export const SocketStatesChart = memo(() => {
  const { t } = useTranslation();

  const { data,      loading } = usePrometheus({ query: 'node_sockets_used',      fallbackSeriesName: 'used',  skeletonKeys: ['used']  });
  const { data: inuse         } = usePrometheus({ query: 'node_tcp_sockets_inuse', fallbackSeriesName: 'inuse', skeletonKeys: ['inuse'] });

  const mergedData = useMemo(() => data.map((dPoint: any) => {
    const iPoint = inuse.find((i: any) => i.timestamp === dPoint.timestamp);
    return {
      timestamp:      dPoint.timestamp,
      [BASELINE_KEY]: 0,
      used:           dPoint['used']  ?? 0,
      inuse:          iPoint ? (iPoint['inuse'] ?? 0) : 0,
    };
  }), [data, inuse]);

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-slate-400">{t('dashboard.refreshing')}</div>;
  }

  return (
    <div className="card col-span-1">
      <div className="inline-flex items-center mb-4">
        <h3 className="text-lg font-semibold text-textPrimary flex items-center">
          {t('metrics.socketStates')}
          <InfoTooltip text={t('descriptions.socketStates')} />
        </h3>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mergedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis dataKey="timestamp" stroke="#94A3B8" tickFormatter={ts => format(ts, 'HH:mm')} tick={{ fill: '#94A3B8', fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 12 }} tickLine={false} axisLine={false} domain={[0, 'auto']} allowDecimals={true} />
            <Tooltip wrapperStyle={{ zIndex: 1000 }} contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', color: '#F8FAFC' }} labelFormatter={l => format(l, 'HH:mm:ss')} cursor={{ fill: '#1E293B' }} formatter={(v: any, name: any) => [Number(v), name]} />
            <Legend verticalAlign="bottom" align="center" />
            {/* BarChart does not support an invisible baseline Bar in the same way,
                but the data always has the key so structure remains stable. */}
            <Bar dataKey="used"  name="Used"   fill="#8B5CF6" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            <Bar dataKey="inuse" name="In Use" fill="#22C55E" radius={[4, 4, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});
SocketStatesChart.displayName = 'SocketStatesChart';
