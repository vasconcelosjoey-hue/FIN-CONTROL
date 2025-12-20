
import React, { useState } from 'react';
import { FinancialData, Income, FixedExpense, InstallmentExpense, CustomSection, SectionItem, RadarItem } from '../types';
import { CollapsibleCard, Button, Input, Select, Badge } from './ui/UIComponents';
import { Trash2, Plus, ArrowRight, Wallet, GripVertical, Target, Pencil, Check, X, CreditCard as CCIcon, Zap, FolderOpen, CalendarDays, AlertCircle, Copy, CalendarCheck } from 'lucide-react';

const AddForm = ({ children, onAdd }: { children?: React.ReactNode, onAdd: () => void }) => (
  <div className="mb-3 pt-2 border-t border-white/5">
    {children}
    <Button onClick={onAdd} variant="primary" className="w-full mt-3 h-9">
      <Plus size={16} /> Adicionar
    </Button>
  </div>
);

const fmt = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const ActionButton = ({ onClick, icon, color = "text-slate-500 hover:text-white" }: { onClick: () => void, icon: React.ReactNode, color?: string }) => (
  <button onClick={(e) => { e.stopPropagation(); onClick(); }} className={`${color} transition-colors p-1.5 rounded hover:bg-white/10`}>
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
    e.stopPropagation();
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
      <div className="mr-3 text-slate-700 hover:text-slate-500 shrink-0"><GripVertical size={14} /></div>
      {children}
    </div>
  );
};

// --- Custom Section Module ---
export const CustomSectionModule: React.FC<{ 
  section: CustomSection, 
  onUpdate: (updatedSection: CustomSection) => void, 
  onDeleteSection: () => void 
}> = ({ section, onUpdate, onDeleteSection }) => {
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [paid, setPaid] = useState('');
  const [date, setDate] = useState('');
  const [qtd, setQtd] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editValue, setEditValue] = useState('');
  const [editPaid, setEditPaid] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editQtd, setEditQtd] = useState('');

  const isIncome = section.type === 'income';
  const total = section.items.reduce((acc, i) => acc + (i.value - (i.paidAmount || 0)), 0);
  const color = isIncome ? 'green' : 'red';
  const neonColor = isIncome ? 'text-neon-green' : 'text-neon-red';

  const handleAdd = () => {
    if (!name || !value) return;
    const newItem: SectionItem = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      value: parseFloat(value),
      paidAmount: parseFloat(paid) || 0,
      date: date || (section.structure === 'installment' ? new Date().toISOString().slice(0, 7) : new Date().toLocaleDateString('pt-BR')),
      installmentsCount: section.structure === 'installment' ? (parseInt(qtd) || 1) : undefined
    };
    onUpdate({ ...section, items: [...section.items, newItem] });
    setName(''); setValue(''); setPaid(''); setDate(''); setQtd('');
  };

  const handleAdvanceMonth = (item: SectionItem) => {
    if (!item.installmentsCount || item.installmentsCount <= 1) {
      if (confirm(`Pagar e remover ${item.name}?`)) onUpdate({ ...section, items: section.items.filter(i => i.id !== item.id) });
      return;
    }
    const [y, m] = (item.date || '').split('-').map(Number);
    const d = new Date(y, m - 1, 1); d.setMonth(d.getMonth() + 1);
    onUpdate({ ...section, items: section.items.map(i => i.id === item.id ? { ...i, installmentsCount: i.installmentsCount! - 1, date: `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`, paidAmount: 0 } : i) });
  };

  const saveEdit = () => {
    if (!editingId) return;
    onUpdate({ ...section, items: section.items.map(i => i.id === editingId ? { ...i, name: editName, value: parseFloat(editValue) || 0, paidAmount: parseFloat(editPaid) || 0, date: editDate, installmentsCount: parseInt(editQtd) || 1 } : i) });
    setEditingId(null);
  };

  return (
    <CollapsibleCard title={section.title} totalValue={`R$ ${fmt(total)}`} color={color} icon={<FolderOpen size={18} />} onEditTitle={nt => onUpdate({...section, title: nt})}>
      <div className="flex justify-end mb-2"><button onClick={onDeleteSection} className={`text-[10px] ${neonColor} hover:underline font-bold flex items-center gap-1 opacity-60`}><Trash2 size={12}/> EXCLUIR SESSÃO</button></div>
      <AddForm onAdd={handleAdd}>
        {isIncome ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-5"><Input placeholder="Nome" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => handleEnter(e, handleAdd)} /></div>
            <div className="md:col-span-3"><Input type="number" placeholder="Valor" value={value} onChange={e => setValue(e.target.value)} /></div>
            <div className="md:col-span-4"><Input placeholder="Data" value={date} onChange={e => setDate(e.target.value)} /></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-4"><Input placeholder="Descrição" value={name} onChange={e => setName(e.target.value)} /></div>
            <div className="md:col-span-3"><Input type="number" placeholder="Valor Total" value={value} onChange={e => setValue(e.target.value)} /></div>
            <div className="md:col-span-2"><Input type="number" placeholder="Pago Parcial" value={paid} onChange={e => setPaid(e.target.value)} /></div>
            <div className="md:col-span-1"><Input type="number" placeholder="Qtd" value={qtd} onChange={e => setQtd(e.target.value)} /></div>
            <div className="md:col-span-2"><Input placeholder="Mês (AAAA-MM)" value={date} onChange={e => setDate(e.target.value)} /></div>
          </div>
        )}
      </AddForm>
      <div className="flex flex-col gap-2">
         {section.items.map((item, idx) => (
           <DraggableRow key={item.id} listId={section.id} index={idx} onMove={(f, t) => { const l = [...section.items]; l.splice(t, 0, l.splice(f, 1)[0]); onUpdate({...section, items: l})}} className={`p-3 bg-white/5 rounded-lg border border-white/5 ${isIncome ? 'hover:border-neon-green/30' : 'hover:border-neon-red/30'}`}>
             {editingId === item.id ? (
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
                  <input value={editName} onChange={e => setEditName(e.target.value.toUpperCase())} className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-white flex-1 h-8 uppercase outline-none" placeholder="Descrição" autoFocus />
                  <input value={editValue} type="number" onChange={e => setEditValue(e.target.value)} className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-white w-20 h-8 outline-none" placeholder="Total" />
                  {!isIncome && <input value={editPaid} type="number" onChange={e => setEditPaid(e.target.value)} className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-neon-yellow w-20 h-8 outline-none" placeholder="Pago" />}
                  <input value={editDate} onChange={e => setEditDate(e.target.value.toUpperCase())} className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-slate-300 w-24 text-center h-8 outline-none" />
                  <div className="flex gap-1 shrink-0"><ActionButton onClick={saveEdit} icon={<Check size={14} />} color="text-neon-green" /><ActionButton onClick={() => setEditingId(null)} icon={<X size={14} />} color="text-neon-red" /></div>
                </div>
             ) : (
               <>
                 <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm truncate">{item.name}</p>
                    <div className="flex gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {item.installmentsCount && <span>{item.installmentsCount}x</span>}
                      <span>{isIncome ? item.date : `Início: ${item.date}`}</span>
                    </div>
                 </div>
                 <div className="flex items-center justify-end gap-3 shrink-0">
                    <div className="flex flex-col items-end">
                      <span className={`font-extrabold text-sm ${isIncome ? 'text-neon-green' : 'text-white'}`}>R$ {fmt(item.value - (item.paidAmount || 0))}</span>
                      {item.paidAmount ? <span className="text-[9px] text-neon-yellow font-bold uppercase">Pago: R$ {fmt(item.paidAmount)}</span> : null}
                    </div>
                    <div className="flex items-center gap-1">
                       {!isIncome && section.structure === 'installment' && <button onClick={() => handleAdvanceMonth(item)} className="mr-2 px-2 py-1 bg-neon-green/10 text-neon-green border border-neon-green/30 rounded hover:bg-neon-green hover:text-black transition-all text-[10px] font-bold flex items-center gap-1.5"><CalendarCheck size={12} /> PAGAR 1 MÊS</button>}
                       <ActionButton onClick={() => { setEditingId(item.id); setEditName(item.name); setEditValue(item.value.toString()); setEditPaid(item.paidAmount?.toString() || ''); setEditDate(item.date || ''); setEditQtd(item.installmentsCount?.toString() || ''); }} icon={<Pencil size={14} />} />
                       <ActionButton onClick={() => onUpdate({...section, items: section.items.filter(i => i.id !== item.id)})} icon={<Trash2 size={14} />} color="text-slate-500 hover:text-neon-red" />
                    </div>
                 </div>
               </>
             )}
           </DraggableRow>
         ))}
      </div>
    </CollapsibleCard>
  );
};

// --- Fixed Expense Module (Contas Pessoais) ---
export const FixedExpenseModule: React.FC<{ data: FinancialData, onUpdate: (d: FinancialData) => void }> = ({ data, onUpdate }) => {
  const [name, setName] = useState(''); const [value, setValue] = useState(''); const [paid, setPaid] = useState(''); const [date, setDate] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState(''); const [editValue, setEditValue] = useState(''); const [editPaid, setEditPaid] = useState(''); const [editDate, setEditDate] = useState('');
  
  const total = data.fixedExpenses.reduce((acc, i) => acc + (i.value - (i.paidAmount || 0)), 0);

  const handleAdd = () => {
    if (!name || !value) return;
    onUpdate({ ...data, fixedExpenses: [...data.fixedExpenses, { id: Math.random().toString(36).substr(2, 9), name, value: parseFloat(value), paidAmount: parseFloat(paid) || 0, dueDate: date || '10' }] });
    setName(''); setValue(''); setPaid(''); setDate('');
  };

  const saveEdit = () => {
    if (!editingId) return;
    onUpdate({ ...data, fixedExpenses: data.fixedExpenses.map(i => i.id === editingId ? { ...i, name: editName, value: parseFloat(editValue) || 0, paidAmount: parseFloat(editPaid) || 0, dueDate: editDate } : i) });
    setEditingId(null);
  };

  return (
    <CollapsibleCard title="Contas Pessoais" totalValue={`R$ ${fmt(total)}`} color="red" icon={<AlertCircle size={18} />}>
      <AddForm onAdd={handleAdd}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5"><Input placeholder="Descrição" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => handleEnter(e, handleAdd)} /></div>
          <div className="md:col-span-3"><Input type="number" placeholder="Valor Mês" value={value} onChange={e => setValue(e.target.value)} /></div>
          <div className="md:col-span-2"><Input type="number" placeholder="Pago Parcial" value={paid} onChange={e => setPaid(e.target.value)} /></div>
          <div className="md:col-span-2"><Input placeholder="Venc. (Dia)" value={date} onChange={e => setDate(e.target.value)} /></div>
        </div>
      </AddForm>
      <div className="flex flex-col gap-2">
        {data.fixedExpenses.map((item, idx) => (
          <DraggableRow key={item.id} listId="fixed" index={idx} onMove={(f,t) => { const l = [...data.fixedExpenses]; l.splice(t,0,l.splice(f,1)[0]); onUpdate({...data, fixedExpenses: l}) }} className="justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:border-neon-red/30">
             {editingId === item.id ? (
               <div className="flex items-center gap-2 w-full">
                 <input value={editName} onChange={e => setEditName(e.target.value.toUpperCase())} className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-white flex-1 h-8 uppercase outline-none" />
                 <input value={editValue} type="number" onChange={e => setEditValue(e.target.value)} className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-white w-20 h-8 outline-none" />
                 <input value={editPaid} type="number" onChange={e => setEditPaid(e.target.value)} className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-neon-yellow w-20 h-8 outline-none" />
                 <input value={editDate} onChange={e => setEditDate(e.target.value.toUpperCase())} className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-slate-300 w-20 text-center h-8 outline-none" />
                 <div className="flex gap-1"><ActionButton onClick={saveEdit} icon={<Check size={14} />} color="text-neon-green" /><ActionButton onClick={() => setEditingId(null)} icon={<X size={14} />} color="text-neon-red" /></div>
               </div>
             ) : (
               <>
                 <div className="flex-1 min-w-0"><p className="font-bold text-white text-sm truncate">{item.name}</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Venc: {item.dueDate}</p></div>
                 <div className="flex items-center justify-end gap-3 shrink-0">
                   <div className="flex flex-col items-end">
                     <span className="font-extrabold text-white text-sm">R$ {fmt(item.value - (item.paidAmount || 0))}</span>
                     {item.paidAmount ? <span className="text-[9px] text-neon-yellow font-bold uppercase">Pago: R$ {fmt(item.paidAmount)}</span> : null}
                   </div>
                   <div className="flex items-center gap-1">
                      <ActionButton onClick={() => { setEditingId(item.id); setEditName(item.name); setEditValue(item.value.toString()); setEditPaid(item.paidAmount?.toString() || ''); setEditDate(item.dueDate); }} icon={<Pencil size={14} />} />
                      <ActionButton onClick={() => onUpdate({ ...data, fixedExpenses: data.fixedExpenses.filter(i => i.id !== item.id) })} icon={<Trash2 size={14} />} color="text-slate-500 hover:text-neon-red" />
                   </div>
                 </div>
               </>
             )}
          </DraggableRow>
        ))}
      </div>
    </CollapsibleCard>
  );
};

// --- Installment Module ---
export const InstallmentModule: React.FC<{ data: FinancialData, onUpdate: (d: FinancialData) => void }> = ({ data, onUpdate }) => {
  const [name, setName] = useState(''); const [val, setVal] = useState(''); const [paid, setPaid] = useState(''); const [qtd, setQtd] = useState(''); const [start, setStart] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState(''); const [editValue, setEditValue] = useState(''); const [editPaid, setEditPaid] = useState(''); const [editQtd, setEditQtd] = useState(''); const [editStart, setEditStart] = useState('');
  
  const totalMonthly = data.installments.reduce((acc, i) => acc + (i.monthlyValue - (i.paidAmount || 0)), 0);

  const handleAdd = () => {
    if (!name || !val) return;
    onUpdate({...data, installments: [...data.installments, { id: Math.random().toString(36).substr(2, 9), name, monthlyValue: parseFloat(val), paidAmount: parseFloat(paid) || 0, installmentsCount: parseInt(qtd) || 12, startMonth: start || new Date().toISOString().slice(0, 7) }]});
    setName(''); setVal(''); setPaid(''); setQtd(''); setStart('');
  };

  const handleAdvanceMonth = (item: InstallmentExpense) => {
    if (item.installmentsCount <= 1) { if (confirm(`Pagar e remover ${item.name}?`)) onUpdate({...data, installments: data.installments.filter(i => i.id !== item.id)}); return; }
    const [y, m] = item.startMonth.split('-').map(Number);
    const date = new Date(y, m - 1, 1); date.setMonth(date.getMonth() + 1);
    onUpdate({...data, installments: data.installments.map(i => i.id === item.id ? { ...i, installmentsCount: i.installmentsCount - 1, startMonth: `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`, paidAmount: 0 } : i)});
  };

  const saveEdit = () => {
    if(!editingId) return;
    onUpdate({...data, installments: data.installments.map(i => i.id === editingId ? { ...i, name: editName, monthlyValue: parseFloat(editValue) || 0, paidAmount: parseFloat(editPaid) || 0, installmentsCount: parseInt(editQtd) || 1, startMonth: editStart } : i)});
    setEditingId(null);
  };

  return (
      <CollapsibleCard title="Parcelamentos" totalValue={`R$ ${fmt(totalMonthly)}`} color="red" icon={<CalendarDays size={18} />}>
         <AddForm onAdd={handleAdd}>
             <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                 <div className="md:col-span-4"><Input placeholder="Descrição" value={name} onChange={e => setName(e.target.value)} /></div>
                 <div className="md:col-span-3"><Input type="number" placeholder="Valor Mês" value={val} onChange={e => setVal(e.target.value)}/></div>
                 <div className="md:col-span-2"><Input type="number" placeholder="Pago Parcial" value={paid} onChange={e => setPaid(e.target.value)}/></div>
                 <div className="md:col-span-1"><Input type="number" placeholder="Qtd" value={qtd} onChange={e => setQtd(e.target.value)}/></div>
                 <div className="md:col-span-2"><Input placeholder="Início (AAAA-MM)" value={start} onChange={e => setStart(e.target.value)}/></div>
             </div>
         </AddForm>
         <div className="flex flex-col gap-2">
             {data.installments.map((item, idx) => (
                 <DraggableRow key={item.id} listId="installments" index={idx} onMove={(f,t) => {const l = [...data.installments]; l.splice(t,0,l.splice(f,1)[0]); onUpdate({...data, installments: l})}} className="justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:border-neon-red/30">
                     {editingId === item.id ? (
                        <div className="flex items-center gap-2 w-full">
                           <input value={editName} onChange={e => setEditName(e.target.value.toUpperCase())} className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-white flex-1 h-8 uppercase outline-none" />
                           <input value={editValue} type="number" onChange={e => setEditValue(e.target.value)} className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-white w-20 h-8 outline-none" />
                           <input value={editPaid} type="number" onChange={e => setEditPaid(e.target.value)} className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-neon-yellow w-20 h-8 outline-none" />
                           <input value={editStart} onChange={e => setEditStart(e.target.value)} className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-white w-24 h-8 outline-none" />
                           <div className="flex gap-1"><ActionButton onClick={saveEdit} icon={<Check size={14} />} color="text-neon-green"/><ActionButton onClick={() => setEditingId(null)} icon={<X size={14} />} color="text-neon-red"/></div>
                        </div>
                     ) : (
                         <>
                            <div className="flex-1 min-w-0"><p className="font-bold text-white text-sm truncate">{item.name}</p><div className="flex gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider"><span>{item.installmentsCount}x</span><span>Início: {item.startMonth}</span></div></div>
                            <div className="flex items-center justify-end gap-3 shrink-0">
                                <div className="flex flex-col items-end">
                                  <span className="font-extrabold text-white text-sm">R$ {fmt(item.monthlyValue - (item.paidAmount || 0))}</span>
                                  {item.paidAmount ? <span className="text-[9px] text-neon-yellow font-bold uppercase">Pago: R$ {fmt(item.paidAmount)}</span> : null}
                                </div>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => handleAdvanceMonth(item)} className="mr-2 px-2 py-1 bg-neon-green/10 text-neon-green border border-neon-green/30 rounded hover:bg-neon-green hover:text-black transition-all text-[10px] font-bold flex items-center gap-1.5"><CalendarCheck size={12} /> PAGAR 1 MÊS</button>
                                    <ActionButton onClick={() => { setEditingId(item.id); setEditName(item.name); setEditValue(item.monthlyValue.toString()); setEditPaid(item.paidAmount?.toString() || ''); setEditQtd(item.installmentsCount.toString()); setEditStart(item.startMonth); }} icon={<Pencil size={14} />} />
                                    <ActionButton onClick={() => onUpdate({...data, installments: data.installments.filter(i => i.id !== item.id)})} icon={<Trash2 size={14} />} color="text-slate-500 hover:text-neon-red" />
                                </div>
                            </div>
                         </>
                     )}
                 </DraggableRow>
             ))}
         </div>
      </CollapsibleCard>
  );
};

export const IncomeModule: React.FC<{ data: FinancialData, onUpdate: (d: FinancialData) => void }> = ({ data, onUpdate }) => {
  const [newName, setNewName] = useState(''); const [newValue, setNewValue] = useState(''); const [newDate, setNewDate] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState(''); const [editValue, setEditValue] = useState(''); const [editDate, setEditDate] = useState('');
  const incomes = data.incomes;
  const totalValue = incomes.reduce((acc, curr) => acc + curr.value, 0);

  const handleAdd = () => {
    if (!newName || !newValue) return;
    onUpdate({ ...data, incomes: [...data.incomes, { id: Math.random().toString(36).substr(2, 9), name: newName, value: parseFloat(newValue), expectedDate: newDate || new Date().toLocaleDateString('pt-BR') }] });
    setNewName(''); setNewValue(''); setNewDate('');
  };

  const saveEdit = () => {
    if (!editingId) return;
    onUpdate({ ...data, incomes: data.incomes.map(i => i.id === editingId ? { ...i, name: editName, value: parseFloat(editValue) || 0, expectedDate: editDate } : i) });
    setEditingId(null);
  };

  return (
    <CollapsibleCard title="ENTRADAS" totalValue={`R$ ${fmt(totalValue)}`} color="green" icon={<Wallet size={18}/>}>
      <AddForm onAdd={handleAdd}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5"><Input placeholder="Nome" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => handleEnter(e, handleAdd)} /></div>
          <div className="md:col-span-3"><Input type="number" placeholder="Valor" value={newValue} onChange={e => setNewValue(e.target.value)} onKeyDown={e => handleEnter(e, handleAdd)} /></div>
          <div className="md:col-span-4"><Input placeholder="Data (ex: 15/10)" value={newDate} onChange={e => setNewDate(e.target.value)} onKeyDown={e => handleEnter(e, handleAdd)} /></div>
        </div>
      </AddForm>
      <div className="flex flex-col gap-2">
        {incomes.map((item, idx) => (
          <DraggableRow key={item.id} listId="incomes" index={idx} onMove={(f,t) => {const l = [...data.incomes]; l.splice(t,0,l.splice(f,1)[0]); onUpdate({...data, incomes: l})}} className="justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:border-neon-green/30 group">
            {editingId === item.id ? (
              <div className="flex items-center gap-2 w-full">
                <input value={editName} onChange={e => setEditName(e.target.value.toUpperCase())} className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-white w-full h-8 uppercase outline-none" placeholder="Nome" autoFocus />
                <input value={editDate} onChange={e => setEditDate(e.target.value.toUpperCase())} className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-slate-300 w-24 text-center h-8 outline-none" />
                <div className="flex items-center gap-2 shrink-0"><span className="text-neon-green font-bold text-sm">R$</span><input type="number" value={editValue} onChange={e => setEditValue(e.target.value)} className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-white w-24 h-8 outline-none" /><div className="flex gap-1"><ActionButton onClick={saveEdit} icon={<Check size={14} />} color="text-neon-green" /><ActionButton onClick={() => setEditingId(null)} icon={<X size={14} />} color="text-neon-red" /></div></div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="p-1.5 bg-neon-green/10 rounded-full text-neon-green shrink-0"><ArrowRight size={12} className="transform -rotate-45" /></div>
                  <div className="flex flex-col min-w-0"><p className="font-bold text-white text-sm truncate">{item.name}</p><p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{item.expectedDate}</p></div>
                </div>
                <div className="flex items-center justify-end gap-4 shrink-0">
                  <span className="font-extrabold text-neon-green text-base">R$ {fmt(item.value)}</span>
                  <div className="flex items-center gap-1"><ActionButton onClick={() => onUpdate({...data, incomes: [...data.incomes, {...item, id: Math.random().toString(36).substr(2, 9)}]})} icon={<Copy size={14} />} /><ActionButton onClick={() => { setEditingId(item.id); setEditName(item.name); setEditValue(item.value.toString()); setEditDate(item.expectedDate); }} icon={<Pencil size={14} />} /><ActionButton onClick={() => onUpdate({ ...data, incomes: data.incomes.filter(i => i.id !== item.id) })} icon={<Trash2 size={14} />} color="text-slate-500 hover:text-neon-red" /></div>
                </div>
              </>
            )}
          </DraggableRow>
        ))}
      </div>
    </CollapsibleCard>
  );
};

export const RadarModule: React.FC<{ data: FinancialData, onUpdate: (d: FinancialData) => void }> = ({ data, onUpdate }) => {
  const [name, setName] = useState(''); const [value, setValue] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState(''); const [editValue, setEditValue] = useState('');
  const total = data.radarItems.reduce((acc, i) => acc + i.value, 0);
  const handleAdd = () => { if (!name || !value) return; onUpdate({ ...data, radarItems: [...data.radarItems, { id: Math.random().toString(36).substr(2, 9), name, value: parseFloat(value) }] }); setName(''); setValue(''); };
  return (
    <CollapsibleCard title="No Radar" totalValue={`R$ ${fmt(total)}`} color="white" icon={<Target size={18} />}>
       <AddForm onAdd={handleAdd}><div className="grid grid-cols-12 gap-2"><div className="col-span-8"><Input placeholder="Descrição" value={name} onChange={e => setName(e.target.value)} /></div><div className="col-span-4"><Input type="number" placeholder="Valor" value={value} onChange={e => setValue(e.target.value)} /></div></div></AddForm>
       <div className="flex flex-col gap-2">{data.radarItems.map((item, idx) => (
         <DraggableRow key={item.id} listId="radar" index={idx} onMove={(f,t)=>{const l=[...data.radarItems]; l.splice(t,0,l.splice(f,1)[0]); onUpdate({...data, radarItems: l})}} className="justify-between p-3 bg-white/5 rounded-lg border border-white/5">
           {editingId === item.id ? (<div className="flex items-center gap-2 w-full"><input value={editName} onChange={e => setEditName(e.target.value.toUpperCase())} className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-white w-full h-8 outline-none"/><input type="number" value={editValue} onChange={e => setEditValue(e.target.value)} className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-white w-24 h-8 outline-none"/><div className="flex gap-1"><ActionButton onClick={()=>{onUpdate({...data, radarItems: data.radarItems.map(i=>i.id===editingId?{...i,name:editName,value:parseFloat(editValue)||0}:i)}); setEditingId(null);}} icon={<Check size={14}/>}/><ActionButton onClick={()=>setEditingId(null)} icon={<X size={14}/>}/></div></div>) : (
             <><div className="flex-1"><span className="font-bold text-white text-sm">{item.name}</span></div><div className="flex items-center gap-3"><span className="font-extrabold text-white text-sm">R$ {fmt(item.value)}</span><div className="flex items-center gap-1"><ActionButton onClick={()=>{setEditingId(item.id); setEditName(item.name); setEditValue(item.value.toString());}} icon={<Pencil size={14}/>}/><ActionButton onClick={()=>onUpdate({...data, radarItems: data.radarItems.filter(i=>i.id!==item.id)})} icon={<Trash2 size={14}/>}/></div></div></>
           )}
         </DraggableRow>
       ))}</div>
    </CollapsibleCard>
  );
};

export const CreditCardModule: React.FC<{ data: FinancialData, onUpdate: (d: FinancialData) => void }> = ({ data, onUpdate }) => {
    const [name, setName] = useState(''); const [limit, setLimit] = useState('');
    const totalLimit = data.creditCards.reduce((acc, c) => acc + c.limit, 0);
    return (
        <CollapsibleCard title="LIMITES" totalValue={`Total: R$ ${fmt(totalLimit)}`} color="pink" icon={<CCIcon size={18} />}>
            <AddForm onAdd={() => { if(!name) return; onUpdate({...data, creditCards: [...data.creditCards, { id: Math.random().toString(36).substr(2, 9), name, limit: parseFloat(limit) || 0, dueDay: 0, closingDay: 0, currentInvoiceValue: 0 }]}); setName(''); setLimit(''); }}>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2"><div className="md:col-span-8"><Input placeholder="Banco" value={name} onChange={e => setName(e.target.value)} /></div><div className="md:col-span-4"><Input type="number" placeholder="Limite" value={limit} onChange={e => setLimit(e.target.value)} /></div></div>
            </AddForm>
            <div className="flex flex-col gap-3">{data.creditCards.map((card, idx) => (
                <DraggableRow key={card.id} listId="creditCards" index={idx} onMove={(f,t)=>{const l=[...data.creditCards]; l.splice(t,0,l.splice(f,1)[0]); onUpdate({...data, creditCards: l})}} className="bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-xl p-4 relative"><div className="flex-1 min-w-0"><h4 className="font-bold text-white tracking-wide truncate uppercase text-sm">{card.name}</h4><div className="mt-1"><p className="text-[10px] text-slate-400 font-bold uppercase">Disponível</p><p className="text-xl font-bold text-neon-pink">R$ {fmt(card.limit)}</p></div></div><ActionButton onClick={()=>onUpdate({...data, creditCards: data.creditCards.filter(c=>c.id!==card.id)})} icon={<Trash2 size={14}/>}/></DraggableRow>
            ))}</div>
        </CollapsibleCard>
    );
};

export const PixModule: React.FC<{ data: FinancialData, onUpdate: (d: FinancialData) => void }> = ({ data, onUpdate }) => {
    const [type, setType] = useState('CPF'); const [key, setKey] = useState('');
    return (
        <CollapsibleCard title="Chaves Pix" color="blue" icon={<Zap size={18} />}>
            <AddForm onAdd={() => { if(!key) return; onUpdate({...data, pixKeys: [...data.pixKeys, { id: Math.random().toString(36).substr(2, 9), type: type as any, key, active: true }]}); setKey(''); }}>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2"><div className="md:col-span-4"><Select options={[{value: 'CPF', label: 'CPF'},{value: 'Telefone', label: 'Telefone'},{value: 'Email', label: 'Email'}]} value={type} onChange={e => setType(e.target.value)} /></div><div className="md:col-span-8"><Input placeholder="Chave" value={key} onChange={e => setKey(e.target.value)} /></div></div>
            </AddForm>
            <div className="flex flex-col gap-2">{data.pixKeys.map((pk, idx) => (
                <DraggableRow key={pk.id} listId="pixKeys" index={idx} onMove={(f,t)=>{const l=[...data.pixKeys]; l.splice(t,0,l.splice(f,1)[0]); onUpdate({...data, pixKeys: l})}} className="justify-between p-3 bg-white/5 rounded-lg border border-white/5"><div className="flex-1 overflow-hidden"><Badge color="blue">{pk.type}</Badge><p className="text-sm font-mono text-white truncate mt-1">{pk.key}</p></div><ActionButton onClick={()=>navigator.clipboard.writeText(pk.key)} icon={<Copy size={14}/>}/><ActionButton onClick={()=>onUpdate({...data, pixKeys: data.pixKeys.filter(p=>p.id!==pk.id)})} icon={<Trash2 size={14}/>}/></DraggableRow>
            ))}</div>
        </CollapsibleCard>
    );
};
