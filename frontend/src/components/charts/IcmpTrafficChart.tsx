import { memo, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { usePrometheus } from '../../hooks/usePrometheus';
import { BASELINE_KEY } from '../../lib/prometheus';
import { InfoTooltip } from '../InfoTooltip';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

export const IcmpTrafficChart = memo(() => {
  const { t } = useTranslation();
  const { data: inData,  loading: loadingIn  } = usePrometheus({ query: 'rate(node_icmp_inmsgs_total[2m])',  fallbackSeriesName: 'in',  skeletonKeys: ['in']  });
  const { data: outData, loading: loadingOut } = usePrometheus({ query: 'rate(node_icmp_outmsgs_total[2m])', fallbackSeriesName: 'out', skeletonKeys: ['out'] });

  const merged = useMemo(() => inData.map((pt: any) => {
    const outPt = outData.find((o: any) => o.timestamp === pt.timestamp) ?? {};
    return {
      timestamp:      pt.timestamp,
      [BASELINE_KEY]: 0,
      in:             pt['in']  ?? 0,
      out:            (outPt as any)['out'] ?? 0,
    };
  }), [inData, outData]);

  if (loadingIn || loadingOut) {
    return <div className="flex items-center justify-center h-64 text-slate-400">{t('dashboard.refreshing')}</div>;
  }

  return (
    <div className="card col-span-1">
      <div className="inline-flex items-center mb-4">
        <h3 className="text-lg font-semibold text-[#F8FAFC] flex items-center">
          {t('metrics.icmpTraffic')}
          <InfoTooltip text={t('descriptions.icmpTraffic')} />
        </h3>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={merged} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis dataKey="timestamp" stroke="#94A3B8" tickFormatter={ts => format(ts, 'HH:mm')} tick={{ fill: '#94A3B8', fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 12 }} tickLine={false} axisLine={false} domain={[0, 'auto']} allowDecimals={true} />
            <Tooltip wrapperStyle={{ zIndex: 1000 }} contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', color: '#F8FAFC' }} labelFormatter={l => format(l, 'HH:mm:ss')} formatter={(v: any, name: any) => [Number(v).toFixed(3), name]} />
            <Legend verticalAlign="bottom" align="center" />
            <Line dataKey={BASELINE_KEY} type="linear" stroke="none" strokeOpacity={0} legendType="none" dot={false} isAnimationActive={false} />
            <Line type="linear" dataKey="in"  name="ICMP In/s"  stroke="#8B5CF6" strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />
            <Line type="linear" dataKey="out" name="ICMP Out/s" stroke="#EC4899" strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});
IcmpTrafficChart.displayName = 'IcmpTrafficChart';
