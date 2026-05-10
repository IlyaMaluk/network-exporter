import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Upload, Activity, AlertTriangle } from 'lucide-react';
import { instantQuery } from '../lib/prometheus';

interface KpiData {
  rxSpeed: number;
  txSpeed: number;
  activeSockets: number;
  tcpRetransmits: number;
}

export const SummaryCards = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<KpiData>({
    rxSpeed: 0,
    txSpeed: 0,
    activeSockets: 0,
    tcpRetransmits: 0,
  });

  useEffect(() => {
    const fetchKpis = async () => {
      try {
        const [rxRes, txRes, socketsRes, tcpRes] = await Promise.all([
          instantQuery('sum(rate(node_network_receive_bytes_total[1m]))'),
          instantQuery('sum(rate(node_network_transmit_bytes_total[1m]))'),
          instantQuery('node_tcp_sockets_inuse'),
          instantQuery('sum(rate(node_tcp_retransmit_total[30s]))')
        ]);

        const parseResult = (res: any[]) => {
          if (res && res.length > 0 && res[0].value) {
            return parseFloat(res[0].value[1]) || 0;
          }
          return 0;
        };

        setData({
          rxSpeed: parseResult(rxRes),
          txSpeed: parseResult(txRes),
          activeSockets: parseResult(socketsRes),
          tcpRetransmits: parseResult(tcpRes)
        });
      } catch (error) {
        console.error('Failed to fetch KPIs', error);
      }
    };

    fetchKpis();
    const interval = setInterval(fetchKpis, 15000);
    return () => clearInterval(interval);
  }, []);

  const formatSpeed = (bytesPerSec: number) => {
    if (bytesPerSec >= 1024 * 1024) {
      return `${(bytesPerSec / (1024 * 1024)).toFixed(2)} MB/s`;
    }
    return `${(bytesPerSec / 1024).toFixed(2)} KB/s`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 shadow-sm flex items-center gap-4 hover:bg-slate-700 transition-colors">
        <div className="p-3 bg-green-500/20 rounded-lg text-green-500">
          <Download size={24} />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-400">{t('metrics.totalRxSpeed')}</p>
          <p className="text-2xl font-bold text-white">{formatSpeed(data.rxSpeed)}</p>
        </div>
      </div>
      
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 shadow-sm flex items-center gap-4 hover:bg-slate-700 transition-colors">
        <div className="p-3 bg-blue-500/20 rounded-lg text-blue-500">
          <Upload size={24} />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-400">{t('metrics.totalTxSpeed')}</p>
          <p className="text-2xl font-bold text-white">{formatSpeed(data.txSpeed)}</p>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 shadow-sm flex items-center gap-4 hover:bg-slate-700 transition-colors">
        <div className="p-3 bg-purple-500/20 rounded-lg text-purple-500">
          <Activity size={24} />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-400">{t('metrics.activeSockets')}</p>
          <p className="text-2xl font-bold text-white">{Math.round(data.activeSockets)}</p>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 shadow-sm flex items-center gap-4 hover:bg-slate-700 transition-colors">
        <div className="p-3 bg-red-500/20 rounded-lg text-red-500">
          <AlertTriangle size={24} />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-400">{t('metrics.tcpRetransmitsSummary')}</p>
          <p className="text-2xl font-bold text-white">{data.tcpRetransmits.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};
