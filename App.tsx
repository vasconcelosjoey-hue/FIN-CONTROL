
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { FinancialData, INITIAL_DATA, CustomSection } from './types';
import { loadData, saveToLocal, saveToCloud, subscribeToData } from './services/dataService';
import { Dashboard } from './components/Dashboard';
import { CustomSectionModule, CreditCardModule, PixModule, RadarModule, DreamsModule } from './components/Modules';
import { RefreshCw, Plus, Cloud, ShieldCheck, Star } from 'lucide-react';
import { DraggableModuleWrapper, Modal, Input, Button, Select } from './components/ui/UIComponents';

const REQUESTED_USER_ID = "GWDk0P5fbhdiLRovli43syBaHUG2";

const getPersistentUserId = () => {
  localStorage.setItem('fincontroller_user_id', REQUESTED_USER_ID);
  return REQUESTED_USER_ID;
};

const BottomMobileNav = ({ balance, onOpenDreams }: { balance: number, onScrollTo: (id: string) => void, onOpenDreams: () => void }) => {
  const fmt = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] sm:hidden bg-neon-dark/95 backdrop-blur-xl border-t border-white/10 px-4 py-4 flex items-center justify-between gap-2 shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
      <div className="flex flex-col items-center bg-black/60 border border-white/10 px-4 py-2 rounded-2xl">
        <span className="text-[7px] text-slate-500 font-black uppercase mb-0.5 tracking-widest">Saldo Geral</span>
        <span className={`text-xs font-black tracking-tighter ${balance >= 0 ? 'text-neon-yellow shadow-neon-yellow/10' : 'text-neon-red shadow-neon-red/10'}`}>
          R$ {fmt(balance)}
        </span>
      </div>
      <button onClick={onOpenDreams} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-gradient-to-br from-neon-blue to-neon-pink shadow-xl transform active:scale-95 transition-all">
        <Star size={18} className="text-white" />
        <span className="text-[8px] font-black text-white uppercase tracking-widest">Dreams</span>
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
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newSessionType, setNewSessionType] = useState<'income' | 'expense'>('expense');
  const [newSessionName, setNewSessionName] = useState('');
  const [newSessionStructure, setNewSessionStructure] = useState<'standard' | 'installment'>('standard');

  const isInternalUpdate = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const normalizeData = (d: FinancialData) => {
    if (!d) return INITIAL_DATA;
    const clean = { ...INITIAL_DATA, ...d };
    if (!clean.sectionsOrder) clean.sectionsOrder = clean.customSections?.map(s => s.id) || [];
    return clean;
  };

  const syncToCloud = useCallback((targetData: FinancialData, immediate = false) => {
    setIsSyncing(true);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    const performSync = async () => {
      try { await saveToCloud(userId, targetData); setIsSyncing(false); }
      catch (err) { setIsSyncing(false); }
    };
    if (immediate) performSync();
    else saveTimeoutRef.current = setTimeout(performSync, 2000);
  }, [userId]);

  const handleUpdate = useCallback((newDataOrUpdater: FinancialData | ((prev: FinancialData) => FinancialData), immediate = false) => {
    const now = Date.now();
    isInternalUpdate.current = true;
    setData(prev => {
      const next = typeof newDataOrUpdater === 'function' ? newDataOrUpdater(prev) : newDataOrUpdater;
      const nextWithTimestamp = { ...next, lastUpdate: now };
      saveToLocal(userId, nextWithTimestamp);
      syncToCloud(nextWithTimestamp, immediate);
      return nextWithTimestamp;
    });
    setTimeout(() => { isInternalUpdate.current = false; }, 3000);
  }, [userId, syncToCloud]);

  useEffect(() => {
    let unsubscribeData: () => void = () => {};
    (async () => {
      try {
        const initialData = await loadData(userId);
        const normalized = normalizeData(initialData);
        setData(normalized);
        unsubscribeData = subscribeToData(userId, (cloudData) => {
          if (!isInternalUpdate.current) setData(normalizeData(cloudData));
        });
      } catch (e) { console.error(e); } finally { setTimeout(() => setLoading(false), 1200); }
    })();
    return () => unsubscribeData();
  }, [userId]);

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

  const handleMoveSection = (from: number, to: number, type: 'income' | 'expense') => {
    const sectionsOfType = data.customSections.filter(s => s.type === type);
    const otherSections = data.customSections.filter(s => s.type !== type);
    
    const newOrder = [...sectionsOfType];
    const [moved] = newOrder.splice(from, 1);
    newOrder.splice(to, 0, moved);
    
    handleUpdate(prev => ({
      ...prev,
      customSections: [...otherSections, ...newOrder],
      sectionsOrder: [...otherSections, ...newOrder].map(s => s.id)
    }), true);
  };

  const calculateBalance = () => {
    const totalInc = data.customSections.filter(s => s.type === 'income').reduce((a, s) => a + s.items.filter(i => i.isActive !== false).reduce((ia, i) => ia + i.value, 0), 0);
    const totalExp = data.customSections.filter(s => s.type === 'expense').reduce((a, s) => a + s.items.filter(i => i.isActive !== false).reduce((ia, i) => ia + (i.value - (i.paidAmount || 0)), 0), 0);
    return totalInc - totalExp;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center p-8">
        <div className="relative mb-14 animate-pulse">
          <div className="p-10 bg-neon-blue/5 rounded-[3.5rem] border-2 border-neon-blue/30 shadow-[0_0_80px_rgba(0,243,255,0.15)]">
            <ShieldCheck className="text-neon-blue w-24 h-24 sm:w-32 sm:h-32" strokeWidth={1} />
          </div>
          <RefreshCw className="absolute -bottom-2 -right-2 animate-spin text-neon-blue w-8 h-8 p-1.5 bg-black border border-neon-blue/50 rounded-full" />
        </div>
        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tighter">FINANCIAL <span className="text-neon-blue drop-shadow-[0_0_20px_rgba(0,243,255,0.5)]">CONTROLLER</span></h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-200 pb-32 relative bg-black font-sans">
      <nav className="border-b border-white/5 bg-neon-surface/90 backdrop-blur-xl sticky top-0 z-50 py-3 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <h1 className="font-black text-xs sm:text-xl tracking-tighter uppercase cursor-pointer" onClick={() => setShowDreams(false)}>
            FINANCIAL <span className="text-neon-blue drop-shadow-[0_0_10px_rgba(0,243,255,0.6)]">CONTROLLER</span>
          </h1>
          <div className="flex items-center gap-2 sm:gap-4">
               <Button onClick={() => setShowDreams(!showDreams)} variant={showDreams ? "secondary" : "primary"} className="px-3 sm:px-6">
                 <Star size={16} className={showDreams ? 'text-neon-yellow' : 'text-white'} /> {showDreams ? 'Módulos' : 'Dreams'}
               </Button>
               <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${isSyncing ? 'border-neon-blue/40 text-neon-blue' : 'border-neon-green/40 text-neon-green'}`}>
                 <Cloud size={12} className={isSyncing ? 'animate-pulse' : ''} />
                 <span className="text-[7px] font-black uppercase tracking-[0.2em]">{isSyncing ? 'Sync...' : 'Cloud'}</span>
               </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-10">
        {showDreams ? (
          <DreamsModule data={data} onUpdate={handleUpdate} onBack={() => setShowDreams(false)} />
        ) : (
          <>
            <Dashboard data={data} />
            
            <div className="flex flex-col lg:flex-row gap-8 items-start mt-10">
              <div className="flex-1 w-full space-y-6">
                <div className="flex items-center justify-between pl-4 border-l-4 border-neon-green/50">
                  <h3 className="text-[10px] font-black text-neon-green uppercase tracking-[0.3em]">Minhas Entradas</h3>
                  <Button onClick={() => { setNewSessionType('income'); setIsCreateModalOpen(true); }} variant="secondary" className="h-8 px-3 text-[8px]"><Plus size={12}/> Criar Sessão</Button>
                </div>
                {data.customSections.filter(s => s.type === 'income').map((section, idx) => (
                  <DraggableModuleWrapper key={section.id} id={section.id} index={idx} onMove={(f,t) => handleMoveSection(f, t, 'income')}>
                    <CustomSectionModule section={section} onUpdate={updateSection} onDeleteSection={() => deleteSection(section.id)} />
                  </DraggableModuleWrapper>
                ))}
                {data.customSections.filter(s => s.type === 'income').length === 0 && (
                  <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[2.5rem] opacity-20">Nenhuma entrada configurada</div>
                )}
              </div>

              <div className="flex-1 w-full space-y-6">
                <div className="flex items-center justify-between pl-4 border-l-4 border-neon-red/50">
                  <h3 className="text-[10px] font-black text-neon-red uppercase tracking-[0.3em]">Meus Pagamentos</h3>
                  <Button onClick={() => { setNewSessionType('expense'); setIsCreateModalOpen(true); }} variant="secondary" className="h-8 px-3 text-[8px]"><Plus size={12}/> Criar Sessão</Button>
                </div>
                {data.customSections.filter(s => s.type === 'expense').map((section, idx) => (
                  <DraggableModuleWrapper key={section.id} id={section.id} index={idx} onMove={(f,t) => handleMoveSection(f, t, 'expense')}>
                    <CustomSectionModule section={section} onUpdate={updateSection} onDeleteSection={() => deleteSection(section.id)} />
                  </DraggableModuleWrapper>
                ))}
                {data.customSections.filter(s => s.type === 'expense').length === 0 && (
                  <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[2.5rem] opacity-20">Nenhuma saída configurada</div>
                )}
              </div>
            </div>

            <div className="mt-20 pt-10 border-t border-white/5 grid grid-cols-1 lg:grid-cols-3 gap-8">
              <CreditCardModule data={data} onUpdate={handleUpdate} />
              <RadarModule data={data} onUpdate={handleUpdate} />
              <PixModule data={data} onUpdate={handleUpdate} />
            </div>
          </>
        )}
      </main>

      <Modal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        title={`Nova Sessão de ${newSessionType === 'income' ? 'Entrada' : 'Saída'}`}
        onConfirm={handleCreateSession}
      >
        <div className="space-y-5 py-4">
          <Input label="Nome da Sessão" placeholder="EX: SALÁRIO, ALUGUEL, LAZER..." value={newSessionName} onChange={e => setNewSessionName(e.target.value)} />
          <Select 
            label="Tipo de Registro" 
            value={newSessionStructure} 
            onChange={e => setNewSessionStructure(e.target.value as any)}
            options={[
              { value: 'standard', label: 'Registro Simples (Apenas Valor)' },
              { value: 'installment', label: 'Parcelamento (Mensalidade + Total)' }
            ]}
          />
        </div>
      </Modal>

      <BottomMobileNav balance={calculateBalance()} onScrollTo={() => {}} onOpenDreams={() => setShowDreams(true)} />
    </div>
  );
}
export default App;
