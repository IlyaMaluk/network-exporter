import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { usePrometheus } from '../../hooks/usePrometheus';
import { BASELINE_KEY } from '../../lib/prometheus';
import { ChartLegend, getLastValue } from '../ChartLegend';
import { InfoTooltip } from '../InfoTooltip';
import { format } from 'date-fns';

// Default interfaces shown when no filter is active and Prometheus data determines
// the real list dynamically. We still need a stable fallback set for the
// JSX structure when Prometheus returns nothing.
const DEFAULT_FALLBACK_IFACES = ['eth0', 'lo'];

export const NetworkErrorsChart = memo(({ selectedInterfaces = [] }: { selectedInterfaces?: string[] }) => {
  const { t } = useTranslation();

  const interfaceFilter = selectedInterfaces.length > 0
    ? `{interface=~"${selectedInterfaces.join('|')}"}`
    : '{interface!~"veth.*|docker.*|br-.*"}';

  const { data: rxData, loading: loadingRx } = usePrometheus({
    query: `rate(node_network_receive_errors_total${interfaceFilter}[2m]) * 60`,
    metricNameKey: 'interface',
  });

  const { data: txData, loading: loadingTx } = usePrometheus({
    query: `rate(node_network_transmit_errors_total${interfaceFilter}[2m]) * 60`,
    metricNameKey: 'interface',
  });

  // The interface set used to build BOTH mergedData and the Area elements.
  // If selectedInterfaces is provided we always use that (stable JSX structure).
  // If not, we derive from Prometheus data (may change as data arrives, which
  // is acceptable — it's the conditional SWAP that causes flickering, not this).
  const renderInterfaces = useMemo(() => {
    if (selectedInterfaces.length > 0) return selectedInterfaces;
    const fromData = Array.from(new Set(
      rxData.flatMap((d: any) => Object.keys(d).filter(k => k !== 'timestamp' && k !== BASELINE_KEY))
    ));
    return fromData.length > 0 ? fromData : DEFAULT_FALLBACK_IFACES;
  }, [selectedInterfaces, rxData]);

  // Build merged data: for every Rx timestamp, attach Tx and pre-fill all
  // renderInterfaces keys to 0 so Recharts always finds every dataKey it renders.
  const mergedData = useMemo(() => {
    if (rxData.length === 0) return [];
    return rxData.map((rxPoint: any) => {
      const txPoint = txData.find((tx: any) => tx.timestamp === rxPoint.timestamp) ?? {};
      // Start with baseline anchor
      const point: Record<string, number> = { timestamp: rxPoint.timestamp, [BASELINE_KEY]: 0 };
      // Pre-fill all interface keys to 0
      renderInterfaces.forEach(iface => {
        point[`${iface}_rx`] = 0;
        point[`${iface}_tx`] = 0;
      });
      // Overwrite with real Prometheus values where available
      renderInterfaces.forEach(iface => {
        if (rxPoint[iface] !== undefined) point[`${iface}_rx`] = Number(rxPoint[iface]);
        if ((txPoint as any)[iface] !== undefined) point[`${iface}_tx`] = Number((txPoint as any)[iface]);
      });
      return point;
    });
  }, [rxData, txData, renderInterfaces]);

  const rxColors = ['#EF4444', '#F43F5E', '#E11D48'];
  const txColors = ['#F97316', '#F59E0B', '#D97706'];

  const legendEntries = useMemo(() =>
    renderInterfaces.flatMap((device, idx) => [
      { 
        name: `${device} (Rx)`, 
        color: rxColors[idx % rxColors.length], 
        currentValue: getLastValue(mergedData, `${device}_rx`) 
      },
      { 
        name: `${device} (Tx)`, 
        color: txColors[idx % txColors.length], 
        currentValue: getLastValue(mergedData, `${device}_tx`) 
      },
    ]),
    [renderInterfaces, mergedData]
  );

  if (loadingRx || loadingTx) {
    return <div className="flex items-center justify-center h-64 text-slate-400">{t('dashboard.refreshing')}</div>;
  }

  return (
    <div className="card col-span-1 flex flex-col">
      <div className="inline-flex items-center mb-4">
        <h3 className="text-lg font-semibold text-textPrimary flex items-center">
          {t('metrics.networkErrors')}
          <InfoTooltip text={t('descriptions.networkErrors')} />
        </h3>
      </div>
      <div style={{ height: 300 }} className="flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={mergedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis dataKey="timestamp" stroke="#94A3B8" tickFormatter={ts => format(ts, 'HH:mm')} tick={{ fill: '#94A3B8', fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 12 }} tickLine={false} axisLine={false} domain={[0, 'auto']} allowDecimals={true} />
            <Tooltip wrapperStyle={{ zIndex: 1000 }} contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', color: '#F8FAFC' }} labelFormatter={l => format(l, 'HH:mm:ss')} formatter={(v: any, name: any) => [Number(v).toFixed(2), name]} />
            <Area dataKey={BASELINE_KEY} type="linear" stroke="none" fill="none" fillOpacity={0} legendType="none" isAnimationActive={false} />
            {renderInterfaces.map((device, idx) => [
              <Area key={`rx-${device}`} type="linear" dataKey={`${device}_rx`} name={`${device} (Rx)`}
                stackId="1" stroke={rxColors[idx % rxColors.length]} fill={rxColors[idx % rxColors.length]}
                fillOpacity={0.25} strokeWidth={1.5} connectNulls isAnimationActive={false} />,
              <Area key={`tx-${device}`} type="linear" dataKey={`${device}_tx`} name={`${device} (Tx)`}
                stackId="1" stroke={txColors[idx % txColors.length]} fill={txColors[idx % txColors.length]}
                fillOpacity={0.25} strokeWidth={1.5} connectNulls isAnimationActive={false} />,
            ])}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend entries={legendEntries} />
    </div>
  );
});
NetworkErrorsChart.displayName = 'NetworkErrorsChart';
