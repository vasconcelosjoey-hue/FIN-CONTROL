
import React, { useState } from 'react';
import { FinancialData, Income, FixedExpense, InstallmentExpense, CustomSection, SectionItem, RadarItem } from '../types';
import { CollapsibleCard, Button, Input, Select, Badge } from './ui/UIComponents';
import { Trash2, Plus, Wallet, GripVertical, Target, Pencil, Check, X, CreditCard as CCIcon, Zap, FolderOpen, CalendarDays, AlertCircle, Copy, CalendarCheck, Power } from 'lucide-react';

const AddForm = ({ children, onAdd }: { children?: React.ReactNode, onAdd: () => void }) => (
  <div className="mb-4 pt-4 border-t border-white/5">
    {children}
    <Button onClick={onAdd} variant="primary" className="w-full mt-4 h-12 shadow-lg">
      <Plus size={18} /> Adicionar Novo Registro
    </Button>
  </div>
);

const fmt = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const advanceDateStr = (dateStr: string): string => {
  if (!dateStr) return new Date().toISOString().slice(0, 7);
  const monthsBR = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  const upperDate = dateStr.toUpperCase().trim();
  const mIdx = monthsBR.indexOf(upperDate);
  if (mIdx !== -1) return monthsBR[(mIdx + 1) % 12];
  const hyphenMatch = upperDate.match(/^(\d{4})-(\d{1,2})$/);
  if (hyphenMatch) {
    const y = parseInt(hyphenMatch[1]);
    const m = parseInt(hyphenMatch[2]);
    const d = new Date(y, m, 1);
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  }
  return dateStr;
};

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
  <div className="w-full flex flex-col gap-4 py-3">
    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 w-full">
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
  <div className={`flex flex-col gap-2 ${props.className || ''}`}>
    {label && <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{label}</label>}
    <input 
      {...props} 
      className={`bg-black/60 border border-white/20 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue/20 transition-all h-12 w-full placeholder:text-slate-700 font-bold`}
    />
  </div>
);

const ToggleStatusButton = ({ active, onClick }: { active: boolean, onClick: () => void }) => (
  <button 
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border text-[10px] font-black tracking-[0.2em] transition-all active:scale-95 shrink-0 ${
      active 
      ? 'bg-neon-green/10 border-neon-green text-neon-green shadow-neon-green' 
      : 'bg-neon-red/10 border-neon-red text-neon-red shadow-neon-red'
    }`}
  >
    <Power size={12} /> {active ? 'ON' : 'OFF'}
  </button>
);

export const CustomSectionModule: React.FC<{ section: CustomSection, onUpdate: (updatedSection: CustomSection, immediate?: boolean) => void, onDeleteSection: () => void }> = ({ section, onUpdate, onDeleteSection }) => {
  const [name, setName] = useState(''); const [value, setValue] = useState(''); const [date, setDate] = useState(''); const [qtd, setQtd] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState(''); const [editValue, setEditValue] = useState(''); const [editPaid, setEditPaid] = useState(''); const [editDate, setEditDate] = useState(''); const [editQtd, setEditQtd] = useState('');

  const isIncome = section.type === 'income';
  const total = section.items.filter(i => i.isActive !== false).reduce((acc, i) => acc + (i.value - (i.paidAmount || 0)), 0);

  const handleAdd = () => {
    if (!name || !value) return;
    const newItem: SectionItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: name.toUpperCase(),
      value: parseFloat(value),
      paidAmount: 0,
      date: date.toUpperCase() || (isIncome ? new Date().toLocaleDateString('pt-BR') : new Date().toISOString().slice(0, 7)),
      installmentsCount: !isIncome ? (parseInt(qtd) || 1) : undefined,
      isActive: true
    };
    onUpdate({ ...section, items: [...section.items, newItem] }, true);
    setName(''); setValue(''); setDate(''); setQtd('');
  };

  return (
    <CollapsibleCard title={section.title} totalValue={`R$ ${fmt(total)}`} color={isIncome ? 'green' : 'red'} icon={<FolderOpen size={18} />} onEditTitle={nt => onUpdate({...section, title: nt.toUpperCase()}, true)}>
      <div className="flex justify-end mb-2"><button onClick={onDeleteSection} className={`text-[10px] font-bold text-slate-500 hover:text-neon-red uppercase transition-all flex items-center gap-1 opacity-60`}><Trash2 size={12}/> DELETAR SESSÃO</button></div>
      <AddForm onAdd={handleAdd}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-4"><Input placeholder="DESCRIÇÃO" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => handleEnter(e, handleAdd)} /></div>
          <div className="md:col-span-3"><Input type="number" placeholder="VALOR A PARCELA" value={value} onChange={e => setValue(e.target.value)} onKeyDown={e => handleEnter(e, handleAdd)} /></div>
          {!isIncome && <div className="md:col-span-2"><Input type="number" placeholder="QTDE" value={qtd} onChange={e => setQtd(e.target.value)} onKeyDown={e => handleEnter(e, handleAdd)} /></div>}
          <div className={isIncome ? "md:col-span-5" : "md:col-span-3"}><Input placeholder="DATA REFERENCIAL" value={date} onChange={e => setDate(e.target.value)} onKeyDown={e => handleEnter(e, handleAdd)} /></div>
        </div>
      </AddForm>
      <div className="flex flex-col gap-2">
        {section.items.map((item, idx) => {
          const isActive = item.isActive !== false;
          return (
            <div key={item.id} className={`p-4 bg-white/5 rounded-xl border transition-all duration-300 ${isActive ? 'border-white/5' : 'border-neon-red/10 opacity-70'}`}>
              <DraggableRow listId={section.id} index={idx} onMove={(f,t) => {const l=[...section.items]; l.splice(t,0,l.splice(f,1)[0]); onUpdate({...section, items:l}, true)}}>
                {editingId === item.id ? (
                  <EditRowLayout onSave={() => { onUpdate({...section, items: section.items.map(i => i.id === editingId ? {...i, name: editName.toUpperCase(), value: parseFloat(editValue)||0, paidAmount: parseFloat(editPaid)||0, date: editDate.toUpperCase(), installmentsCount: parseInt(editQtd)||1} : i)}, true); setEditingId(null); }} onCancel={() => setEditingId(null)}>
                    <EditInput label="DESCRIÇÃO" className="sm:col-span-4" value={editName} onChange={e=>setEditName(e.target.value)} />
                    <EditInput label="VALOR A PARCELA" type="number" className="sm:col-span-2" value={editValue} onChange={e=>setEditValue(e.target.value)} />
                    {!isIncome && <EditInput label="PAGO PARCIAL" type="number" className="sm:col-span-2" value={editPaid} onChange={e=>setEditPaid(e.target.value)} />}
                    {!isIncome && <EditInput label="QTDE" type="number" className="sm:col-span-2" value={editQtd} onChange={e=>setEditQtd(e.target.value)} />}
                    <EditInput label="DATA REFERENCIAL" className="sm:col-span-2" value={editDate} onChange={e=>setEditDate(e.target.value)} />
                  </EditRowLayout>
                ) : (
                  <div className="flex items-center justify-between w-full gap-4">
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm truncate tracking-wide ${isActive ? 'text-white' : 'text-slate-500 line-through'}`}>{item.name}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{item.date} {!isIncome && item.installmentsCount ? `• ${item.installmentsCount}X` : ''}</p>
                    </div>
                    <ToggleStatusButton active={isActive} onClick={() => onUpdate({...section, items: section.items.map(i => i.id === item.id ? {...i, isActive: !isActive} : i)}, true)} />
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex flex-col items-end">
                         <span className={`font-black text-base ${isActive ? (isIncome ? 'text-neon-green' : 'text-white') : 'text-slate-600'}`}>R$ {fmt(item.value - (item.paidAmount||0))}</span>
                         {!isIncome && isActive && <div className="flex items-center gap-1.5 mt-1"><span className="text-[12px] text-slate-500 font-black uppercase tracking-tighter">PAGO PARCIAL:</span><input type="number" value={item.paidAmount || ''} onChange={e => onUpdate({...section, items: section.items.map(i => i.id === item.id ? {...i, paidAmount: parseFloat(e.target.value)||0} : i)})} className="w-20 bg-black/50 border border-white/10 rounded px-1 text-xs text-neon-yellow font-black text-center py-0.5 outline-none focus:border-neon-yellow/50 transition-all"/></div>}
                      </div>
                      <div className="flex items-center gap-1">
                        <ActionButton onClick={() => { setEditingId(item.id); setEditName(item.name); setEditValue(item.value.toString()); setEditPaid(item.paidAmount?.toString()||''); setEditDate(item.date||''); setEditQtd(item.installmentsCount?.toString()||''); }} icon={<Pencil size={18} />} />
                        <ActionButton onClick={() => onUpdate({...section, items: section.items.filter(i => i.id !== item.id)}, true)} icon={<Trash2 size={18} />} color="text-slate-600 hover:text-neon-red" />
                      </div>
                    </div>
                  </div>
                )}
              </DraggableRow>
            </div>
          );
        })}
      </div>
    </CollapsibleCard>
  );
};

export const FixedExpenseModule: React.FC<{ data: FinancialData, onUpdate: (d: FinancialData, immediate?: boolean) => void }> = ({ data, onUpdate }) => {
  const [name, setName] = useState(''); const [val, setVal] = useState(''); const [qtd, setQtd] = useState(''); const [date, setDate] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState(''); const [editValue, setEditValue] = useState(''); const [editPaid, setEditPaid] = useState(''); const [editDate, setEditDate] = useState(''); const [editQtd, setEditQtd] = useState('');

  const total = data.fixedExpenses.filter(e => e.isActive !== false).reduce((acc, i) => acc + (i.value - (i.paidAmount || 0)), 0);

  const handleAdd = () => {
    if (!name || !val) return;
    onUpdate({ ...data, fixedExpenses: [...data.fixedExpenses, { id: Math.random().toString(36).substr(2, 9), name: name.toUpperCase(), value: parseFloat(val), paidAmount: 0, dueDate: date.toUpperCase() || new Date().toISOString().slice(0, 7), installmentsCount: parseInt(qtd) || 1, isActive: true }] }, true);
    setName(''); setVal(''); setQtd(''); setDate('');
  };

  return (
    <CollapsibleCard title="CONTAS PESSOAIS" totalValue={`R$ ${fmt(total)}`} color="red" icon={<AlertCircle size={18} />}>
      <AddForm onAdd={handleAdd}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-4"><Input placeholder="DESCRIÇÃO" value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="md:col-span-3"><Input type="number" placeholder="VALOR A PARCELA" value={val} onChange={e => setVal(e.target.value)} /></div>
          <div className="md:col-span-2"><Input type="number" placeholder="QTDE" value={qtd} onChange={e => setQtd(e.target.value)} /></div>
          <div className="md:col-span-3"><Input placeholder="DATA REFERENCIAL" value={date} onChange={e => setDate(e.target.value)} /></div>
        </div>
      </AddForm>
      <div className="flex flex-col gap-2">
        {data.fixedExpenses.map((item, idx) => {
          const isActive = item.isActive !== false;
          const isPaid = (item.paidAmount || 0) >= item.value;
          return (
            <div key={item.id} className={`p-4 bg-white/5 rounded-xl border transition-all duration-300 ${isActive ? 'border-white/5 hover:border-neon-red/20' : 'border-neon-red/10 opacity-70'}`}>
              <DraggableRow listId="fixed" index={idx} onMove={(f,t) => {const l=[...data.fixedExpenses]; l.splice(t,0,l.splice(f,1)[0]); onUpdate({...data, fixedExpenses:l}, true)}}>
                {editingId === item.id ? (
                  <EditRowLayout onSave={() => { onUpdate({...data, fixedExpenses: data.fixedExpenses.map(i => i.id === editingId ? {...i, name: editName.toUpperCase(), value: parseFloat(editValue)||0, paidAmount: parseFloat(editPaid)||0, dueDate: editDate.toUpperCase(), installmentsCount: parseInt(editQtd)||1} : i)}, true); setEditingId(null); }} onCancel={() => setEditingId(null)}>
                    <EditInput label="DESCRIÇÃO" className="sm:col-span-4" value={editName} onChange={e=>setEditName(e.target.value)} />
                    <EditInput label="VALOR A PARCELA" type="number" className="sm:col-span-2" value={editValue} onChange={e=>setEditValue(e.target.value)} />
                    <EditInput label="PAGO PARCIAL" type="number" className="sm:col-span-2" value={editPaid} onChange={e=>setEditPaid(e.target.value)} />
                    <EditInput label="QTDE" type="number" className="sm:col-span-2" value={editQtd} onChange={e=>setEditQtd(e.target.value)} />
                    <EditInput label="DATA REFERENCIAL" className="sm:col-span-2" value={editDate} onChange={e=>setEditDate(e.target.value)} />
                  </EditRowLayout>
                ) : (
                  <div className="flex items-center justify-between w-full gap-4">
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm truncate ${isActive ? 'text-white' : 'text-slate-500 line-through'}`}>{item.name}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{item.dueDate} • {item.installmentsCount}X</p>
                    </div>
                    <ToggleStatusButton active={isActive} onClick={() => onUpdate({...data, fixedExpenses: data.fixedExpenses.map(i => i.id === item.id ? {...i, isActive: !isActive} : i)}, true)} />
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex flex-col items-end">
                         <span className={`font-black text-base ${isActive ? (isPaid ? 'text-neon-green' : 'text-white') : 'text-slate-600'}`}>R$ {fmt(item.value - (item.paidAmount||0))}</span>
                         {isActive && <div className="flex items-center gap-1.5 mt-1"><span className="text-[12px] text-slate-500 font-black uppercase tracking-tighter">PAGO PARCIAL:</span><input type="number" value={item.paidAmount || ''} onChange={e => onUpdate({...data, fixedExpenses: data.fixedExpenses.map(i => i.id === item.id ? {...i, paidAmount: parseFloat(e.target.value)||0} : i)})} className="w-20 bg-black/50 border border-white/10 rounded px-1 text-xs text-neon-yellow font-black text-center py-0.5 outline-none focus:border-neon-yellow/50 transition-all"/></div>}
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => { if(item.installmentsCount! > 1) { onUpdate({...data, fixedExpenses: data.fixedExpenses.map(i => i.id === item.id ? {...i, installmentsCount: i.installmentsCount!-1, dueDate: advanceDateStr(item.dueDate), paidAmount: 0} : i)}, true); } else { if(confirm("Remover conta finalizada?")) onUpdate({...data, fixedExpenses: data.fixedExpenses.filter(i => i.id !== item.id)}, true); } }} className="px-2.5 py-1.5 bg-neon-green/10 text-neon-green border border-neon-green/30 rounded-lg hover:bg-neon-green hover:text-black transition-all text-[10px] font-bold"><CalendarCheck size={16} /></button>
                        <ActionButton onClick={() => { setEditingId(item.id); setEditName(item.name); setEditValue(item.value.toString()); setEditPaid(item.paidAmount?.toString()||''); setEditDate(item.dueDate); setEditQtd(item.installmentsCount?.toString()||''); }} icon={<Pencil size={18} />} />
                      </div>
                    </div>
                  </div>
                )}
              </DraggableRow>
            </div>
          );
        })}
      </div>
    </CollapsibleCard>
  );
};

export const InstallmentModule: React.FC<{ data: FinancialData, onUpdate: (d: FinancialData, immediate?: boolean) => void }> = ({ data, onUpdate }) => {
  const [name, setName] = useState(''); const [val, setVal] = useState(''); const [qtd, setQtd] = useState(''); const [start, setStart] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState(''); const [editValue, setEditValue] = useState(''); const [editPaid, setEditPaid] = useState(''); const [editQtd, setEditQtd] = useState(''); const [editStart, setEditStart] = useState('');

  const total = data.installments.filter(e => e.isActive !== false).reduce((acc, i) => acc + (i.monthlyValue - (i.paidAmount || 0)), 0);

  const handleAdd = () => {
    if (!name || !val) return;
    onUpdate({...data, installments: [...data.installments, { id: Math.random().toString(36).substr(2, 9), name: name.toUpperCase(), monthlyValue: parseFloat(val), paidAmount: 0, installmentsCount: parseInt(qtd) || 12, startMonth: start.toUpperCase() || new Date().toISOString().slice(0, 7), isActive: true }]}, true);
    setName(''); setVal(''); setQtd(''); setStart('');
  };

  return (
    <CollapsibleCard title="PARCELAMENTOS" totalValue={`R$ ${fmt(total)}`} color="red" icon={<CalendarDays size={18} />}>
      <AddForm onAdd={handleAdd}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-4"><Input placeholder="DESCRIÇÃO" value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="md:col-span-3"><Input type="number" placeholder="VALOR A PARCELA" value={val} onChange={e => setVal(e.target.value)} /></div>
          <div className="md:col-span-2"><Input type="number" placeholder="QTDE" value={qtd} onChange={e => setQtd(e.target.value)} /></div>
          <div className="md:col-span-3"><Input placeholder="DATA REFERENCIAL" value={start} onChange={e => setStart(e.target.value)} /></div>
        </div>
      </AddForm>
      <div className="flex flex-col gap-2">
        {data.installments.map((item, idx) => {
          const isActive = item.isActive !== false;
          return (
            <div key={item.id} className={`p-4 bg-white/5 rounded-xl border transition-all duration-300 ${isActive ? 'border-white/5' : 'border-neon-red/10 opacity-70'}`}>
              <DraggableRow listId="installments" index={idx} onMove={(f,t) => {const l=[...data.installments]; l.splice(t,0,l.splice(f,1)[0]); onUpdate({...data, installments:l}, true)}}>
                {editingId === item.id ? (
                  <EditRowLayout onSave={() => { onUpdate({...data, installments: data.installments.map(i => i.id === editingId ? {...i, name: editName.toUpperCase(), monthlyValue: parseFloat(editValue)||0, paidAmount: parseFloat(editPaid)||0, installmentsCount: parseInt(editQtd)||1, startMonth: editStart.toUpperCase()} : i)}, true); setEditingId(null); }} onCancel={() => setEditingId(null)}>
                    <EditInput label="DESCRIÇÃO" className="sm:col-span-4" value={editName} onChange={e=>setEditName(e.target.value)} />
                    <EditInput label="VALOR A PARCELA" type="number" className="sm:col-span-2" value={editValue} onChange={e=>setEditValue(e.target.value)} />
                    <EditInput label="PAGO PARCIAL" type="number" className="sm:col-span-2" value={editPaid} onChange={e=>setEditPaid(e.target.value)} />
                    <EditInput label="QTDE" type="number" className="sm:col-span-2" value={editQtd} onChange={e=>setEditQtd(e.target.value)} />
                    <EditInput label="DATA REFERENCIAL" className="sm:col-span-2" value={editStart} onChange={e=>setEditStart(e.target.value)} />
                  </EditRowLayout>
                ) : (
                  <div className="flex items-center justify-between w-full gap-4">
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm truncate ${isActive ? 'text-white' : 'text-slate-500 line-through'}`}>{item.name}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{item.startMonth} • {item.installmentsCount}X Restantes</p>
                    </div>
                    <ToggleStatusButton active={isActive} onClick={() => onUpdate({...data, installments: data.installments.map(i => i.id === item.id ? {...i, isActive: !isActive} : i)}, true)} />
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex flex-col items-end">
                         <span className={`font-black text-base ${isActive ? 'text-white' : 'text-slate-600'}`}>R$ {fmt(item.monthlyValue - (item.paidAmount||0))}</span>
                         {isActive && <div className="flex items-center gap-1.5 mt-1"><span className="text-[12px] text-slate-500 font-black uppercase tracking-tighter">PAGO PARCIAL:</span><input type="number" value={item.paidAmount || ''} onChange={e => onUpdate({...data, installments: data.installments.map(i => i.id === item.id ? {...i, paidAmount: parseFloat(e.target.value)||0} : i)})} className="w-20 bg-black/50 border border-white/10 rounded px-1 text-xs text-neon-yellow font-black text-center py-0.5 outline-none focus:border-neon-yellow/50 transition-all"/></div>}
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => { if(item.installmentsCount > 1) { onUpdate({...data, installments: data.installments.map(i => i.id === item.id ? {...i, installmentsCount: i.installmentsCount-1, startMonth: advanceDateStr(item.startMonth), paidAmount: 0} : i)}, true); } else { if(confirm("Remover parcelamento finalizado?")) onUpdate({...data, installments: data.installments.filter(i => i.id !== item.id)}, true); } }} className="px-2.5 py-1.5 bg-neon-green/10 text-neon-green border border-neon-green/30 rounded-lg hover:bg-neon-green hover:text-black transition-all text-[10px] font-bold"><CalendarCheck size={16} /></button>
                        <ActionButton onClick={() => { setEditingId(item.id); setEditName(item.name); setEditValue(item.monthlyValue.toString()); setEditPaid(item.paidAmount?.toString()||''); setEditQtd(item.installmentsCount.toString()); setEditStart(item.startMonth); }} icon={<Pencil size={18} />} />
                      </div>
                    </div>
                  </div>
                )}
              </DraggableRow>
            </div>
          );
        })}
      </div>
    </CollapsibleCard>
  );
};

export const IncomeModule: React.FC<{ data: FinancialData, onUpdate: (d: FinancialData, immediate?: boolean) => void }> = ({ data, onUpdate }) => {
  const [name, setName] = useState(''); const [val, setVal] = useState(''); const [date, setDate] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState(''); const [editValue, setEditValue] = useState(''); const [editDate, setEditDate] = useState('');

  const total = data.incomes.filter(i => i.isActive !== false).reduce((acc, i) => acc + i.value, 0);

  const handleAdd = () => {
    if (!name || !val) return;
    onUpdate({ ...data, incomes: [...data.incomes, { id: Math.random().toString(36).substr(2, 9), name: name.toUpperCase(), value: parseFloat(val), expectedDate: date.toUpperCase() || new Date().toLocaleDateString('pt-BR'), isActive: true }] }, true);
    setName(''); setVal(''); setDate('');
  };

  return (
    <CollapsibleCard title="RECEITAS FIXAS" totalValue={`R$ ${fmt(total)}`} color="green" icon={<Wallet size={18} />}>
      <AddForm onAdd={handleAdd}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6"><Input placeholder="DESCRIÇÃO" value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="md:col-span-3"><Input type="number" placeholder="VALOR A RECEBER" value={val} onChange={e => setVal(e.target.value)} /></div>
          <div className="md:col-span-3"><Input placeholder="DATA REFERENCIAL" value={date} onChange={e => setDate(e.target.value)} /></div>
        </div>
      </AddForm>
      <div className="flex flex-col gap-2">
        {data.incomes.map((item, idx) => {
          const isActive = item.isActive !== false;
          return (
            <div key={item.id} className={`p-4 bg-white/5 rounded-xl border transition-all duration-300 ${isActive ? 'border-white/5 hover:border-neon-green/20' : 'border-neon-red/10 opacity-70'}`}>
              <DraggableRow listId="incomes" index={idx} onMove={(f,t) => {const l=[...data.incomes]; l.splice(t,0,l.splice(f,1)[0]); onUpdate({...data, incomes:l}, true)}}>
                {editingId === item.id ? (
                  <EditRowLayout onSave={() => { onUpdate({...data, incomes: data.incomes.map(i => i.id === editingId ? {...i, name: editName.toUpperCase(), value: parseFloat(editValue)||0, expectedDate: editDate.toUpperCase()} : i)}, true); setEditingId(null); }} onCancel={() => setEditingId(null)}>
                    <EditInput label="DESCRIÇÃO" className="sm:col-span-6" value={editName} onChange={e=>setEditName(e.target.value)} />
                    <EditInput label="VALOR" type="number" className="sm:col-span-3" value={editValue} onChange={e=>setEditValue(e.target.value)} />
                    <EditInput label="DATA" className="sm:col-span-3" value={editDate} onChange={e=>setEditDate(e.target.value)} />
                  </EditRowLayout>
                ) : (
                  <div className="flex items-center justify-between w-full gap-4">
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm truncate ${isActive ? 'text-white' : 'text-slate-500 line-through'}`}>{item.name}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{item.expectedDate}</p>
                    </div>
                    <ToggleStatusButton active={isActive} onClick={() => onUpdate({...data, incomes: data.incomes.map(i => i.id === item.id ? {...i, isActive: !isActive} : i)}, true)} />
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`font-black text-base ${isActive ? 'text-neon-green drop-shadow-[0_0_8px_rgba(10,255,104,0.3)]' : 'text-slate-600'}`}>R$ {fmt(item.value)}</span>
                      <div className="flex gap-1">
                        <ActionButton onClick={() => { setEditingId(item.id); setEditName(item.name); setEditValue(item.value.toString()); setEditDate(item.expectedDate); }} icon={<Pencil size={18} />} />
                        <ActionButton onClick={() => onUpdate({ ...data, incomes: data.incomes.filter(i => i.id !== item.id) }, true)} icon={<Trash2 size={18} />} color="text-slate-600 hover:text-neon-red" />
                      </div>
                    </div>
                  </div>
                )}
              </DraggableRow>
            </div>
          );
        })}
      </div>
    </CollapsibleCard>
  );
};

export const CreditCardModule: React.FC<{ data: FinancialData, onUpdate: (d: FinancialData, immediate?: boolean) => void }> = ({ data, onUpdate }) => {
  const [name, setName] = useState(''); const [limit, setLimit] = useState(''); const [closing, setClosing] = useState(''); const [due, setDue] = useState(''); const [invoice, setInvoice] = useState('');
  const handleAdd = () => {
    if (!name || !limit) return;
    onUpdate({ ...data, creditCards: [...data.creditCards, { id: Math.random().toString(36).substr(2, 9), name: name.toUpperCase(), limit: parseFloat(limit), closingDay: parseInt(closing) || 1, dueDay: parseInt(due) || 1, currentInvoiceValue: parseFloat(invoice) || 0 }] }, true);
    setName(''); setLimit(''); setClosing(''); setDue(''); setInvoice('');
  };
  return (
    <CollapsibleCard title="CARTÕES DE CRÉDITO" color="pink" icon={<CCIcon size={18} />}>
      <AddForm onAdd={handleAdd}>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Input placeholder="IDENTIFICAÇÃO DO CARTÃO" value={name} onChange={e => setName(e.target.value)} /></div>
          <Input type="number" placeholder="LIMITE TOTAL" value={limit} onChange={e => setLimit(e.target.value)} />
          <Input type="number" placeholder="FATURA ATUAL" value={invoice} onChange={e => setInvoice(e.target.value)} />
          <Input type="number" placeholder="DIA FECH." value={closing} onChange={e => setClosing(e.target.value)} />
          <Input type="number" placeholder="DIA VENC." value={due} onChange={e => setDue(e.target.value)} />
        </div>
      </AddForm>
      <div className="flex flex-col gap-3">
        {data.creditCards.map(card => {
          const used = Math.min((card.currentInvoiceValue / card.limit) * 100, 100);
          return (
            <div key={card.id} className="p-4 bg-black/40 rounded-xl border border-white/10 relative overflow-hidden group">
              <div className="absolute top-0 left-0 h-1 bg-neon-pink shadow-neon-pink transition-all duration-1000" style={{ width: `${used}%` }}></div>
              <div className="flex justify-between items-start mb-2">
                <div><h4 className="font-bold text-white text-sm">{card.name}</h4><p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">FECH: {card.closingDay} | VENC: {card.dueDay}</p></div>
                <ActionButton onClick={() => onUpdate({ ...data, creditCards: data.creditCards.filter(c => c.id !== card.id) }, true)} icon={<Trash2 size={16} />} />
              </div>
              <div className="flex justify-between items-end mt-4">
                <div><p className="text-[8px] text-slate-500 font-bold uppercase">VALOR FATURA</p><p className="text-sm font-black text-neon-pink">R$ {fmt(card.currentInvoiceValue)}</p></div>
                <div className="text-right"><p className="text-[8px] text-slate-500 font-bold uppercase">LIMITE LIVRE</p><p className="text-xs font-bold text-slate-300">R$ {fmt(card.limit - card.currentInvoiceValue)}</p></div>
              </div>
            </div>
          );
        })}
      </div>
    </CollapsibleCard>
  );
};

export const PixModule: React.FC<{ data: FinancialData, onUpdate: (d: FinancialData, immediate?: boolean) => void }> = ({ data, onUpdate }) => {
  const [type, setType] = useState<any>('Aleatória'); const [key, setKey] = useState(''); const [ben, setBen] = useState('');
  const handleAdd = () => { if (!key) return; onUpdate({ ...data, pixKeys: [...data.pixKeys, { id: Math.random().toString(36).substr(2, 9), type, key: key.toUpperCase(), beneficiary: ben.toUpperCase(), active: true }] }, true); setKey(''); setBen(''); };
  return (
    <CollapsibleCard title="CHAVES PIX" color="blue" icon={<Zap size={18} />}>
      <AddForm onAdd={handleAdd}>
        <div className="flex flex-col gap-3">
          <Select label="TIPO DE CHAVE" value={type} onChange={e => setType(e.target.value)} options={[{ value: 'CPF', label: 'CPF' }, { value: 'CNPJ', label: 'CNPJ' }, { value: 'Telefone', label: 'TELEFONE' }, { value: 'Email', label: 'EMAIL' }, { value: 'Aleatória', label: 'ALEATÓRIA' }]} />
          <Input placeholder="INSIRA A CHAVE" value={key} onChange={e => setKey(e.target.value)} />
          <Input placeholder="BENEFICIÁRIO" value={ben} onChange={e => setBen(e.target.value)} />
        </div>
      </AddForm>
      <div className="flex flex-col gap-2">
        {data.pixKeys.map(k => (
          <div key={k.id} className="p-4 bg-white/5 rounded-xl border border-white/5 group hover:border-neon-blue/40 transition-all">
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2"><Badge color="blue">{k.type}</Badge>{k.beneficiary && <span className="text-[10px] font-bold text-slate-400 truncate">{k.beneficiary}</span>}</div>
                <p className="text-xs font-mono text-white truncate break-all">{k.key}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { navigator.clipboard.writeText(k.key); alert('Copiado!'); }} className="p-2 text-slate-500 hover:text-neon-blue transition-colors"><Copy size={16} /></button>
                <button onClick={() => onUpdate({ ...data, pixKeys: data.pixKeys.filter(pk => pk.id !== k.id) }, true)} className="p-2 text-slate-500 hover:text-neon-red transition-colors"><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </CollapsibleCard>
  );
};

export const RadarModule: React.FC<{ data: FinancialData, onUpdate: (d: FinancialData, immediate?: boolean) => void }> = ({ data, onUpdate }) => {
  const [name, setName] = useState(''); const [val, setVal] = useState('');
  const handleAdd = () => { if (!name || !val) return; onUpdate({ ...data, radarItems: [...data.radarItems, { id: Math.random().toString(36).substr(2, 9), name: name.toUpperCase(), value: parseFloat(val) }] }, true); setName(''); setVal(''); };
  return (
    <CollapsibleCard title="RADAR DE ATIVOS" color="yellow" icon={<Target size={18} />}>
      <AddForm onAdd={handleAdd}>
        <div className="grid grid-cols-1 gap-3">
          <Input placeholder="ITEM / ATIVO" value={name} onChange={e => setName(e.target.value)} />
          <Input type="number" placeholder="VALOR ALVO R$" value={val} onChange={e => setVal(e.target.value)} />
        </div>
      </AddForm>
      <div className="flex flex-col gap-2">
        {data.radarItems.map(item => (
          <div key={item.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-neon-yellow/40 transition-all">
            <span className="text-xs font-bold text-white uppercase tracking-wide">{item.name}</span>
            <div className="flex items-center gap-4">
              <span className="text-sm font-black text-neon-yellow">R$ {fmt(item.value)}</span>
              <button onClick={() => onUpdate({ ...data, radarItems: data.radarItems.filter(i => i.id !== item.id) }, true)} className="text-slate-600 hover:text-neon-red transition-colors"><X size={18} /></button>
            </div>
          </div>
        ))}
      </div>
    </CollapsibleCard>
  );
};
