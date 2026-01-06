
import React, { useState } from 'react';
import { FinancialData, Income, FixedExpense, InstallmentExpense, CustomSection, SectionItem, RadarItem } from '../types';
import { CollapsibleCard, Button, Input, Select, Badge } from './ui/UIComponents';
import { Trash2, Plus, ArrowRight, Wallet, GripVertical, Target, Pencil, Check, X, CreditCard as CCIcon, Zap, FolderOpen, CalendarDays, AlertCircle, Copy, CalendarCheck, User, Power } from 'lucide-react';

const AddForm = ({ children, onAdd }: { children?: React.ReactNode, onAdd: () => void }) => (
  <div className="mb-3 pt-2 border-t border-white/5">
    {children}
    <Button onClick={onAdd} variant="primary" className="w-full mt-3 h-10 sm:h-9">
      <Plus size={16} /> Adicionar
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

  const slashMatch = upperDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/) || upperDate.match(/^(\d{1,2})\/(\d{2,4})$/);
  if (slashMatch) {
    const isFull = slashMatch.length === 4;
    const dVal = isFull ? parseInt(slashMatch[1]) : 1;
    const mVal = isFull ? parseInt(slashMatch[2]) : parseInt(slashMatch[1]);
    let yVal = isFull ? parseInt(slashMatch[3]) : parseInt(slashMatch[2]);
    if (yVal < 100) yVal += 2000;
    
    const d = new Date(yVal, mVal, dVal);
    const nextM = (d.getMonth() + 1).toString().padStart(2, '0');
    const nextY = d.getFullYear();
    
    return isFull 
      ? `${dVal.toString().padStart(2, '0')}/${nextM}/${nextY}` 
      : `${nextM}/${nextY}`;
  }
  return dateStr;
};

const ActionButton = ({ onClick, icon, color = "text-slate-500 hover:text-white" }: { onClick: () => void, icon: React.ReactNode, color?: string }) => (
  <button onClick={(e) => { e.stopPropagation(); onClick(); }} className={`${color} transition-colors p-2 rounded hover:bg-white/10 shrink-0`}>
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
      <div className="mr-2 text-slate-700 hover:text-slate-500 shrink-0"><GripVertical size={14} /></div>
      {children}
    </div>
  );
};

const EditRowLayout: React.FC<{ children: React.ReactNode, onSave: () => void, onCancel: () => void }> = ({ children, onSave, onCancel }) => (
  <div className="w-full flex flex-col gap-4 py-2">
    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 w-full">
      {children}
    </div>
    <div className="flex flex-col sm:flex-row gap-2 w-full pt-2">
      <button onClick={onSave} className="flex-1 flex items-center justify-center gap-2 bg-neon-green/20 text-neon-green border border-neon-green/40 py-2.5 rounded-xl hover:bg-neon-green hover:text-black transition-all font-bold text-xs uppercase tracking-widest shadow-lg active:scale-[0.98]">
        <Check size={16} /> SALVAR ALTERAÇÕES
      </button>
      <button onClick={onCancel} className="flex-1 flex items-center justify-center gap-2 bg-white/5 text-slate-400 border border-white/10 py-2.5 rounded-xl hover:bg-neon-red/10 hover:text-neon-red hover:border-neon-red/30 transition-all font-bold text-xs uppercase tracking-widest active:scale-[0.98]">
        <X size={16} /> CANCELAR
      </button>
    </div>
  </div>
);

const EditInput = ({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) => (
  <div className={`flex flex-col gap-1.5 ${props.className || ''}`}>
    {label && <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">{label}</label>}
    <input 
      {...props} 
      className={`bg-black/60 border border-white/20 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue/20 transition-all h-11 w-full placeholder:text-slate-700`}
    />
  </div>
);

export const CustomSectionModule: React.FC<{ 
  section: CustomSection, 
  onUpdate: (updatedSection: CustomSection, immediate?: boolean) => void, 
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
  const totalRemaining = section.items.reduce((acc, i) => acc + (i.value - (i.paidAmount || 0)), 0);
  const color = isIncome ? 'green' : 'red';
  const neonColor = isIncome ? 'text-neon-green' : 'text-neon-red';

  const handleAdd = () => {
    if (!name || !value) return;
    const newItem: SectionItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: name.toUpperCase(),
      value: parseFloat(value),
      paidAmount: parseFloat(paid) || 0,
      date: date.toUpperCase() || (section.type === 'expense' ? new Date().toISOString().slice(0, 7) : new Date().toLocaleDateString('pt-BR')),
      installmentsCount: !isIncome ? (parseInt(qtd) || 1) : undefined
    };
    onUpdate({ ...section, items: [...section.items, newItem] }, true);
    setName(''); setValue(''); setPaid(''); setDate(''); setQtd('');
  };

  const updatePaidAmount = (itemId: string, amount: string) => {
    const val = parseFloat(amount) || 0;
    onUpdate({ ...section, items: section.items.map(i => i.id === itemId ? { ...i, paidAmount: val } : i) });
  };

  const handleAdvanceMonth = (item: SectionItem) => {
    if (!item.installmentsCount || item.installmentsCount <= 1) {
      if (confirm(`Remover ${item.name}?`)) onUpdate({ ...section, items: section.items.filter(i => i.id !== item.id) }, true);
      return;
    }
    const nextDate = advanceDateStr(item.date || '');
    onUpdate({ ...section, items: section.items.map(i => i.id === item.id ? { ...i, installmentsCount: i.installmentsCount! - 1, date: nextDate, paidAmount: 0 } : i) }, true);
  };

  const saveEdit = () => {
    if (!editingId) return;
    onUpdate({ ...section, items: section.items.map(i => i.id === editingId ? { ...i, name: editName.toUpperCase(), value: parseFloat(editValue) || 0, paidAmount: parseFloat(editPaid) || 0, date: editDate.toUpperCase(), installmentsCount: !isIncome ? (parseInt(editQtd) || 1) : undefined } : i) }, true);
    setEditingId(null);
  };

  return (
    <CollapsibleCard title={section.title} totalValue={`R$ ${fmt(totalRemaining)}`} color={color} icon={<FolderOpen size={18} />} onEditTitle={nt => onUpdate({...section, title: nt.toUpperCase()}, true)}>
      <div className="flex justify-end mb-2"><button onClick={onDeleteSection} className={`text-[10px] ${neonColor} hover:underline font-bold flex items-center gap-1 opacity-60`}><Trash2 size={12}/> EXCLUIR SESSÃO</button></div>
      <AddForm onAdd={handleAdd}>
        {isIncome ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
            <div className="md:col-span-5"><Input placeholder="FONTE / NOME" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => handleEnter(e, handleAdd)} /></div>
            <div className="md:col-span-3"><Input type="number" placeholder="VALOR R$" value={value} onChange={e => setValue(e.target.value)} onKeyDown={e => handleEnter(e, handleAdd)} /></div>
            <div className="md:col-span-4"><Input placeholder="DATA / REF." value={date} onChange={e => setDate(e.target.value)} onKeyDown={e => handleEnter(e, handleAdd)} /></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
            <div className="md:col-span-4"><Input placeholder="DESCRIÇÃO" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => handleEnter(e, handleAdd)} /></div>
            <div className="md:col-span-3"><Input type="number" placeholder="VALOR MÊS" value={value} onChange={e => setValue(e.target.value)} onKeyDown={e => handleEnter(e, handleAdd)} /></div>
            <div className="md:col-span-2"><Input type="number" placeholder="PAGO R$" value={paid} onChange={e => setPaid(e.target.value)} onKeyDown={e => handleEnter(e, handleAdd)} /></div>
            <div className="md:col-span-1"><Input type="number" placeholder="QTD" value={qtd} onChange={e => setQtd(e.target.value)} onKeyDown={e => handleEnter(e, handleAdd)} /></div>
            <div className="md:col-span-2"><Input placeholder="INÍCIO" value={date} onChange={e => setDate(e.target.value)} onKeyDown={e => handleEnter(e, handleAdd)} /></div>
          </div>
        )}
      </AddForm>
      <div className="flex flex-col gap-2">
         {section.items.map((item, idx) => {
           const isFullyPaid = !isIncome && (item.paidAmount || 0) >= item.value;
           return (
             <div key={item.id} className={`p-4 bg-white/5 rounded-xl border transition-all duration-300 ${isFullyPaid ? 'border-neon-green/40 bg-neon-green/5' : 'border-white/5'} ${isIncome ? 'hover:border-neon-green/30' : 'hover:border-neon-red/30'}`}>
               <DraggableRow listId={section.id} index={idx} onMove={(f, t) => { const l = [...section.items]; l.splice(t, 0, l.splice(f, 1)[0]); onUpdate({...section, items: l}, true)}} className="w-full">
               {editingId === item.id ? (
                  <EditRowLayout onSave={saveEdit} onCancel={() => setEditingId(null)}>
                    <EditInput label="NOME / DESCRIÇÃO" className="sm:col-span-4 uppercase font-bold" value={editName} onChange={e => setEditName(e.target.value.toUpperCase())} onKeyDown={e => handleEnter(e, saveEdit)} autoFocus />
                    <EditInput label="VALOR" type="number" className="sm:col-span-2" value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={e => handleEnter(e, saveEdit)} />
                    {!isIncome && <EditInput label="PAGO" type="number" className="sm:col-span-2 text-neon-yellow" value={editPaid} onChange={e => setEditPaid(e.target.value)} onKeyDown={e => handleEnter(e, saveEdit)} />}
                    {!isIncome && <EditInput label="QTD" type="number" className="sm:col-span-2" value={editQtd} onChange={e => setEditQtd(e.target.value)} onKeyDown={e => handleEnter(e, saveEdit)} />}
                    <EditInput label="REF. / DATA" className={isIncome ? "sm:col-span-6 text-center" : "sm:col-span-2 text-center"} value={editDate} onChange={e => setEditDate(e.target.value.toUpperCase())} onKeyDown={e => handleEnter(e, saveEdit)} />
                  </EditRowLayout>
               ) : (
                 <div className="flex items-center justify-between w-full gap-2">
                   <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm tracking-wide mb-1 truncate ${isFullyPaid ? 'text-neon-green/60 line-through' : 'text-white'}`}>{item.name}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        {!isIncome && item.installmentsCount && <span className="text-slate-200 bg-white/10 px-1.5 rounded">{item.installmentsCount}X</span>}
                        <span className="text-slate-300">{isIncome ? item.date : `Ref: ${item.date}`}</span>
                      </div>
                   </div>
                   <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 shrink-0">
                      <div className="flex flex-col items-end">
                        <span className={`font-black text-sm tracking-tight ${isIncome ? 'text-neon-green' : isFullyPaid ? 'text-neon-green' : 'text-white'}`}>R$ {fmt(item.value - (item.paidAmount || 0))}</span>
                        {!isIncome && (
                          <div className="flex items-center gap-1.5 mt-1" onClick={e => e.stopPropagation()}>
                            <span className="text-[8px] text-slate-500 font-bold">PAGO:</span>
                            <input 
                              type="number" 
                              value={item.paidAmount || ''} 
                              onChange={e => updatePaidAmount(item.id, e.target.value)}
                              onKeyDown={e => { if(e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                              className="w-16 bg-black/50 border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-neon-yellow font-black outline-none focus:border-neon-yellow/50 text-center"
                              placeholder="0,00"
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                         {!isIncome && (
                           <button onClick={() => handleAdvanceMonth(item)} className={`px-2 py-1.5 border rounded-lg transition-all text-[10px] font-bold flex items-center gap-1.5 ${isFullyPaid ? 'bg-neon-green text-black border-neon-green shadow-neon-green' : 'bg-neon-green/10 text-neon-green border-neon-green/30 hover:bg-neon-green hover:text-black'}`}><CalendarCheck size={14} /> OK</button>
                         )}
                         <ActionButton onClick={() => { setEditingId(item.id); setEditName(item.name); setEditValue(item.value.toString()); setEditPaid(item.paidAmount?.toString() || ''); setEditDate(item.date || ''); setEditQtd(item.installmentsCount?.toString() || '1'); }} icon={<Pencil size={16} />} />
                         <ActionButton onClick={() => onUpdate({...section, items: section.items.filter(i => i.id !== item.id)}, true)} icon={<Trash2 size={16} />} color="text-slate-600 hover:text-neon-red" />
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
  const [name, setName] = useState(''); const [value, setValue] = useState(''); const [paid, setPaid] = useState(''); const [qtd, setQtd] = useState(''); const [date, setDate] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState(''); const [editValue, setEditValue] = useState(''); const [editPaid, setEditPaid] = useState(''); const [editQtd, setEditQtd] = useState(''); const [editDate, setEditDate] = useState('');
  
  const totalRemaining = data.fixedExpenses.reduce((acc, i) => acc + (i.value - (i.paidAmount || 0)), 0);

  const handleAdd = () => {
    if (!name || !value) return;
    onUpdate({ ...data, fixedExpenses: [...data.fixedExpenses, { id: Math.random().toString(36).substr(2, 9), name: name.toUpperCase(), value: parseFloat(value), paidAmount: parseFloat(paid) || 0, dueDate: date.toUpperCase() || new Date().toISOString().slice(0, 7), installmentsCount: parseInt(qtd) || 1 }] }, true);
    setName(''); setValue(''); setPaid(''); setQtd(''); setDate('');
  };

  const updatePaidAmount = (itemId: string, amount: string) => {
    onUpdate({ ...data, fixedExpenses: data.fixedExpenses.map(i => i.id === itemId ? { ...i, paidAmount: parseFloat(amount) || 0 } : i) });
  };

  const handleAdvanceMonth = (item: FixedExpense) => {
    if (!item.installmentsCount || item.installmentsCount <= 1) {
      if (confirm(`Remover ${item.name}?`)) onUpdate({ ...data, fixedExpenses: data.fixedExpenses.filter(i => i.id !== item.id) }, true);
      return;
    }
    const nextDate = advanceDateStr(item.dueDate || '');
    onUpdate({ ...data, fixedExpenses: data.fixedExpenses.map(i => i.id === item.id ? { ...i, installmentsCount: i.installmentsCount! - 1, dueDate: nextDate, paidAmount: 0 } : i) }, true);
  };

  const saveEdit = () => {
    if (!editingId) return;
    onUpdate({ ...data, fixedExpenses: data.fixedExpenses.map(i => i.id === editingId ? { ...i, name: editName.toUpperCase(), value: parseFloat(editValue) || 0, paidAmount: parseFloat(editPaid) || 0, dueDate: editDate.toUpperCase(), installmentsCount: parseInt(editQtd) || 1 } : i) }, true);
    setEditingId(null);
  };

  return (
    <CollapsibleCard title="CONTAS PESSOAIS" totalValue={`R$ ${fmt(totalRemaining)}`} color="red" icon={<AlertCircle size={18} />}>
      <AddForm onAdd={handleAdd}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
          <div className="md:col-span-4"><Input placeholder="DESCRIÇÃO" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => handleEnter(e, handleAdd)} /></div>
          <div className="md:col-span-3"><Input type="number" placeholder="VALOR MÊS" value={value} onChange={e => setValue(e.target.value)} onKeyDown={e => handleEnter(e, handleAdd)} /></div>
          <div className="md:col-span-2"><Input type="number" placeholder="PAGO R$" value={paid} onChange={e => setPaid(e.target.value)} onKeyDown={e => handleEnter(e, handleAdd)} /></div>
          <div className="md:col-span-1"><Input type="number" placeholder="QTD" value={qtd} onChange={e => setQtd(e.target.value)} onKeyDown={e => handleEnter(e, handleAdd)} /></div>
          <div className="md:col-span-2"><Input placeholder="REFERÊNCIA" value={date} onChange={e => setDate(e.target.value)} onKeyDown={e => handleEnter(e, handleAdd)} /></div>
        </div>
      </AddForm>
      <div className="flex flex-col gap-2">
        {data.fixedExpenses.map((item, idx) => {
          const isFullyPaid = (item.paidAmount || 0) >= item.value;
          return (
            <div key={item.id} className={`p-4 bg-white/5 rounded-xl border transition-all duration-300 ${isFullyPaid ? 'border-neon-green/40 bg-neon-green/5' : 'border-white/5'} hover:border-neon-red/30`}>
              <DraggableRow listId="fixed" index={idx} onMove={(f,t) => { const l = [...data.fixedExpenses]; l.splice(t,0,l.splice(f,1)[0]); onUpdate({...data, fixedExpenses: l}, true) }} className="w-full">
              {editingId === item.id ? (
                <EditRowLayout onSave={saveEdit} onCancel={() => setEditingId(null)}>
                  <EditInput label="DESCRIÇÃO" className="sm:col-span-4 uppercase font-bold" value={editName} onChange={e => setEditName(e.target.value.toUpperCase())} onKeyDown={e => handleEnter(e, saveEdit)} autoFocus />
                  <EditInput label="VALOR" type="number" className="sm:col-span-2" value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={e => handleEnter(e, saveEdit)} />
                  <EditInput label="PAGO" type="number" className="sm:col-span-2 text-neon-yellow" value={editPaid} onChange={e => setEditPaid(e.target.value)} onKeyDown={e => handleEnter(e, saveEdit)} />
                  <EditInput label="QTD" type="number" className="sm:col-span-2" value={editQtd} onChange={e => setEditQtd(e.target.value)} onKeyDown={e => handleEnter(e, saveEdit)} />
                  <EditInput label="REF." className="sm:col-span-2 text-center" value={editDate} onChange={e => setEditDate(e.target.value.toUpperCase())} onKeyDown={e => handleEnter(e, saveEdit)} />
                </EditRowLayout>
              ) : (
                <div className="flex items-center justify-between w-full gap-2">
                  <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm tracking-wide mb-1 truncate ${isFullyPaid ? 'text-neon-green/60 line-through' : 'text-white'}`}>{item.name}</p>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        <span className="text-slate-200 bg-white/10 px-1.5 rounded">{item.installmentsCount}X</span>
                        <span className="text-slate-300">Ref: {item.dueDate}</span>
                      </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 shrink-0">
                    <div className="flex flex-col items-end">
                      <span className={`font-black text-sm tracking-tight ${isFullyPaid ? 'text-neon-green' : 'text-white'}`}>R$ {fmt(item.value - (item.paidAmount || 0))}</span>
                      <div className="flex items-center gap-1.5 mt-1" onClick={e => e.stopPropagation()}>
                        <span className="text-[8px] text-slate-500 font-bold">PAGO:</span>
                        <input 
                          type="number" 
                          value={item.paidAmount || ''} 
                          onChange={e => updatePaidAmount(item.id, e.target.value)}
                          onKeyDown={e => { if(e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                          className="w-16 bg-black/50 border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-neon-yellow font-black outline-none focus:border-neon-yellow/50 text-center"
                          placeholder="0,00"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button onClick={() => handleAdvanceMonth(item)} className={`px-2 py-1.5 border rounded-lg transition-all text-[10px] font-bold flex items-center gap-1.5 ${isFullyPaid ? 'bg-neon-green text-black border-neon-green shadow-neon-green' : 'bg-neon-green/10 text-neon-green border-neon-green/30 hover:bg-neon-green hover:text-black'}`}><CalendarCheck size={14} /> OK</button>
                        <ActionButton onClick={() => { setEditingId(item.id); setEditName(item.name); setEditValue(item.value.toString()); setEditPaid(item.paidAmount?.toString() || ''); setEditQtd(item.installmentsCount?.toString() || '1'); setEditDate(item.dueDate); }} icon={<Pencil size={16} />} />
                        <ActionButton onClick={() => onUpdate({ ...data, fixedExpenses: data.fixedExpenses.filter(i => i.id !== item.id) }, true)} icon={<Trash2 size={16} />} color="text-slate-600 hover:text-neon-red" />
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
  const [name, setName] = useState(''); const [val, setVal] = useState(''); const [paid, setPaid] = useState(''); const [qtd, setQtd] = useState(''); const [start, setStart] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState(''); const [editValue, setEditValue] = useState(''); const [editPaid, setEditPaid] = useState(''); const [editQtd, setEditQtd] = useState(''); const [editStart, setEditStart] = useState('');
  
  const totalRemainingMonthly = data.installments.reduce((acc, i) => acc + (i.monthlyValue - (i.paidAmount || 0)), 0);

  const handleAdd = () => {
    if (!name || !val) return;
    onUpdate({...data, installments: [...data.installments, { id: Math.random().toString(36).substr(2, 9), name: name.toUpperCase(), monthlyValue: parseFloat(val), paidAmount: parseFloat(paid) || 0, installmentsCount: parseInt(qtd) || 12, startMonth: start.toUpperCase() || new Date().toISOString().slice(0, 7) }]}, true);
    setName(''); setVal(''); setPaid(''); setQtd(''); setStart('');
  };

  const updatePaidAmount = (itemId: string, amount: string) => {
    onUpdate({ ...data, installments: data.installments.map(i => i.id === itemId ? { ...i, paidAmount: parseFloat(amount) || 0 } : i) });
  };

  const handleAdvanceMonth = (item: InstallmentExpense) => {
    if (item.installmentsCount <= 1) { if (confirm(`Remover ${item.name}?`)) onUpdate({...data, installments: data.installments.filter(i => i.id !== item.id)}, true); return; }
    const nextDate = advanceDateStr(item.startMonth || '');
    onUpdate({...data, installments: data.installments.map(i => i.id === item.id ? { ...i, installmentsCount: i.installmentsCount - 1, startMonth: nextDate, paidAmount: 0 } : i)}, true);
  };

  const saveEdit = () => {
    if(!editingId) return;
    onUpdate({...data, installments: data.installments.map(i => i.id === editingId ? { ...i, name: editName.toUpperCase(), monthlyValue: parseFloat(editValue) || 0, paidAmount: parseFloat(editPaid) || 0, installmentsCount: parseInt(editQtd) || 1, startMonth: editStart.toUpperCase() } : i)}, true);
    setEditingId(null);
  };

  return (
      <CollapsibleCard title="PARCELAMENTOS" totalValue={`R$ ${fmt(totalRemainingMonthly)}`} color="red" icon={<CalendarDays size={18} />}>
         <AddForm onAdd={handleAdd}>
             <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                 <div className="md:col-span-4"><Input placeholder="DESCRIÇÃO" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => handleEnter(e, handleAdd)} /></div>
                 <div className="md:col-span-3"><Input type="number" placeholder="VALOR MÊS" value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => handleEnter(e, handleAdd)}/></div>
                 <div className="md:col-span-2"><Input type="number" placeholder="PAGO R$" value={paid} onChange={e => setPaid(e.target.value)} onKeyDown={e => handleEnter(e, handleAdd)}/></div>
                 <div className="md:col-span-1"><Input type="number" placeholder="QTD" value={qtd} onChange={e => setQtd(e.target.value)} onKeyDown={e => handleEnter(e, handleAdd)}/></div>
                 <div className="md:col-span-2"><Input placeholder="INÍCIO" value={start} onChange={e => setStart(e.target.value)} onKeyDown={e => handleEnter(e, handleAdd)}/></div>
             </div>
         </AddForm>
         <div className="flex flex-col gap-2">
             {data.installments.map((item, idx) => {
                 const isFullyPaid = (item.paidAmount || 0) >= item.monthlyValue;
                 return (
                  <div key={item.id} className={`p-4 bg-white/5 rounded-xl border transition-all duration-300 ${isFullyPaid ? 'border-neon-green/40 bg-neon-green/5' : 'border-white/5'} hover:border-neon-red/30`}>
                      <DraggableRow listId="installments" index={idx} onMove={(f,t) => {const l = [...data.installments]; l.splice(t,0,l.splice(f,1)[0]); onUpdate({...data, installments: l}, true)}} className="w-full">
                      {editingId === item.id ? (
                        <EditRowLayout onSave={saveEdit} onCancel={() => setEditingId(null)}>
                           <EditInput label="DESCRIÇÃO" className="sm:col-span-4 uppercase font-bold" value={editName} onChange={e => setEditName(e.target.value.toUpperCase())} onKeyDown={e => handleEnter(e, saveEdit)} autoFocus />
                           <EditInput label="VALOR" type="number" className="sm:col-span-2" value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={e => handleEnter(e, saveEdit)} />
                           <EditInput label="PAGO" type="number" className="sm:col-span-2 text-neon-yellow" value={editPaid} onChange={e => setEditPaid(e.target.value)} onKeyDown={e => handleEnter(e, saveEdit)} />
                           <EditInput label="QTD" type="number" className="sm:col-span-2" value={editQtd} onChange={e => setEditQtd(e.target.value)} onKeyDown={e => handleEnter(e, saveEdit)} />
                           <EditInput label="INÍCIO" className="sm:col-span-2 text-center" value={editStart} onChange={e => setEditStart(e.target.value)} onKeyDown={e => handleEnter(e, saveEdit)} />
                        </EditRowLayout>
                      ) : (
                        <div className="flex items-center justify-between w-full gap-2">
                            <div className="flex-1 min-w-0">
                                <p className={`font-bold text-sm tracking-wide mb-1 truncate ${isFullyPaid ? 'text-neon-green/60 line-through' : 'text-white'}`}>{item.name}</p>
                                <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                  <span className="text-slate-200 bg-white/10 px-1.5 rounded">{item.installmentsCount}X</span>
                                  <span className="text-slate-300">Início: {item.startMonth}</span>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 shrink-0">
                                <div className="flex flex-col items-end">
                                  <span className={`font-black text-sm tracking-tight ${isFullyPaid ? 'text-neon-green' : 'text-white'}`}>R$ {fmt(item.monthlyValue - (item.paidAmount || 0))}</span>
                                  <div className="flex items-center gap-1.5 mt-1" onClick={e => e.stopPropagation()}>
                                    <span className="text-[8px] text-slate-500 font-bold">PAGO:</span>
                                    <input 
                                      type="number" 
                                      value={item.paidAmount || ''} 
                                      onChange={e => updatePaidAmount(item.id, e.target.value)}
                                      onKeyDown={e => { if(e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                                      className="w-16 bg-black/50 border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-neon-yellow font-black outline-none focus:border-neon-yellow/50 text-center"
                                      placeholder="0,00"
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => handleAdvanceMonth(item)} className={`px-2 py-1.5 border rounded-lg transition-all text-[10px] font-bold flex items-center gap-1.5 ${isFullyPaid ? 'bg-neon-green text-black border-neon-green shadow-neon-green' : 'bg-neon-green/10 text-neon-green border-neon-green/30 hover:bg-neon-green hover:text-black'}`}><CalendarCheck size={14} /> OK</button>
                                    <ActionButton onClick={() => { setEditingId(item.id); setEditName(item.name); setEditValue(item.monthlyValue.toString()); setEditPaid(item.paidAmount?.toString() || ''); setEditQtd(item.installmentsCount.toString()); setEditStart(item.startMonth); }} icon={<Pencil size={16} />} />
                                    <ActionButton onClick={() => onUpdate({...data, installments: data.installments.filter(i => i.id !== item.id)}, true)} icon={<Trash2 size={16} />} color="text-slate-600 hover:text-neon-red" />
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
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [date, setDate] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editValue, setEditValue] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editActive, setEditActive] = useState(true);

  // Somatório considera apenas ativos
  const total = data.incomes.filter(i => i.isActive !== false).reduce((acc, i) => acc + i.value, 0);

  const handleAdd = () => {
    if (!name || !value) return;
    onUpdate({ ...data, incomes: [...data.incomes, { id: Math.random().toString(36).substr(2, 9), name: name.toUpperCase(), value: parseFloat(value), expectedDate: date.toUpperCase() || new Date().toLocaleDateString('pt-BR'), isActive: true }] }, true);
    setName(''); setValue(''); setDate('');
  };

  const toggleIncomeStatus = (id: string) => {
    onUpdate({
      ...data,
      incomes: data.incomes.map(i => i.id === id ? { ...i, isActive: i.isActive === false ? true : false } : i)
    }, true);
  };

  const saveEdit = () => {
    if (!editingId) return;
    onUpdate({ 
      ...data, 
      incomes: data.incomes.map(i => i.id === editingId ? { 
        ...i, 
        name: editName.toUpperCase(), 
        value: parseFloat(editValue) || 0, 
        expectedDate: editDate.toUpperCase(),
        isActive: editActive
      } : i) 
    }, true);
    setEditingId(null);
  };

  return (
    <CollapsibleCard title="RECEITAS FIXAS" totalValue={`R$ ${fmt(total)}`} color="green" icon={<Wallet size={18} />}>
      <AddForm onAdd={handleAdd}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
          <div className="md:col-span-6"><Input placeholder="FONTE / NOME" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => handleEnter(e, handleAdd)} /></div>
          <div className="md:col-span-3"><Input type="number" placeholder="VALOR R$" value={value} onChange={e => setValue(e.target.value)} onKeyDown={e => handleEnter(e, handleAdd)} /></div>
          <div className="md:col-span-3"><Input placeholder="DATA / REF." value={date} onChange={e => setDate(e.target.value)} onKeyDown={e => handleEnter(e, handleAdd)} /></div>
        </div>
      </AddForm>
      <div className="flex flex-col gap-2">
        {data.incomes.map((item, idx) => {
          const isActive = item.isActive !== false;
          return (
            <div key={item.id} className={`p-4 bg-white/5 rounded-xl border transition-all duration-300 ${isActive ? 'border-white/5 hover:border-neon-green/30 opacity-100' : 'border-neon-red/10 grayscale opacity-60 bg-black/40'}`}>
              <DraggableRow listId="incomes" index={idx} onMove={(f,t) => { const l = [...data.incomes]; l.splice(t, 0, l.splice(f, 1)[0]); onUpdate({...data, incomes: l}, true) }} className="w-full">
                {editingId === item.id ? (
                  <EditRowLayout onSave={saveEdit} onCancel={() => setEditingId(null)}>
                    <EditInput 
                      label="FONTE"
                      className="sm:col-span-5 uppercase font-bold" 
                      value={editName} 
                      onChange={e => setEditName(e.target.value.toUpperCase())} 
                      onKeyDown={e => handleEnter(e, saveEdit)} 
                      autoFocus 
                    />
                    <EditInput 
                      label="VALOR"
                      type="number" 
                      className="sm:col-span-2 font-black text-neon-green" 
                      value={editValue} 
                      onChange={e => setEditValue(e.target.value)} 
                      onKeyDown={e => handleEnter(e, saveEdit)} 
                    />
                    <EditInput 
                      label="DATA"
                      className="sm:col-span-3 text-center uppercase text-slate-400 font-bold" 
                      value={editDate} 
                      onChange={e => setEditDate(e.target.value.toUpperCase())} 
                      onKeyDown={e => handleEnter(e, saveEdit)} 
                    />
                    <div className="sm:col-span-2 flex flex-col items-center justify-center gap-1">
                       <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">STATUS</label>
                       <button 
                        onClick={() => setEditActive(!editActive)}
                        className={`w-full h-11 rounded-xl border flex items-center justify-center gap-2 transition-all font-black text-[10px] ${editActive ? 'bg-neon-green/10 border-neon-green text-neon-green' : 'bg-neon-red/10 border-neon-red text-neon-red'}`}
                       >
                         <Power size={14} /> {editActive ? 'ON' : 'OFF'}
                       </button>
                    </div>
                  </EditRowLayout>
                ) : (
                  <div className="flex items-center justify-between w-full gap-4">
                    {/* Nome do Registro */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm tracking-wide transition-all ${isActive ? 'text-white' : 'text-slate-500 line-through'}`}>{item.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.expectedDate}</p>
                    </div>

                    {/* Botão ON OFF Centralizado */}
                    <div className="flex items-center justify-center shrink-0">
                      <button 
                        onClick={() => toggleIncomeStatus(item.id)}
                        className={`flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg border text-[10px] font-black tracking-widest transition-all shadow-md active:scale-95 ${isActive ? 'bg-neon-green/10 border-neon-green text-neon-green shadow-neon-green/30' : 'bg-neon-red/10 border-neon-red text-neon-red shadow-neon-red/20'}`}
                      >
                        <Power size={12} /> {isActive ? 'ON' : 'OFF'}
                      </button>
                    </div>

                    {/* Valor e Ações Finais */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`font-black text-sm transition-colors ${isActive ? 'text-neon-green drop-shadow-[0_0_5px_rgba(10,255,104,0.3)]' : 'text-slate-600'}`}>R$ {fmt(item.value)}</span>
                      <div className="flex items-center gap-1">
                        <ActionButton 
                          onClick={() => { 
                            setEditingId(item.id); 
                            setEditName(item.name); 
                            setEditValue(item.value.toString()); 
                            setEditDate(item.expectedDate); 
                            setEditActive(item.isActive !== false);
                          }} 
                          icon={<Pencil size={16} />} 
                        />
                        <ActionButton 
                          onClick={() => onUpdate({ ...data, incomes: data.incomes.filter(i => i.id !== item.id) }, true)} 
                          icon={<Trash2 size={16} />} 
                          color="text-slate-600 hover:text-neon-red" 
                        />
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
  const [name, setName] = useState('');
  const [limit, setLimit] = useState('');
  const [closing, setClosing] = useState('');
  const [due, setDue] = useState('');
  const [invoice, setInvoice] = useState('');

  const handleAdd = () => {
    if (!name || !limit) return;
    onUpdate({ ...data, creditCards: [...data.creditCards, { id: Math.random().toString(36).substr(2, 9), name: name.toUpperCase(), limit: parseFloat(limit), closingDay: parseInt(closing) || 1, dueDay: parseInt(due) || 1, currentInvoiceValue: parseFloat(invoice) || 0 }] }, true);
    setName(''); setLimit(''); setClosing(''); setDue(''); setInvoice('');
  };

  return (
    <CollapsibleCard title="CARTÕES DE CRÉDITO" color="pink" icon={<CCIcon size={18} />}>
      <AddForm onAdd={handleAdd}>
        <div className="grid grid-cols-2 gap-2">
          <div className="col-span-2"><Input placeholder="NOME DO CARTÃO" value={name} onChange={e => setName(e.target.value)} /></div>
          <Input type="number" placeholder="LIMITE" value={limit} onChange={e => setLimit(e.target.value)} />
          <Input type="number" placeholder="FATURA ATUAL" value={invoice} onChange={e => setInvoice(e.target.value)} />
          <Input type="number" placeholder="FECHAMENTO" value={closing} onChange={e => setClosing(e.target.value)} />
          <Input type="number" placeholder="VENCIMENTO" value={due} onChange={e => setDue(e.target.value)} />
        </div>
      </AddForm>
      <div className="flex flex-col gap-3">
        {data.creditCards.map(card => {
          const usedPercent = Math.min((card.currentInvoiceValue / card.limit) * 100, 100);
          return (
            <div key={card.id} className="p-4 bg-black/40 rounded-xl border border-white/10 relative overflow-hidden group">
              <div className="absolute top-0 left-0 h-1 bg-neon-pink shadow-neon-pink" style={{ width: `${usedPercent}%` }}></div>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-bold text-white text-sm">{card.name}</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">FECH: {card.closingDay} | VENC: {card.dueDay}</p>
                </div>
                <ActionButton onClick={() => onUpdate({ ...data, creditCards: data.creditCards.filter(c => c.id !== card.id) }, true)} icon={<Trash2 size={14} />} />
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[8px] text-slate-500 font-bold uppercase">FATURA</p>
                  <p className="text-sm font-black text-neon-pink">R$ {fmt(card.currentInvoiceValue)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] text-slate-500 font-bold uppercase">DISPONÍVEL</p>
                  <p className="text-xs font-bold text-slate-300">R$ {fmt(card.limit - card.currentInvoiceValue)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </CollapsibleCard>
  );
};

export const PixModule: React.FC<{ data: FinancialData, onUpdate: (d: FinancialData, immediate?: boolean) => void }> = ({ data, onUpdate }) => {
  const [type, setType] = useState<any>('Aleatória');
  const [key, setKey] = useState('');
  const [beneficiary, setBeneficiary] = useState('');

  const handleAdd = () => {
    if (!key) return;
    onUpdate({ ...data, pixKeys: [...data.pixKeys, { id: Math.random().toString(36).substr(2, 9), type, key: key.toUpperCase(), beneficiary: beneficiary.toUpperCase(), active: true }] }, true);
    setKey(''); setBeneficiary('');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Chave PIX copiada!');
  };

  return (
    <CollapsibleCard title="CHAVES PIX" color="blue" icon={<Zap size={18} />}>
      <AddForm onAdd={handleAdd}>
        <div className="flex flex-col gap-2">
          <Select label="TIPO" value={type} onChange={e => setType(e.target.value)} options={[
            { value: 'CPF', label: 'CPF' },
            { value: 'CNPJ', label: 'CNPJ' },
            { value: 'Telefone', label: 'TELEFONE' },
            { value: 'Email', label: 'EMAIL' },
            { value: 'Aleatória', label: 'ALEATÓRIA' }
          ]} />
          <Input placeholder="CHAVE" value={key} onChange={e => setKey(e.target.value)} />
          <Input placeholder="BENEFICIÁRIO (OPCIONAL)" value={beneficiary} onChange={e => setBeneficiary(e.target.value)} />
        </div>
      </AddForm>
      <div className="flex flex-col gap-2">
        {data.pixKeys.map(k => (
          <div key={k.id} className="p-3 bg-white/5 rounded-xl border border-white/5 group hover:border-neon-blue/40 transition-all">
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge color="blue">{k.type}</Badge>
                  {k.beneficiary && <span className="text-[10px] font-bold text-slate-400 truncate">{k.beneficiary}</span>}
                </div>
                <p className="text-xs font-mono text-white truncate break-all">{k.key}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => copyToClipboard(k.key)} className="p-2 text-slate-500 hover:text-neon-blue transition-colors"><Copy size={14} /></button>
                <button onClick={() => onUpdate({ ...data, pixKeys: data.pixKeys.filter(pk => pk.id !== k.id) }, true)} className="p-2 text-slate-500 hover:text-neon-red transition-colors"><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </CollapsibleCard>
  );
};

export const RadarModule: React.FC<{ data: FinancialData, onUpdate: (d: FinancialData, immediate?: boolean) => void }> = ({ data, onUpdate }) => {
  const [name, setName] = useState('');
  const [val, setVal] = useState('');

  const handleAdd = () => {
    if (!name || !val) return;
    onUpdate({ ...data, radarItems: [...data.radarItems, { id: Math.random().toString(36).substr(2, 9), name: name.toUpperCase(), value: parseFloat(val) }] }, true);
    setName(''); setVal('');
  };

  return (
    <CollapsibleCard title="RADAR DE INVESTIMENTOS" color="yellow" icon={<Target size={18} />}>
      <AddForm onAdd={handleAdd}>
        <div className="grid grid-cols-2 gap-2">
          <div className="col-span-2"><Input placeholder="ITEM / ATIVO" value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="col-span-2"><Input type="number" placeholder="VALOR ALVO" value={val} onChange={e => setVal(e.target.value)} /></div>
        </div>
      </AddForm>
      <div className="flex flex-col gap-2">
        {data.radarItems.map(item => (
          <div key={item.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-neon-yellow/40">
            <span className="text-xs font-bold text-white uppercase">{item.name}</span>
            <div className="flex items-center gap-3">
              <span className="text-sm font-black text-neon-yellow">R$ {fmt(item.value)}</span>
              <button onClick={() => onUpdate({ ...data, radarItems: data.radarItems.filter(i => i.id !== item.id) }, true)} className="text-slate-600 hover:text-neon-red transition-colors"><X size={14} /></button>
            </div>
          </div>
        ))}
      </div>
    </CollapsibleCard>
  );
};
