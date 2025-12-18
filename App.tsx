import React, { useEffect, useState } from 'react';
import { FinancialData, INITIAL_DATA, CustomSection } from './types';
import { loadData, saveData, subscribeToData, signInUser } from './services/dataService';
import { auth } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { Dashboard } from './components/Dashboard';
import { IncomeModule, FixedExpenseModule, InstallmentModule, CreditCardModule, PixModule, CustomSectionModule, RadarModule } from './components/Modules';
import { RefreshCw, ShieldCheck, Plus } from 'lucide-react';
import { Button, DraggableModuleWrapper } from './components/ui/UIComponents';

function App() {
  const [data, setData] = useState<FinancialData>(INITIAL_DATA);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  // Initial Load
  useEffect(() => {
    let unsubscribeData: () => void = () => {};

    const normalizeData = (d: FinancialData) => {
        if (!d.modulesOrder) {
             const customIds = d.customSections?.map(s => s.id) || [];
             d.modulesOrder = ['fixed', 'installments', ...customIds];
        }
        if (!d.incomeModulesOrder) {
            d.incomeModulesOrder = ['incomes'];
            d.customSections?.forEach(s => {
                if (!s.type) s.type = 'expense';
            });
        }
        if (!d.radarItems) d.radarItems = [];
        return d;
    };

    const initLocalMode = () => {
      const localId = "local_user";
      setUserId(localId);
      loadData(localId).then(d => {
        setData(normalizeData(d));
        setLoading(false);
      });
    };

    if (auth) {
      const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
        if (user) {
          setUserId(user.uid);
          const initialData = await loadData(user.uid);
          setData(normalizeData(initialData));
          setLoading(false);
          unsubscribeData = subscribeToData(user.uid, (newData) => {
            setData(normalizeData(newData));
          });
        } else {
          try {
             await signInUser();
          } catch (e) {
             initLocalMode();
          }
        }
      });
      return () => { unsubscribeAuth(); unsubscribeData(); };
    } else {
      initLocalMode();
    }
  }, []);

  // Auto-Save Effect
  useEffect(() => {
    if (userId && !loading) {
      saveData(userId, data);
    }
  }, [data, userId, loading]);

  const handleUpdate = (newData: FinancialData) => {
    setData(newData);
  };

  const createNewSection = (type: 'income' | 'expense') => {
    const title = prompt(`Nome da nova sessão de ${type === 'income' ? 'Entrada' : 'Saída'} (ex: Extras):`);
    if (title) {
      const newSectionId = Math.random().toString(36).substr(2, 9);
      const newSection: CustomSection = {
        id: newSectionId,
        title: title.toUpperCase(),
        items: [],
        type: type
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
      handleUpdate(updatedData);
    }
  };

  const deleteSection = (id: string) => {
    if(confirm("Tem certeza que deseja apagar esta sessão e todos os itens dela?")) {
      handleUpdate({
          ...data, 
          customSections: data.customSections.filter(s => s.id !== id),
          modulesOrder: data.modulesOrder?.filter(oid => oid !== id),
          incomeModulesOrder: data.incomeModulesOrder?.filter(oid => oid !== id)
      });
    }
  };

  const updateSection = (updatedSection: CustomSection) => {
    handleUpdate({
      ...data,
      customSections: data.customSections.map(s => s.id === updatedSection.id ? updatedSection : s)
    });
  };

  if (loading) return <div className="min-h-screen bg-neon-dark flex flex-col items-center justify-center text-neon-blue gap-4"><RefreshCw className="animate-spin w-10 h-10" /></div>;

  // Render order for Expense Column
  const expenseModules = (data.modulesOrder || ['fixed', 'installments']).map((moduleId, index) => {
     if (moduleId === 'fixed') return <DraggableModuleWrapper key="fixed" id="fixed" index={index} onMove={(f,t) => { const n = [...(data.modulesOrder||[])]; const [m] = n.splice(f,1); n.splice(t,0,m); handleUpdate({...data, modulesOrder: n}); }}><FixedExpenseModule data={data} onUpdate={handleUpdate} /></DraggableModuleWrapper>;
     if (moduleId === 'installments') return <DraggableModuleWrapper key="installments" id="installments" index={index} onMove={(f,t) => { const n = [...(data.modulesOrder||[])]; const [m] = n.splice(f,1); n.splice(t,0,m); handleUpdate({...data, modulesOrder: n}); }}><InstallmentModule data={data} onUpdate={handleUpdate} /></DraggableModuleWrapper>;
     const section = data.customSections?.find(s => s.id === moduleId && s.type === 'expense');
     if (section) return <DraggableModuleWrapper key={section.id} id={section.id} index={index} onMove={(f,t) => { const n = [...(data.modulesOrder||[])]; const [m] = n.splice(f,1); n.splice(t,0,m); handleUpdate({...data, modulesOrder: n}); }}><CustomSectionModule section={section} onUpdate={updateSection} onDeleteSection={() => deleteSection(section.id)} /></DraggableModuleWrapper>;
     return null;
  });

  // Render order for Income Column
  const incomeModules = (data.incomeModulesOrder || ['incomes']).map((moduleId, index) => {
     if (moduleId === 'incomes') return <DraggableModuleWrapper key="incomes" id="incomes" index={index} onMove={(f,t) => { const n = [...(data.incomeModulesOrder||[])]; const [m] = n.splice(f,1); n.splice(t,0,m); handleUpdate({...data, incomeModulesOrder: n}); }}><IncomeModule data={data} onUpdate={handleUpdate} /></DraggableModuleWrapper>;
     const section = data.customSections?.find(s => s.id === moduleId && s.type === 'income');
     if (section) return <DraggableModuleWrapper key={section.id} id={section.id} index={index} onMove={(f,t) => { const n = [...(data.incomeModulesOrder||[])]; const [m] = n.splice(f,1); n.splice(t,0,m); handleUpdate({...data, incomeModulesOrder: n}); }}><CustomSectionModule section={section} onUpdate={updateSection} onDeleteSection={() => deleteSection(section.id)} /></DraggableModuleWrapper>;
     return null;
  });

  return (
    <div className="min-h-screen text-slate-200 pb-20 selection:bg-neon-pink selection:text-white">
      <nav className="border-b border-white/5 bg-neon-surface/80 backdrop-blur-md sticky top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
          <h1 className="font-extrabold text-xl tracking-tight">FIN<span className="text-neon-blue/80 mx-0.5">/</span><span className="text-neon-blue drop-shadow-[0_0_5px_rgba(0,243,255,0.8)]">CONTROLE</span></h1>
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
             <h3 className="text-xs font-extrabold text-neon-red uppercase tracking-widest pl-3 border-l-2 border-neon-red/30">Saídas & Despesas</h3>
             {expenseModules}
             <button onClick={() => createNewSection('expense')} className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-slate-500 font-bold hover:border-neon-red/50 hover:text-neon-red hover:bg-neon-red/5 transition-all flex items-center justify-center gap-2"><Plus size={20} /> Nova Sessão de Saída</button>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5">
           <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-6">Recursos Adicionais & Bancos</h3>
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <CreditCardModule data={data} onUpdate={handleUpdate} />
              <RadarModule data={data} onUpdate={handleUpdate} />
              <PixModule data={data} onUpdate={handleUpdate} />
           </div>
        </div>
      </main>
      <footer className="mt-20 py-8 text-center text-slate-600 text-[10px] font-bold tracking-widest uppercase">FIN/CONTROLE • 2024</footer>
    </div>
  );
}
export default App;