
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { FinancialData, INITIAL_DATA, CustomSection } from './types';
import { loadData, saveToLocal, saveToCloud, subscribeToData, getLocalTimestamp } from './services/dataService';
import { Dashboard } from './components/Dashboard';
import { IncomeModule, FixedExpenseModule, InstallmentModule, CreditCardModule, PixModule, CustomSectionModule, RadarModule, DreamsModule } from './components/Modules';
import { RefreshCw, Plus, Cloud, TrendingUp, TrendingDown, ShieldCheck, Star, Calendar } from 'lucide-react';
import { DraggableModuleWrapper } from './components/ui/UIComponents';

// Gerador de ID persistente para simular "conta" sem login obrigatório
const getPersistentUserId = () => {
  let id = localStorage.getItem('fincontroller_user_id');
  if (!id) {
    id = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('fincontroller_user_id', id);
  }
  return id;
};

const BottomMobileNav = ({ balance, onScrollTo, onOpenDreams }: { balance: number, onScrollTo: (id: string) => void, onOpenDreams: () => void }) => {
  const fmt = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] sm:hidden bg-neon-dark/95 backdrop-blur-xl border-t border-white/10 px-4 py-3 flex items-center justify-between gap-2 shadow-[0_-10px_30px_rgba(0,0,0,0.6)]">
      <button onClick={() => onScrollTo('section-incomes')} className="flex flex-col items-center gap-1 text-neon-green/60 hover:text-neon-green transition-colors active:scale-90">
        <TrendingUp size={16} />
        <span className="text-[6px] font-black uppercase tracking-tighter">Entradas</span>
      </button>
      <button onClick={onOpenDreams} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-gradient-to-br from-neon-blue to-neon-pink shadow-lg shadow-neon-blue/20 transform active:scale-95 transition-all">
        <Star size={16} className="text-white" />
        <span className="text-[6px] font-black text-white uppercase tracking-tighter">Dreams</span>
      </button>
      <div className="flex flex-col items-center bg-black/70 border border-neon-yellow/30 px-3 py-1 rounded-2xl shadow-[0_0_15px_rgba(255,230,0,0.1)]">
        <span className="text-[6px] text-slate-500 font-black uppercase mb-0.5">Saldo</span>
        <span className={`text-[10px] font-black tracking-tight ${balance >= 0 ? 'text-neon-yellow' : 'text-neon-red'}`}>
          {fmt(balance)}
        </span>
      </div>
      <button onClick={() => onScrollTo('section-fixed')} className="flex flex-col items-center gap-1 text-neon-red/60 hover:text-neon-red transition-colors active:scale-90">
        <TrendingDown size={16} />
        <span className="text-[6px] font-black uppercase tracking-tighter">Saídas</span>
      </button>
    </div>
  );
};

function App() {
  const [userId] = useState(getPersistentUserId());
  const [data, setData] = useState<FinancialData>(INITIAL_DATA);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showDreams, setShowDreams] = useState(false);
  
  const isInternalUpdate = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const updateLockRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastUpdateRef = useRef<number>(0);

  const normalizeData = (d: FinancialData) => {
    if (!d) return INITIAL_DATA;
    const clean = { ...INITIAL_DATA, ...d };
    if (!clean.modulesOrder || clean.modulesOrder.length === 0) {
      const customIds = clean.customSections?.map(s => s.id) || [];
      clean.modulesOrder = ['fixed', 'installments', ...customIds];
    }
    if (!clean.incomeModulesOrder || clean.incomeModulesOrder.length === 0) {
      const customIds = clean.customSections?.filter(s => s.type === 'income').map(s => s.id) || [];
      clean.incomeModulesOrder = ['incomes', ...customIds];
    }
    return clean;
  };

  const syncToCloud = useCallback((targetData: FinancialData, immediate = false) => {
    setIsSyncing(true);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    const performSync = async () => {
      try {
        await saveToCloud(userId, targetData);
        setIsSyncing(false);
      } catch (err) {
        console.error("Cloud sync failed:", err);
        setIsSyncing(false);
      }
    };
    if (immediate) performSync();
    else saveTimeoutRef.current = setTimeout(performSync, 2000);
  }, [userId]);

  const handleUpdate = useCallback((newDataOrUpdater: FinancialData | ((prev: FinancialData) => FinancialData), immediate = false) => {
    const now = Date.now();
    lastUpdateRef.current = now;
    isInternalUpdate.current = true;
    if (updateLockRef.current) clearTimeout(updateLockRef.current);
    updateLockRef.current = setTimeout(() => { isInternalUpdate.current = false; }, 3000);

    setData(prev => {
      const next = typeof newDataOrUpdater === 'function' ? newDataOrUpdater(prev) : newDataOrUpdater;
      const nextWithTimestamp = { ...next, lastUpdate: now };
      saveToLocal(userId, nextWithTimestamp);
      syncToCloud(nextWithTimestamp, immediate);
      return nextWithTimestamp;
    });
  }, [userId, syncToCloud]);

  useEffect(() => {
    let unsubscribeData: () => void = () => {};
    (async () => {
      const initialData = await loadData(userId);
      const normalized = normalizeData(initialData);
      lastUpdateRef.current = normalized.lastUpdate || 0;
      setData(normalized);
      unsubscribeData = subscribeToData(userId, (cloudData) => {
        const cloudTimestamp = (cloudData as any).lastUpdate || 0;
        const localTimestamp = getLocalTimestamp(userId);
        if (!isInternalUpdate.current && cloudTimestamp > localTimestamp) {
          lastUpdateRef.current = cloudTimestamp;
          setData(normalizeData(cloudData));
          setIsSyncing(false);
        }
      });
      setTimeout(() => setLoading(false), 1500);
    })();
    return () => unsubscribeData();
  }, [userId]);

  const createNewSection = (type: 'income' | 'expense') => {
    const title = prompt(`Nome da sessão de ${type === 'income' ? 'Entrada' : 'Saída'}?`);
    if (!title) return;
    const newSectionId = Math.random().toString(36).substr(2, 9);
    const newSection: CustomSection = {
      id: newSectionId, title: title.toUpperCase(), items: [], type: type, structure: type === 'expense' ? 'installment' : 'standard'
    };
    handleUpdate(prev => {
      const sections = prev.customSections || [];
      const updatedData = { ...prev, customSections: [...sections, newSection] };
      if (type === 'expense') updatedData.modulesOrder = [...(prev.modulesOrder || ['fixed', 'installments']), newSectionId];
      else updatedData.incomeModulesOrder = [...(prev.incomeModulesOrder || ['incomes']), newSectionId];
      return updatedData;
    }, true);
  };

  const deleteSection = (id: string) => {
    if(confirm("Deseja apagar esta sessão inteira?")) {
      handleUpdate(prev => ({
        ...prev, 
        customSections: (prev.customSections || []).filter(s => s.id !== id),
        modulesOrder: (prev.modulesOrder || []).filter(oid => oid !== id),
        incomeModulesOrder: (prev.incomeModulesOrder || []).filter(oid => oid !== id)
      }), true);
    }
  };

  const updateSection = (updatedSection: CustomSection, immediate = false) => {
    handleUpdate(prev => ({ ...prev, customSections: (prev.customSections || []).map(s => s.id === updatedSection.id ? updatedSection : s) }), immediate);
  };

  const scrollToId = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({ top: element.getBoundingClientRect().top - 80, behavior: 'smooth' });
    }
  };

  const calculateBalance = () => {
    const baseInc = data.incomes.filter(i => i.isActive !== false).reduce((a, c) => a + c.value, 0);
    const customInc = data.customSections?.filter(s => s.type === 'income').reduce((a, s) => a + s.items.filter(i => i.isActive !== false).reduce((ia, i) => ia + i.value, 0), 0) || 0;
    const fixedExp = data.fixedExpenses.filter(e => e.isActive !== false).reduce((a, c) => a + (c.value - (c.paidAmount || 0)), 0);
    const instExp = data.installments.filter(e => e.isActive !== false).reduce((a, c) => a + (c.monthlyValue - (c.paidAmount || 0)), 0);
    const customExp = data.customSections?.filter(s => s.type === 'expense').reduce((a, s) => a + s.items.filter(i => i.isActive !== false).reduce((ia, i) => ia + (i.value - (i.paidAmount || 0)), 0), 0) || 0;
    return (baseInc + customInc) - (fixedExp + instExp + customExp);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-5 pointer-events-none"></div>
        <div className="relative mb-14 animate-pulse">
          <div className="p-8 bg-neon-blue/5 rounded-[3rem] border-2 border-neon-blue/40 shadow-[0_0_60px_rgba(0,243,255,0.2)]">
            <ShieldCheck className="text-neon-blue w-24 h-24 sm:w-32 sm:h-32" strokeWidth={1} />
          </div>
          <div className="absolute -bottom-3 -right-3 bg-black p-2 rounded-full border border-neon-blue/50">
            <RefreshCw className="animate-spin text-neon-blue w-6 h-6" />
          </div>
        </div>
        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tighter leading-none">
          FINANCIAL <span className="text-neon-blue drop-shadow-[0_0_20px_rgba(0,243,255,0.6)]">CONTROLLER</span>
        </h1>
        <div className="w-56 h-1 bg-white/5 rounded-full overflow-hidden mt-12">
          <div className="h-full bg-neon-blue shadow-[0_0_10px_#00f3ff] animate-loading-bar"></div>
        </div>
      </div>
    );
  }

  const expenseModules = (data.modulesOrder || ['fixed', 'installments']).map((moduleId: string, index: number) => {
    if (moduleId === 'fixed') return <DraggableModuleWrapper key="fixed" id="fixed" index={index} onMove={(f,t) => { const n = [...(data.modulesOrder||[])]; const [m] = n.splice(f,1); n.splice(t,0,m); handleUpdate({...data, modulesOrder: n}, true); }}><FixedExpenseModule data={data} onUpdate={handleUpdate} /></DraggableModuleWrapper>;
    if (moduleId === 'installments') return <DraggableModuleWrapper key="installments" id="installments" index={index} onMove={(f,t) => { const n = [...(data.modulesOrder||[])]; const [m] = n.splice(f,1); n.splice(t,0,m); handleUpdate({...data, modulesOrder: n}, true); }}><InstallmentModule data={data} onUpdate={handleUpdate} /></DraggableModuleWrapper>;
    const section = data.customSections?.find(s => s.id === moduleId && s.type === 'expense');
    if (section) return <DraggableModuleWrapper key={section.id} id={section.id} index={index} onMove={(f,t) => { const n = [...(data.modulesOrder||[])]; const [m] = n.splice(f,1); n.splice(t,0,m); handleUpdate({...data, modulesOrder: n}, true); }}><CustomSectionModule section={section} onUpdate={updateSection} onDeleteSection={() => deleteSection(section.id)} /></DraggableModuleWrapper>;
    return null;
  });

  const incomeModules = (data.incomeModulesOrder || ['incomes']).map((moduleId: string, index: number) => {
    if (moduleId === 'incomes') return <DraggableModuleWrapper key="incomes" id="incomes" index={index} onMove={(f,t) => { const n = [...(data.incomeModulesOrder||[])]; const [m] = n.splice(f,1); n.splice(t,0,m); handleUpdate({...data, incomeModulesOrder: n}, true); }}><IncomeModule data={data} onUpdate={handleUpdate} /></DraggableModuleWrapper>;
    const section = data.customSections?.find(s => s.id === moduleId && s.type === 'income');
    if (section) return <DraggableModuleWrapper key={section.id} id={section.id} index={index} onMove={(f,t) => { const n = [...(data.incomeModulesOrder||[])]; const [m] = n.splice(f,1); n.splice(t,0,m); handleUpdate({...data, incomeModulesOrder: n}, true); }}><CustomSectionModule section={section} onUpdate={updateSection} onDeleteSection={() => deleteSection(section.id)} /></DraggableModuleWrapper>;
    return null;
  });

  return (
    <div className="min-h-screen text-slate-200 pb-20 selection:bg-neon-pink selection:text-white relative bg-black">
      <nav className="border-b border-white/5 bg-neon-surface/95 backdrop-blur-md sticky top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.6)]">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-2 overflow-hidden">
          <div className="flex flex-row items-center gap-2 sm:gap-6 min-w-0">
            <h1 className="font-extrabold text-[11px] sm:text-xl tracking-tighter leading-none shrink-0 cursor-pointer" onClick={() => setShowDreams(false)}>
              FINANCIAL <span className="text-neon-blue drop-shadow-[0_0_5px_rgba(0,243,255,0.8)]">CONTROLLER</span>
            </h1>
          </div>
          <div className="flex items-center gap-1 sm:gap-4 shrink-0">
               <button onClick={() => setShowDreams(!showDreams)} className={`flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest transition-all duration-300 ${showDreams ? 'bg-white/10 text-white border border-white/20' : 'bg-gradient-to-r from-neon-blue to-neon-pink text-white shadow-lg hover:shadow-neon-blue/20 hover:scale-105 active:scale-95'}`}>
                 <Star size={14} className={showDreams ? 'text-neon-yellow' : 'text-white'} /> {showDreams ? 'CONTROLE' : 'MODO DREAMS'}
               </button>
               <div className={`flex items-center gap-1 px-1.5 py-1 rounded-full border transition-all duration-500 ${isSyncing ? 'bg-neon-blue/10 border-neon-blue/40 text-neon-blue' : 'bg-neon-green/10 border-neon-green/40 text-neon-green'}`}>
                 {isSyncing ? <RefreshCw size={8} className="animate-spin" /> : <Cloud size={10} />}
                 <span className="text-[6px] sm:text-[8px] font-black uppercase tracking-widest">
                   {isSyncing ? 'Sync' : 'Cloud ON'}
                 </span>
               </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-4 pb-32 sm:py-8">
        {showDreams ? (
          <DreamsModule data={data} onUpdate={handleUpdate} onBack={() => setShowDreams(false)} />
        ) : (
          <>
            <Dashboard data={data} />
            <div className="flex flex-col lg:flex-row gap-6 items-start mt-4 sm:mt-6">
              <div className="flex-1 w-full flex flex-col gap-4">
                <h3 className="text-[8px] font-extrabold text-neon-green uppercase tracking-[0.2em] pl-3 border-l-2 border-neon-green/30">Recebimentos</h3>
                {incomeModules}
                <button onClick={() => createNewSection('income')} className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-slate-600 font-bold hover:border-neon-green/40 hover:text-neon-green hover:bg-neon-green/5 transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest"><Plus size={16} /> Adicionar Nova Entrada</button>
              </div>
              <div className="flex-1 w-full flex flex-col gap-4">
                <h3 className="text-[8px] font-extrabold text-neon-red uppercase tracking-[0.2em] pl-3 border-l-2 border-neon-red/30">Pagamentos</h3>
                {expenseModules}
                <button onClick={() => createNewSection('expense')} className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-slate-600 font-bold hover:border-neon-red/40 hover:text-neon-red hover:bg-neon-red/5 transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest"><Plus size={16} /> Adicionar Nova Saída</button>
              </div>
            </div>
            <div className="mt-12 pt-8 border-t border-white/5">
              <h3 className="text-[8px] font-extrabold text-slate-500 uppercase tracking-[0.2em] mb-6 text-center lg:text-left">Recursos & Bancos</h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <CreditCardModule data={data} onUpdate={handleUpdate} />
                <RadarModule data={data} onUpdate={handleUpdate} />
                <PixModule data={data} onUpdate={handleUpdate} />
              </div>
            </div>
          </>
        )}
      </main>

      <BottomMobileNav balance={calculateBalance()} onScrollTo={scrollToId} onOpenDreams={() => setShowDreams(true)} />

      <footer className="mt-20 py-10 text-center border-t border-white/5 bg-black/40 backdrop-blur-md">
        <div className="flex flex-col items-center gap-2 px-4">
          <p className="text-[9px] font-black text-white/70 uppercase tracking-[0.4em]">Financial Controller</p>
          <div className="h-px w-20 bg-white/5 my-1"></div>
          <p className="text-[7px] font-bold text-slate-600 uppercase tracking-[0.2em] leading-relaxed">
            {new Date().getFullYear()} • Powered By JOI.A. todos os direitos reservados
          </p>
        </div>
      </footer>
    </div>
  );
}
export default App;
