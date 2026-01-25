
import React, { useState } from 'react';
import { FinancialData, Income, FixedExpense, InstallmentExpense, CustomSection, SectionItem, RadarItem, DreamItem, PixKey, CreditCard } from '../types';
import { CollapsibleCard, Button, Input, Select, Badge, Card } from './ui/UIComponents';
import { Trash2, Plus, Wallet, GripVertical, Target, Pencil, Check, X, CreditCard as CCIcon, Zap, FolderOpen, CalendarDays, AlertCircle, Copy, CalendarCheck, Power, Star, ArrowLeft, Trophy } from 'lucide-react';

// Helper component for adding new records
const AddForm = ({ children, onAdd }: { children?: React.ReactNode, onAdd: () => void }) => (
  <div className="mb-4 pt-4 border-t border-white/5">
    {children}
    <Button onClick={onAdd} variant="primary" className="w-full mt-4 h-12 shadow-lg">
      <Plus size={18} /> Adicionar Novo Registro
    </Button>
  </div>
);

const fmt = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const ActionButton = ({ onClick, icon, color = "text-slate-500 hover:text-white" }: { onClick: () => void, icon: React.ReactNode, color?: string }) => (
  <button onClick={(e) => { e.stopPropagation(); onClick(); }} className={`${color} transition-colors p-2.5 rounded hover:bg-white/10 shrink-0`}>
    {icon}
  </button>
);

const handleEnter = (e: React.KeyboardEvent, action: () => void) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    action();
  }
};

const DraggableRow: React.FC<{ children: React.ReactNode; index: number; listId: string; onMove: (f: number, t: number) => void; className?: string }> = ({ children, index, listId, onMove, className }) => {
  const handleDragStart = (e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'SELECT') { e.preventDefault(); return; }
    e.dataTransfer.setData('type', 'ROW');
    e.dataTransfer.setData('listId', listId);
    e.dataTransfer.setData('rowIndex', index.toString());
  };
  return (
    <div draggable onDragStart={handleDragStart} onDragOver={e => e.preventDefault()} onDrop={e => {
        e.preventDefault();
        const type = e.dataTransfer.getData('type');
        const srcListId = e.dataTransfer.getData('listId');
        if (type !== 'ROW' || srcListId !== listId) return;
        onMove(parseInt(e.dataTransfer.getData('rowIndex')), index);
    }} className={`cursor-grab active:cursor-grabbing flex items-center ${className}`}>
      <div className="mr-3 text-slate-700 hover:text-slate-500 shrink-0"><GripVertical size={16} /></div>
      {children}
    </div>
  );
};

const EditRowLayout: React.FC<{ children: React.ReactNode, onSave: () => void, onCancel: () => void }> = ({ children, onSave, onCancel }) => (
  <div className="w-full flex flex-col gap-4 py-3" onKeyDown={e => handleEnter(e, onSave)}>
    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 w-full items-end">
      {children}
    </div>
    <div className="flex flex-col sm:flex-row gap-2 w-full pt-2">
      <button onClick={onSave} className="flex-1 flex items-center justify-center gap-2 bg-neon-green/20 text-neon-green border border-neon-green/40 py-3 rounded-xl hover:bg-neon-green hover:text-black transition-all font-bold text-xs uppercase tracking-[0.2em] shadow-lg active:scale-[0.98]">
        <Check size={18} /> CONFIRMAR
      </button>
      <button onClick={onCancel} className="flex-1 flex items-center justify-center gap-2 bg-white/5 text-slate-400 border border-white/10 py-3 rounded-xl hover:bg-neon-red/10 hover:text-neon-red hover:border-neon-red/30 transition-all font-bold text-xs uppercase tracking-[0.2em] active:scale-[0.98]">
        <X size={18} /> VOLTAR
      </button>
    </div>
  </div>
);

const EditInput = ({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) => (
  <div className={`flex flex-col gap-1.5 ${props.className || ''}`}>
    {label && <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">{label}</label>}
    <input 
      {...props} 
      className={`bg-black/60 border border-white/20 rounded-xl px-4 py-3 text-xs sm:text-sm text-white outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue/20 transition-all h-12 w-full placeholder:text-slate-700 font-bold uppercase`}
    />
  </div>
);

const ToggleStatusButton = ({ active, onClick }: { active: boolean, onClick: () => void }) => (
  <button 
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-[8px] font-black tracking-[0.2em] transition-all active:scale-95 shrink-0 ${
      active 
      ? 'bg-neon-green/10 border-neon-green text-neon-green shadow-neon-green' 
      : 'bg-neon-red/10 border-neon-red text-neon-red shadow-neon-red'
    }`}
  >
    <Power size={12} /> {active ? 'ON' : 'OFF'}
  </button>
);

// Module for Incomes
export const IncomeModule: React.FC<{ data: FinancialData, onUpdate: (d: FinancialData, immediate?: boolean) => void }> = ({ data, onUpdate }) => {
  const [name, setName] = useState('');
  const [val, setVal] = useState('');
  const [date, setDate] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Income>>({});

  const total = data.incomes.filter(i => i.isActive !== false).reduce((acc, curr) => acc + curr.value, 0);

  const handleAdd = () => {
    if (!name || !val) return;
    const newItem: Income = { id: Math.random().toString(36).substr(2, 9), name: name.toUpperCase(), value: parseFloat(val), expectedDate: date, isActive: true };
    onUpdate({ ...data, incomes: [...data.incomes, newItem] }, true);
    setName(''); setVal(''); setDate('');
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    onUpdate({ ...data, incomes: data.incomes.map(i => i.id === editingId ? { ...i, ...editData } : i) }, true);
    setEditingId(null);
  };

  return (
    <CollapsibleCard title="Entradas Fixas" totalValue={`R$ ${fmt(total)}`} color="green" icon={<Wallet size={18} />}>
      <AddForm onAdd={handleAdd}>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-5"><Input label="Nome" value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="sm:col-span-4"><Input label="Valor" type="number" value={val} onChange={e => setVal(e.target.value)} /></div>
          <div className="sm:col-span-3"><Input label="Data" value={date} onChange={e => setDate(e.target.value)} placeholder="05/Mês" /></div>
        </div>
      </AddForm>
      <div className="flex flex-col gap-2">
        {data.incomes.map((item, idx) => (
          <DraggableRow key={item.id} index={idx} listId="incomes" onMove={(f, t) => { const n = [...data.incomes]; const [m] = n.splice(f,1); n.splice(t,0,m); onUpdate({...data, incomes: n}, true); }}>
            <div className="flex-1 flex items-center justify-between p-2 hover:bg-white/5 rounded-lg">
              {editingId === item.id ? (
                <EditRowLayout onSave={handleSaveEdit} onCancel={() => setEditingId(null)}>
                  <EditInput className="sm:col-span-6" label="NOME" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} />
                  <EditInput className="sm:col-span-3" label="VALOR" type="number" value={editData.value} onChange={e => setEditData({...editData, value: parseFloat(e.target.value)})} />
                  <EditInput className="sm:col-span-3" label="DATA" value={editData.expectedDate} onChange={e => setEditData({...editData, expectedDate: e.target.value})} />
                </EditRowLayout>
              ) : (
                <>
                  <div className="min-w-0 flex-1">
                    <p className={`font-bold text-xs truncate ${item.isActive ? 'text-white' : 'text-slate-600 line-through'}`}>{item.name}</p>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">{item.expectedDate || 'Mensal'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-mono font-bold text-xs ${item.isActive ? 'text-neon-green' : 'text-slate-600'}`}>R$ {fmt(item.value)}</span>
                    <ToggleStatusButton active={item.isActive !== false} onClick={() => onUpdate({...data, incomes: data.incomes.map(i => i.id === item.id ? {...i, isActive: !i.isActive} : i)}, true)} />
                    <ActionButton icon={<Pencil size={14} />} onClick={() => { setEditingId(item.id); setEditData(item); }} />
                    <ActionButton icon={<Trash2 size={14} />} color="text-slate-600 hover:text-neon-red" onClick={() => onUpdate({...data, incomes: data.incomes.filter(i => i.id !== item.id)}, true)} />
                  </div>
                </>
              )}
            </div>
          </DraggableRow>
        ))}
      </div>
    </CollapsibleCard>
  );
};

// Module for Fixed Expenses
export const FixedExpenseModule: React.FC<{ data: FinancialData, onUpdate: (d: FinancialData, immediate?: boolean) => void }> = ({ data, onUpdate }) => {
  const [name, setName] = useState('');
  const [val, setVal] = useState('');
  const [due, setDue] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<FixedExpense>>({});

  const total = data.fixedExpenses.filter(e => e.isActive !== false).reduce((acc, curr) => acc + (curr.value - (curr.paidAmount || 0)), 0);

  const handleAdd = () => {
    if (!name || !val) return;
    const newItem: FixedExpense = { id: Math.random().toString(36).substr(2, 9), name: name.toUpperCase(), value: parseFloat(val), dueDate: due, isActive: true };
    onUpdate({ ...data, fixedExpenses: [...data.fixedExpenses, newItem] }, true);
    setName(''); setVal(''); setDue('');
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    onUpdate({ ...data, fixedExpenses: data.fixedExpenses.map(e => e.id === editingId ? { ...e, ...editData } : e) }, true);
    setEditingId(null);
  };

  return (
    <CollapsibleCard title="Despesas Fixas" totalValue={`R$ ${fmt(total)}`} color="red" icon={<Zap size={18} />}>
      <AddForm onAdd={handleAdd}>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-5"><Input label="Nome" value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="sm:col-span-4"><Input label="Valor" type="number" value={val} onChange={e => setVal(e.target.value)} /></div>
          <div className="sm:col-span-3"><Input label="Vencimento" value={due} onChange={e => setDue(e.target.value)} placeholder="10/Mês" /></div>
        </div>
      </AddForm>
      <div className="flex flex-col gap-2">
        {data.fixedExpenses.map((item, idx) => (
          <DraggableRow key={item.id} index={idx} listId="fixed" onMove={(f, t) => { const n = [...data.fixedExpenses]; const [m] = n.splice(f,1); n.splice(t,0,m); onUpdate({...data, fixedExpenses: n}, true); }}>
            <div className="flex-1 flex items-center justify-between p-2 hover:bg-white/5 rounded-lg">
              {editingId === item.id ? (
                <EditRowLayout onSave={handleSaveEdit} onCancel={() => setEditingId(null)}>
                  <EditInput className="sm:col-span-4" label="NOME" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} />
                  <EditInput className="sm:col-span-3" label="VALOR" type="number" value={editData.value} onChange={e => setEditData({...editData, value: parseFloat(e.target.value)})} />
                  <EditInput className="sm:col-span-3" label="PAGO" type="number" value={editData.paidAmount} onChange={e => setEditData({...editData, paidAmount: parseFloat(e.target.value)})} />
                  <EditInput className="sm:col-span-2" label="VENC" value={editData.dueDate} onChange={e => setEditData({...editData, dueDate: e.target.value})} />
                </EditRowLayout>
              ) : (
                <>
                  <div className="min-w-0 flex-1">
                    <p className={`font-bold text-xs truncate ${item.isActive ? 'text-white' : 'text-slate-600 line-through'}`}>{item.name}</p>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] text-slate-500">{item.dueDate || 'Mensal'}</span>
                       {item.paidAmount && item.paidAmount > 0 && <Badge color="green">Pago: R$ {fmt(item.paidAmount)}</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-mono font-bold text-xs ${item.isActive ? 'text-neon-red' : 'text-slate-600'}`}>R$ {fmt(item.value - (item.paidAmount || 0))}</span>
                    <ToggleStatusButton active={item.isActive !== false} onClick={() => onUpdate({...data, fixedExpenses: data.fixedExpenses.map(e => e.id === item.id ? {...e, isActive: !e.isActive} : e)}, true)} />
                    <ActionButton icon={<Pencil size={14} />} onClick={() => { setEditingId(item.id); setEditData(item); }} />
                    <ActionButton icon={<Trash2 size={14} />} color="text-slate-600 hover:text-neon-red" onClick={() => onUpdate({...data, fixedExpenses: data.fixedExpenses.filter(e => e.id !== item.id)}, true)} />
                  </div>
                </>
              )}
            </div>
          </DraggableRow>
        ))}
      </div>
    </CollapsibleCard>
  );
};

// Module for Installment Expenses
export const InstallmentModule: React.FC<{ data: FinancialData, onUpdate: (d: FinancialData, immediate?: boolean) => void }> = ({ data, onUpdate }) => {
  const [name, setName] = useState('');
  const [val, setVal] = useState('');
  const [count, setCount] = useState('');
  const [start, setStart] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<InstallmentExpense>>({});

  const total = data.installments.filter(e => e.isActive !== false).reduce((acc, curr) => acc + (curr.monthlyValue - (curr.paidAmount || 0)), 0);

  const handleAdd = () => {
    if (!name || !val || !count) return;
    const newItem: InstallmentExpense = { id: Math.random().toString(36).substr(2, 9), name: name.toUpperCase(), monthlyValue: parseFloat(val), installmentsCount: parseInt(count), startMonth: start || new Date().toISOString().slice(0, 7), isActive: true };
    onUpdate({ ...data, installments: [...data.installments, newItem] }, true);
    setName(''); setVal(''); setCount(''); setStart('');
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    onUpdate({ ...data, installments: data.installments.map(e => e.id === editingId ? { ...e, ...editData } : e) }, true);
    setEditingId(null);
  };

  return (
    <CollapsibleCard title="Parcelamentos" totalValue={`R$ ${fmt(total)}`} color="yellow" icon={<CalendarDays size={18} />}>
      <AddForm onAdd={handleAdd}>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-4"><Input label="Nome" value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="sm:col-span-3"><Input label="Vlr Mensal" type="number" value={val} onChange={e => setVal(e.target.value)} /></div>
          <div className="sm:col-span-2"><Input label="Parc." type="number" value={count} onChange={e => setCount(e.target.value)} /></div>
          <div className="sm:col-span-3"><Input label="Início" type="month" value={start} onChange={e => setStart(e.target.value)} /></div>
        </div>
      </AddForm>
      <div className="flex flex-col gap-2">
        {data.installments.map((item, idx) => (
          <DraggableRow key={item.id} index={idx} listId="installments" onMove={(f, t) => { const n = [...data.installments]; const [m] = n.splice(f,1); n.splice(t,0,m); onUpdate({...data, installments: n}, true); }}>
            <div className="flex-1 flex items-center justify-between p-2 hover:bg-white/5 rounded-lg">
              {editingId === item.id ? (
                <EditRowLayout onSave={handleSaveEdit} onCancel={() => setEditingId(null)}>
                  <EditInput className="sm:col-span-4" label="NOME" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} />
                  <EditInput className="sm:col-span-3" label="VLR MENSAL" type="number" value={editData.monthlyValue} onChange={e => setEditData({...editData, monthlyValue: parseFloat(e.target.value)})} />
                  <EditInput className="sm:col-span-2" label="PARC" type="number" value={editData.installmentsCount} onChange={e => setEditData({...editData, installmentsCount: parseInt(e.target.value)})} />
                  <EditInput className="sm:col-span-3" label="INÍCIO" type="month" value={editData.startMonth} onChange={e => setEditData({...editData, startMonth: e.target.value})} />
                </EditRowLayout>
              ) : (
                <>
                  <div className="min-w-0 flex-1">
                    <p className={`font-bold text-xs truncate ${item.isActive ? 'text-white' : 'text-slate-600 line-through'}`}>{item.name}</p>
                    <span className="text-[10px] text-slate-500 uppercase">{item.installmentsCount}x de R$ {fmt(item.monthlyValue)} • Início: {item.startMonth}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-mono font-bold text-xs ${item.isActive ? 'text-neon-yellow' : 'text-slate-600'}`}>R$ {fmt(item.monthlyValue - (item.paidAmount || 0))}</span>
                    <ToggleStatusButton active={item.isActive !== false} onClick={() => onUpdate({...data, installments: data.installments.map(i => i.id === item.id ? {...i, isActive: !i.isActive} : i)}, true)} />
                    <ActionButton icon={<Pencil size={14} />} onClick={() => { setEditingId(item.id); setEditData(item); }} />
                    <ActionButton icon={<Trash2 size={14} />} color="text-slate-600 hover:text-neon-red" onClick={() => onUpdate({...data, installments: data.installments.filter(i => i.id !== item.id)}, true)} />
                  </div>
                </>
              )}
            </div>
          </DraggableRow>
        ))}
      </div>
    </CollapsibleCard>
  );
};

// Module for Custom Sections
export const CustomSectionModule: React.FC<{ section: CustomSection, onUpdate: (s: CustomSection, immediate?: boolean) => void, onDeleteSection: () => void }> = ({ section, onUpdate, onDeleteSection }) => {
  const [name, setName] = useState('');
  const [val, setVal] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<SectionItem>>({});

  const total = section.items.filter(i => i.isActive !== false).reduce((acc, curr) => acc + (curr.value - (curr.paidAmount || 0)), 0);
  const color = section.type === 'income' ? 'green' : 'pink';

  const handleAdd = () => {
    if (!name || !val) return;
    const newItem: SectionItem = { id: Math.random().toString(36).substr(2, 9), name: name.toUpperCase(), value: parseFloat(val), isActive: true };
    onUpdate({ ...section, items: [...section.items, newItem] }, true);
    setName(''); setVal('');
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    onUpdate({ ...section, items: section.items.map(i => i.id === editingId ? { ...i, ...editData } : i) }, true);
    setEditingId(null);
  };

  return (
    <CollapsibleCard title={section.title} totalValue={`R$ ${fmt(total)}`} color={color} icon={<FolderOpen size={18} />} onEditTitle={(nt) => onUpdate({...section, title: nt}, true)}>
      <div className="flex justify-end mb-2">
         <button onClick={onDeleteSection} className="text-[10px] text-slate-600 hover:text-neon-red font-bold uppercase tracking-widest flex items-center gap-1 transition-colors"><Trash2 size={10} /> Apagar Sessão</button>
      </div>
      <AddForm onAdd={handleAdd}>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-8"><Input label="Item" value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="sm:col-span-4"><Input label="Valor" type="number" value={val} onChange={e => setVal(e.target.value)} /></div>
        </div>
      </AddForm>
      <div className="flex flex-col gap-2">
        {section.items.map((item, idx) => (
          <DraggableRow key={item.id} index={idx} listId={section.id} onMove={(f, t) => { const n = [...section.items]; const [m] = n.splice(f,1); n.splice(t,0,m); onUpdate({...section, items: n}, true); }}>
            <div className="flex-1 flex items-center justify-between p-2 hover:bg-white/5 rounded-lg">
              {editingId === item.id ? (
                <EditRowLayout onSave={handleSaveEdit} onCancel={() => setEditingId(null)}>
                  <EditInput className="sm:col-span-6" label="NOME" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} />
                  <EditInput className="sm:col-span-3" label="VALOR" type="number" value={editData.value} onChange={e => setEditData({...editData, value: parseFloat(e.target.value)})} />
                  <EditInput className="sm:col-span-3" label="PAGO" type="number" value={editData.paidAmount} onChange={e => setEditData({...editData, paidAmount: parseFloat(e.target.value)})} />
                </EditRowLayout>
              ) : (
                <>
                  <div className="min-w-0 flex-1">
                    <p className={`font-bold text-xs truncate ${item.isActive !== false ? 'text-white' : 'text-slate-600 line-through'}`}>{item.name}</p>
                    {item.paidAmount && item.paidAmount > 0 && <Badge color="green">Pago: R$ {fmt(item.paidAmount)}</Badge>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-mono font-bold text-xs ${item.isActive !== false ? (section.type === 'income' ? 'text-neon-green' : 'text-neon-pink') : 'text-slate-600'}`}>R$ {fmt(item.value - (item.paidAmount || 0))}</span>
                    <ToggleStatusButton active={item.isActive !== false} onClick={() => onUpdate({...section, items: section.items.map(i => i.id === item.id ? {...i, isActive: !i.isActive} : i)}, true)} />
                    <ActionButton icon={<Pencil size={14} />} onClick={() => { setEditingId(item.id); setEditData(item); }} />
                    <ActionButton icon={<Trash2 size={14} />} color="text-slate-600 hover:text-neon-red" onClick={() => onUpdate({...section, items: section.items.filter(i => i.id !== item.id)}, true)} />
                  </div>
                </>
              )}
            </div>
          </DraggableRow>
        ))}
      </div>
    </CollapsibleCard>
  );
};

// Module for Credit Cards
export const CreditCardModule: React.FC<{ data: FinancialData, onUpdate: (d: FinancialData, immediate?: boolean) => void }> = ({ data, onUpdate }) => {
  const [name, setName] = useState('');
  const [limit, setLimit] = useState('');
  const [closing, setClosing] = useState('');
  const [due, setDue] = useState('');
  const [invoice, setInvoice] = useState('');

  const handleAdd = () => {
    if (!name || !limit) return;
    const newItem: CreditCard = { id: Math.random().toString(36).substr(2, 9), name: name.toUpperCase(), limit: parseFloat(limit), closingDay: parseInt(closing) || 1, dueDay: parseInt(due) || 10, currentInvoiceValue: parseFloat(invoice) || 0 };
    onUpdate({ ...data, creditCards: [...(data.creditCards || []), newItem] }, true);
    setName(''); setLimit(''); setClosing(''); setDue(''); setInvoice('');
  };

  return (
    <CollapsibleCard title="Cartões de Crédito" color="blue" icon={<CCIcon size={18} />}>
      <AddForm onAdd={handleAdd}>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Input label="Nome do Cartão" value={name} onChange={e => setName(e.target.value)} />
          <Input label="Limite Total" type="number" value={limit} onChange={e => setLimit(e.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Input label="Fechamento" type="number" value={closing} onChange={e => setClosing(e.target.value)} />
          <Input label="Vencimento" type="number" value={due} onChange={e => setDue(e.target.value)} />
          <Input label="Fatura Atual" type="number" value={invoice} onChange={e => setInvoice(e.target.value)} />
        </div>
      </AddForm>
      <div className="flex flex-col gap-4">
        {(data.creditCards || []).map(card => {
           const available = card.limit - card.currentInvoiceValue;
           const perc = (card.currentInvoiceValue / card.limit) * 100;
           return (
             <div key={card.id} className="p-3 bg-black/40 border border-white/5 rounded-xl group relative">
               <div className="flex justify-between items-start mb-2">
                 <div>
                   <h4 className="font-black text-xs text-white uppercase tracking-wider">{card.name}</h4>
                   <p className="text-[10px] text-slate-500 uppercase font-bold">Vence dia {card.dueDay} • Fecha dia {card.closingDay}</p>
                 </div>
                 <div className="flex flex-col items-end">
                    <span className="font-mono font-black text-neon-blue text-xs">R$ {fmt(card.currentInvoiceValue)}</span>
                    <button onClick={() => onUpdate({...data, creditCards: data.creditCards.filter(c => c.id !== card.id)}, true)} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-700 hover:text-neon-red mt-1"><Trash2 size={12} /></button>
                 </div>
               </div>
               <div className="space-y-1.5">
                  <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase tracking-widest">
                    <span>Limite Disponível</span>
                    <span>R$ {fmt(available)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div style={{ width: `${Math.min(perc, 100)}%` }} className={`h-full transition-all duration-1000 ${perc > 80 ? 'bg-neon-red shadow-neon-red' : 'bg-neon-blue shadow-neon-blue'}`}></div>
                  </div>
               </div>
             </div>
           );
        })}
      </div>
    </CollapsibleCard>
  );
};

// Module for PIX Keys
export const PixModule: React.FC<{ data: FinancialData, onUpdate: (d: FinancialData, immediate?: boolean) => void }> = ({ data, onUpdate }) => {
  const [type, setType] = useState<PixKey['type']>('CPF');
  const [key, setKey] = useState('');
  const [ben, setBen] = useState('');

  const handleAdd = () => {
    if (!key) return;
    const newItem: PixKey = { id: Math.random().toString(36).substr(2, 9), type, key: key.toUpperCase(), beneficiary: ben.toUpperCase(), active: true };
    onUpdate({ ...data, pixKeys: [...(data.pixKeys || []), newItem] }, true);
    setKey(''); setBen('');
  };

  const copyToClipboard = (txt: string) => {
    navigator.clipboard.writeText(txt);
    alert('Chave copiada!');
  };

  return (
    <CollapsibleCard title="Chaves PIX" color="white" icon={<Zap size={18} />}>
      <AddForm onAdd={handleAdd}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <Select label="Tipo de Chave" options={[{value:'CPF', label:'CPF'}, {value:'CNPJ', label:'CNPJ'}, {value:'Telefone', label:'Telefone'}, {value:'Email', label:'Email'}, {value:'Aleatória', label:'Aleatória'}]} value={type} onChange={e => setType(e.target.value as any)} />
          <Input label="Chave PIX" value={key} onChange={e => setKey(e.target.value)} />
        </div>
        <Input label="Beneficiário (Opcional)" value={ben} onChange={e => setBen(e.target.value)} />
      </AddForm>
      <div className="flex flex-col gap-2">
        {(data.pixKeys || []).map(k => (
          <div key={k.id} className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between group">
            <div className="min-w-0">
               <div className="flex items-center gap-2">
                  <Badge color="white">{k.type}</Badge>
                  {k.beneficiary && <span className="text-[8px] font-black text-slate-500 uppercase truncate">{k.beneficiary}</span>}
               </div>
               <p className="font-mono text-xs text-white mt-1 truncate">{k.key}</p>
            </div>
            <div className="flex items-center gap-1">
               <ActionButton icon={<Copy size={14} />} onClick={() => copyToClipboard(k.key)} />
               <ActionButton icon={<Trash2 size={14} />} color="text-slate-700 hover:text-neon-red" onClick={() => onUpdate({...data, pixKeys: data.pixKeys.filter(pk => pk.id !== k.id)}, true)} />
            </div>
          </div>
        ))}
      </div>
    </CollapsibleCard>
  );
};

// Module for Radar Items
export const RadarModule: React.FC<{ data: FinancialData, onUpdate: (d: FinancialData, immediate?: boolean) => void }> = ({ data, onUpdate }) => {
  const [name, setName] = useState('');
  const [val, setVal] = useState('');

  const handleAdd = () => {
    if (!name || !val) return;
    const newItem: RadarItem = { id: Math.random().toString(36).substr(2, 9), name: name.toUpperCase(), value: parseFloat(val) };
    onUpdate({ ...data, radarItems: [...(data.radarItems || []), newItem] }, true);
    setName(''); setVal('');
  };

  const total = (data.radarItems || []).reduce((a, c) => a + c.value, 0);

  return (
    <CollapsibleCard title="Radar de Gastos" totalValue={`R$ ${fmt(total)}`} color="yellow" icon={<Target size={18} />}>
      <p className="text-[10px] text-slate-500 mb-4 uppercase font-bold tracking-widest italic">Gastos eventuais ou previstos que ainda não foram realizados.</p>
      <AddForm onAdd={handleAdd}>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Descrição" value={name} onChange={e => setName(e.target.value)} />
          <Input label="Valor Estimado" type="number" value={val} onChange={e => setVal(e.target.value)} />
        </div>
      </AddForm>
      <div className="flex flex-col gap-2">
        {(data.radarItems || []).map(item => (
          <div key={item.id} className="flex items-center justify-between p-2 bg-black/40 border border-white/5 rounded-lg">
             <span className="text-xs font-bold text-white uppercase truncate">{item.name}</span>
             <div className="flex items-center gap-3">
                <span className="font-mono font-black text-neon-yellow text-xs">R$ {fmt(item.value)}</span>
                <ActionButton icon={<Trash2 size={14} />} color="text-slate-700 hover:text-neon-red" onClick={() => onUpdate({...data, radarItems: data.radarItems.filter(r => r.id !== item.id)}, true)} />
             </div>
          </div>
        ))}
      </div>
    </CollapsibleCard>
  );
};

// Module for Dreams
export const DreamsModule: React.FC<{ data: FinancialData, onUpdate: (d: FinancialData, immediate?: boolean) => void, onBack: () => void }> = ({ data, onUpdate, onBack }) => {
  const [name, setName] = useState('');
  const [val, setVal] = useState('');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editVal, setEditVal] = useState('');

  const activeDreamsTotal = (data.dreams || []).filter(d => d.isActive).reduce((acc, curr) => acc + curr.value, 0);
  const remainingBudget = (data.dreamsTotalBudget || 0) - activeDreamsTotal;

  const handleAdd = () => {
    if (!name || !val) return;
    const newDream: DreamItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: name.toUpperCase(),
      value: parseFloat(val),
      isActive: true
    };
    onUpdate({ ...data, dreams: [...(data.dreams || []), newDream] }, true);
    setName(''); setVal('');
  };

  const handleSaveEdit = () => {
    if (!editingId || !editName || !editVal) return;
    onUpdate({
      ...data,
      dreams: (data.dreams || []).map(d => 
        d.id === editingId ? { ...d, name: editName.toUpperCase(), value: parseFloat(editVal) || 0 } : d
      )
    }, true);
    setEditingId(null);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
        <button onClick={onBack} className="w-full sm:w-auto flex items-center justify-center gap-2 text-slate-400 hover:text-white transition-all text-xs font-black uppercase tracking-widest bg-white/5 px-4 py-3 rounded-xl border border-white/10">
          <ArrowLeft size={16} /> Voltar ao Painel
        </button>
        <div className="flex items-center gap-3">
          <Star className="text-neon-yellow animate-pulse" size={24} />
          <h2 className="text-2xl font-black text-white tracking-tighter">MODO <span className="bg-gradient-to-r from-neon-blue to-neon-pink bg-clip-text text-transparent">DREAMS</span></h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="border-neon-yellow/30 bg-black/40 p-5 h-36 flex flex-col justify-center">
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Valor Total Acumulado</p>
          <div className="flex items-center gap-3">
            <h3 className="text-3xl font-black text-neon-yellow tracking-tighter">R$ {fmt(data.dreamsTotalBudget || 0)}</h3>
            <button 
              onClick={() => {
                const nv = prompt("Digite o novo valor do prêmio acumulado:", (data.dreamsTotalBudget || 0).toString());
                if (nv !== null) onUpdate({...data, dreamsTotalBudget: parseFloat(nv) || 0}, true);
              }}
              className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all"
            >
              <Pencil size={14} />
            </button>
          </div>
        </Card>

        <Card className="border-neon-blue/30 bg-black/40 p-5 h-36 flex flex-col justify-center">
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Custo dos Sonhos Ativos</p>
          <h3 className="text-3xl font-black text-neon-pink tracking-tighter">R$ {fmt(activeDreamsTotal)}</h3>
        </Card>

        <Card className={`border-2 p-5 h-36 flex flex-col justify-center transition-all duration-700 ${remainingBudget >= 0 ? 'border-neon-green/30 bg-neon-green/5' : 'border-neon-red/30 bg-neon-red/5'}`}>
          <p className="text-[8px] font-black uppercase tracking-[0.3em] mb-1 text-slate-400">Saldo Final Disponível</p>
          <h3 className={`text-3xl font-black tracking-tighter ${remainingBudget >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
            R$ {fmt(remainingBudget)}
          </h3>
        </Card>
      </div>

      <CollapsibleCard title="GESTÃO DE SONHOS" color="white" icon={<Trophy size={18} />} defaultOpen={true}>
        <AddForm onAdd={handleAdd}>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-8"><Input label="DESCRIÇÃO DO SONHO" placeholder="EX: IPHONE 16 PRO MAX" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => handleEnter(e, handleAdd)} /></div>
            <div className="sm:col-span-4"><Input label="VALOR" type="number" placeholder="0,00" value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => handleEnter(e, handleAdd)} /></div>
          </div>
        </AddForm>

        <div className="flex flex-col gap-3">
          {(data.dreams || []).map((dream) => (
            <div key={dream.id} className={`p-5 bg-white/5 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-4 ${dream.isActive ? 'border-white/10 hover:border-white/20' : 'border-neon-red/10 opacity-50'}`}>
              {editingId === dream.id ? (
                <EditRowLayout onSave={handleSaveEdit} onCancel={() => setEditingId(null)}>
                  <EditInput label="DESCRIÇÃO" className="sm:col-span-8" value={editName} onChange={e => setEditName(e.target.value)} />
                  <EditInput label="VALOR" type="number" className="sm:col-span-4" value={editVal} onChange={e => setEditVal(e.target.value)} />
                </EditRowLayout>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <p className={`font-black text-sm sm:text-lg tracking-tight uppercase ${dream.isActive ? 'text-white' : 'text-slate-600 line-through'}`}>{dream.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                       <Badge color={dream.isActive ? 'green' : 'red'}>{dream.isActive ? 'No Orçamento' : 'Fora do Orçamento'}</Badge>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <span className={`text-xl font-black ${dream.isActive ? 'text-white' : 'text-slate-600'}`}>
                      R$ {fmt(dream.value)}
                    </span>
                    <div className="flex items-center gap-1">
                      <ToggleStatusButton active={dream.isActive} onClick={() => onUpdate({ ...data, dreams: data.dreams.map(d => d.id === dream.id ? { ...d, isActive: !d.isActive } : d) }, true)} />
                      <ActionButton onClick={() => {
                        setEditingId(dream.id);
                        setEditName(dream.name);
                        setEditVal(dream.value.toString());
                      }} icon={<Pencil size={20} />} />
                      <ActionButton onClick={() => onUpdate({ ...data, dreams: data.dreams.filter(d => d.id !== dream.id) }, true)} icon={<Trash2 size={20} />} color="text-slate-600 hover:text-neon-red" />
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
          {(data.dreams || []).length === 0 && (
            <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-3xl">
              <p className="text-slate-600 font-black uppercase tracking-[0.3em] text-[10px]">Nenhum sonho registrado ainda. Liste o que você quer conquistar!</p>
            </div>
          )}
        </div>
      </CollapsibleCard>
    </div>
  );
};
