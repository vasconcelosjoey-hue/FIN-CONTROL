
import React, { useState, useEffect, useRef } from 'react';
import { FinancialData, CustomSection, SectionItem, RadarItem, DreamItem, PixKey, CreditCard, Goal } from '../types';
import { CollapsibleCard, Button, Input, CurrencyInput, Select, Badge, Card, Modal } from './ui/UIComponents';
import { Trash2, Plus, Wallet, GripVertical, Target, Pencil, Check, X, CreditCard as CCIcon, Zap, Power, Star, ArrowLeft, Trophy, CalendarCheck, CheckCircle2, AlertTriangle, DollarSign, Rocket, Sparkles, TrendingUp } from 'lucide-react';

const AddForm = ({ children, onAdd }: { children?: React.ReactNode, onAdd: () => void }) => (
  <div className="mb-4 pt-4 border-t border-white/5" onKeyDown={e => e.key === 'Enter' && onAdd()}>
    {children}
    <Button onClick={onAdd} variant="primary" className="w-full mt-4 h-12 shadow-lg">
      <Plus size={18} /> Adicionar Novo Registro
    </Button>
  </div>
);

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
  <button onClick={(e) => { e.stopPropagation(); onClick(); }} className={`${color} transition-colors p-2 rounded-lg hover:bg-white/5 shrink-0`}>
    {icon}
  </button>
);

// Componente DraggableRow com Reordenação de Precisão e Auto-Scroll
const DraggableRow: React.FC<{ children: React.ReactNode; index: number; listId: string; onMove: (f: number, t: number) => void }> = ({ children, index, listId, onMove }) => {
  const [dragState, setDragState] = useState<'none' | 'top' | 'bottom'>('none');
  const [isDragging, setIsDragging] = useState(false);
  const scrollInterval = useRef<number | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);

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
    const type = e.dataTransfer.getData('type');
    const srcListId = e.dataTransfer.getData('listId');
    // Só permite drag dentro da mesma lista
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

    // Calcula a nova posição baseada em onde soltou (metade de cima ou de baixo)
    let toIdx = index;
    if (dragState === 'bottom' && fromIdx < index) toIdx = index;
    if (dragState === 'top' && fromIdx > index) toIdx = index;
    if (dragState === 'bottom' && fromIdx > index) toIdx = index; // index já é o destino
    if (dragState === 'top' && fromIdx < index) toIdx = index; // index já é o destino

    // Na prática, se soltar na metade de baixo, o item vai para a posição seguinte
    // se soltar na metade de cima, ele assume a posição atual.
    const finalTo = dragState === 'bottom' ? index : index; 
    // O algoritmo de splice(f,1) e splice(t,0,m) já funciona bem se T for o índice alvo.
    
    onMove(fromIdx, index);
    setDragState('none');
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
      className={`relative flex items-center group/row transition-all duration-200 py-1
        ${isDragging ? 'opacity-20 grayscale scale-95' : 'opacity-100 scale-100'}
        ${dragState === 'top' ? 'pt-4' : ''}
        ${dragState === 'bottom' ? 'pb-4' : ''}
      `}
    >
      {/* Indicador Visual de Inserção */}
      {dragState !== 'none' && (
        <div className={`absolute left-16 right-0 h-1 bg-neon-blue shadow-[0_0_15px_rgba(0,243,255,0.8)] rounded-full z-10 transition-all
          ${dragState === 'top' ? 'top-0' : 'bottom-0'}
        `}></div>
      )}

      <div className="mr-4 text-neon-blue drop-shadow-[0_0_12px_rgba(0,243,255,1)] transition-all shrink-0 cursor-grab active:cursor-grabbing p-2 bg-neon-blue/10 rounded-xl border border-neon-blue/40 flex items-center justify-center hover:bg-neon-blue/20">
        <GripVertical size={22} />
      </div>
      
      <div className="flex-1 pointer-events-none sm:pointer-events-auto">
        {children}
      </div>
    </div>
  );
};

const EditRowLayout: React.FC<{ children: React.ReactNode, onSave: () => void, onCancel: () => void }> = ({ children, onSave, onCancel }) => (
  <div className="w-full flex flex-col gap-4 py-4 px-2" onKeyDown={e => e.key === 'Enter' && onSave()}>
    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 w-full items-end">
      {children}
    </div>
    <div className="flex flex-col sm:flex-row gap-3 w-full pt-2">
      <Button onClick={onSave} variant="primary" className="flex-1 h-12 text-[10px] font-black"><Check size={18} /> Confirmar</Button>
      <Button onClick={onCancel} variant="secondary" className="flex-1 h-12 text-[10px] font-black"><X size={18} /> Cancelar</Button>
    </div>
  </div>
);

const ToggleStatusButton = ({ active, onClick, color }: { active: boolean, onClick: () => void, color: string }) => (
  <button 
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl border text-[9px] font-black tracking-[0.2em] transition-all active:scale-95 shrink-0 ${
      active 
      ? `bg-neon-green/20 border-neon-green/60 text-neon-green shadow-[0_0_15px_rgba(10,255,104,0.2)]` 
      : `bg-neon-red/20 border-neon-red/60 text-neon-red shadow-[0_0_15px_rgba(255,0,85,0.2)]`
    }`}
  >
    <Power size={14} /> {active ? 'ON' : 'OFF'}
  </button>
);

export const CustomSectionModule: React.FC<{ section: CustomSection, onUpdate: (s: CustomSection, immediate?: boolean) => void, onDeleteSection: () => void, isOpen?: boolean, onToggle?: () => void }> = ({ section, onUpdate, onDeleteSection, isOpen, onToggle }) => {
  const [name, setName] = useState('');
  const [val, setVal] = useState(0);
  const [count, setCount] = useState('');
  const [start, setStart] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<SectionItem>>({});
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  
  const [payInstallmentModal, setPayInstallmentModal] = useState<{ isOpen: boolean, item?: SectionItem }>({ isOpen: false });

  const total = section.items.filter(i => i.isActive !== false).reduce((acc, curr) => acc + (curr.value - (curr.paidAmount || 0)), 0);
  const color = section.type === 'income' ? 'green' : 'red';
  const isInstallment = section.structure === 'installment';

  const handleAdd = () => {
    if (!name || val === 0) return;
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

  const handlePayInstallment = (item: SectionItem) => {
    const isLast = (item.currentInstallment || 1) >= (item.installmentsCount || 1);
    if (isLast) {
      onUpdate({ ...section, items: section.items.filter(i => i.id !== item.id) }, true);
    } else {
      onUpdate({ 
        ...section, 
        items: section.items.map(i => i.id === item.id ? { ...i, currentInstallment: (i.currentInstallment || 1) + 1, paidAmount: 0 } : i) 
      }, true);
    }
    setPayInstallmentModal({ isOpen: false });
  };

  const handleQuickPay = (itemId: string, paidVal: number) => {
    onUpdate({
        ...section,
        items: section.items.map(i => i.id === itemId ? { ...i, paidAmount: paidVal } : i)
    }, false);
  };

  return (
    <>
      <CollapsibleCard 
        title={section.title} 
        totalValue={`R$ ${fmt(total)}`} 
        color={color} 
        isOpen={isOpen}
        onToggle={onToggle}
        icon={section.type === 'income' ? <Wallet size={18}/> : (isInstallment ? <CalendarCheck size={18}/> : <Zap size={18}/>)} 
        onEditTitle={(nt) => onUpdate({...section, title: nt}, true)}
      >
        <div className="flex justify-end mb-4">
           <button onClick={() => setIsDeleteModalOpen(true)} className="text-[10px] font-black uppercase tracking-widest text-slate-700 hover:text-neon-red flex items-center gap-1 transition-colors"><Trash2 size={10} /> Excluir Sessão</button>
        </div>
        
        <AddForm onAdd={handleAdd}>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className={`${isInstallment ? 'sm:col-span-4' : 'sm:col-span-7'}`}><Input label="Descrição" placeholder="EX: SALÁRIO, ALUGUEL..." value={name} onChange={e => setName(e.target.value)} /></div>
            <div className={`${isInstallment ? 'sm:col-span-3' : 'sm:col-span-5'}`}><CurrencyInput label={isInstallment ? "Vlr Parcela" : "Valor"} value={val} onValueChange={setVal} /></div>
            {isInstallment && (
              <>
                <div className="sm:col-span-2"><Input label="Parcelas" type="number" value={count} onChange={e => setCount(e.target.value)} placeholder="12" /></div>
                <div className="sm:col-span-3"><Input label="Referência (Mês 1)" type="month" value={start} onChange={e => setStart(e.target.value)} /></div>
              </>
            )}
          </div>
        </AddForm>

        <div className="flex flex-col gap-2 mt-4">
          {section.items.map((item, idx) => (
            <DraggableRow key={item.id} index={idx} listId={section.id} onMove={(f, t) => { 
                const n = [...section.items]; 
                const [movedItem] = n.splice(f, 1); 
                n.splice(t, 0, movedItem); 
                onUpdate({...section, items: n}, true); 
            }}>
              <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/[0.04] border border-white/5 hover:border-white/10 rounded-2xl transition-all gap-4">
                {editingId === item.id ? (
                  <EditRowLayout onSave={handleSaveEdit} onCancel={() => setEditingId(null)}>
                    <div className={`${isInstallment ? 'sm:col-span-4' : 'sm:col-span-8'}`}><Input label="NOME" value={editData.name || ''} onChange={e => setEditData({...editData, name: e.target.value})} /></div>
                    <div className="sm:col-span-4"><CurrencyInput label="VALOR" value={editData.value || 0} onValueChange={v => setEditData({...editData, value: v})} /></div>
                    {isInstallment && (
                        <div className="sm:col-span-2"><Input label="PARC" type="number" value={String(editData.installmentsCount || '')} onChange={e => setEditData({...editData, installmentsCount: parseInt(e.target.value)})} /></div>
                    )}
                  </EditRowLayout>
                ) : (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className={`font-black text-sm sm:text-base tracking-tight truncate ${item.isActive !== false ? 'text-white' : 'text-slate-700 line-through'}`}>{item.name}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {isInstallment && (
                          <div className="flex items-center gap-1.5 shrink-0">
                             <Badge color="yellow">{item.currentInstallment}/{item.installmentsCount}X</Badge>
                             <div className="flex items-center bg-black/40 rounded-lg pr-2 border border-white/5 shadow-inner">
                                <button onClick={() => setPayInstallmentModal({ isOpen: true, item })} className="bg-neon-green/10 text-neon-green p-1.5 rounded-l-lg hover:bg-neon-green hover:text-black transition-all"><CheckCircle2 size={12} /></button>
                                <span className="text-[10px] font-black text-neon-yellow ml-2">{getInstallmentMonth(item.startMonth, item.currentInstallment)}</span>
                             </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-xl border border-white/5 shadow-inner">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">PAGO</span>
                            <CurrencyInput 
                                className="h-6 w-32 text-[14px] bg-transparent border-none p-0 focus:ring-0 font-black text-neon-green" 
                                value={item.paidAmount || 0} 
                                onValueChange={(v) => handleQuickPay(item.id, v)} 
                            />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0">
                      <span className={`font-mono font-black text-lg sm:text-xl ${item.isActive !== false ? (section.type === 'income' ? 'text-neon-green' : 'text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]') : 'text-slate-800'}`}>
                        R$ {fmt(item.value - (item.paidAmount || 0))}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <ToggleStatusButton active={item.isActive !== false} onClick={() => onUpdate({...section, items: section.items.map(i => i.id === item.id ? {...i, isActive: !i.isActive} : i)}, true)} color={color} />
                        <ActionButton icon={<Pencil size={16} />} onClick={() => { setEditingId(item.id); setEditData(item); }} />
                        <ActionButton icon={<Trash2 size={16} />} color="text-slate-700 hover:text-neon-red" onClick={() => setItemToDelete(item.id)} />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </DraggableRow>
          ))}
        </div>
      </CollapsibleCard>

      <Modal isOpen={!!itemToDelete} onClose={() => setItemToDelete(null)} title="Excluir Registro?" confirmText="Sim, Apagar" confirmVariant="danger" onConfirm={() => { if (itemToDelete) onUpdate({ ...section, items: section.items.filter(i => i.id !== itemToDelete) }, true); setItemToDelete(null); }}>
        Tem certeza que deseja apagar permanentemente este registro?
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Excluir Sessão?" confirmText="Sim, Apagar Tudo" confirmVariant="danger" onConfirm={onDeleteSection}>
        Deseja excluir permanentemente a sessão <strong className="text-white">"{section.title}"</strong>?
      </Modal>

      <Modal isOpen={payInstallmentModal.isOpen} onClose={() => setPayInstallmentModal({ isOpen: false })} title="Avançar Parcela?" confirmText="Confirmar" onConfirm={() => payInstallmentModal.item && handlePayInstallment(payInstallmentModal.item)}>
        Deseja confirmar o pagamento deste mês e avançar para a próxima parcela?
      </Modal>
    </>
  );
};

export const DreamsModule: React.FC<{ data: FinancialData, onUpdate: (d: FinancialData | ((p: FinancialData) => FinancialData), imm?: boolean) => void, onBack: () => void }> = ({ data, onUpdate, onBack }) => {
  const [name, setName] = useState('');
  const [val, setVal] = useState(0);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const handleAdd = () => {
    if (!name || val === 0) return;
    const newItem: DreamItem = { id: Math.random().toString(36).substr(2, 9), name: name.toUpperCase(), value: val, isActive: true };
    onUpdate((prev: FinancialData) => ({ ...prev, dreams: [...(prev.dreams || []), newItem] }), true);
    setName(''); setVal(0);
  };

  const handleMove = (from: number, to: number) => {
    onUpdate(prev => {
        const next = [...(prev.dreams || [])];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        return { ...prev, dreams: next };
    }, true);
  };

  return (
    <div className="animate-in slide-in-from-right duration-500">
      <div className="flex items-center gap-4 mb-8">
        <Button onClick={onBack} variant="ghost" className="p-2 rounded-full"><ArrowLeft size={24} /></Button>
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">My <span className="text-neon-pink">Dreams</span></h2>
      </div>

      <div className="max-w-3xl mx-auto space-y-8">
        <AddForm onAdd={handleAdd}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Qual o seu sonho?" value={name} onChange={e => setName(e.target.value)} />
            <CurrencyInput label="Valor Estimado" value={val} onValueChange={setVal} />
          </div>
        </AddForm>

        <div className="grid grid-cols-1 gap-4">
          {(data.dreams || []).map((dream, idx) => (
            <DraggableRow key={dream.id} index={idx} listId="dreams-list" onMove={handleMove}>
                <div className="flex-1 p-6 bg-neon-surface/60 border border-white/5 rounded-3xl flex justify-between items-center group transition-all">
                    <div className="flex items-center gap-5">
                        <div className={`p-4 rounded-2xl ${dream.isActive ? 'bg-neon-pink/10 text-neon-pink shadow-[0_0_15px_rgba(188,19,254,0.3)]' : 'bg-slate-900 text-slate-700'}`}><Trophy size={22} /></div>
                        <p className={`font-black text-xl uppercase tracking-tight ${dream.isActive ? 'text-white' : 'text-slate-700 line-through'}`}>{dream.name}</p>
                    </div>
                    <div className="flex items-center gap-6">
                        <p className={`font-mono font-black text-2xl ${dream.isActive ? 'text-white' : 'text-slate-800'}`}>R$ {fmt(dream.value)}</p>
                        <ActionButton icon={<Trash2 size={18} />} color="text-slate-800 hover:text-neon-red" onClick={() => setItemToDelete(dream.id)} />
                    </div>
                </div>
            </DraggableRow>
          ))}
        </div>
      </div>
      <Modal isOpen={!!itemToDelete} onClose={() => setItemToDelete(null)} title="Remover Sonho?" onConfirm={() => { if(itemToDelete) onUpdate(prev => ({ ...prev, dreams: prev.dreams.filter(d => d.id !== itemToDelete) }), true); setItemToDelete(null); }} confirmVariant="danger">
        Confirmar exclusão deste sonho?
      </Modal>
    </div>
  );
};

export const GoalsModule: React.FC<{ data: FinancialData, onUpdate: (d: FinancialData | ((p: FinancialData) => FinancialData), imm?: boolean) => void, onBack: () => void }> = ({ data, onUpdate, onBack }) => {
  const [name, setName] = useState('');
  const [target, setTarget] = useState(0);
  const [depositModal, setDepositModal] = useState<{ isOpen: boolean, goal?: Goal, amount: number }>({ isOpen: false, amount: 0 });
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const handleAddGoal = () => {
    if (!name || target <= 0) return;
    const newGoal: Goal = {
      id: Math.random().toString(36).substr(2, 9),
      name: name.toUpperCase(),
      targetValue: target,
      currentValue: 0,
      color: 'blue'
    };
    onUpdate(prev => ({ ...prev, goals: [...(prev.goals || []), newGoal] }), true);
    setName(''); setTarget(0);
  };

  const handleMove = (from: number, to: number) => {
    onUpdate(prev => {
        const next = [...(prev.goals || [])];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        return { ...prev, goals: next };
    }, true);
  };

  const totalPercent = data.goals.reduce((acc, g) => acc + g.targetValue, 0) > 0 
    ? (data.goals.reduce((acc, g) => acc + g.currentValue, 0) / data.goals.reduce((acc, g) => acc + g.targetValue, 0)) * 100 
    : 0;

  return (
    <div className="animate-in slide-in-from-right duration-500 pb-20">
      <div className="flex items-center gap-4 mb-10">
        <Button onClick={onBack} variant="ghost" className="p-2 rounded-full"><ArrowLeft size={24} /></Button>
        <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Financial <span className="text-neon-blue">Goals</span></h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <Card className="lg:col-span-2 border-neon-blue/20 bg-gradient-to-br from-neon-blue/5 to-transparent p-10 flex items-center gap-10">
          <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
            <svg height="100%" width="100%" viewBox="0 0 100 100" className="transform -rotate-90">
              <circle stroke="#1e1e2e" fill="transparent" strokeWidth="8" r="40" cx="50" cy="50" />
              <circle stroke="#00f3ff" fill="transparent" strokeWidth="8" strokeDasharray="251.2" style={{ strokeDashoffset: 251.2 - (totalPercent / 100) * 251.2 }} strokeLinecap="round" r="40" cx="50" cy="50" className="drop-shadow-[0_0_15px_rgba(0,243,255,0.8)]" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-black text-white">{totalPercent.toFixed(0)}%</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-[11px] text-white font-black uppercase tracking-[0.4em] mb-4 opacity-90">PONTUAÇÃO GLOBAL DE CONQUISTA</p>
            <p className="text-6xl font-black text-white tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">R$ {fmt(data.goals.reduce((acc, g) => acc + g.currentValue, 0))}</p>
          </div>
        </Card>
      </div>

      <div className="max-w-4xl mx-auto mb-16">
        <Card className="p-8 border-neon-blue/40 bg-neon-blue/5" onKeyDown={e => e.key === 'Enter' && handleAddGoal()}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <Input label="NOME DO GOAL" value={name} onChange={e => setName(e.target.value)} />
            <div className="flex items-end gap-4">
              <CurrencyInput label="VALOR ALVO" value={target} onValueChange={setTarget} />
              <Button onClick={handleAddGoal} className="h-12 w-12 rounded-xl p-0"><Plus size={24} /></Button>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {data.goals.map((goal, idx) => {
          const progress = (goal.currentValue / goal.targetValue) * 100;
          const isCompleted = progress >= 100;
          return (
            <DraggableRow key={goal.id} index={idx} listId="goals-list" onMove={handleMove}>
                <Card className={`relative flex flex-col p-8 rounded-[3rem] h-full transition-all w-full border-2 ${isCompleted ? 'border-neon-yellow shadow-[0_0_40px_rgba(255,230,0,0.25)] bg-neon-yellow/5' : 'border-white/10'}`}>
                    <div className="flex justify-between mb-8">
                        <div className={`p-5 rounded-2xl ${isCompleted ? 'bg-neon-yellow/20 text-neon-yellow shadow-neon-yellow/40' : 'bg-white/5 text-slate-500'}`}>{isCompleted ? <Trophy size={28}/> : <Target size={28}/>}</div>
                        <ActionButton icon={<Trash2 size={20}/>} color="text-slate-800 hover:text-neon-red" onClick={() => setItemToDelete(goal.id)} />
                    </div>
                    <h4 className="text-2xl font-black text-white uppercase tracking-tighter mb-6">{goal.name}</h4>
                    <div className="mt-auto">
                        <div className="flex justify-between items-baseline mb-3">
                            <span className="text-3xl font-black text-white">R$ {fmt(goal.currentValue)}</span>
                            <span className="text-[11px] font-black text-white opacity-40">/ R$ {fmt(goal.targetValue)}</span>
                        </div>
                        <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <div style={{ width: `${progress}%` }} className={`h-full ${isCompleted ? 'bg-neon-yellow shadow-[0_0_15px_rgba(255,230,0,0.8)]' : 'bg-neon-blue shadow-[0_0_15px_rgba(0,243,255,0.8)]'} transition-all duration-1000`}></div>
                        </div>
                        <Button onClick={() => setDepositModal({ isOpen: true, goal, amount: 0 })} variant={isCompleted ? "secondary" : "primary"} className="w-full mt-8 h-14 rounded-[1.5rem] shadow-2xl font-black tracking-widest">APORTAR AGORA</Button>
                    </div>
                </Card>
            </DraggableRow>
          );
        })}
      </div>

      <Modal isOpen={depositModal.isOpen} onClose={() => setDepositModal({ isOpen: false, amount: 0 })} title={`Aporte em ${depositModal.goal?.name}`} onConfirm={() => { if(depositModal.goal) onUpdate(prev => ({ ...prev, goals: prev.goals.map(g => g.id === depositModal.goal!.id ? { ...g, currentValue: Math.min(g.targetValue, g.currentValue + depositModal.amount) } : g) }), true); setDepositModal({ isOpen: false, amount: 0 }); }}>
        <CurrencyInput value={depositModal.amount} onValueChange={(v) => setDepositModal(p => ({ ...p, amount: v }))} label="Valor do Aporte" />
      </Modal>

      <Modal isOpen={!!itemToDelete} onClose={() => setItemToDelete(null)} title="Apagar Objetivo?" onConfirm={() => { if(itemToDelete) onUpdate(prev => ({ ...prev, goals: prev.goals.filter(g => g.id !== itemToDelete) }), true); setItemToDelete(null); }} confirmVariant="danger">
        Deseja apagar este objetivo permanentemente?
      </Modal>
    </div>
  );
};
