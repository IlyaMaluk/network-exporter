import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

// Context
import { DashboardProvider, useDashboard, REFRESH_OPTIONS } from '../context/DashboardContext';

// Utility
import { instantQuery } from '../lib/prometheus';

// Layout components
import { LanguageSwitcher } from './LanguageSwitcher';
import { SummaryCards } from './SummaryCards';

// Row 1 – eBPF
import { TcpDropsChart } from './charts/TcpDropsChart';
import { TcpRetransmitsChart } from './charts/TcpRetransmitsChart';

// Row 2 – Interface Health
import { NetworkRxChart } from './charts/NetworkRxChart';
import { NetworkTxChart } from './charts/NetworkTxChart';
import { NetworkErrorsChart } from './charts/NetworkErrorsChart';

// Row 3 – Conntrack & TCP
import { ConntrackGauge } from './charts/ConntrackGauge';
import { TcpIpStackChart } from './charts/TcpIpStackChart';
import { TcpRetransSegmentsChart } from './charts/TcpRetransSegmentsChart';
import { TcpMemoryStatCard } from './charts/TcpMemoryStatCard';

// Row 4 – Sockets
import { SocketsStatPanel } from './charts/SocketsStatPanel';

// Row 5 – UDP & ICMP
import { UdpTrafficChart } from './charts/UdpTrafficChart';
import { UdpStatsPanel } from './charts/UdpStatsPanel';
import { IcmpTrafficChart } from './charts/IcmpTrafficChart';
import { IcmpStatsPanel } from './charts/IcmpStatsPanel';

// Icons
import {
  Activity, X, ChevronDown, Filter,
  RefreshCw, Zap, Pause, Play,
} from 'lucide-react';

// Time picker
import { TimeRangePicker } from './TimeRangePicker';

// ─── Section row header ────────────────────────────────────────────────────────
const SectionRow = ({ emoji, title, children, isFeatured }: { emoji: string; title: string; children: React.ReactNode, isFeatured?: boolean }) => (
  <section className={`mb-10 p-6 rounded-2xl transition-all ${isFeatured ? 'bg-indigo-500/5 border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.05)]' : ''}`}>
    <div className="flex items-center gap-3 mb-6">
      <span className="text-2xl">{emoji}</span>
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-[0.2em]">{title}</h2>
          {isFeatured && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500 text-white uppercase tracking-wider animate-pulse">
              Core Feature
            </span>
          )}
        </div>
        <div className="h-1 w-12 bg-indigo-500/50 mt-1 rounded-full" />
      </div>
      <div className="flex-grow h-px bg-slate-700/50 ml-4" />
    </div>
    {children}
  </section>
);

// ─── Global Controls Bar ───────────────────────────────────────────────────────
const GlobalControls = () => {
  const { t } = useTranslation();
  const { refreshInterval, setRefreshInterval, manualRefresh, isPaused, togglePause } = useDashboard();
  const [spinning, setSpinning] = useState(false);

  const handleRefresh = () => {
    setSpinning(true);
    manualRefresh();
    setTimeout(() => setSpinning(false), 700);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6 p-3 bg-slate-800/60 rounded-xl border border-slate-700">
      {/* Advanced time range picker */}
      <TimeRangePicker />

      <div className="h-5 w-px bg-slate-600" />

      {/* Live / Pause toggle */}
      <button
        onClick={togglePause}
        title={isPaused ? t('common.resume') : t('common.freeze')}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${isPaused
          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
          }`}
      >
        {isPaused
          ? <><Play size={13} className="fill-amber-300" />  {t('common.live')}</>
          : <><Pause size={13} className="fill-emerald-400" /> {t('common.live')}</>}
      </button>

      <div className="h-5 w-px bg-slate-600" />

      {/* Auto-refresh */}
      <div className="flex items-center gap-2">
        <Zap size={16} className="text-slate-400" />
        <span className="text-xs text-slate-400 font-medium">{t('common.auto')}</span>
        <div className="flex gap-1">
          {REFRESH_OPTIONS.map(opt => (
            <button
              key={opt.seconds}
              onClick={() => setRefreshInterval(opt.seconds)}
              disabled={isPaused}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${refreshInterval === opt.seconds && !isPaused
                ? 'bg-primary/20 text-primary border border-primary/40'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
            >
              {opt.seconds === 0 ? t('common.off') : opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-5 w-px bg-slate-600" />

      {/* Manual refresh */}
      <button
        onClick={handleRefresh}
        className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-lg text-xs font-medium border border-primary/30 transition-colors"
      >
        <RefreshCw size={14} className={spinning ? 'animate-spin' : ''} />
        {t('common.refresh_now')}
      </button>
    </div>
  );
};

// ─── Interface Filter Bar ──────────────────────────────────────────────────────
interface InterfaceFilterProps {
  selectedInterfaces: string[];
  availableInterfaces: string[];
  onToggle: (iface: string) => void;
  onRemove: (iface: string) => void;
}

const InterfaceFilter = ({ selectedInterfaces, availableInterfaces, onToggle, onRemove }: InterfaceFilterProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative z-10 mb-6 p-4 bg-slate-800 rounded-xl border border-slate-700 flex flex-col md:flex-row gap-4 items-start md:items-center shadow-sm">
      <div className="flex items-center gap-2 text-slate-400">
        <Filter size={20} />
        <span className="font-medium text-sm text-white">{t('common.interfaces')}</span>
      </div>

      <div className="flex flex-wrap gap-2 flex-grow">
        {selectedInterfaces.map(iface => (
          <div key={iface} className="flex items-center gap-1 bg-slate-700 text-white px-3 py-1.5 rounded-full text-sm border border-slate-600 shadow-sm">
            <span>{iface}</span>
            <button onClick={() => onRemove(iface)} className="hover:text-red-400 transition-colors">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm border border-slate-600 transition-colors shadow-sm"
        >
          <span>{t('dashboard.addInterface')}</span>
          <ChevronDown size={16} />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
              {availableInterfaces.map(iface => {
                const isSelected = selectedInterfaces.includes(iface);
                return (
                  <button
                    key={iface}
                    onClick={() => onToggle(iface)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between ${isSelected ? 'bg-primary/20 text-primary' : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                      }`}
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
  );
};

// ─── Inner dashboard (needs context) ──────────────────────────────────────────
const DashboardInner = () => {
  const { t } = useTranslation();
  const [selectedInterfaces, setSelectedInterfaces] = useState<string[]>(['eth0', 'lo']);
  const [availableInterfaces, setAvailableInterfaces] = useState<string[]>([]);

  useEffect(() => {
    instantQuery('count by (interface) (node_network_receive_bytes_total)').then(results => {
      const ifaces = results.map((r: any) => r.metric.interface).filter(Boolean);
      setAvailableInterfaces(ifaces.length > 0 ? ifaces : ['eth0', 'lo', 'wlan0', 'docker0']);
    });
  }, []);

  const toggleInterface = (iface: string) =>
    setSelectedInterfaces(prev => prev.includes(iface) ? prev.filter(i => i !== iface) : [...prev, iface]);

  const removeInterface = (iface: string) =>
    setSelectedInterfaces(prev => prev.filter(i => i !== iface));

  return (
    <div className="min-h-screen p-6 md:p-8 lg:p-10 max-w-[1800px] mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg text-primary">
            <Activity size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-textPrimary tracking-tight">
              {t('dashboard.title')}
            </h1>
            <p className="text-textMuted text-sm mt-1">{t('common.monitoring_desc')}</p>
          </div>
        </div>
        <LanguageSwitcher />
      </header>

      {/* KPI Summary */}
      <SummaryCards />

      {/* Global Controls */}
      <GlobalControls />

      {/* Interface Filter */}
      <InterfaceFilter
        selectedInterfaces={selectedInterfaces}
        availableInterfaces={availableInterfaces}
        onToggle={toggleInterface}
        onRemove={removeInterface}
      />

      {/* ── Row 1: Interface Health & Traffic ───────────────────────────────── */}
      <SectionRow emoji="📊" title={t('sections.traffic')}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <NetworkRxChart selectedInterfaces={selectedInterfaces} />
          <NetworkTxChart selectedInterfaces={selectedInterfaces} />
        </div>
      </SectionRow>

      {/* ── Row 2: Network Errors ───────────────────────────────────────────── */}
      <SectionRow emoji="⚠️" title={t('sections.errors')}>
        <div className="grid grid-cols-1 gap-6">
          <NetworkErrorsChart selectedInterfaces={selectedInterfaces} />
        </div>
      </SectionRow>

      {/* ── Row 3: Conntrack & TCP Subsystem ────────────────────────────────── */}
      <SectionRow emoji="🔗" title={t('sections.stack')}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <ConntrackGauge />
          <TcpIpStackChart />
          <TcpRetransSegmentsChart />
          <TcpMemoryStatCard />
        </div>
      </SectionRow>

      {/* ── Row 4: Sockets Overview ─────────────────────────────────────────── */}
      <SectionRow emoji="🧮" title={t('sections.sockets')}>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          <SocketsStatPanel />
          <div className="col-span-2 md:col-span-1 xl:col-span-4 h-full flex items-center">
            {/* Dynamic content or just padding */}
          </div>
        </div>
      </SectionRow>

      {/* ── Row 5: UDP & ICMP Statistics ────────────────────────────────────── */}
      <SectionRow emoji="🛠️" title={t('sections.udpIcmp')}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <UdpTrafficChart />
          <div className="grid grid-cols-3 gap-4 col-span-1">
            <UdpStatsPanel />
          </div>
          <IcmpTrafficChart />
          <div className="grid grid-cols-2 gap-4 col-span-1">
            <IcmpStatsPanel />
          </div>
        </div>
      </SectionRow>

      {/* ── Row 6: eBPF Network Insights (Grand Finale) ────────────────────── */}
      <SectionRow emoji="🌟" title={t('sections.ebpf')} isFeatured>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TcpDropsChart />
          <TcpRetransmitsChart />
        </div>
      </SectionRow>
    </div>
  );
};

// ─── Root export — wraps everything in the provider ───────────────────────────
export const Dashboard = () => {
  return (
    <DashboardProvider>
      <DashboardInner />
    </DashboardProvider>
  );
};
