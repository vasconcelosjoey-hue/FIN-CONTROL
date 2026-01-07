
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { FinancialData, INITIAL_DATA, CustomSection } from './types';
import { loadData, saveToLocal, saveToCloud, subscribeToData, logoutUser, getLocalTimestamp } from './services/dataService';
import { auth } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { Dashboard } from './components/Dashboard';
import { AuthScreen } from './components/AuthScreen';
import { IncomeModule, FixedExpenseModule, InstallmentModule, CreditCardModule, PixModule, CustomSectionModule, RadarModule } from './components/Modules';
import { RefreshCw, Plus, LogOut, User as UserIcon, CloudCheck, Clock, Calendar, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { DraggableModuleWrapper } from './components/ui/UIComponents';

const DigitalClock = () => {
  const [dateTime, setDateTime] = useState({ time: '', date: '' });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('pt-BR', { 
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      const dateStr = now.toLocaleDateString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      setDateTime({ time: timeStr, date: dateStr });
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center sm:items-end px-3 py-1 bg-black/60 border border-neon-blue/30 rounded-xl shadow-[0_0_20px_rgba(0,243,255,0.1)] backdrop-blur-md shrink-0">
      <div className="flex items-center gap-1.5">
        <span className="text-[7px] font-black text-slate-500 uppercase tracking-tighter">Brasília</span>
        <span className="text-[11px] font-black text-neon-blue font-mono tracking-widest drop-shadow-[0_0_8px_rgba(0,243,255,0.6)] animate-pulse">
          {dateTime.time}
        </span>
      </div>
      <div className="flex items-center gap-1 opacity-70">
        <Calendar size={8} className="text-slate-400" />
        <span className="text-[8px] font-bold text-slate-400 font-mono tracking-wider">{dateTime.date}</span>
      </div>
    </div>
  );
};

const BottomMobileNav = ({ balance, onScrollTo }: { balance: number, onScrollTo: (id: string) => void }) => {
  const fmt = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] sm:hidden bg-neon-dark/95 backdrop-blur-xl border-t border-white/10 px-4 py-3 flex items-center justify-between gap-4 shadow-[0_-10px_30px_rgba(0,0,0,0.6)]">
      <button 
        onClick={() => onScrollTo('section-incomes')}
        className="flex flex-col items-center gap-1 text-neon-green/60 hover:text-neon-green transition-colors active:scale-90"
      >
        <TrendingUp size={18} />
        <span className="text-[7px] font-black uppercase tracking-tighter">Entradas</span>
      </button>

      <div className="flex flex-col items-center bg-black/60 border border-neon-yellow/30 px-5 py-1.5 rounded-2xl shadow-[0_0_15px_rgba(255,230,0,0.15)]">
        <span className="text-[6px] text-slate-500 font-black uppercase tracking-[0.2em] mb-0.5">Saldo Previsto</span>
        <span className={`text-xs font-black tracking-tight ${balance >= 0 ? 'text-neon-yellow shadow-neon-yellow/10' : 'text-neon-red shadow-neon-red/10'}`}>
          <span className="text-[9px] mr-1 opacity-60 font-bold">R$</span>
          {fmt(balance)}
        </span>
      </div>

      <button 
        onClick={() => onScrollTo('section-fixed')}
        className="flex flex-col items-center gap-1 text-neon-red/60 hover:text-neon-red transition-colors active:scale-90"
      >
        <TrendingDown size={18} />
        <span className="text-[7px] font-black uppercase tracking-tighter">Saídas</span>
      </button>
    </div>
  );
};

function App() {
  const [data, setData] = useState<FinancialData>(INITIAL_DATA);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
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
    if (!userId) return;
    
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

    if (immediate) {
      performSync();
    } else {
      saveTimeoutRef.current = setTimeout(performSync, 1500);
    }
  }, [userId]);

  const handleUpdate = useCallback((newDataOrUpdater: FinancialData | ((prev: FinancialData) => FinancialData), immediate = false) => {
    const now = Date.now();
    lastUpdateRef.current = now;
    
    isInternalUpdate.current = true;
    if (updateLockRef.current) clearTimeout(updateLockRef.current);
    updateLockRef.current = setTimeout(() => {
      isInternalUpdate.current = false;
    }, 3000);

    setData(prev => {
      const next = typeof newDataOrUpdater === 'function' ? newDataOrUpdater(prev) : newDataOrUpdater;
      const nextWithTimestamp = { ...next, lastUpdate: now };
      
      if (userId) saveToLocal(userId, nextWithTimestamp);
      syncToCloud(nextWithTimestamp, immediate);
      
      return nextWithTimestamp;
    });
  }, [userId, syncToCloud]);

  useEffect(() => {
    let unsubscribeData: () => void = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        setUserEmail(user.email);
        
        const initialData = await loadData(user.uid);
        const normalized = normalizeData(initialData);
        lastUpdateRef.current = normalized.lastUpdate || 0;
        setData(normalized);
        
        unsubscribeData = subscribeToData(user.uid, (cloudData) => {
          const cloudTimestamp = (cloudData as any).lastUpdate || 0;
          const localTimestamp = getLocalTimestamp(user.uid);
          
          if (!isInternalUpdate.current && cloudTimestamp > localTimestamp) {
            console.log("🔄 Sincronização externa recebida");
            lastUpdateRef.current = cloudTimestamp;
            setData(normalizeData(cloudData));
            setIsSyncing(false);
          } else if (cloudTimestamp < localTimestamp) {
            console.log("📤 Nuvem desatualizada detectada, forçando upload local");
            const localDataStr = localStorage.getItem(`fincontroller_data_${user.uid}`);
            if (localDataStr) {
               saveToCloud(user.uid, JSON.parse(localDataStr));
            }
          }
        });
        setLoading(false);
      } else {
        setUserId(null);
        setUserEmail(null);
        setData(INITIAL_DATA);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeData();
    };
  }, []);

  const createNewSection = (type: 'income' | 'expense') => {
    const title = prompt(`Nome da nova sessão de ${type === 'income' ? 'Entrada' : 'Saída'}?`);
    if (!title) return;

    const newSectionId = Math.random().toString(36).substr(2, 9);
    const newSection: CustomSection = {
      id: newSectionId,
      title: title.toUpperCase(),
      items: [],
      type: type,
      structure: type === 'expense' ? 'installment' : 'standard'
    };
    
    handleUpdate(prev => {
      const sections = prev.customSections || [];
      const updatedData = { ...prev, customSections: [...sections, newSection] };

      if (type === 'expense') {
        updatedData.modulesOrder = [...(prev.modulesOrder || ['fixed', 'installments']), newSectionId];
      } else {
        updatedData.incomeModulesOrder = [...(prev.incomeModulesOrder || ['incomes']), newSectionId];
      }
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
    handleUpdate(prev => ({ 
      ...prev, 
      customSections: (prev.customSections || []).map(s => s.id === updatedSection.id ? updatedSection : s) 
    }), immediate);
  };

  const scrollToId = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100; // Ajuste para o header fixo
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
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
      <div className="min-h-screen bg-neon-dark flex flex-col items-center justify-center text-neon-blue gap-4">
        <RefreshCw className="animate-spin w-10 h-10 shadow-neon-blue" />
        <p className="text-[9px] font-bold uppercase tracking-[0.3em] animate-pulse">Protegendo Dados...</p>
      </div>
    );
  }

  if (!userId) return <AuthScreen />;

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
    <div className="min-h-screen text-slate-200 pb-20 selection:bg-neon-pink selection:text-white relative">
      <nav className="border-b border-white/5 bg-neon-surface/90 backdrop-blur-md sticky top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.6)]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-2 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 min-w-0">
            <h1 className="font-extrabold text-sm sm:text-xl tracking-tight leading-tight flex-wrap max-w-[150px] sm:max-w-none">
              FINANCIAL <span className="text-neon-blue drop-shadow-[0_0_5px_rgba(0,243,255,0.8)] block sm:inline">CONTROLLER</span>
            </h1>
            <DigitalClock />
          </div>
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-4 shrink-0">
               <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all duration-500 ${isSyncing ? 'bg-neon-blue/10 border-neon-blue/40 text-neon-blue shadow-neon-blue' : 'bg-neon-green/10 border-neon-green/40 text-neon-green shadow-none'}`}>
                 {isSyncing ? <RefreshCw size={10} className="animate-spin" /> : <CloudCheck size={12} />}
                 <span className="text-[8px] font-black uppercase tracking-widest whitespace-nowrap">
                   {isSyncing ? 'Sync...' : 'Online'}
                 </span>
               </div>
               <button onClick={logoutUser} className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 hover:text-neon-red transition-all uppercase tracking-widest px-3 py-1.5 hover:bg-neon-red/10 rounded-lg border border-transparent hover:border-neon-red/30">
                 <LogOut size={12} /> Sair
               </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6 pb-32 sm:py-8">
        <Dashboard data={data} />
        <div className="flex flex-col lg:flex-row gap-6 items-start mt-6">
          <div className="flex-1 w-full flex flex-col gap-4">
            <h3 className="text-[10px] font-extrabold text-neon-green uppercase tracking-[0.2em] pl-3 border-l-2 border-neon-green/30">Fluxo de Entradas</h3>
            {incomeModules}
            <button onClick={() => createNewSection('income')} className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-slate-600 font-bold hover:border-neon-green/40 hover:text-neon-green hover:bg-neon-green/5 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest"><Plus size={18} /> Nova Sessão de Entrada</button>
          </div>
          <div className="flex-1 w-full flex flex-col gap-4">
            <h3 className="text-[10px] font-extrabold text-neon-red uppercase tracking-[0.2em] pl-3 border-l-2 border-neon-red/30">Saídas & Despesas (Restante)</h3>
            {expenseModules}
            <button onClick={() => createNewSection('expense')} className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-slate-600 font-bold hover:border-neon-red/40 hover:text-neon-red hover:bg-neon-red/5 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest"><Plus size={18} /> Nova Sessão de Saída</button>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-white/5">
          <h3 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-[0.2em] mb-6 text-center lg:text-left">Recursos Adicionais & Bancos</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <CreditCardModule data={data} onUpdate={handleUpdate} />
            <RadarModule data={data} onUpdate={handleUpdate} />
            <PixModule data={data} onUpdate={handleUpdate} />
          </div>
        </div>
      </main>

      <BottomMobileNav balance={calculateBalance()} onScrollTo={scrollToId} />

      <footer className="mt-20 py-12 text-center border-t border-white/5 bg-black/30 backdrop-blur-sm">
        <p className="text-[10px] font-black text-white/80 uppercase tracking-[0.4em] mb-3">Financial Controller</p>
        <p className="text-[8px] font-bold text-slate-600 uppercase tracking-[0.2em] px-4">
          {new Date().getFullYear()} • Powered By JOI.A. todos os direitos reservados
        </p>
      </footer>
    </div>
  );
}
export default App;
