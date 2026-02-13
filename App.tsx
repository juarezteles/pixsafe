
import React, { useState, useEffect } from 'react';
import { generateSHA256, calculateRisk, isValidPixKey } from './utils/hash';
import { pixService } from './services/supabase';
import { RiskAnalysis, RiskLevel, ScamCategory } from './types';
import LGPDBanner from './components/LGPDBanner';
import RiskDisplay from './components/RiskDisplay';

const App: React.FC = () => {
  const [pixKey, setPixKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RiskAnalysis | null>(null);
  const [error, setError] = useState('');
  const [showReportForm, setShowReportForm] = useState(false);

  const [reportKey, setReportKey] = useState('');
  const [category, setCategory] = useState<ScamCategory>(ScamCategory.PHISHING);
  const [hasPoliceReport, setHasPoliceReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  useEffect(() => {
    if (showReportForm && !reportKey) {
      setReportKey(pixKey);
    }
  }, [showReportForm, pixKey]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pixKey) return;

    setError('');
    setShowReportForm(false);
    
    if (!isValidPixKey(pixKey)) {
      setError('Formato de chave Pix inválido. Use CPF, E-mail, Celular ou Chave Aleatória.');
      return;
    }
    
    setLoading(true);
    setResult(null);

    try {
      const hash = await generateSHA256(pixKey);
      const { testRecord, dbRecords } = await pixService.getReportsByHash(hash);
      
      if (testRecord) {
        const isPerigo = testRecord.status === 'perigo';
        const level = isPerigo ? RiskLevel.CRITICAL : RiskLevel.MEDIUM;
        const score = isPerigo ? 100 : 40;
        
        setResult({
          hash,
          score,
          reportCount: Math.max(isPerigo ? 5 : 2, dbRecords.length),
          policeReportCount: Math.max(isPerigo ? 5 : 0, dbRecords.filter(r => r.has_bo).length),
          level,
          motivo: testRecord.motivo
        });
      } else if (dbRecords.length > 0) {
        const policeReportCount = dbRecords.filter(r => r.has_bo).length;
        const { level, score } = calculateRisk(dbRecords.length, policeReportCount);

        setResult({
          hash,
          score,
          reportCount: dbRecords.length,
          policeReportCount,
          level: level as RiskLevel
        });
      } else {
        setResult({
          hash,
          score: 0,
          reportCount: 0,
          policeReportCount: 0,
          level: RiskLevel.SAFE
        });
      }
    } catch (err) {
      setError('Erro de conexão com o servidor de segurança.');
    } finally {
      setLoading(false);
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportKey) return;
    setError('');

    if (!isValidPixKey(reportKey)) {
      setError('Formato de chave Pix inválido para denúncia.');
      return;
    }

    setLoading(true);
    try {
      const hash = await generateSHA256(reportKey);
      await pixService.createReport(hash, category, hasPoliceReport);
      setReportSuccess(true);
      setReportKey(''); 
      
      // Retorna automaticamente para a tela de consulta após sucesso
      setTimeout(() => {
        setReportSuccess(false);
        setShowReportForm(false);
        setResult(null);
        setPixKey('');
      }, 2500);
    } catch (err: any) {
      setError(`Erro ao salvar denúncia: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const backToSearch = () => {
    setShowReportForm(false);
    setReportSuccess(false);
    setError('');
  };

  // Helper para definir cores do botão de denúncia baseadas no nível de risco atual
  const getRiskButtonStyles = (level: RiskLevel) => {
    switch (level) {
      case RiskLevel.HIGH:
      case RiskLevel.CRITICAL:
        return 'bg-red-100 border-red-200 hover:bg-red-200';
      default:
        return 'bg-amber-100 border-amber-200 hover:bg-amber-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4">
      <div className="w-full max-w-2xl mt-12 mb-8 flex flex-col items-center">
        <div className="flex items-center space-x-2 mb-2">
          <div className="bg-blue-600 text-white p-2 rounded-lg shadow-lg cursor-pointer" onClick={backToSearch}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight cursor-pointer" onClick={backToSearch}>
            Pix<span className="text-blue-600">Safe</span>
          </h1>
        </div>
        <p className="text-slate-500 font-medium text-center">Proteção comunitária contra golpes financeiros.</p>
      </div>

      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden transition-all">
        <div className="p-8">
          {!showReportForm && <LGPDBanner />}

          <div className="animate-in fade-in duration-500">
            {!showReportForm ? (
              <>
                <form onSubmit={handleSearch} className="relative">
                  <input
                    type="text"
                    placeholder="Insira a chave Pix para consulta"
                    value={pixKey}
                    autoFocus
                    onChange={(e) => setPixKey(e.target.value)}
                    className="w-full pl-12 pr-4 py-5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-semibold text-lg text-slate-800"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <button 
                    type="submit"
                    disabled={loading || !pixKey}
                    className="mt-5 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-black text-sm uppercase tracking-widest py-5 px-6 rounded-2xl shadow-lg transition-all flex justify-center items-center active:scale-[0.98]"
                  >
                    {loading ? <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Verificar Agora'}
                  </button>
                </form>

                {error && <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl text-center font-bold text-sm border border-red-100">{error}</div>}

                {result && (
                  <div className="mt-6 space-y-6 animate-in slide-in-from-top-4 duration-500">
                    <RiskDisplay analysis={result} />
                    
                    <div className="flex flex-col items-center">
                      {result.level === RiskLevel.SAFE ? (
                        <div className="text-center p-6 bg-emerald-50 rounded-2xl border border-emerald-100 w-full">
                          <p className="text-black font-medium mb-4">
                            Nada foi encontrado. Esta chave ainda não possui registros de irregularidades até o momento.
                          </p>
                          <button
                            onClick={() => setShowReportForm(true)}
                            className="bg-white text-red-600 border border-red-200 hover:bg-red-50 px-6 py-3 rounded-xl font-bold transition-all shadow-sm active:scale-[0.98]"
                          >
                            Quero Denunciar Este Pix
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowReportForm(true)}
                          className={`w-full ${getRiskButtonStyles(result.level)} border px-6 py-4 rounded-xl font-bold transition-all shadow-md flex items-center justify-center space-x-2 active:scale-[0.98] text-sm`}
                        >
                          <span className="flex-shrink-0">⚠️</span>
                          <span className="text-black">
                            fui vítima desta chave <span className="text-red-600 uppercase font-black">DENUNCIAR</span>
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="animate-in slide-in-from-right-4 duration-500">
                <div className="flex items-center mb-6">
                  <button 
                    onClick={backToSearch}
                    className="text-slate-500 hover:text-slate-800 flex items-center space-x-2 font-black text-xs uppercase tracking-tighter"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>Cancelar</span>
                  </button>
                </div>

                {reportSuccess ? (
                  <div className="text-center py-12 bg-green-50 rounded-2xl border border-green-100">
                    <div className="inline-flex items-center justify-center h-16 w-16 bg-green-100 text-green-600 rounded-full mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 mb-2">Denúncia Registrada!</h3>
                    <p className="text-slate-600 font-medium">Sua contribuição ajuda a manter a comunidade segura.</p>
                  </div>
                ) : (
                  <form onSubmit={handleReport} className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Chave Pix denunciada</label>
                      <input
                        type="text"
                        required
                        placeholder="Confirmar Chave"
                        value={reportKey}
                        autoFocus
                        onChange={(e) => setReportKey(e.target.value)}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-semibold text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Tipo de ocorrência</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as ScamCategory)}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-semibold cursor-pointer text-slate-800"
                      >
                        {Object.values(ScamCategory).map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div 
                      className="flex items-center space-x-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 group cursor-pointer active:scale-[0.99] transition-all hover:bg-slate-100/50" 
                      onClick={() => setHasPoliceReport(!hasPoliceReport)}
                    >
                      <div className={`w-6 h-6 border-2 border-black rounded flex items-center justify-center transition-colors bg-white shadow-sm`}>
                        {hasPoliceReport && (
                          <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <label className="text-sm font-black text-slate-700 select-none cursor-pointer">
                        Possuo Boletim de Ocorrência (B.O.)
                      </label>
                    </div>

                    {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-center font-bold text-sm border border-red-100">{error}</div>}

                    <button
                      type="submit"
                      disabled={loading || !reportKey}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-black uppercase tracking-widest py-5 rounded-2xl transition-all shadow-xl active:scale-[0.98]"
                    >
                      {loading ? <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Confirmar Denúncia'}
                    </button>

                    <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 text-center shadow-inner">
                      <p className="text-amber-800 text-[11px] font-bold leading-relaxed">
                        <span className="text-amber-600 mr-1">💡</span> 
                        Nota Importante: Denúncias com número de Boletim de Ocorrência (B.O.) têm peso maior na análise de risco.
                      </p>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="mt-12 text-slate-400 text-[10px] text-center pb-12 font-bold uppercase tracking-widest leading-loose">
        <p>© 2024 PixSafe Security • Consultar & Proteger</p>
        <p>Segurança coletiva em conformidade com a LGPD</p>
      </footer>
    </div>
  );
};

export default App;
