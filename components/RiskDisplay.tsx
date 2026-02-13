
import React from 'react';
import { RiskAnalysis, RiskLevel } from '../types';

interface RiskDisplayProps {
  analysis: RiskAnalysis;
}

const RiskDisplay: React.FC<RiskDisplayProps> = ({ analysis }) => {
  const getLevelStyles = (level: RiskLevel) => {
    switch (level) {
      case RiskLevel.SAFE:
        return { 
          color: 'text-emerald-600', 
          bg: 'bg-emerald-100', 
          border: 'border-emerald-200',
          label: 'Sem Registros', 
          icon: '🛡️',
          desc: 'Chave sem histórico de denúncias no sistema.'
        };
      case RiskLevel.LOW:
      case RiskLevel.MEDIUM:
        return { 
          color: 'text-amber-600', 
          bg: 'bg-amber-100', 
          border: 'border-amber-200',
          label: 'Atenção', 
          icon: '⚠️',
          desc: analysis.motivo || 'Esta chave possui denúncias recentes e deve ser tratada com cuidado.'
        };
      case RiskLevel.HIGH:
      case RiskLevel.CRITICAL:
        return { 
          color: 'text-red-600', 
          bg: 'bg-red-100', 
          border: 'border-red-200',
          label: 'Risco Detectado', 
          icon: '🛑',
          desc: analysis.motivo || 'Esta chave está vinculada a múltiplas denúncias de fraude.'
        };
    }
  };

  const styles = getLevelStyles(analysis.level);

  return (
    <div className={`p-5 bg-white border ${styles.border} rounded-2xl shadow-sm transition-all animate-in zoom-in-95 duration-300 w-full`}>
      <div className="flex flex-row items-center justify-between mb-5 gap-2">
        <div className="flex items-center space-x-2 min-w-0 overflow-hidden">
          <span className="text-2xl flex-shrink-0">{styles.icon}</span>
          <div className="min-w-0">
            <h3 className={`text-base font-black leading-tight truncate ${styles.color}`}>{styles.label}</h3>
            <p className="text-slate-500 text-[8px] sm:text-[9px] font-bold uppercase tracking-tight truncate">{styles.desc}</p>
          </div>
        </div>
        <div className={`flex-shrink-0 px-2 py-1 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-tighter whitespace-nowrap ${styles.bg} ${styles.color} border border-current/10`}>
          Índice: {analysis.score}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <p className="text-slate-400 text-[8px] uppercase font-bold tracking-wider mb-1">Denúncias</p>
          <p className="text-xl font-black text-slate-700">{analysis.reportCount}</p>
        </div>
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <p className="text-slate-400 text-[8px] uppercase font-bold tracking-wider mb-1">B.O. Confirmados</p>
          <p className="text-xl font-black text-slate-700">{analysis.policeReportCount}</p>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
        <p className="text-[8px] font-mono text-slate-400 truncate max-w-[85%]">
          <span className="font-bold">HASH:</span> {analysis.hash}
        </p>
        <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${analysis.level === RiskLevel.SAFE ? 'bg-emerald-400' : 'bg-red-400 animate-pulse'}`}></div>
      </div>
    </div>
  );
};

export default RiskDisplay;
