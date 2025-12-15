import React, { useState } from 'react';
import { FinancialData, Income, FixedExpense, InstallmentExpense, CreditCard, PixKey, CustomSection, SectionItem, RadarItem } from '../types';
import { CollapsibleCard, Button, Input, Select, Badge } from './ui/UIComponents';
import { Trash2, Plus, Calendar, AlertCircle, Copy, Check, CreditCard as CCIcon, ArrowRight, Zap, FolderOpen, CalendarDays, Wallet, GripVertical, Target, Pencil, X, Save } from 'lucide-react';

const AddForm = ({ children, onAdd }: { children?: React.ReactNode, onAdd: () => void }) => (
  <div className="mb-4 pt-4 border-t border-white/5">
    {children}
    <Button onClick={onAdd} variant="primary" className="w-full mt-3 h-10">
      <Plus size={16} /> Adicionar
    </Button>
  </div>
);

// Helper for Drag and Drop
interface DraggableRowProps {
  children: React.ReactNode;
  index: number;
  listId: string; // New prop to identify the list
  onMove: (from: number, to: number) => void;
  className?: string;
}

const DraggableRow: React.FC<DraggableRowProps> = ({ children, index, listId, onMove, className }) => {
  const handleDragStart = (e: React.DragEvent) => {
    // If we are editing (inputs present), prevent drag to avoid UX issues
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'SELECT') {
       e.preventDefault();
       return;
    }

    e.stopPropagation(); // Stop propagation to prevent module dragging
    e.dataTransfer.setData('type', 'ROW');
    e.dataTransfer.setData('listId', listId);
    e.dataTransfer.setData('rowIndex', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Stop bubbling
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Verify if we are dropping a row from the SAME list
    const type = e.dataTransfer.getData('type');
    const srcListId = e.dataTransfer.getData('listId');
    
    if (type !== 'ROW' || srcListId !== listId) return;

    const fromIndex = parseInt(e.dataTransfer.getData('rowIndex'));
    if (isNaN(fromIndex) || fromIndex === index) return;
    
    onMove(fromIndex, index);
  };

  return (
    <div 
      draggable 
      onDragStart={handleDragStart} 
      onDragOver={handleDragOver} 
      onDrop={handleDrop}
      className={`cursor-grab active:cursor-grabbing ${className}`}
    >
      <div className="mr-2 text-slate-600 hover:text-slate-400 shrink-0">
        <GripVertical size={14} />
      </div>
      {children}
    </div>
  );
};

// Small helper for action buttons
const ActionButton = ({ onClick, icon, color = "text-slate-500 hover:text-white" }: { onClick: () => void, icon: React.ReactNode, color?: string }) => (
  <button 
    onClick={(e) => { e.stopPropagation(); onClick(); }} 
    className={`${color} transition-colors p-1.5 rounded-md hover:bg-white/10`}
  >
    {icon}
  </button>
);

// --- Radar Module (No Radar) ---
export const RadarModule: React.FC<{ data: FinancialData, onUpdate: (d: FinancialData) => void }> = ({ data, onUpdate }) => {
  const [name, setName] = useState('');
  const [value, setValue] = useState('');

  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editValue, setEditValue] = useState('');

  // Safe check for radarItems in case of legacy data
  const items = data.radarItems || [];
  const total = items.reduce((acc, i) => acc + i.value, 0);

  const handleAdd = () => {
    if (!name || !value) return;
    const item: RadarItem = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      value: parseFloat(value),
    };
    onUpdate({ ...data, radarItems: [...items, item] });
    setName(''); setValue('');
  };

  const handleMove = (from: number, to: number) => {
    const list = [...items];
    list.splice(to, 0, list.splice(from, 1)[0]);
    onUpdate({ ...data, radarItems: list });
  };

  const startEdit = (item: RadarItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditValue(item.value.toString());
  };

  const saveEdit = () => {
    if (!editingId) return;
    const updatedItems = items.map(item => {
      if (item.id === editingId) {
        return { ...item, name: editName, value: parseFloat(editValue) || 0 };
      }
      return item;
    });
    onUpdate({ ...data, radarItems: updatedItems });
    setEditingId(null);
  };

  return (
    <CollapsibleCard title="No Radar" totalValue={`R$ ${total.toFixed(2)}`} color="white" icon={<Target size={20} />}>
       <AddForm onAdd={handleAdd}>
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-8"><Input placeholder="Descrição" value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="col-span-4"><Input type="number" placeholder="Valor" value={value} onChange={e => setValue(e.target.value)} /></div>
        </div>
      </AddForm>

      <div className="flex flex-col gap-2">
         {items.map((item, idx) => (
           <DraggableRow key={item.id} listId="radar" index={idx} onMove={handleMove} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/50">
             {editingId === item.id ? (
               <div className="flex items-center gap-2 w-full">
                  <input 
                    value={editName} 
                    onChange={e => setEditName(e.target.value)} 
                    className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-white focus:border-neon-blue outline-none w-full"
                    placeholder="Nome"
                    autoFocus
                  />
                  <input 
                    type="number" 
                    value={editValue} 
                    onChange={e => setEditValue(e.target.value)} 
                    className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-white focus:border-neon-blue outline-none w-24"
                    placeholder="Val"
                  />
                  <div className="flex items-center shrink-0">
                    <ActionButton onClick={saveEdit} icon={<Check size={14} />} color="text-neon-green" />
                    <ActionButton onClick={() => setEditingId(null)} icon={<X size={14} />} color="text-neon-red" />
                  </div>
               </div>
             ) : (
               <>
                <div className="flex-1">
                    <span className="font-bold text-white text-sm">{item.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-white text-sm">R$ {item.value.toFixed(2)}</span>
                  <div className="flex items-center gap-1">
                    <ActionButton onClick={() => startEdit(item)} icon={<Pencil size={14} />} />
                    <ActionButton onClick={() => onUpdate({...data, radarItems: items.filter(i => i.id !== item.id)})} icon={<Trash2 size={14} />} color="text-slate-500 hover:text-neon-red" />
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

// --- Income Module (Consolidated) ---
export const IncomeModule: React.FC<{ data: FinancialData, onUpdate: (d: FinancialData) => void }> = ({ data, onUpdate }) => {
  const [newName, setNewName] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newDate, setNewDate] = useState('');

  // No filtering - Show all incomes
  const incomes = data.incomes;
  const totalValue = incomes.reduce((acc, curr) => acc + curr.value, 0);

  const handleAdd = () => {
    if (!newName || !newValue) return;
    const item: Income = {
      id: Math.random().toString(36).substr(2, 9),
      name: newName,
      value: parseFloat(newValue),
      expectedDate: newDate || new Date().toLocaleDateString('pt-BR')
    };
    onUpdate({ ...data, incomes: [...data.incomes, item] });
    setNewName(''); setNewValue(''); setNewDate('');
  };

  const handleRemove = (id: string) => {
    onUpdate({ ...data, incomes: data.incomes.filter(i => i.id !== id) });
  };

  const handleDuplicate = (item: Income) => {
    const newItem = { ...item, id: Math.random().toString(36).substr(2, 9) };
    onUpdate({ ...data, incomes: [...data.incomes, newItem] });
  };

  const handleMove = (fromIndex: number, toIndex: number) => {
    const allIncomes = [...data.incomes];
    const [moved] = allIncomes.splice(fromIndex, 1);
    allIncomes.splice(toIndex, 0, moved);
    onUpdate({...data, incomes: allIncomes});
  };

  return (
    <CollapsibleCard 
      title="Entradas Vigentes" 
      totalValue={`R$ ${totalValue.toFixed(2)}`}
      color="green"
      icon={<Wallet size={20}/>}
    >
      <AddForm onAdd={handleAdd}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5"><Input placeholder="Nome" value={newName} onChange={e => setNewName(e.target.value)} /></div>
          <div className="md:col-span-3"><Input type="number" placeholder="Valor" value={newValue} onChange={e => setNewValue(e.target.value)} /></div>
          <div className="md:col-span-4"><Input type="text" placeholder="Data (ex: 15/10)" value={newDate} onChange={e => setNewDate(e.target.value)} /></div>
        </div>
      </AddForm>

      <div className="flex flex-col gap-2">
        {incomes.length === 0 && <p className="text-slate-500 text-center text-sm py-4 italic">Nenhum registro.</p>}
        {incomes.map((item, idx) => (
          <DraggableRow key={item.id} listId="incomes" index={idx} onMove={handleMove} className="flex flex-col sm:flex-row items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-neon-green/50 hover:bg-white/10 transition-all group">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="p-1.5 bg-neon-green/10 rounded-full text-neon-green">
                <ArrowRight size={12} className="transform -rotate-45" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">{item.name}</p>
                <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1 uppercase tracking-wider">{item.expectedDate}</p>
              </div>
            </div>
            <div className="flex items-center justify-between w-full sm:w-auto gap-4 mt-2 sm:mt-0">
              <span className="font-extrabold text-neon-green text-base">R$ {item.value.toFixed(2)}</span>
              <div className="flex items-center gap-1">
                 <ActionButton onClick={() => handleDuplicate(item)} icon={<Copy size={14} />} />
                 <ActionButton onClick={() => handleRemove(item.id)} icon={<Trash2 size={14} />} color="text-slate-500 hover:text-neon-red" />
              </div>
            </div>
          </DraggableRow>
        ))}
      </div>
    </CollapsibleCard>
  );
};

// --- Custom Section Module (Generic) ---
export const CustomSectionModule: React.FC<{ 
  section: CustomSection, 
  onUpdate: (updatedSection: CustomSection) => void,
  onDeleteSection: () => void 
}> = ({ 
  section, 
  onUpdate, 
  onDeleteSection 
}) => {
  const [name, setName] = useState('');
  const [value, setValue] = useState('');

  const total = section.items.reduce((acc, i) => acc + i.value, 0);

  const handleAdd = () => {
    if (!name || !value) return;
    const item: SectionItem = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      value: parseFloat(value),
      date: new Date().toLocaleDateString('pt-BR')
    };
    onUpdate({ ...section, items: [...section.items, item] });
    setName(''); setValue('');
  };

  const handleDuplicate = (item: SectionItem) => {
    const newItem = { ...item, id: Math.random().toString(36).substr(2, 9) };
    onUpdate({ ...section, items: [...section.items, newItem] });
  };

  const handleMove = (from: number, to: number) => {
    const newItems = [...section.items];
    newItems.splice(to, 0, newItems.splice(from, 1)[0]);
    onUpdate({ ...section, items: newItems });
  };

  return (
    <CollapsibleCard 
      title={section.title} 
      totalValue={`R$ ${total.toFixed(2)}`}
      color="red"
      icon={<FolderOpen size={20} />}
    >
      <div className="flex justify-end mb-2">
        <button onClick={onDeleteSection} className="text-[10px] text-neon-red hover:underline flex items-center gap-1"><Trash2 size={10}/> Excluir Sessão</button>
      </div>

      <AddForm onAdd={handleAdd}>
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-8"><Input placeholder="Descrição" value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="col-span-4"><Input type="number" placeholder="Valor" value={value} onChange={e => setValue(e.target.value)} /></div>
        </div>
      </AddForm>

      <div className="flex flex-col gap-2">
         {section.items.map((item, idx) => (
           <DraggableRow key={item.id} listId={section.id} index={idx} onMove={handleMove} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5 hover:border-neon-red/50">
             <div className="flex-1">
                <span className="font-bold text-white text-sm">{item.name}</span>
             </div>
              <div className="flex items-center gap-3">
                <span className="font-extrabold text-white text-sm">R$ {item.value.toFixed(2)}</span>
                <div className="flex items-center gap-1">
                   <ActionButton onClick={() => handleDuplicate(item)} icon={<Copy size={14} />} />
                   <ActionButton onClick={() => onUpdate({...section, items: section.items.filter(i => i.id !== item.id)})} icon={<Trash2 size={14} />} color="text-slate-500 hover:text-neon-red" />
                </div>
              </div>
           </DraggableRow>
         ))}
      </div>
    </CollapsibleCard>
  );
};

// --- Fixed Expense Module (Renamed to Contas Pessoais) ---
export const FixedExpenseModule: React.FC<{ data: FinancialData, onUpdate: (d: FinancialData) => void }> = ({ data, onUpdate }) => {
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [date, setDate] = useState('');

  const total = data.fixedExpenses.reduce((acc, i) => acc + i.value, 0);

  const handleAdd = () => {
    if (!name || !value) return;
    const item: FixedExpense = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      value: parseFloat(value),
      dueDate: date || new Date().toLocaleDateString('pt-BR')
    };
    onUpdate({ ...data, fixedExpenses: [...data.fixedExpenses, item] });
    setName(''); setValue(''); setDate('');
  };

  const handleDuplicate = (item: FixedExpense) => {
    const newItem = { ...item, id: Math.random().toString(36).substr(2, 9) };
    onUpdate({ ...data, fixedExpenses: [...data.fixedExpenses, newItem] });
  };

  const handleMove = (from: number, to: number) => {
    const list = [...data.fixedExpenses];
    list.splice(to, 0, list.splice(from, 1)[0]);
    onUpdate({ ...data, fixedExpenses: list });
  };

  return (
    <CollapsibleCard title="Contas Pessoais" totalValue={`R$ ${total.toFixed(2)}`} color="red" icon={<AlertCircle size={20} />}>
      <AddForm onAdd={handleAdd}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5"><Input placeholder="Descrição" value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="md:col-span-3"><Input type="number" placeholder="Valor" value={value} onChange={e => setValue(e.target.value)} /></div>
          <div className="md:col-span-4"><Input type="text" placeholder="Vencimento (Dia)" value={date} onChange={e => setDate(e.target.value)} /></div>
        </div>
      </AddForm>
      <div className="flex flex-col gap-2">
        {data.fixedExpenses.map((item, idx) => (
          <DraggableRow key={item.id} listId="fixed" index={idx} onMove={handleMove} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5 hover:border-neon-red/50">
             <div className="flex-1">
               <p className="font-bold text-white text-sm">{item.name}</p>
               <p className="text-[10px] text-slate-400">Venc: {item.dueDate}</p>
             </div>
             <div className="flex items-center gap-3">
               <span className="font-extrabold text-white text-sm">R$ {item.value.toFixed(2)}</span>
               <div className="flex items-center gap-1">
                  <ActionButton onClick={() => handleDuplicate(item)} icon={<Copy size={14} />} />
                  <ActionButton onClick={() => onUpdate({ ...data, fixedExpenses: data.fixedExpenses.filter(i => i.id !== item.id) })} icon={<Trash2 size={14} />} color="text-slate-500 hover:text-neon-red" />
               </div>
             </div>
          </DraggableRow>
        ))}
      </div>
    </CollapsibleCard>
  );
};

// --- Installment Module ---
export const InstallmentModule: React.FC<{ data: FinancialData, onUpdate: (d: FinancialData) => void }> = ({ data, onUpdate }) => {
  const [name, setName] = useState('');
  const [total, setTotal] = useState('');
  const [count, setCount] = useState('');
  const [start, setStart] = useState('');

  // Calculate monthly total
  const monthlyTotal = data.installments.reduce((acc, curr) => {
      const installmentValue = curr.totalValue / curr.installmentsCount;
      return acc + installmentValue; 
  }, 0);

  const handleAdd = () => {
    if (!name || !total || !count || !start) return;
    const item: InstallmentExpense = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      totalValue: parseFloat(total),
      installmentsCount: parseInt(count),
      startMonth: start
    };
    onUpdate({ ...data, installments: [...data.installments, item] });
    setName(''); setTotal(''); setCount(''); setStart('');
  };

  const handleDuplicate = (item: InstallmentExpense) => {
    const newItem = { ...item, id: Math.random().toString(36).substr(2, 9) };
    onUpdate({ ...data, installments: [...data.installments, newItem] });
  };

  const handleMove = (from: number, to: number) => {
    const list = [...data.installments];
    list.splice(to, 0, list.splice(from, 1)[0]);
    onUpdate({ ...data, installments: list });
  };

  return (
    <CollapsibleCard title="Parcelados" totalValue={`~ R$ ${monthlyTotal.toFixed(2)}/mês`} color="red" icon={<Calendar size={20} />}>
      <AddForm onAdd={handleAdd}>
        <div className="grid grid-cols-2 gap-3 mb-2">
          <Input placeholder="Item" value={name} onChange={e => setName(e.target.value)} />
          <Input type="month" value={start} onChange={e => setStart(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
           <Input type="number" placeholder="Total (R$)" value={total} onChange={e => setTotal(e.target.value)} />
           <Input type="number" placeholder="Qtd. Parcelas" value={count} onChange={e => setCount(e.target.value)} />
        </div>
      </AddForm>
      
      <div className="flex flex-col gap-3">
        {data.installments.map((item, idx) => {
           const installmentValue = item.totalValue / item.installmentsCount;
           return (
            <DraggableRow key={item.id} listId="installments" index={idx} onMove={handleMove} className="p-3 bg-white/5 rounded-xl border border-white/5 hover:border-neon-red/50 block">
              <div className="flex justify-between w-full">
                <span className="font-bold text-white text-sm">{item.name}</span>
                <span className="font-extrabold text-white text-sm">R$ {installmentValue.toFixed(2)}/mês</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 w-full">
                 <span>{item.installmentsCount}x de R$ {installmentValue.toFixed(2)}</span>
                 <div className="flex gap-2">
                    <button onClick={() => handleDuplicate(item)} className="text-slate-400 hover:text-white flex items-center gap-1"><Copy size={10} /> Duplicar</button>
                    <button onClick={() => onUpdate({ ...data, installments: data.installments.filter(i => i.id !== item.id) })} className="text-neon-red hover:underline">Remover</button>
                 </div>
              </div>
            </DraggableRow>
           );
        })}
      </div>
    </CollapsibleCard>
  );
};

// --- Credit Card Module ---
export const CreditCardModule: React.FC<{ data: FinancialData, onUpdate: (d: FinancialData) => void }> = ({ data, onUpdate }) => {
  const [name, setName] = useState('');
  const [limit, setLimit] = useState('');

  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editLimit, setEditLimit] = useState('');

  const totalLimit = data.creditCards.reduce((acc, c) => acc + c.limit, 0);

  const handleAdd = () => {
    if (!name || !limit) return;
    const item: CreditCard = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      limit: parseFloat(limit),
      currentInvoiceValue: 0, // Default to 0 as user removed input
      closingDay: 1,
      dueDay: 10
    };
    
    // Add AND Sort by limit descending immediately
    const newList = [...data.creditCards, item].sort((a, b) => b.limit - a.limit);
    
    onUpdate({ ...data, creditCards: newList });
    setName(''); setLimit('');
  };

  const handleMove = (from: number, to: number) => {
    const list = [...data.creditCards];
    list.splice(to, 0, list.splice(from, 1)[0]);
    onUpdate({ ...data, creditCards: list });
  };

  const startEdit = (card: CreditCard) => {
    setEditingId(card.id);
    setEditName(card.name);
    setEditLimit(card.limit.toString());
  };

  const saveEdit = () => {
    if (!editingId) return;
    const updatedCards = data.creditCards.map(c => {
      if (c.id === editingId) {
        return { ...c, name: editName, limit: parseFloat(editLimit) || 0 };
      }
      return c;
    });
    // Sort again by limit just in case
    updatedCards.sort((a, b) => b.limit - a.limit);
    
    onUpdate({ ...data, creditCards: updatedCards });
    setEditingId(null);
  };

  return (
    <CollapsibleCard title="Limites de Cartões" totalValue={`Total: R$ ${totalLimit.toFixed(2)}`} color="blue" icon={<CCIcon size={20} />}>
      <AddForm onAdd={handleAdd}>
         <div className="grid grid-cols-2 gap-2">
           <Input placeholder="Nome do Banco" value={name} onChange={e => setName(e.target.value)} />
           <Input type="number" placeholder="Limite (R$)" value={limit} onChange={e => setLimit(e.target.value)} />
         </div>
      </AddForm>

      <div className="flex flex-col gap-4">
        {data.creditCards.map((card, idx) => (
            <DraggableRow key={card.id} listId="cc" index={idx} onMove={handleMove} className="p-4 bg-white/5 rounded-xl border border-white/5 hover:border-neon-blue/50 flex flex-col gap-2">
               {editingId === card.id ? (
                 <div className="flex flex-col gap-2 w-full">
                    <div className="flex items-center gap-2">
                       <input 
                         value={editName} 
                         onChange={e => setEditName(e.target.value)} 
                         className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-white focus:border-neon-blue outline-none w-full font-bold"
                         placeholder="Banco"
                         autoFocus
                       />
                       <div className="flex gap-1">
                          <ActionButton onClick={saveEdit} icon={<Check size={14} />} color="text-neon-green" />
                          <ActionButton onClick={() => setEditingId(null)} icon={<X size={14} />} color="text-neon-red" />
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="uppercase text-[10px] text-slate-500 font-bold shrink-0">LIMITE: R$</span>
                       <input 
                         type="number"
                         value={editLimit} 
                         onChange={e => setEditLimit(e.target.value)} 
                         className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-neon-blue font-mono font-bold focus:border-neon-blue outline-none w-full"
                         placeholder="0.00"
                       />
                    </div>
                 </div>
               ) : (
                 <>
                   <div className="flex justify-between items-center">
                     <span className="font-bold text-white text-lg">{card.name}</span>
                     <div className="flex gap-1">
                       <ActionButton onClick={() => startEdit(card)} icon={<Pencil size={14} />} />
                       <ActionButton onClick={() => onUpdate({ ...data, creditCards: data.creditCards.filter(c => c.id !== card.id) })} icon={<Trash2 size={14} />} color="text-slate-500 hover:text-neon-red" />
                     </div>
                   </div>
                   <div className="flex justify-between text-sm text-slate-300">
                     <span className="uppercase text-[10px] tracking-widest font-bold text-slate-500">Limite Disponível</span>
                     <span className="font-mono text-neon-blue font-bold">R$ {card.limit.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                   </div>
                 </>
               )}
            </DraggableRow>
          ))}
      </div>
    </CollapsibleCard>
  );
};

// --- Pix Module ---
export const PixModule: React.FC<{ data: FinancialData, onUpdate: (d: FinancialData) => void }> = ({ data, onUpdate }) => {
  const [type, setType] = useState<PixKey['type']>('CPF');
  const [key, setKey] = useState('');
  const [beneficiary, setBeneficiary] = useState('');

  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editType, setEditType] = useState<PixKey['type']>('CPF');
  const [editKey, setEditKey] = useState('');
  const [editBeneficiary, setEditBeneficiary] = useState('');


  const handleAdd = () => {
    if (!key) return;
    const item: PixKey = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      key,
      beneficiary,
      active: true
    };
    onUpdate({ ...data, pixKeys: [...data.pixKeys, item] });
    setKey(''); setBeneficiary('');
  };

  const handleMove = (from: number, to: number) => {
    const list = [...data.pixKeys];
    list.splice(to, 0, list.splice(from, 1)[0]);
    onUpdate({ ...data, pixKeys: list });
  };

  const startEdit = (item: PixKey) => {
    setEditingId(item.id);
    setEditType(item.type);
    setEditKey(item.key);
    setEditBeneficiary(item.beneficiary || '');
  };

  const saveEdit = () => {
    if (!editingId) return;
    const updatedItems = data.pixKeys.map(item => {
      if (item.id === editingId) {
        return { ...item, type: editType, key: editKey, beneficiary: editBeneficiary };
      }
      return item;
    });
    onUpdate({ ...data, pixKeys: updatedItems });
    setEditingId(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const options = [
    { value: 'CPF', label: 'CPF' },
    { value: 'CNPJ', label: 'CNPJ' },
    { value: 'Telefone', label: 'Telefone' },
    { value: 'Email', label: 'Email' },
    { value: 'Aleatória', label: 'Aleatória' },
  ];

  return (
    <CollapsibleCard title="Registros de Chaves Pix" totalValue={`${data.pixKeys.length} chaves`} color="pink" icon={<Zap size={20} />}>
       <AddForm onAdd={handleAdd}>
         <div className="flex flex-col gap-3">
           <div className="grid grid-cols-12 gap-3">
             <div className="col-span-4">
               <Select options={options} value={type} onChange={e => setType(e.target.value as any)} />
             </div>
             <div className="col-span-8">
               <Input placeholder="Chave Pix" value={key} onChange={e => setKey(e.target.value)} />
             </div>
           </div>
           <div>
             <Input placeholder="Nome da Pessoa / Beneficiário" value={beneficiary} onChange={e => setBeneficiary(e.target.value)} />
           </div>
         </div>
       </AddForm>
       <div className="flex flex-col gap-2">
          {data.pixKeys.map((item, idx) => (
            <DraggableRow key={item.id} listId="pix" index={idx} onMove={handleMove} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5 hover:border-neon-pink/50">
               {editingId === item.id ? (
                 <div className="flex flex-col w-full gap-2">
                    <div className="flex gap-2">
                       <select 
                          value={editType} 
                          onChange={e => setEditType(e.target.value as any)}
                          className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-white focus:border-neon-pink outline-none w-1/3"
                       >
                         {options.map(opt => <option key={opt.value} value={opt.value} className="bg-neon-surface text-white">{opt.label}</option>)}
                       </select>
                       <input 
                          value={editKey} 
                          onChange={e => setEditKey(e.target.value)} 
                          className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-white focus:border-neon-pink outline-none w-full"
                          placeholder="Chave Pix"
                       />
                       <div className="flex items-center shrink-0">
                          <ActionButton onClick={saveEdit} icon={<Check size={14} />} color="text-neon-green" />
                          <ActionButton onClick={() => setEditingId(null)} icon={<X size={14} />} color="text-neon-red" />
                       </div>
                    </div>
                    <input 
                      value={editBeneficiary} 
                      onChange={e => setEditBeneficiary(e.target.value)} 
                      className="bg-black/40 border border-white/20 rounded px-2 py-1 text-xs text-slate-300 focus:border-neon-pink outline-none w-full"
                      placeholder="Beneficiário (Opcional)"
                    />
                 </div>
               ) : (
                 <>
                   <div className="flex flex-col w-full overflow-hidden">
                     <div className="flex items-center gap-2 mb-1">
                        <Badge color="pink">{item.type}</Badge>
                        {item.beneficiary && <span className="text-xs text-slate-300 font-bold uppercase truncate">{item.beneficiary}</span>}
                     </div>
                     <div className="flex items-center gap-2">
                       <span className="font-bold text-white text-sm truncate">{item.key}</span>
                       <ActionButton onClick={() => copyToClipboard(item.key)} icon={<Copy size={12} />} color="text-neon-blue hover:text-white" />
                     </div>
                   </div>
                   <div className="flex items-center gap-1 ml-2 shrink-0">
                     <ActionButton onClick={() => startEdit(item)} icon={<Pencil size={14} />} />
                     <ActionButton onClick={() => onUpdate({ ...data, pixKeys: data.pixKeys.filter(i => i.id !== item.id) })} icon={<Trash2 size={14} />} color="text-slate-500 hover:text-neon-red" />
                   </div>
                 </>
               )}
            </DraggableRow>
          ))}
       </div>
    </CollapsibleCard>
  );
};