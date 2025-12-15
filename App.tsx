import React, { useEffect, useState } from 'react';
import { FinancialData, INITIAL_DATA, CustomSection } from './types';
import { loadData, saveData, subscribeToData, signInUser } from './services/dataService';
import { auth } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { Dashboard } from './components/Dashboard';
import { IncomeModule, FixedExpenseModule, InstallmentModule, CreditCardModule, PixModule, CustomSectionModule, RadarModule } from './components/Modules';
import { Share2, RefreshCw, ShieldCheck, Plus, Command } from 'lucide-react';
import { Button, DraggableModuleWrapper } from './components/ui/UIComponents';

function App() {
  const [data, setData] = useState<FinancialData>(INITIAL_DATA);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);
  const [smartInput, setSmartInput] = useState('');

  // Initial Load
  useEffect(() => {
    let unsubscribeData: () => void = () => {};

    const initLocalMode = () => {
      const localId = "local_user";
      setUserId(localId);
      loadData(localId).then(d => {
        // Migration Logic
        if (!d.modulesOrder) {
             const customIds = d.customSections?.map(s => s.id) || [];
             d.modulesOrder = ['fixed', 'installments', ...customIds];
        }
        if (!d.radarItems) {
          d.radarItems = [];
        }
        setData(d);
        setLoading(false);
      });
    };

    if (auth) {
      const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
        if (user) {
          setUserId(user.uid);
          const initialData = await loadData(user.uid);
          // Ensure modulesOrder exists for legacy data
          if (!initialData.modulesOrder) {
             const customIds = initialData.customSections?.map(s => s.id) || [];
             initialData.modulesOrder = ['fixed', 'installments', ...customIds];
          }
          // Ensure radarItems exists for legacy data
          if (!initialData.radarItems) {
            initialData.radarItems = [];
          }
          setData(initialData);
          setLoading(false);
          unsubscribeData = subscribeToData(user.uid, (newData) => {
             // Handle external updates (Firebase)
             // We need to be careful not to overwrite local state if we are the ones updating, 
             // but subscribeToData usually filters local writes or we just accept server truth.
             // For this "local storage priority" request, this is less critical, 
             // but keeping it for when auth is actually used.
            if (!newData.modulesOrder) {
                const customIds = newData.customSections?.map(s => s.id) || [];
                newData.modulesOrder = ['fixed', 'installments', ...customIds];
            }
            if (!newData.radarItems) {
              newData.radarItems = [];
            }
            setData(newData);
          });
        } else {
          // If auth exists but no user, try anon sign in, or fall back to local if that fails
          try {
             await signInUser();
          } catch (e) {
             console.error("Auth failed, using local mode", e);
             initLocalMode();
          }
        }
      });

      return () => {
        unsubscribeAuth();
        unsubscribeData();
      };
    } else {
      // No Auth configured -> Local Mode
      initLocalMode();
    }
  }, []);

  // Auto-Save Effect: Whenever data or userId changes, persist to storage.
  useEffect(() => {
    if (userId && !loading) {
      saveData(userId, data);
    }
  }, [data, userId, loading]);

  const handleUpdate = (newData: FinancialData) => {
    setData(newData);
    // Auto-save effect handles the persistence
  };

  const handleSmartCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!smartInput.trim()) return;

    const lowerInput = smartInput.toLowerCase();
    const valueMatch = smartInput.match(/(\d+([.,]\d+)?)/);
    const value = valueMatch ? parseFloat(valueMatch[1].replace(',', '.')) : 0;
    
    // Remove value from string to get description
    const description = smartInput.replace(valueMatch ? valueMatch[0] : '', '').replace(/entrada|gasto|cartão|pagar|receber/gi, '').trim() || "Nova Transação";

    const newData = { ...data };
    let addedType = '';
    let foundSection = false;

    // 1. Check Custom Sections first (Priority match)
    // We check if any section title is present in the input string
    if (newData.customSections) {
      for (let i = 0; i < newData.customSections.length; i++) {
        const section = newData.customSections[i];
        if (lowerInput.includes(section.title.toLowerCase())) {
          section.items.push({
             id: Math.random().toString(36).substr(2, 9),
             name: description.replace(new RegExp(section.title, "gi"), "").trim() || "Item",
             value: value,
             date: new Date().toISOString().split('T')[0]
          });
          addedType = section.title;
          foundSection = true;
          break;
        }
      }
    }

    if (!foundSection) {
      if (lowerInput.includes('entrada') || lowerInput.includes('receber')) {
        newData.incomes = [...newData.incomes, {
          id: Math.random().toString(36).substr(2, 9),
          name: description,
          value: value,
          expectedDate: new Date().toISOString().split('T')[0]
        }];
        addedType = 'Entrada';
      } else if (lowerInput.includes('cartão') || lowerInput.includes('credito')) {
        // Add to first credit card found or alert
        if (newData.creditCards.length > 0) {
          newData.creditCards[0].currentInvoiceValue += value;
          addedType = 'Cartão (Fatura)';
        } else {
          setNotification('ERRO: Crie um cartão primeiro');
          return;
        }
      } else {
         // Default to "Contas Pessoais" (Fixed Expenses)
         newData.fixedExpenses = [...newData.fixedExpenses, {
           id: Math.random().toString(36).substr(2, 9),
           name: description,
           value: value,
           dueDate: new Date().toISOString().split('T')[0]
         }];
         addedType = 'Contas Pessoais';
      }
    }

    handleUpdate(newData);
    setSmartInput('');
    setNotification(`ADICIONADO EM: ${addedType.toUpperCase()}`);
    setTimeout(() => setNotification(null), 3000);
  };

  const createNewSection = () => {
    const title = prompt("Nome da nova sessão (ex: CBMC Mensalidade):");
    if (title) {
      const newSectionId = Math.random().toString(36).substr(2, 9);
      const newSection: CustomSection = {
        id: newSectionId,
        title: title.toUpperCase(),
        items: []
      };
      
      const sections = data.customSections || [];
      const currentOrder = data.modulesOrder || ['fixed', 'installments'];
      
      // Add new section and put it at the top of the order
      const newOrder = [...currentOrder, newSectionId];

      handleUpdate({ 
          ...data, 
          customSections: [...sections, newSection],
          modulesOrder: newOrder
      });
    }
  };

  const deleteSection = (id: string) => {
    if(confirm("Tem certeza que deseja apagar esta sessão e todos os itens dela?")) {
      handleUpdate({
          ...data, 
          customSections: data.customSections.filter(s => s.id !== id),
          modulesOrder: data.modulesOrder?.filter(oid => oid !== id)
      });
    }
  };

  const updateSection = (updatedSection: CustomSection) => {
    handleUpdate({
      ...data,
      customSections: data.customSections.map(s => s.id === updatedSection.id ? updatedSection : s)
    });
  };

  const handleModuleReorder = (fromIndex: number, toIndex: number) => {
    const newOrder = [...(data.modulesOrder || [])];
    const [moved] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, moved);
    handleUpdate({ ...data, modulesOrder: newOrder });
  };

  const copyShareLink = () => {
    const url = window.location.origin + window.location.pathname;
    navigator.clipboard.writeText(url);
    setNotification('LINK DE ACESSO COPIADO');
    setTimeout(() => setNotification(null), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neon-dark flex flex-col items-center justify-center text-neon-blue gap-4 relative overflow-hidden">
         <RefreshCw className="animate-spin w-10 h-10" /> 
      </div>
    );
  }

  // Determine rendering order for Expense Column
  const expenseModules = (data.modulesOrder || ['fixed', 'installments']).map((moduleId, index) => {
     if (moduleId === 'fixed') {
         return (
             <React.Fragment key="fixed">
                 <DraggableModuleWrapper id="fixed" index={index} onMove={handleModuleReorder}>
                     <FixedExpenseModule data={data} onUpdate={handleUpdate} />
                 </DraggableModuleWrapper>
             </React.Fragment>
         );
     } else if (moduleId === 'installments') {
         return (
             <React.Fragment key="installments">
                 <DraggableModuleWrapper id="installments" index={index} onMove={handleModuleReorder}>
                     <InstallmentModule data={data} onUpdate={handleUpdate} />
                 </DraggableModuleWrapper>
             </React.Fragment>
         );
     } else {
         const section = data.customSections?.find(s => s.id === moduleId);
         if (section) {
             return (
                 <React.Fragment key={section.id}>
                     <DraggableModuleWrapper id={section.id} index={index} onMove={handleModuleReorder}>
                         <CustomSectionModule 
                            section={section} 
                            onUpdate={updateSection} 
                            onDeleteSection={() => deleteSection(section.id)}
                         />
                     </DraggableModuleWrapper>
                 </React.Fragment>
             );
         }
     }
     return null;
  });

  return (
    <div className="min-h-screen text-slate-200 pb-20 selection:bg-neon-pink selection:text-white">
      {/* Navbar & Smart Input */}
      <nav className="border-b border-white/5 bg-neon-surface/80 backdrop-blur-md sticky top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <h1 className="font-extrabold text-xl tracking-tight whitespace-nowrap">
              FIN<span className="text-neon-blue/80 mx-0.5">/</span><span className="text-neon-blue drop-shadow-[0_0_5px_rgba(0,243,255,0.8)]">CONTROLE</span>
            </h1>
            
            {/* Smart Command Bar */}
            <form onSubmit={handleSmartCommand} className="w-full max-w-xl relative group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-neon-blue transition-colors">
                <Command size={16} />
              </div>
              <input 
                type="text" 
                value={smartInput}
                onChange={(e) => setSmartInput(e.target.value)}
                placeholder="Digite: 'Entrada 500 projeto' ou 'Gasto 100 mercado'..." 
                className="w-full bg-black/40 border border-white/10 rounded-full py-2.5 pl-10 pr-4 text-sm font-semibold text-white focus:outline-none focus:border-neon-blue focus:shadow-[0_0_15px_rgba(0,243,255,0.15)] transition-all placeholder:text-slate-600"
              />
              <button type="submit" className="absolute inset-y-0 right-2 flex items-center">
                 <div className="bg-white/10 hover:bg-neon-blue/20 p-1 rounded-full transition-colors text-slate-400 hover:text-neon-blue">
                   <Plus size={14} />
                 </div>
              </button>
            </form>
            
            <div className="flex items-center gap-2 shrink-0">
               {/* Share button removed */}
            </div>
          </div>
        </div>
      </nav>

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-24 right-4 bg-neon-dark border border-neon-green text-neon-green px-6 py-3 rounded-xl shadow-[0_0_20px_rgba(10,255,104,0.3)] z-50 animate-bounce font-extrabold tracking-wide flex items-center gap-2">
          <ShieldCheck size={18} /> {notification}
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        
        <Dashboard data={data} />

        {/* Modules Grid - Top Section (Cashflow vs Expenses) */}
        <div className="flex flex-col lg:flex-row gap-6 items-start mt-6">
          
          {/* Column 1: Incomes (Green) */}
          <div className="flex-1 w-full flex flex-col gap-4">
             <h3 className="text-xs font-extrabold text-neon-green uppercase tracking-widest pl-1 border-l-2 border-neon-green/30 pl-3">Fluxo de Entradas</h3>
             <IncomeModule data={data} onUpdate={handleUpdate} />
          </div>

          {/* Column 2: Expenses (Red) - Reorderable */}
          <div className="flex-1 w-full flex flex-col gap-4">
             <div className="flex justify-between items-center pl-1 border-l-2 border-neon-red/30 pl-3">
                 <h3 className="text-xs font-extrabold text-neon-red uppercase tracking-widest">Saídas & Despesas</h3>
             </div>
             
             {expenseModules}

             <button onClick={createNewSection} className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-slate-500 font-bold hover:border-neon-red/50 hover:text-neon-red hover:bg-neon-red/5 transition-all flex items-center justify-center gap-2">
               <Plus size={20} /> Nova Sessão Personalizada
             </button>
          </div>
        </div>

        {/* Bottom Section: Cards & Pix & Radar */}
        <div className="mt-12 pt-8 border-t border-white/5">
           <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-6">Recursos Adicionais & Bancos</h3>
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <CreditCardModule data={data} onUpdate={handleUpdate} />
              <RadarModule data={data} onUpdate={handleUpdate} />
              <PixModule data={data} onUpdate={handleUpdate} />
           </div>
        </div>

      </main>

      <footer className="mt-20 py-8 text-center text-slate-600 text-[10px] font-bold tracking-widest uppercase">
        FIN/CONTROLE • 2024
      </footer>
    </div>
  );
}

export default App;