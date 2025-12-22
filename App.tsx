
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { FinancialData, INITIAL_DATA, CustomSection } from './types';
import { loadData, saveData, subscribeToData, logoutUser } from './services/dataService';
import { auth } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { Dashboard } from './components/Dashboard';
import { AuthScreen } from './components/AuthScreen';
import { IncomeModule, FixedExpenseModule, InstallmentModule, CreditCardModule, PixModule, CustomSectionModule, RadarModule } from './components/Modules';
import { RefreshCw, Plus, LogOut, User as UserIcon, CloudCheck } from 'lucide-react';
import { DraggableModuleWrapper } from './components/ui/UIComponents';

function App() {
  const [data, setData] = useState<FinancialData>(INITIAL_DATA);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Ref para evitar loops de salvamento quando recebemos dados da nuvem
  const isInternalUpdate = useRef(false);
  // Fix: Use ReturnType<typeof setTimeout> instead of NodeJS.Timeout to avoid namespace errors in browser environments
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Função Central de Salvamento com Debounce
  const persistData = useCallback(async (newData: FinancialData, immediate = false) => {
    if (!userId) return;
    
    setIsSyncing(true);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    const performSave = async () => {
      await saveData(userId, newData);
      setIsSyncing(false);
      isInternalUpdate.current = false;
    };

    if (immediate) {
      await performSave();
    } else {
      saveTimeoutRef.current = setTimeout(performSave, 1000);
    }
  }, [userId]);

  // Função para atualizar estado local E disparar salvamento
  const handleUpdate = useCallback((newData: FinancialData, immediate = false) => {
    isInternalUpdate.current = true;
    setData(newData);
    persistData(newData, immediate);
  }, [persistData]);

  useEffect(() => {
    let unsubscribeData: () => void = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setUserId(user.uid);
        setUserEmail(user.email);
        
        // Carga inicial
        const initialData = await loadData(user.uid);
        setData(normalizeData(initialData));
        
        // Inscrição Real-time
        unsubscribeData = subscribeToData(user.uid, (cloudData) => {
          // CRITICAL: Só atualiza se a mudança NÃO veio deste próprio dispositivo
          if (!isInternalUpdate.current) {
            setData(normalizeData(cloudData));
            setIsSyncing(false);
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
    
    const sections = data.customSections || [];
    let updatedData = { ...data, customSections: [...sections, newSection] };

    if (type === 'expense') {
      const currentOrder = data.modulesOrder || ['fixed', 'installments'];
      updatedData.modulesOrder = [...currentOrder, newSectionId];
    } else {
      const currentOrder = data.incomeModulesOrder || ['incomes'];
      updatedData.incomeModulesOrder = [...currentOrder, newSectionId];
    }
    handleUpdate(updatedData, true);
  };

  const deleteSection = (id: string) => {
    if(confirm("Deseja apagar esta sessão inteira?")) {
      handleUpdate({
        ...data, 
        customSections: (data.customSections || []).filter(s => s.id !== id),
        modulesOrder: (data.modulesOrder || []).filter(oid => oid !== id),
        incomeModulesOrder: (data.incomeModulesOrder || []).filter(oid => oid !== id)
      }, true);
    }
  };

  const updateSection = (updatedSection: CustomSection) => {
    handleUpdate({ 
      ...data, 
      customSections: (data.customSections || []).map(s => s.id === updatedSection.id ? updatedSection : s) 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neon-dark flex flex-col items-center justify-center text-neon-blue gap-4">
        <RefreshCw className="animate-spin w-10 h-10 shadow-neon-blue" />
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] animate-pulse">Estabelecendo Conexão Segura...</p>
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
    <div className="min-h-screen text-slate-200 pb-20 selection:bg-neon-pink selection:text-white">
      <nav className="border-b border-white/5 bg-neon-surface/80 backdrop-blur-md sticky top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="font-extrabold text-xl tracking-tight">FINANCIAL <span className="text-neon-blue drop-shadow-[0_0_5px_rgba(0,243,255,0.8)]">CONTROLLER</span></h1>
            <div className="flex items-center gap-3">
               <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                 <UserIcon size={12} className="text-slate-500" />
                 <span className="text-[10px] font-bold text-slate-400 truncate max-w-[150px]">{userEmail}</span>
               </div>
               <div className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all duration-500 ${isSyncing ? 'bg-neon-blue/10 border-neon-blue/40 text-neon-blue' : 'bg-neon-green/10 border-neon-green/40 text-neon-green'}`}>
                 {isSyncing ? <RefreshCw size={12} className="animate-spin" /> : <CloudCheck size={14} />}
                 <span className="text-[9px] font-black uppercase tracking-widest">
                   {isSyncing ? 'Sincronizando...' : 'Nuvem Ativa'}
                 </span>
               </div>
            </div>
          </div>
          <button onClick={logoutUser} className="flex items-center gap-2 text-[10px] font-bold text-slate-400 hover:text-neon-red transition-all uppercase tracking-widest px-4 py-2 hover:bg-neon-red/10 rounded-lg border border-transparent hover:border-neon-red/30">
            <LogOut size={14} /> Sair do Sistema
          </button>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Dashboard data={data} />
        <div className="flex flex-col lg:flex-row gap-6 items-start mt-6">
          <div className="flex-1 w-full flex flex-col gap-4">
            <h3 className="text-xs font-extrabold text-neon-green uppercase tracking-widest pl-3 border-l-2 border-neon-green/30">Fluxo de Entradas</h3>
            {incomeModules}
            <button onClick={() => createNewSection('income')} className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-slate-500 font-bold hover:border-neon-green/50 hover:text-neon-green hover:bg-neon-green/5 transition-all flex items-center justify-center gap-2"><Plus size={20} /> Nova Sessão de Entrada</button>
          </div>
          <div className="flex-1 w-full flex flex-col gap-4">
            <h3 className="text-xs font-extrabold text-neon-red uppercase tracking-widest pl-3 border-l-2 border-neon-red/30">Saídas & Despesas (Restante)</h3>
            {expenseModules}
            <button onClick={() => createNewSection('expense')} className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-slate-500 font-bold hover:border-neon-red/50 hover:text-neon-red hover:bg-neon-red/5 transition-all flex items-center justify-center gap-2"><Plus size={20} /> Nova Sessão de Saída</button>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-white/5">
          <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-6 text-center lg:text-left">Recursos Adicionais & Bancos</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <CreditCardModule data={data} onUpdate={handleUpdate} />
            <RadarModule data={data} onUpdate={handleUpdate} />
            <PixModule data={data} onUpdate={handleUpdate} />
          </div>
        </div>
      </main>
      <footer className="mt-20 py-8 text-center text-slate-600 text-[10px] font-bold tracking-widest uppercase">
        FINANCIAL CONTROLLER • {new Date().getFullYear()} • Real-Time Sync Active
      </footer>
    </div>
  );
}
export default App;
