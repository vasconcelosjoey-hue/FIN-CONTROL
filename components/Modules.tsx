import React, { useState, useEffect, useRef } from 'react';
import { FinancialData, CustomSection, SectionItem, RadarItem, DreamItem, PixKey, CreditCard, Goal, NATIVE_WALLET_ID } from '../types';
import { CollapsibleCard, Button, Input, CurrencyInput, Select, Badge, Card, Modal } from './ui/UIComponents';
import { Trash2, Plus, Wallet, GripVertical, Target, Pencil, Check, X, CreditCard as CCIcon, Zap, Power, Star, ArrowLeft, Trophy, CalendarCheck, CheckCircle2, AlertTriangle, DollarSign, Rocket, Sparkles, TrendingUp, ArrowUpRight } from 'lucide-react';

const AddForm = ({ children, onAdd }: { children?: React.ReactNode, onAdd: () => void }) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onAdd();
    }
  };

  return (
    <div className="mb-4 pt-4 border-t border-white/5" onKeyDown={handleKeyDown}>
      {children}
      <div className="mt-3">
        <Button onClick={onAdd} variant="primary" className="w-full h-10 sm:h-12 shadow-lg">
          <Plus size={14} /> NOVO REGISTRO
        </Button>
      </div>
    </div>
  );
};

const fmt = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const getInstallmentMonth = (startMonth?: string, current: number = 1) => {
  if (!startMonth) return '---';
  try {
    const parts = startMonth.split('-');
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const targetDate = new Date(year, (month - 1) + (current - 1), 15);
    return targetDate.toLocaleString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');
  } catch (e) {
    return '---';
  }
};

const ActionButton = ({ onClick, icon, color = "text-slate-600 hover:text-white" }: { onClick: () => void, icon: React.ReactNode, color?: string }) => (
  <button onClick={(e) => { e.stopPropagation(); onClick(); }} className={`${color} transition-colors p-1.5 sm:p-2 rounded-lg hover:bg-white/5 shrink-0`}>
    {icon}
  </button>
);

const DraggableRow: React.FC<{ children: React.ReactNode; index: number; listId: string; onMove: (f: number, t: number) => void }> = ({ children, index, listId, onMove }) => {
  const [dragState, setDragState] = useState<'none' | 'top' | 'bottom'>('none');
  const [isDragging, setIsDragging] = useState(false);
  const scrollInterval = useRef<number | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);

  const handleDragOverGlobal = (e: DragEvent) => {
    const threshold = 120;
    if (e.clientY < threshold) {
      if (!scrollInterval.current) {
        scrollInterval.current = window.setInterval(() => window.scrollBy(0, -12), 10);
      }
    } else if (e.clientY > window.innerHeight - threshold) {
      if (!scrollInterval.current) {
        scrollInterval.current = window.setInterval(() => window.scrollBy(0, 12), 10);
      }
    } else {
      if (scrollInterval.current) {
        clearInterval(scrollInterval.current);
        scrollInterval.current = null;
      }
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.closest('button')) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('type', 'ROW');
    e.dataTransfer.setData('listId', listId);
    e.dataTransfer.setData('rowIndex', index.toString());
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
    window.addEventListener('dragover', handleDragOverGlobal);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragState('none');
    window.removeEventListener('dragover', handleDragOverGlobal);
    if (scrollInterval.current) {
      clearInterval(scrollInterval.current);
      scrollInterval.current = null;
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    const srcListId = e.dataTransfer.getData('listId');
    if (srcListId !== listId) return;
    if (rowRef.current) {
      const rect = rowRef.current.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      setDragState(e.clientY < mid ? 'top' : 'bottom');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const srcListId = e.dataTransfer.getData('listId');
    if (srcListId !== listId) return;
    const fromIdx = parseInt(e.dataTransfer.getData('rowIndex'));
    if (isNaN(fromIdx) || fromIdx === index) {
      setDragState('none');
      return;
    }
    onMove(fromIdx, index);
    setDragState('none');
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.closest('button')) return;
    touchStartY.current = e.touches[0].clientY;
  };

  return (
    <div 
      ref={rowRef}
      draggable 
      onDragStart={handleDragStart} 
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={() => setDragState('none')}
      onDrop={handleDrop}
      onTouchStart={handleTouchStart}
      className={`relative flex items-center group/row transition-all duration-200 py-1 select-none sm:select-auto
        ${isDragging ? 'opacity-20 grayscale scale-95' : 'opacity-100 scale-100'}
        ${dragState === 'top' ? 'pt-2 sm:pt-4' : ''}
        ${dragState === 'bottom' ? 'pb-2 sm:pb-4' : ''}
      `}
    >
      {dragState !== 'none' && (
        <div className={`absolute left-10 sm:left-16 right-0 h-1 bg-neon-blue shadow-[0_0_15px_rgba(0,243,255,0.8)] rounded-full z-10 transition-all
          ${dragState === 'top' ? 'top-0' : 'bottom-0'}
        `}></div>
      )}
      <div className="mr-2 sm:mr-4 text-neon-blue drop-shadow-[0_0_8px_rgba(0,243,255,1)] transition-all shrink-0 cursor-grab active:cursor-grabbing p-1.5 sm:p-2 bg-neon-blue/10 rounded-xl border border-neon-blue/40 flex items-center justify-center hover:bg-neon-blue/20">
        <GripVertical size={16} className="sm:w-5 sm:h-5" />
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
};

const EditRowLayout: React.FC<{ children: React.ReactNode, onSave: () => void, onCancel: () => void }> = ({ children, onSave, onCancel }) => (
  <div className="w-full flex flex-col gap-3 py-2 px-1" onKeyDown={e => e.key === 'Enter' && onSave()}>
    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 w-full items-end">{children}</div>
    <div className="flex gap-2 w-full pt-1">
      <Button onClick={onSave} variant="primary" className="flex-1 h-10 text-[9px] font-black"><Check size={14} /> OK</Button>
      <Button onClick={onCancel} variant="secondary" className="flex-1 h-10 text-[9px] font-black"><X size={14} /> X</Button>
    </div>
  </div>
);

const ToggleStatusButton = ({ active, onClick, color }: { active: boolean, onClick: () => void, color: string }) => (
  <button 
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className={`flex items-center justify-center gap-1.5 px-2 py-1.5 sm:px-4 sm:py-2 rounded-xl border text-[8px] sm:text-[9px] font-black tracking-widest transition-all active:scale-95 shrink-0 ${
      active ? `bg-neon-green/20 border-neon-green/60 text-neon-green` : `bg-neon-red/20 border-neon-red/60 text-neon-red`
    }`}
  >
    <Power size={12} /> {active ? 'ON' : 'OFF'}
  </button>
);

export const CustomSectionModule: React.FC<{ 
    section: CustomSection, 
    walletSection?: CustomSection,
    onUpdate: (s: CustomSection, immediate?: boolean) => void, 
    onDeleteSection: () => void, 
    isOpen?: boolean, 
    onToggle?: () => void 
}> = ({ section, walletSection, onUpdate, onDeleteSection, isOpen, onToggle }) => {
  const [name, setName] = useState('');
  const [val, setVal] = useState(0);
  const [count, setCount] = useState('');
  const [start, setStart] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<SectionItem>>({});
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [payInstallmentModal, setPayInstallmentModal] = useState<{ isOpen: boolean, item?: SectionItem }>({ isOpen: false });
  const [transferModal, setTransferModal] = useState<{ isOpen: boolean, sourceItem?: SectionItem }>({ isOpen: false });

  const total = section.items.filter(i => i.isActive !== false).reduce((acc, curr) => acc + (curr.value - (curr.paidAmount || 0)), 0);
  const color = section.type === 'income' ? 'green' : 'red';
  const isInstallment = section.structure === 'installment';
  const isWallet = section.id === NATIVE_WALLET_ID;

  const handleAdd = () => {
    if (!name) return;
    const newItem: SectionItem = { 
      id: Math.random().toString(36).substr(2, 9), 
      name: name.toUpperCase(), 
      value: val, 
      isActive: true,
      ...(isInstallment ? { installmentsCount: parseInt(count) || 1, currentInstallment: 1, startMonth: start || new Date().toISOString().slice(0, 7) } : {})
    };
    onUpdate({ ...section, items: [...section.items, newItem] }, true);
    setName(''); setVal(0); setCount(''); setStart('');
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    onUpdate({ ...section, items: section.items.map(i => i.id === editingId ? { ...i, ...editData } : i) }, true);
    setEditingId(null);
  };

  // Define handleQuickPay to fix missing name error
  const handleQuickPay = (itemId: string, paidAmount: number) => {
    onUpdate({
      ...section,
      items: section.items.map(item => 
        item.id === itemId ? { ...item, paidAmount } : item
      )
    }, true);
  };

  const handleConfirmTransfer = (targetItemId: string) => {
      const source = transferModal.sourceItem;
      if (!source || !walletSection) return;
      const amountToTransfer = (source.value - (source.paidAmount || 0));
      const event = new CustomEvent('transfer-to-wallet', { detail: { targetItemId, amount: amountToTransfer } });
      window.dispatchEvent(event);
      setTransferModal({ isOpen: false });
  };

  useEffect(() => {
    if (!isWallet) return;
    const handler = (e: any) => {
        const { targetItemId, amount } = e.detail;
        const newItems = section.items.map(item => item.id === targetItemId ? { ...item, value: item.value + amount } : item);
        onUpdate({ ...section, items: newItems }, true);
    };
    window.addEventListener('transfer-to-wallet', handler);
    return () => window.removeEventListener('transfer-to-wallet', handler);
  }, [isWallet, section, onUpdate]);

  return (
    <>
      <CollapsibleCard 
        title={isWallet ? "WALLET" : section.title} 
        totalValue={`R$ ${fmt(total)}`} 
        color={isWallet ? 'green' : color} 
        isOpen={isOpen}
        onToggle={onToggle}
        icon={isWallet ? <Wallet size={16} className="text-neon-green" /> : (section.type === 'income' ? <Plus size={16}/> : (isInstallment ? <CalendarCheck size={16}/> : <Zap size={16}/>))} 
        onEditTitle={isWallet ? undefined : (nt) => onUpdate({...section, title: nt}, true)}
      >
        {!isWallet && (
            <div className="flex justify-end mb-2">
               <button onClick={() => setIsDeleteModalOpen(true)} className="text-[9px] font-black uppercase tracking-widest text-neon-red flex items-center gap-1 transition-colors">
                 <Trash2 size={10} /> EXCLUIR SESSÃO
               </button>
            </div>
        )}
        
        <AddForm onAdd={handleAdd}>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3">
            <div className={`${isInstallment ? 'sm:col-span-4' : 'sm:col-span-7'}`}><Input label="Descrição" placeholder="SALÁRIO, ALUGUEL..." value={name} onChange={e => setName(e.target.value)} /></div>
            <div className={`${isInstallment ? 'sm:col-span-3' : 'sm:col-span-5'}`}><CurrencyInput label={isInstallment ? "Parcela" : "Valor"} value={val} onValueChange={setVal} /></div>
            {isInstallment && (
              <>
                <div className="sm:col-span-2"><Input label="Parc." type="number" value={count} onChange={e => setCount(e.target.value)} placeholder="12" /></div>
                <div className="sm:col-span-3"><Input label="Mês 1" type="month" value={start} onChange={e => setStart(e.target.value)} /></div>
              </>
            )}
          </div>
        </AddForm>

        <div className="flex flex-col gap-1.5 mt-2">
          {section.items.map((item, idx) => (
            <DraggableRow key={item.id} index={idx} listId={section.id} onMove={(f, t) => { 
                const n = [...section.items]; const [movedItem] = n.splice(f, 1); n.splice(t, 0, movedItem); onUpdate({...section, items: n}, true); 
            }}>
              <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-white/[0.04] border border-white/5 hover:border-white/10 rounded-xl transition-all gap-3">
                {editingId === item.id ? (
                  <EditRowLayout onSave={handleSaveEdit} onCancel={() => setEditingId(null)}>
                    <div className={`${isInstallment ? 'sm:col-span-4' : 'sm:col-span-8'}`}><Input label="NOME" value={editData.name || ''} onChange={e => setEditData({...editData, name: e.target.value})} /></div>
                    <div className="sm:col-span-4"><CurrencyInput label="VALOR" value={editData.value || 0} onValueChange={v => setEditData({...editData, value: v})} /></div>
                    {isInstallment && (<div className="sm:col-span-2"><Input label="PARC" type="number" value={String(editData.installmentsCount || '')} onChange={e => setEditData({...editData, installmentsCount: parseInt(e.target.value)})} /></div>)}
                  </EditRowLayout>
                ) : (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className={`font-black text-xs sm:text-base tracking-tight truncate ${item.isActive !== false ? 'text-white' : 'text-slate-700 line-through'}`}>{item.name}</p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {isInstallment && (
                          <div className="flex items-center gap-1 shrink-0">
                             <Badge color="yellow">{item.currentInstallment}/{item.installmentsCount}X</Badge>
                             <div className="flex items-center bg-black/40 rounded-lg pr-1.5 border border-white/5">
                                <button onClick={() => setPayInstallmentModal({ isOpen: true, item })} className="bg-neon-green/10 text-neon-green p-1 rounded-l-lg hover:bg-neon-green hover:text-black transition-all"><CheckCircle2 size={10} /></button>
                                <span className="text-[9px] font-black text-neon-yellow ml-1">{getInstallmentMonth(item.startMonth, item.currentInstallment)}</span>
                             </div>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded-lg border border-white/5">
                            <span className="text-[7px] font-black text-slate-600 uppercase tracking-tighter">PAGO</span>
                            <CurrencyInput className="h-4 w-20 text-[11px] bg-transparent border-none p-0 focus:ring-0 font-black text-neon-green" value={item.paidAmount || 0} onValueChange={(v) => handleQuickPay(item.id, v)} />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1 sm:pt-0 border-t border-white/5 sm:border-none">
                      <span className={`font-mono font-black text-base sm:text-xl ${item.isActive !== false ? (section.type === 'income' ? 'text-neon-green' : 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]') : 'text-slate-800'}`}>R$ {fmt(item.value - (item.paidAmount || 0))}</span>
                      <div className="flex items-center gap-1">
                        {section.type === 'income' && !isWallet && (
                          <button onClick={(e) => { e.stopPropagation(); setTransferModal({ isOpen: true, sourceItem: item }); }} className="bg-neon-blue/20 text-neon-blue border border-neon-blue/30 px-2 py-1.5 rounded-xl text-[8px] font-black hover:bg-neon-blue hover:text-black transition-all flex items-center gap-1 uppercase"><ArrowUpRight size={10} /> ADD</button>
                        )}
                        <ToggleStatusButton active={item.isActive !== false} onClick={() => onUpdate({...section, items: section.items.map(i => i.id === item.id ? {...i, isActive: !i.isActive} : i)}, true)} color={color} />
                        <ActionButton icon={<Pencil size={14} />} onClick={() => { setEditingId(item.id); setEditData(item); }} />
                        <ActionButton icon={<Trash2 size={14} />} color="text-neon-red" onClick={() => setItemToDelete(item.id)} />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </DraggableRow>
          ))}
        </div>
      </AddForm>

      <Modal isOpen={!!itemToDelete} onClose={() => setItemToDelete(null)} title="Excluir?" confirmText="Sim" confirmVariant="danger" onConfirm={() => { if (itemToDelete) onUpdate({ ...section, items: section.items.filter(i => i.id !== itemToDelete) }, true); setItemToDelete(null); }}>Deseja apagar permanentemente?</Modal>
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Excluir Sessão?" confirmText="Sim" confirmVariant="danger" onConfirm={onDeleteSection}>Deseja excluir permanentemente a sessão <strong className="text-white">"{section.title}"</strong>?</Modal>
      <Modal isOpen={payInstallmentModal.isOpen} onClose={() => setPayInstallmentModal({ isOpen: false })} title="Avançar?" confirmText="Confirmar" onConfirm={() => payInstallmentModal.item && ( (item) => { const isLast = (item.currentInstallment || 1) >= (item.installmentsCount || 1); if (isLast) onUpdate({ ...section, items: section.items.filter(i => i.id !== item.id) }, true); else onUpdate({ ...section, items: section.items.map(i => i.id === item.id ? { ...i, currentInstallment: (i.currentInstallment || 1) + 1, paidAmount: 0 } : i) }, true); })(payInstallmentModal.item)}>Avançar para a próxima parcela?</Modal>
      <Modal isOpen={transferModal.isOpen} onClose={() => setTransferModal({ isOpen: false })} title="ADICIONAR À WALLET" confirmText="Cancelar" onConfirm={() => setTransferModal({ isOpen: false })}>
        <div className="space-y-4">
            <p className="text-[10px] uppercase font-bold text-slate-500">Escolha um item da sua Wallet para receber o valor de <strong className="text-neon-blue">R$ {fmt(transferModal.sourceItem ? (transferModal.sourceItem.value - (transferModal.sourceItem.paidAmount || 0)) : 0)}</strong>:</p>
            {walletSection && walletSection.items.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                    {walletSection.items.map(walletItem => (
                        <button key={walletItem.id} onClick={() => handleConfirmTransfer(walletItem.id)} className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl flex justify-between items-center hover:bg-neon-blue/10 hover:border-neon-blue/50 transition-all text-left group">
                            <span className="font-black text-xs text-white group-hover:text-neon-blue uppercase">{walletItem.name}</span>
                            <span className="font-mono text-xs text-slate-400">R$ {fmt(walletItem.value)}</span>
                        </button>
                    ))}
                </div>
            ) : (<div className="p-4 border border-dashed border-white/20 rounded-2xl text-center text-slate-600 uppercase font-black text-[10px]">Nenhum item cadastrado na Wallet</div>)}
        </div>
      </Modal>
    </>
  );
};

export const DreamsModule: React.FC<{ data: FinancialData, onUpdate: (newDataOrUpdater: FinancialData | ((prev: FinancialData) => FinancialData), immediate?: boolean) => void, onBack: () => void }> = ({ data, onUpdate, onBack }) => {
  const [name, setName] = useState('');
  const [val, setVal] = useState(0);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const handleAdd = () => { if (!name || val <= 0) return; const newItem: DreamItem = { id: Math.random().toString(36).substr(2, 9), name: name.toUpperCase(), value: val, isActive: true }; onUpdate({ ...data, dreams: [...data.dreams, newItem] }, true); setName(''); setVal(0); };
  const deleteDream = (id: string) => { onUpdate({ ...data, dreams: data.dreams.filter(d => d.id !== id) }, true); setItemToDelete(null); };
  const totalDreamsValue = data.dreams.filter(d => d.isActive).reduce((acc, d) => acc + d.value, 0);
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between"><button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors group"><ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /><span className="text-xs font-black uppercase tracking-widest">Voltar</span></button><div className="flex items-center gap-2 text-neon-pink"><Star size={24} fill="currentColor" /><h2 className="text-2xl font-black uppercase tracking-tighter">Dreams</h2></div></div>
      <Card className="border-neon-pink/20 bg-neon-pink/5"><div className="flex flex-col sm:flex-row justify-between items-center gap-4"><div className="flex flex-col items-center sm:items-start"><span className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Total Desejado</span><span className="text-3xl font-black text-white">R$ {fmt(totalDreamsValue)}</span></div><div className="w-full sm:w-64"><CurrencyInput label="Orçamento Mensal para Sonhos" value={data.dreamsTotalBudget || 0} onValueChange={(v) => onUpdate({...data, dreamsTotalBudget: v}, false)} /></div></div></Card>
      <AddForm onAdd={handleAdd}><div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><Input label="Qual o seu sonho?" placeholder="VIAGEM, CARRO..." value={name} onChange={e => setName(e.target.value)} /><CurrencyInput label="Valor Estimado" value={val} onValueChange={setVal} /></div></AddForm>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.dreams.map(dream => (
          /* Fix: Wrap Card in div with key to avoid TypeScript error on custom component */
          <div key={dream.id}>
            <Card className={`border-white/5 hover:border-neon-pink/30 group transition-all ${!dream.isActive ? 'opacity-50' : ''}`}><div className="flex justify-between items-start gap-4"><div className="flex-1"><div className="flex items-center gap-2 mb-1">{dream.isActive ? <Rocket size={14} className="text-neon-pink" /> : <Sparkles size={14} className="text-slate-500" />}<h4 className="font-black text-lg text-white uppercase tracking-tight truncate">{dream.name}</h4></div><p className="font-mono font-black text-neon-pink">R$ {fmt(dream.value)}</p></div><div className="flex flex-col gap-2"><button onClick={() => onUpdate({ ...data, dreams: data.dreams.map(d => d.id === dream.id ? { ...d, isActive: !d.isActive } : d) }, true)} className={`p-2 rounded-xl border transition-all ${dream.isActive ? 'bg-neon-pink/20 border-neon-pink text-white' : 'bg-white/5 border-white/10 text-slate-500'}`}><Power size={16} /></button><button onClick={() => setItemToDelete(dream.id)} className="p-2 rounded-xl border border-white/10 text-neon-red hover:bg-neon-red/10 transition-all"><Trash2 size={16} /></button></div></div></Card>
          </div>
        ))}
      </div>
      <Modal isOpen={!!itemToDelete} onClose={() => setItemToDelete(null)} title="Excluir Sonho?" confirmVariant="danger" onConfirm={() => itemToDelete && deleteDream(itemToDelete)}>Deseja remover este sonho permanentemente?</Modal>
    </div>
  );
};

export const GoalsModule: React.FC<{ data: FinancialData, onUpdate: (newDataOrUpdater: FinancialData | ((prev: FinancialData) => FinancialData), immediate?: boolean) => void, onBack: () => void }> = ({ data, onUpdate, onBack }) => {
  const [name, setName] = useState(''); const [target, setTarget] = useState(0); const [color, setColor] = useState<'blue' | 'pink' | 'green' | 'yellow'>('blue'); const [deadline, setDeadline] = useState(''); const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const handleAdd = () => { if (!name || target <= 0) return; const newItem: Goal = { id: Math.random().toString(36).substr(2, 9), name: name.toUpperCase(), targetValue: target, currentValue: 0, color, deadline }; onUpdate({ ...data, goals: [...data.goals, newItem] }, true); setName(''); setTarget(0); setDeadline(''); };
  const deleteGoal = (id: string) => { onUpdate({ ...data, goals: data.goals.filter(g => g.id !== id) }, true); setItemToDelete(null); };
  const updateGoalValue = (id: string, newVal: number) => { onUpdate({ ...data, goals: data.goals.map(g => g.id === id ? { ...g, currentValue: Math.max(0, newVal) } : g) }, false); };
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between"><button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors group"><ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /><span className="text-xs font-black uppercase tracking-widest">Voltar</span></button><div className="flex items-center gap-2 text-neon-blue"><Target size={24} /><h2 className="text-2xl font-black uppercase tracking-tighter">Goals</h2></div></div>
      <AddForm onAdd={handleAdd}><div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"><div className="sm:col-span-4"><Input label="Objetivo" placeholder="RESERVA, INVESTIMENTO..." value={name} onChange={e => setName(e.target.value)} /></div><div className="sm:col-span-3"><CurrencyInput label="Meta" value={target} onValueChange={setTarget} /></div><div className="sm:col-span-2"><Select label="Cor" value={color} onChange={e => setColor(e.target.value as any)} options={[{value:'blue', label:'Azul'}, {value:'pink', label:'Rosa'}, {value:'green', label:'Verde'}, {value:'yellow', label:'Amarelo'}]} /></div><div className="sm:col-span-3"><Input label="Prazo (Opcional)" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} /></div></div></AddForm>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {data.goals.map(goal => {
          const progress = Math.min(100, (goal.currentValue / goal.targetValue) * 100);
          const barColorClass = { blue: 'bg-neon-blue shadow-neon-blue', pink: 'bg-neon-pink shadow-neon-pink', green: 'bg-neon-green shadow-neon-green', yellow: 'bg-neon-yellow shadow-neon-yellow' }[goal.color];
          const colorClass = { blue: 'text-neon-blue bg-neon-blue/20 border-neon-blue/40', pink: 'text-neon-pink bg-neon-pink/20 border-neon-pink/40', green: 'text-neon-green bg-neon-green/20 border-neon-green/40', yellow: 'text-neon-yellow bg-neon-yellow/20 border-neon-yellow/40' }[goal.color];
          return (
            /* Fix: Wrap Card in div with key to avoid TypeScript error on custom component */
            <div key={goal.id}>
              <Card className="border-white/5 relative overflow-hidden group">
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4"><div><div className="flex items-center gap-2 mb-1"><div className={`p-1.5 rounded-lg border ${colorClass}`}><Trophy size={14} /></div><h4 className="font-black text-lg text-white uppercase tracking-tight">{goal.name}</h4></div>{goal.deadline && (<p className="text-[8px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1"><CalendarCheck size={10} /> Meta até {new Date(goal.deadline).toLocaleDateString('pt-BR')}</p>)}</div><button onClick={() => setItemToDelete(goal.id)} className="text-neon-red transition-colors p-2"><Trash2 size={16} /></button></div>
                  <div className="space-y-2 mb-6"><div className="flex justify-between items-end"><div className="flex flex-col"><span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Acumulado</span><span className={`text-xl font-black ${goal.color === 'blue' ? 'text-neon-blue' : goal.color === 'pink' ? 'text-neon-pink' : goal.color === 'green' ? 'text-neon-green' : 'text-neon-yellow'}`}>R$ {fmt(goal.currentValue)}</span></div><div className="text-right"><span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Objetivo</span><p className="text-sm font-black text-white">R$ {fmt(goal.targetValue)}</p></div></div><div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5"><div className={`h-full rounded-full transition-all duration-1000 ease-out ${barColorClass}`} style={{ width: `${progress}%` }}></div></div><div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-500"><span>{progress.toFixed(0)}% Concluído</span><span>Restam R$ {fmt(Math.max(0, goal.targetValue - goal.currentValue))}</span></div></div>
                  <div className="grid grid-cols-2 gap-2"><CurrencyInput label="Adicionar / Ajustar" value={goal.currentValue} onValueChange={(v) => updateGoalValue(goal.id, v)} /><div className="flex items-end gap-1"><Button onClick={() => updateGoalValue(goal.id, goal.currentValue + 50)} variant="secondary" className="flex-1 h-10">+50</Button><Button onClick={() => updateGoalValue(goal.id, goal.currentValue + 100)} variant="secondary" className="flex-1 h-10">+100</Button></div></div>
                </div>
              </Card>
            </div>
          );
        })}
      </div>
      <Modal isOpen={!!itemToDelete} onClose={() => setItemToDelete(null)} title="Excluir Meta?" confirmVariant="danger" onConfirm={() => itemToDelete && deleteGoal(itemToDelete)}>Deseja remover esta meta permanentemente?</Modal>
    </div>
  );
};