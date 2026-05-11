import React from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  text: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ text }) => {
  return (
    <div className="relative group inline-flex items-center ml-2">
      <Info size={16} className="text-slate-400 hover:text-blue-400 transition-colors cursor-help" />
      <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 w-64 p-3 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl text-xs text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity z-[9999] pointer-events-none backdrop-blur-sm bg-opacity-95 leading-relaxed">
        {text}
        {/* Tooltip Arrow */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-8 border-transparent border-t-slate-900"></div>
      </div>
    </div>
  );
};
