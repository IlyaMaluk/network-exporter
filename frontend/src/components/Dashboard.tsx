import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { NetworkRxChart } from './charts/NetworkRxChart';
import { NetworkTxChart } from './charts/NetworkTxChart';
import { NetworkErrorsChart } from './charts/NetworkErrorsChart';
import { TcpIpStackChart } from './charts/TcpIpStackChart';
import { TcpRetransmitsChart } from './charts/TcpRetransmitsChart';
import { SocketStatesChart } from './charts/SocketStatesChart';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Activity, X, ChevronDown, Filter } from 'lucide-react';
import { instantQuery } from '../lib/prometheus';
import { SummaryCards } from './SummaryCards';

export const Dashboard = () => {
  const { t } = useTranslation();
  const [selectedInterfaces, setSelectedInterfaces] = useState<string[]>(['eth0', 'lo']);
  const [availableInterfaces, setAvailableInterfaces] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchInterfaces = async () => {
      const results = await instantQuery('count by (interface) (node_network_receive_bytes_total)');
      const interfaces = results.map((r: any) => r.metric.interface).filter(Boolean);
      if (interfaces.length > 0) {
        setAvailableInterfaces(interfaces);
      } else {
        setAvailableInterfaces(['eth0', 'lo', 'wlan0', 'docker0']);
      }
    };
    fetchInterfaces();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleInterface = (iface: string) => {
    setSelectedInterfaces(prev =>
      prev.includes(iface)
        ? prev.filter(i => i !== iface)
        : [...prev, iface]
    );
  };

  const removeInterface = (iface: string) => {
    setSelectedInterfaces(prev => prev.filter(i => i !== iface));
  };

  return (
    <div className="min-h-screen p-6 md:p-8 lg:p-10 max-w-[1600px] mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg text-primary">
            <Activity size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-textPrimary tracking-tight">
              {t('dashboard.title')}
            </h1>
            <p className="text-textMuted text-sm mt-1">
              Real-time monitoring and analytics
            </p>
          </div>
        </div>
        <LanguageSwitcher />
      </header>

      <SummaryCards />

      <div className="relative z-10 mb-6 p-4 bg-slate-800 rounded-xl border border-slate-700 flex flex-col md:flex-row gap-4 items-start md:items-center shadow-sm">
        <div className="flex items-center gap-2 text-slate-400">
          <Filter size={20} />
          <span className="font-medium text-sm text-white">{t('dashboard.interfaces')}</span>
        </div>

        <div className="flex flex-wrap gap-2 flex-grow">
          {selectedInterfaces.map(iface => (
            <div key={iface} className="flex items-center gap-1 bg-slate-700 text-white px-3 py-1.5 rounded-full text-sm border border-slate-600 shadow-sm">
              <span>{iface}</span>
              <button onClick={() => removeInterface(iface)} className="hover:text-red-400 transition-colors">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm border border-slate-600 transition-colors shadow-sm"
          >
            <span>{t('dashboard.addInterface')}</span>
            <ChevronDown size={16} />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="max-h-60 overflow-y-auto p-1">
                {availableInterfaces.map(iface => {
                  const isSelected = selectedInterfaces.includes(iface);
                  return (
                    <button
                      key={iface}
                      onClick={() => toggleInterface(iface)}
                      className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between ${isSelected ? 'bg-primary/20 text-primary' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                    >
                      <span>{iface}</span>
                      {isSelected && <X size={14} />}
                    </button>
                  );
                })}
                {availableInterfaces.length === 0 && (
                  <div className="px-3 py-2 text-sm text-slate-400 text-center">{t('dashboard.loading')}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <main className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <NetworkRxChart selectedInterfaces={selectedInterfaces} />
        <NetworkTxChart selectedInterfaces={selectedInterfaces} />
        <NetworkErrorsChart selectedInterfaces={selectedInterfaces} />
        <TcpIpStackChart />
        <TcpRetransmitsChart />
        <SocketStatesChart />
      </main>
    </div>
  );
};
