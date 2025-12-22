
import React, { useState } from 'react';
import { FinancialData, Income, FixedExpense, InstallmentExpense, CustomSection, SectionItem, RadarItem } from '../types';
import { CollapsibleCard, Button, Input, Select, Badge } from './ui/UIComponents';
import { Trash2, Plus, ArrowRight, Wallet, GripVertical, Target, Pencil, Check, X, CreditCard as CCIcon, Zap, FolderOpen, CalendarDays, AlertCircle, Copy, CalendarCheck, User } from 'lucide-react';

const AddForm = ({ children, onAdd }: { children?: React.ReactNode, onAdd: () => void }) => (
  <div className="mb-3 pt-2 border-t border-white/5">
    {children}
    <Button onClick={onAdd} variant="primary" className="w-full mt-3 h-10 sm:h-9">
      <Plus size={16} /> Adicionar
    </Button>
  </div>
);

const fmt = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Função inteligente para avançar a referência da data/mês
const advanceDateStr = (dateStr: string): string => {
  if (!dateStr) return new Date().toISOString().slice(0, 7);
  const monthsBR = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  const upperDate = dateStr.toUpperCase().trim();

  // Caso 1: Apenas o nome do mês (ex: JAN -> FEV)
  const mIdx = monthsBR.indexOf(upperDate);
  if (mIdx !== -1) return monthsBR[(mIdx + 1) % 12];

  // Caso 2: Formato AAAA-MM (Padrão input month)
  const hyphenMatch = upperDate.match(/^(\d{4})-(\d{1,2})$/);
  if (hyphenMatch) {
    const y = parseInt(hyphenMatch[1]);
    const m = parseInt(hyphenMatch[2]);
    const d = new Date(y, m, 1); // Passar m (1-based) para o construtor já pula para o próximo mês
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  }

  // Caso 3: Formato MM/AAAA ou DD/MM/AAAA
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

  return dateStr; // Fallback se não reconhecer o formato
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
  <div className="w-full flex flex-col gap-3">
    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 w-full">
      {children}
    </div>
    <div className="flex gap-2 w-full">
      <button onClick={onSave} className="flex-1 flex items-center justify-center gap-2 bg-neon-green/20 text-neon-green border border-neon-green/40 py-2.5 rounded-lg hover:bg-neon-green hover:text-black transition-all font-bold text-xs uppercase tracking-wider shadow-sm">
        <Check size={16} /> SALVAR
      </button>
      <button onClick={onCancel} className="flex-1 flex items-center justify-center gap-2 bg-neon-red/10 text-neon-red border border-neon-red/30 py-2.5 rounded-lg hover:bg-neon-red hover:text-white transition-all font-bold text-xs uppercase tracking-wider">
        <X size={16} /> CANCELAR
      </button>
    </div>
  </div>
);

const EditInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input 
    {...props} 
    className={`bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-neon-blue transition-all h-10 w-full placeholder:text-slate-600 ${props.className || ''}`}
  />
);

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
  const totalRemaining = section.items.reduce((acc, i) => acc + (i.value - (i.paidAmount || 0)), 0);
  const color = isIncome ? 'green' : 'red';
  const neonColor = isIncome ? 'text-neon-green' : 'text-neon-red';

  const handleAdd = () => {
    if (!name || !value) return;
    const newItem: SectionItem = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      value: parseFloat(value),
      paidAmount: parseFloat(paid) || 0,
      date: date || (section.type === 'expense' ? new Date().toISOString().slice(0, 7) : new Date().toLocaleDateString('pt-BR')),
      installmentsCount: section.type === 'expense' ? (parseInt(qtd) || 1) : undefined
    };
    onUpdate({ ...section, items: [...section.items, newItem] });
    setName(''); setValue(''); setPaid(''); setDate(''); setQtd('');
  };

  const updatePaidAmount = (itemId: string, amount: string) => {
    const val = parseFloat(amount) || 0;
    onUpdate({ ...section, items: section.items.map(i => i.id === itemId ? { ...i, paidAmount: val } : i) });
  };

  const handleAdvanceMonth = (item: SectionItem) => {
    if (!item.installmentsCount || item.installmentsCount <= 1) {
      if (confirm(`Remover ${item.name}?`)) onUpdate({ ...section, items: section.items.filter(i => i.id !== item.id) });
      return;
    }
    const nextDate = advanceDateStr(item.date || '');
    onUpdate({ ...section, items: section.items.map(i => i.id === item.id ? { ...i, installmentsCount: i.installmentsCount! - 1, date: nextDate, paidAmount: 0 } : i) });
  };

  const saveEdit = () => {
    if (!editingId) return;
    onUpdate({ ...section, items: section.items.map(i => i.id === editingId ? { ...i, name: editName, value: parseFloat(editValue) || 0, paidAmount: parseFloat(editPaid) || 0, date: editDate, installmentsCount: parseInt(editQtd) || 1 } : i) });
    setEditingId(null);
  };

  return (
    <CollapsibleCard title={section.title} totalValue={`R$ ${fmt(totalRemaining)}`} color={color} icon={<FolderOpen size={18} />} onEditTitle={nt => onUpdate({...section, title: nt})}>
      <div className="flex justify-end mb-2"><button onClick={onDeleteSection} className={`text-[10px] ${neonColor} hover:underline font-bold flex items-center gap-1 opacity-60`}><Trash2 size={12}/> EXCLUIR SESSÃO</button></div>
      <AddForm onAdd={handleAdd}>
        {isIncome ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
            <div className="md:col-span-5"><Input placeholder="NOME" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => handleEnter(e, handleAdd)} /></div>
            <div className="md:col-span-3"><Input type="number" placeholder="VALOR" value={value} onChange={e => setValue(e.target.value)} onKeyDown={e => handleEnter(e, handleAdd)} /></div>
            <div className="md:col-span-4"><Input placeholder="DATA" value={date} onChange={e => setDate(e.target.value)} onKeyDown={e => handleEnter(e, handleAdd)} /></div>
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
               <DraggableRow listId={section.id} index={idx} onMove={(f, t) => { const l = [...section.items]; l.splice(t, 0, l.splice(f, 1)[0]); onUpdate({...section, items: l})}} className="w-full">
               {editingId === item.id ? (
                  <EditRowLayout onSave={saveEdit} onCancel={() => setEditingId(null)}>
                    <EditInput className="sm:col-span-5 uppercase font-bold" value={editName} onChange={e => setEditName(e.target.value.toUpperCase())} onKeyDown={e => handleEnter(e, saveEdit)} placeholder="NOME" autoFocus />
                    <EditInput type="number" className="sm:col-span-2" value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={e => handleEnter(e, saveEdit)} placeholder="VALOR" />
                    {!isIncome && <EditInput type="number" className="sm:col-span-2 text-neon-yellow" value={editPaid} onChange={e => setEditPaid(e.target.value)} onKeyDown={e => handleEnter(e, saveEdit)} placeholder="PAGO" />}
                    <EditInput className="sm:col-span-3 text-center" value={editDate} onChange={e => setEditDate(e.target.value.toUpperCase())} onKeyDown={e => handleEnter(e, saveEdit)} placeholder="REF." />
                  </EditRowLayout>
               ) : (
                 <div className="flex items-center justify-between w-full gap-2">
                   <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm tracking-wide mb-1 truncate ${isFullyPaid ? 'text-neon-green/60 line-through' : 'text-white'}`}>{item.name}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        {item.installmentsCount && <span className="text-slate-200 bg-white/10 px-1.5 rounded">{item.installmentsCount}X</span>}
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
                         <ActionButton onClick={() => { setEditingId(item.id); setEditName(item.name); setEditValue(item.value.toString()); setEditPaid(item.paidAmount?.toString() || ''); setEditDate(item.date || ''); setEditQtd(item.installmentsCount?.toString() || ''); }} icon={<Pencil size={16} />} />
                         <ActionButton onClick={() => onUpdate({...section, items: section.items.filter(i => i.id !== item.id)})} icon={<Trash2 size={16} />} color="text-slate-600 hover:text-neon-red" />
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

// --- Fixed Expense Module ---
export const FixedExpenseModule: React.FC<{ data: FinancialData, onUpdate: (d: FinancialData) => void }> = ({ data, onUpdate }) => {
  const [name, setName] = useState(''); const [value, setValue] = useState(''); const [paid, setPaid] = useState(''); const [qtd, setQtd] = useState(''); const [date, setDate] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState(''); const [editValue, setEditValue] = useState(''); const [editPaid, setEditPaid] = useState(''); const [editQtd, setEditQtd] = useState(''); const [editDate, setEditDate] = useState('');
  
  const totalRemaining = data.fixedExpenses.reduce((acc, i) => acc + (i.value - (i.paidAmount || 0)), 0);

  const handleAdd = () => {
    if (!name || !value) return;
    onUpdate({ ...data, fixedExpenses: [...data.fixedExpenses, { id: Math.random().toString(36).substr(2, 9), name, value: parseFloat(value), paidAmount: parseFloat(paid) || 0, dueDate: date || new Date().toISOString().slice(0, 7), installmentsCount: parseInt(qtd) || 1 }] });
    setName(''); setValue(''); setPaid(''); setQtd(''); setDate('');
  };

  const updatePaidAmount = (itemId: string, amount: string) => {
    onUpdate({ ...data, fixedExpenses: data.fixedExpenses.map(i => i.id === itemId ? { ...i, paidAmount: parseFloat(amount) || 0 } : i) });
  };

  const handleAdvanceMonth = (item: FixedExpense) => {
    if (!item.installmentsCount || item.installmentsCount <= 1) {
      if (confirm(`Remover ${item.name}?`)) onUpdate({ ...data, fixedExpenses: data.fixedExpenses.filter(i => i.id !== item.id) });
      return;
    }
    const nextDate = advanceDateStr(item.dueDate || '');
    onUpdate({ ...data, fixedExpenses: data.fixedExpenses.map(i => i.id === item.id ? { ...i, installmentsCount: i.installmentsCount! - 1, dueDate: nextDate, paidAmount: 0 } : i) });
  };

  const saveEdit = () => {
    if (!editingId) return;
    onUpdate({ ...data, fixedExpenses: data.fixedExpenses.map(i => i.id === editingId ? { ...i, name: editName, value: parseFloat(editValue) || 0, paidAmount: parseFloat(editPaid) || 0, dueDate: editDate, installmentsCount: parseInt(editQtd) || 1 } : i) });
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
              <DraggableRow listId="fixed" index={idx} onMove={(f,t) => { const l = [...data.fixedExpenses]; l.splice(t,0,l.splice(f,1)[0]); onUpdate({...data, fixedExpenses: l}) }} className="w-full">
              {editingId === item.id ? (
                <EditRowLayout onSave={saveEdit} onCancel={() => setEditingId(null)}>
                  <EditInput className="sm:col-span-5 uppercase font-bold" value={editName} onChange={e => setEditName(e.target.value.toUpperCase())} onKeyDown={e => handleEnter(e, saveEdit)} placeholder="DESCRIÇÃO" autoFocus />
                  <EditInput type="number" className="sm:col-span-2" value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={e => handleEnter(e, saveEdit)} placeholder="VALOR" />
                  <EditInput type="number" className="sm:col-span-2 text-neon-yellow" value={editPaid} onChange={e => setEditPaid(e.target.value)} onKeyDown={e => handleEnter(e, saveEdit)} placeholder="PAGO" />
                  <EditInput className="sm:col-span-3 text-center" value={editDate} onChange={e => setEditDate(e.target.value.toUpperCase())} onKeyDown={e => handleEnter(e, saveEdit)} placeholder="REF." />
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
                        <ActionButton onClick={() => onUpdate({ ...data, fixedExpenses: data.fixedExpenses.filter(i => i.id !== item.id) })} icon={<Trash2 size={16} />} color="text-slate-600 hover:text-neon-red" />
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

// --- Installment Module ---
export const InstallmentModule: React.FC<{ data: FinancialData, onUpdate: (d: FinancialData) => void }> = ({ data, onUpdate }) => {
  const [name, setName] = useState(''); const [val, setVal] = useState(''); const [paid, setPaid] = useState(''); const [qtd, setQtd] = useState(''); const [start, setStart] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState(''); const [editValue, setEditValue] = useState(''); const [editPaid, setEditPaid] = useState(''); const [editQtd, setEditQtd] = useState(''); const [editStart, setEditStart] = useState('');
  
  const totalRemainingMonthly = data.installments.reduce((acc, i) => acc + (i.monthlyValue - (i.paidAmount || 0)), 0);

  const handleAdd = () => {
    if (!name || !val) return;
    onUpdate({...data, installments: [...data.installments, { id: Math.random().toString(36).substr(2, 9), name, monthlyValue: parseFloat(val), paidAmount: parseFloat(paid) || 0, installmentsCount: parseInt(qtd) || 12, startMonth: start || new Date().toISOString().slice(0, 7) }]});
    setName(''); setVal(''); setPaid(''); setQtd(''); setStart('');
  };

  const updatePaidAmount = (itemId: string, amount: string) => {
    onUpdate({ ...data, installments: data.installments.map(i => i.id === itemId ? { ...i, paidAmount: parseFloat(amount) || 0 } : i) });
  };

  const handleAdvanceMonth = (item: InstallmentExpense) => {
    if (item.installmentsCount <= 1) { if (confirm(`Remover ${item.name}?`)) onUpdate({...data, installments: data.installments.filter(i => i.id !== item.id)}); return; }
    const nextDate = advanceDateStr(item.startMonth || '');
    onUpdate({...data, installments: data.installments.map(i => i.id === item.id ? { ...i, installmentsCount: i.installmentsCount - 1, startMonth: nextDate, paidAmount: 0 } : i)});
  };

  const saveEdit = () => {
    if(!editingId) return;
    onUpdate({...data, installments: data.installments.map(i => i.id === editingId ? { ...i, name: editName, monthlyValue: parseFloat(editValue) || 0, paidAmount: parseFloat(editPaid) || 0, installmentsCount: parseInt(editQtd) || 1, startMonth: editStart } : i)});
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
                      <DraggableRow listId="installments" index={idx} onMove={(f,t) => {const l = [...data.installments]; l.splice(t,0,l.splice(f,1)[0]); onUpdate({...data, installments: l})}} className="w-full">
                      {editingId === item.id ? (
                        <EditRowLayout onSave={saveEdit} onCancel={() => setEditingId(null)}>
                           <EditInput className="sm:col-span-5 uppercase font-bold" value={editName} onChange={e => setEditName(e.target.value.toUpperCase())} onKeyDown={e => handleEnter(e, saveEdit)} placeholder="NOME" autoFocus />
                           <EditInput type="number" className="sm:col-span-2" value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={e => handleEnter(e, saveEdit)} placeholder="MÊS" />
                           <EditInput type="number" className="sm:col-span-2 text-neon-yellow" value={editPaid} onChange={e => setEditPaid(e.target.value)} onKeyDown={e => handleEnter(e, saveEdit)} placeholder="PAGO" />
                           <EditInput className="sm:col-span-3 text-center" value={editStart} onChange={e => setEditStart(e.target.value)} onKeyDown={e => handleEnter(e, saveEdit)} placeholder="INÍCIO" />
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
                                    <ActionButton onClick={() => onUpdate({...data, installments: data.installments.filter(i => i.id !== item.id)})} icon={<Trash2 size={16} />} color="text-slate-600 hover:text-neon-red" />
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

// --- Income Module ---
export const IncomeModule: React.FC<{ data: FinancialData, onUpdate: (d: FinancialData) => void }> = ({ data, onUpdate }) => {
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [date, setDate] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editValue, setEditValue] = useState('');
  const [editDate, setEditDate] = useState('');

  const total = data.incomes.reduce((acc, i) => acc + i.value, 0);

  const handleAdd = () => {
    if (!name || !value) return;
    onUpdate({ ...data, incomes: [...data.incomes, { id: Math.random().toString(36).substr(2, 9), name, value: parseFloat(value), expectedDate: date || new Date().toLocaleDateString('pt-BR') }] });
    setName(''); setValue(''); setDate('');
  };

  const saveEdit = () => {
    if (!editingId) return;
    onUpdate({ 
      ...data, 
      incomes: data.incomes.map(i => i.id === editingId ? { 
        ...i, 
        name: editName, 
        value: parseFloat(editValue) || 0, 
        expectedDate: editDate 
      } : i) 
    });
    setEditingId(null);
  };

  return (
    <CollapsibleCard title="RECEITAS FIXAS" totalValue={`R$ ${fmt(total)}`} color="green" icon={<Wallet size={18} />}>
      <AddForm onAdd={handleAdd}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
          <div className="md:col-span-6"><Input placeholder="FONTE" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => handleEnter(e, handleAdd)} /></div>
          <div className="md:col-span-3"><Input type="number" placeholder="VALOR" value={value} onChange={e => setValue(e.target.value)} onKeyDown={e => handleEnter(e, handleAdd)} /></div>
          <div className="md:col-span-3"><Input placeholder="DATA" value={date} onChange={e => setDate(e.target.value)} onKeyDown={e => handleEnter(e, handleAdd)} /></div>
        </div>
      </AddForm>
      <div className="flex flex-col gap-2">
        {data.incomes.map((item, idx) => (
          <div key={item.id} className="p-4 bg-white/5 rounded-xl border border-white/5 hover:border-neon-green/30 transition-all">
            <DraggableRow listId="incomes" index={idx} onMove={(f,t) => { const l = [...data.incomes]; l.splice(t, 0, l.splice(f, 1)[0]); onUpdate({...data, incomes: l}) }} className="w-full">
              {editingId === item.id ? (
                <EditRowLayout onSave={saveEdit} onCancel={() => setEditingId(null)}>
                  <EditInput 
                    className="sm:col-span-6 uppercase font-bold" 
                    value={editName} 
                    onChange={e => setEditName(e.target.value.toUpperCase())} 
                    onKeyDown={e => handleEnter(e, saveEdit)} 
                    placeholder="FONTE" 
                    autoFocus 
                  />
                  <EditInput 
                    type="number" 
                    className="sm:col-span-3 font-black text-neon-green" 
                    value={editValue} 
                    onChange={e => setEditValue(e.target.value)} 
                    onKeyDown={e => handleEnter(e, saveEdit)} 
                    placeholder="VALOR" 
                  />
                  <EditInput 
                    className="sm:col-span-3 text-center uppercase text-slate-400 font-bold" 
                    value={editDate} 
                    onChange={e => setEditDate(e.target.value.toUpperCase())} 
                    onKeyDown={e => handleEnter(e, saveEdit)} 
                    placeholder="DATA" 
                  />
                </EditRowLayout>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <div className="flex-1">
                    <p className="font-bold text-sm text-white tracking-wide">{item.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.expectedDate}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-neon-green text-sm">R$ {fmt(item.value)}</span>
                    <div className="flex items-center gap-1">
                      <ActionButton 
                        onClick={() => { 
                          setEditingId(item.id); 
                          setEditName(item.name); 
                          setEditValue(item.value.toString()); 
                          setEditDate(item.expectedDate); 
                        }} 
                        icon={<Pencil size={16} />} 
                      />
                      <ActionButton 
                        onClick={() => onUpdate({ ...data, incomes: data.incomes.filter(i => i.id !== item.id) })} 
                        icon={<Trash2 size={16} />} 
                        color="text-slate-600 hover:text-neon-red" 
                      />
                    </div>
                  </div>
                </div>
              )}
            </DraggableRow>
          </div>
        ))}
      </div>
    </CollapsibleCard>
  );
};

// --- Credit Card Module ---
export const CreditCardModule: React.FC<{ data: FinancialData, onUpdate: (d: FinancialData) => void }> = ({ data, onUpdate }) => {
  const [name, setName] = useState('');
  const [limit, setLimit] = useState('');
  const [closing, setClosing] = useState('');
  const [due, setDue] = useState('');
  const [invoice, setInvoice] = useState('');

  const handleAdd = () => {
    if (!name || !limit) return;
    onUpdate({ ...data, creditCards: [...data.creditCards, { id: Math.random().toString(36).substr(2, 9), name, limit: parseFloat(limit), closingDay: parseInt(closing) || 1, dueDay: parseInt(due) || 1, currentInvoiceValue: parseFloat(invoice) || 0 }] });
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
                <ActionButton onClick={() => onUpdate({ ...data, creditCards: data.creditCards.filter(c => c.id !== card.id) })} icon={<Trash2 size={14} />} />
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

// --- Pix Module ---
export const PixModule: React.FC<{ data: FinancialData, onUpdate: (d: FinancialData) => void }> = ({ data, onUpdate }) => {
  const [type, setType] = useState<any>('Aleatória');
  const [key, setKey] = useState('');
  const [beneficiary, setBeneficiary] = useState('');

  const handleAdd = () => {
    if (!key) return;
    onUpdate({ ...data, pixKeys: [...data.pixKeys, { id: Math.random().toString(36).substr(2, 9), type, key, beneficiary, active: true }] });
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
                <button onClick={() => onUpdate({ ...data, pixKeys: data.pixKeys.filter(pk => pk.id !== k.id) })} className="p-2 text-slate-500 hover:text-neon-red transition-colors"><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </CollapsibleCard>
  );
};

// --- Radar Module ---
export const RadarModule: React.FC<{ data: FinancialData, onUpdate: (d: FinancialData) => void }> = ({ data, onUpdate }) => {
  const [name, setName] = useState('');
  const [val, setVal] = useState('');

  const handleAdd = () => {
    if (!name || !val) return;
    onUpdate({ ...data, radarItems: [...data.radarItems, { id: Math.random().toString(36).substr(2, 9), name, value: parseFloat(val) }] });
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
              <button onClick={() => onUpdate({ ...data, radarItems: data.radarItems.filter(i => i.id !== item.id) })} className="text-slate-600 hover:text-neon-red transition-colors"><X size={14} /></button>
            </div>
          </div>
        ))}
      </div>
    </CollapsibleCard>
  );
};
