import { useTranslation } from 'react-i18next';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { usePrometheus } from '../../hooks/usePrometheus';
import { format } from 'date-fns';

export const NetworkErrorsChart = ({ selectedInterfaces = [] }: { selectedInterfaces?: string[] }) => {
  const { t } = useTranslation();
  
  const interfaceFilter = selectedInterfaces.length > 0 
    ? `{interface=~"${selectedInterfaces.join('|')}"}`
    : '{interface!~"veth.*|docker.*|br-.*"}';

  const { data: rxData, loading: loadingRx } = usePrometheus({
    query: `rate(node_network_receive_errors_total${interfaceFilter}[5m])`,
    metricNameKey: 'interface',
  });

  const { data: txData, loading: loadingTx } = usePrometheus({
    query: `rate(node_network_transmit_errors_total${interfaceFilter}[5m])`,
    metricNameKey: 'interface',
  });

  const mergedData = rxData.map((rxPoint: any) => {
    const txPoint = txData.find((tx: any) => tx.timestamp === rxPoint.timestamp) || {};
    const formattedTx = Object.fromEntries(
      Object.entries(txPoint)
        .filter(([k]) => k !== 'timestamp')
        .map(([k, v]) => [`${k}_tx`, v])
    );
    const formattedRx = Object.fromEntries(
      Object.entries(rxPoint)
        .filter(([k]) => k !== 'timestamp')
        .map(([k, v]) => [`${k}_rx`, v])
    );
    return {
      timestamp: rxPoint.timestamp,
      ...formattedRx,
      ...formattedTx,
    };
  });

  const interfaces = Array.from(new Set(rxData.flatMap((d: any) => Object.keys(d).filter(k => k !== 'timestamp'))));
  const rxColors = ['#EF4444', '#F43F5E', '#E11D48']; // Red shades for Rx errors
  const txColors = ['#F97316', '#F59E0B', '#D97706']; // Orange shades for Tx errors

  if (loadingRx || loadingTx) {
    return <div className="flex items-center justify-center h-64 text-textMuted">{t('dashboard.refreshing')}</div>;
  }

  return (
    <div className="card col-span-1">
      <div className="relative group inline-flex items-center mb-4 cursor-help">
        <h3 className="text-lg font-semibold text-textPrimary border-b border-dashed border-slate-600">
          {t('metrics.networkErrors')}
        </h3>
        <div className="absolute left-0 top-full mt-2 w-72 p-3 bg-[#0F172A] border border-[#1E293B] rounded-lg shadow-xl text-sm text-[#F8FAFC] opacity-0 group-hover:opacity-100 transition-opacity z-[1000] pointer-events-none">
          {t('descriptions.networkErrors')}
        </div>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={mergedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
              formatter={(value: any) => [Number(value).toFixed(2)]}
            />
            <Legend verticalAlign="bottom" align="center" />
            {interfaces.map((device, idx) => [
              <Area 
                key={`rx-${device}`}
                type="monotone" 
                dataKey={`${device}_rx`} 
                name={`${device} (Rx)`}
                stackId="1"
                stroke={rxColors[idx % rxColors.length]} 
                fill={rxColors[idx % rxColors.length]} 
              />,
              <Area 
                key={`tx-${device}`}
                type="monotone" 
                dataKey={`${device}_tx`} 
                name={`${device} (Tx)`}
                stackId="1"
                stroke={txColors[idx % txColors.length]} 
                fill={txColors[idx % txColors.length]} 
              />
            ])}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
