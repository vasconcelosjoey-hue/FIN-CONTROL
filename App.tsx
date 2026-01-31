
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { FinancialData, INITIAL_DATA, CustomSection } from './types';
import { loadData, saveToLocal, saveToCloud, subscribeToData } from './services/dataService';
import { Dashboard } from './components/Dashboard';
import { CustomSectionModule, DreamsModule, GoalsModule } from './components/Modules';
import { RefreshCw, Plus, Cloud, ShieldCheck, Star, LogOut, User, ChevronUp, Coins, LayoutPanelTop, Target } from 'lucide-react';
import { DraggableModuleWrapper, Modal, Input, Button, Select } from './components/ui/UIComponents';
import { AuthScreen } from './components/AuthScreen';
import { auth } from './firebaseConfig';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';

const BottomMobileNav = ({ balance, onOpenDreams, onOpenGoals, active }: { balance: number, onScrollTo: (id: string) => void, onOpenDreams: () => void, onOpenGoals: () => void, active: string }) => {
  const fmt = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] sm:hidden bg-neon-dark/95 backdrop-blur-xl border-t border-white/10 px-4 py-4 flex items-center justify-between gap-2 shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
      <div className="flex flex-col items-center bg-black/60 border border-white/10 px-4 py-2 rounded-2xl">
        <span className="text-[7px] text-slate-500 font-black uppercase mb-0.5 tracking-widest">Saldo Geral</span>
        <span className={`text-xs font-black tracking-tighter ${balance >= 0 ? 'text-neon-yellow shadow-neon-yellow/10' : 'text-neon-red shadow-neon-red/10'}`}>
          R$ {fmt(balance)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onOpenGoals} className={`p-3 rounded-2xl border transition-all ${active === 'goals' ? 'bg-neon-blue/20 border-neon-blue text-white shadow-neon-blue' : 'bg-white/5 border-white/10 text-slate-500'}`}>
          <Target size={18} />
        </button>
        <button onClick={onOpenDreams} className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all ${active === 'dreams' ? 'bg-neon-pink/20 border-neon-pink text-white shadow-neon-pink' : 'bg-gradient-to-br from-neon-blue to-neon-pink border-transparent text-white'}`}>
          <Star size={18} />
        </button>
      </div>
    </div>
  );
};

const FloatingControls = ({ balance, isVisible, onCollapse }: { balance: number, isVisible: boolean, onCollapse: () => void }) => {
  const fmt = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (
    <div className={`fixed bottom-10 left-10 z-[100] hidden lg:flex flex-col gap-4 items-start transition-all duration-500 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
      <div className="bg-neon-dark/80 backdrop-blur-2xl border border-neon-yellow/30 p-5 rounded-[2rem] shadow-[0_0_50px_rgba(255,230,0,0.15)] flex flex-col gap-1 items-start min-w-[200px]">
        <div className="flex items-center gap-2 mb-1">
          <Coins size={14} className="text-neon-yellow" />
          <span className="text-[8px] font-black text-neon-yellow uppercase tracking-[0.4em]">Saldo Previsto</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-bold text-slate-500">R$</span>
          <span className={`text-3xl font-black tracking-tighter ${balance >= 0 ? 'text-neon-yellow' : 'text-neon-red'}`}>
            {fmt(balance)}
          </span>
        </div>
      </div>
      <button onClick={onCollapse} className="group flex items-center gap-4 bg-neon-dark/80 backdrop-blur-2xl border border-white/10 hover:border-neon-blue/50 p-4 pr-6 rounded-[1.5rem] shadow-2xl transition-all active:scale-95">
        <div className="p-3 bg-white/5 rounded-xl group-hover:bg-neon-blue/10 group-hover:text-neon-blue transition-colors">
          <ChevronUp size={20} />
        </div>
        <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Recolher Tudo</span>
      </button>
    </div>
  );
};

function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [data, setData] = useState<FinancialData>(INITIAL_DATA);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeModule, setActiveModule] = useState<'dashboard' | 'dreams' | 'goals'>('dashboard');
  const [scrollY, setScrollY] = useState(0);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newSessionType, setNewSessionType] = useState<'income' | 'expense'>('expense');
  const [newSessionName, setNewSessionName] = useState('');
  const [newSessionStructure, setNewSessionStructure] = useState<'standard' | 'installment'>('standard');

  const isInternalUpdate = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (!currentUser) {
        setLoading(false);
        setData(INITIAL_DATA);
      }
    });
    return () => unsubscribe();
  }, []);

  const normalizeData = (d: FinancialData) => {
    if (!d) return INITIAL_DATA;
    const clean = { ...INITIAL_DATA, ...d };
    if (!clean.goals) clean.goals = [];
    if (!clean.dreams) clean.dreams = [];
    if (!clean.sectionsOrder) clean.sectionsOrder = clean.customSections?.map(s => s.id) || [];
    return clean;
  };

  const syncToCloud = useCallback((targetData: FinancialData, immediate = false) => {
    if (!user) return;
    setIsSyncing(true);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    const performSync = async () => {
      try { await saveToCloud(user.uid, targetData); setIsSyncing(false); }
      catch (err) { setIsSyncing(false); }
    };
    if (immediate) performSync();
    else saveTimeoutRef.current = setTimeout(performSync, 2000);
  }, [user]);

  const handleUpdate = useCallback((newDataOrUpdater: FinancialData | ((prev: FinancialData) => FinancialData), immediate = false) => {
    if (!user) return;
    const now = Date.now();
    isInternalUpdate.current = true;
    setData(prev => {
      const next = typeof newDataOrUpdater === 'function' ? newDataOrUpdater(prev) : newDataOrUpdater;
      const nextWithTimestamp = { ...next, lastUpdate: now };
      saveToLocal(user.uid, nextWithTimestamp);
      syncToCloud(nextWithTimestamp, immediate);
      return nextWithTimestamp;
    });
    setTimeout(() => { isInternalUpdate.current = false; }, 3000);
  }, [user, syncToCloud]);

  useEffect(() => {
    if (!user) return;
    let unsubscribeData: () => void = () => {};
    setLoading(true);
    (async () => {
      try {
        const initialData = await loadData(user.uid);
        const normalized = normalizeData(initialData);
        setData(normalized);
        unsubscribeData = subscribeToData(user.uid, (cloudData) => {
          if (!isInternalUpdate.current) setData(normalizeData(cloudData));
        });
      } catch (e) { console.error(e); } finally { setTimeout(() => setLoading(false), 800); }
    })();
    return () => unsubscribeData();
  }, [user]);

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const collapseAll = () => setExpandedSections(new Set());

  const handleCreateSession = () => {
    if (!newSessionName) return;
    const newId = Math.random().toString(36).substr(2, 9);
    const newSection: CustomSection = {
      id: newId, title: newSessionName.toUpperCase(), items: [], type: newSessionType, structure: newSessionStructure
    };
    handleUpdate(prev => ({
      ...prev,
      customSections: [...(prev.customSections || []), newSection],
      sectionsOrder: [...(prev.sectionsOrder || []), newId]
    }), true);
    setIsCreateModalOpen(false);
    setNewSessionName('');
  };

  const deleteSection = (id: string) => {
    handleUpdate(prev => ({
      ...prev,
      customSections: prev.customSections.filter(s => s.id !== id),
      sectionsOrder: (prev.sectionsOrder || []).filter(oid => oid !== id)
    }), true);
  };

  const updateSection = (updatedSection: CustomSection, immediate = false) => {
    handleUpdate(prev => ({ ...prev, customSections: prev.customSections.map(s => s.id === updatedSection.id ? updatedSection : s) }), immediate);
  };

  const handleMoveSection = (fromIdx: number, toIdx: number, type: 'income' | 'expense') => {
    if (!user) return;
    setData(prev => {
      const all = [...prev.customSections];
      const filtered = all.filter(s => s.type === type);
      const itemToMove = filtered[fromIdx];
      const targetItem = filtered[toIdx];
      if (!itemToMove || !targetItem) return prev;
      const actualFrom = all.findIndex(s => s.id === itemToMove.id);
      all.splice(actualFrom, 1);
      const actualTo = all.findIndex(s => s.id === targetItem.id);
      all.splice(actualTo, 0, itemToMove);
      const next = { ...prev, customSections: all, sectionsOrder: all.map(s => s.id), lastUpdate: Date.now() };
      saveToLocal(user.uid, next);
      syncToCloud(next, true);
      return next;
    });
  };

  const calculateBalance = () => {
    const totalInc = data.customSections.filter(s => s.type === 'income').reduce((a, s) => a + s.items.filter(i => i.isActive !== false).reduce((ia, i) => ia + i.value, 0), 0);
    const totalExp = data.customSections.filter(s => s.type === 'expense').reduce((a, s) => a + s.items.filter(i => i.isActive !== false).reduce((ia, i) => ia + (i.value - (i.paidAmount || 0)), 0), 0);
    return totalInc - totalExp;
  };

  if (authLoading) return null;
  if (!user) return <AuthScreen />;

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center p-8">
        <div className="relative mb-14 animate-pulse">
          <div className="p-10 bg-neon-blue/5 rounded-[3.5rem] border-2 border-neon-blue/30 shadow-[0_0_80px_rgba(0,243,255,0.15)]">
            <ShieldCheck className="text-neon-blue w-24 h-24 sm:w-32 sm:h-32" strokeWidth={1} />
          </div>
          <RefreshCw className="absolute -bottom-2 -right-2 animate-spin text-neon-blue w-8 h-8 p-1.5 bg-black border border-neon-blue/50 rounded-full" />
        </div>
        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tighter uppercase">Syncing <span className="text-neon-blue">Vault...</span></h1>
      </div>
    );
  }

  const balance = calculateBalance();

  return (
    <div className="min-h-screen text-slate-200 pb-32 relative bg-black font-sans">
      <nav className="border-b border-white/10 bg-neon-surface/95 backdrop-blur-2xl sticky top-0 z-50 py-5 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">
          <div className="flex flex-col cursor-pointer" onClick={() => setActiveModule('dashboard')}>
            <h1 className="font-black text-sm sm:text-2xl tracking-tighter uppercase">
              FINANCIAL <span className="text-neon-blue drop-shadow-[0_0_15px_rgba(0,243,255,0.7)]">CONTROLLER</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
               <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 gap-3 shadow-inner">
                 <button 
                   onClick={() => setActiveModule('dashboard')} 
                   className={`px-8 py-3.5 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] transition-all duration-300 border ${activeModule === 'dashboard' ? 'bg-white/10 text-white shadow-[0_0_25px_rgba(255,255,255,0.2)] border-white/40 scale-105' : 'text-slate-500 hover:text-slate-300 border-transparent'}`}
                 >
                   Módulos
                 </button>
                 <button 
                   onClick={() => setActiveModule('dreams')} 
                   className={`px-8 py-3.5 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] transition-all duration-300 border ${activeModule === 'dreams' ? 'bg-neon-pink/30 text-white shadow-[0_0_25px_rgba(188,19,254,0.4)] border-neon-pink/60 scale-105' : 'text-slate-500 hover:text-slate-300 border-transparent'}`}
                 >
                   Dreams
                 </button>
                 <button 
                   onClick={() => setActiveModule('goals')} 
                   className={`px-8 py-3.5 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] transition-all duration-300 border ${activeModule === 'goals' ? 'bg-neon-blue/30 text-white shadow-[0_0_25px_rgba(0,243,255,0.4)] border-neon-blue/60 scale-105' : 'text-slate-500 hover:text-slate-300 border-transparent'}`}
                 >
                   Goals
                 </button>
               </div>
               
               <div className="w-px h-10 bg-white/10 mx-3 hidden sm:block"></div>
               
               <button 
                 onClick={() => signOut(auth)}
                 className="p-3.5 text-slate-500 hover:text-neon-red hover:bg-neon-red/10 rounded-2xl transition-all group"
                 title="Sair"
               >
                 <LogOut size={22} className="group-hover:scale-110 transition-transform" />
               </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-10">
        {activeModule === 'dreams' ? (
          <DreamsModule data={data} onUpdate={handleUpdate} onBack={() => setActiveModule('dashboard')} />
        ) : activeModule === 'goals' ? (
          <GoalsModule data={data} onUpdate={handleUpdate} onBack={() => setActiveModule('dashboard')} />
        ) : (
          <>
            <Dashboard data={data} />
            <div className="flex flex-col lg:flex-row gap-10 items-start mt-12">
              <div className="flex-1 w-full space-y-8">
                <div className="flex items-center justify-between pl-5 border-l-4 border-neon-green/60 bg-gradient-to-r from-neon-green/5 to-transparent py-2 rounded-r-2xl">
                  <h3 className="text-[11px] font-black text-neon-green uppercase tracking-[0.4em]">Minhas Entradas</h3>
                  <div className="flex items-center gap-3">
                    <Button onClick={collapseAll} variant="ghost" className="h-9 px-3 text-[9px] font-black opacity-50 hover:opacity-100"><ChevronUp size={14}/> Recolher</Button>
                    <Button onClick={() => { setNewSessionType('income'); setIsCreateModalOpen(true); }} variant="secondary" className="h-9 px-4 text-[9px] font-black"><Plus size={14}/> Nova Sessão</Button>
                  </div>
                </div>
                {data.customSections.filter(s => s.type === 'income').map((section, idx) => (
                  <DraggableModuleWrapper key={section.id} id={section.id} index={idx} onMove={(f,t) => handleMoveSection(f, t, 'income')}>
                    <CustomSectionModule section={section} onUpdate={updateSection} onDeleteSection={() => deleteSection(section.id)} isOpen={expandedSections.has(section.id)} onToggle={() => toggleSection(section.id)} />
                  </DraggableModuleWrapper>
                ))}
              </div>

              <div className="flex-1 w-full space-y-8">
                <div className="flex items-center justify-between pl-5 border-l-4 border-neon-red/60 bg-gradient-to-r from-neon-red/5 to-transparent py-2 rounded-r-2xl">
                  <h3 className="text-[11px] font-black text-neon-red uppercase tracking-[0.4em]">Meus Pagamentos</h3>
                  <div className="flex items-center gap-3">
                    <Button onClick={collapseAll} variant="ghost" className="h-9 px-3 text-[9px] font-black opacity-50 hover:opacity-100"><ChevronUp size={14}/> Recolher Tudo</Button>
                    <Button onClick={() => { setNewSessionType('expense'); setIsCreateModalOpen(true); }} variant="secondary" className="h-9 px-4 text-[9px] font-black"><Plus size={14}/> Nova Sessão</Button>
                  </div>
                </div>
                {data.customSections.filter(s => s.type === 'expense').map((section, idx) => (
                  <DraggableModuleWrapper key={section.id} id={section.id} index={idx} onMove={(f,t) => handleMoveSection(f, t, 'expense')}>
                    <CustomSectionModule section={section} onUpdate={updateSection} onDeleteSection={() => deleteSection(section.id)} isOpen={expandedSections.has(section.id)} onToggle={() => toggleSection(section.id)} />
                  </DraggableModuleWrapper>
                ))}
              </div>
            </div>
          </>
        )}
      </main>

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title={`Nova Sessão de ${newSessionType === 'income' ? 'Entrada' : 'Saída'}`} onConfirm={handleCreateSession}>
        <div className="space-y-6 py-4">
          <Input label="Nome da Sessão" placeholder="EX: SALÁRIO, ALUGUEL, CARTÃO..." value={newSessionName} onChange={e => setNewSessionName(e.target.value)} />
          <Select label="Tipo de Registro" value={newSessionStructure} onChange={e => setNewSessionStructure(e.target.value as any)} options={[{ value: 'standard', label: 'Simples' }, { value: 'installment', label: 'Parcelamento' }]} />
        </div>
      </Modal>

      <FloatingControls balance={balance} isVisible={scrollY > 150} onCollapse={collapseAll} />
      <BottomMobileNav balance={balance} onScrollTo={() => {}} onOpenDreams={() => setActiveModule('dreams')} onOpenGoals={() => setActiveModule('goals')} active={activeModule} />
    </div>
  );
}
export default App;
