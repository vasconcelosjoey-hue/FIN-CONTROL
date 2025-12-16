import React, { useState } from 'react';
import { FinancialData, Income, FixedExpense, InstallmentExpense, CreditCard, PixKey, CustomSection, SectionItem, RadarItem } from '../types';
import { CollapsibleCard, Button, Input, Select, Badge } from './ui/UIComponents';
import { Trash2, Plus, Calendar, AlertCircle, Copy, Check, CreditCard as CCIcon, ArrowRight, Zap, FolderOpen, CalendarDays, Wallet, GripVertical, Target, Pencil, X, CalendarCheck, Search } from 'lucide-react';

const AddForm = ({ children, onAdd }: { children?: React.ReactNode, onAdd: () => void }) => (
  <div className="mb-3 pt-2 border-t border-white/5">
    {children}
    <Button onClick={onAdd} variant="primary" className="w-full mt-3 h-9">
      <Plus size={16} /> Adicionar
    </Button>
  </div>
);

// Formatter Helper (PT-BR)
const fmt = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
      <div className="mr-3 text-slate-700 hover:text-slate-500 shrink-0">
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
    className={`${color} transition-colors p-1.5 rounded hover:bg-white/10`}
  >
    {icon}
  </button>
);

// Helper to handle ENTER key on inputs
const handleEnter = (e: React.KeyboardEvent, action: () => void) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    action();
  }
};

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
    <CollapsibleCard title="No Radar" totalValue={`R$ ${fmt(total)}`} color="white" icon={<Target size={18} />}>
       <AddForm onAdd={handleAdd}>
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-8"><Input placeholder="Descrição" value={name} onChange={e => setName(e.target.value)} onKeyDown={(e) => handleEnter(e, handleAdd)} /></div>
          <div className="col-span-4"><Input type="number" placeholder="Valor" value={value} onChange={e => setValue(e.target.value)} onKeyDown={(e) => handleEnter(e, handleAdd)} /></div>
        </div>
      </AddForm>

      <div className="flex flex-col gap-2">
         {items.map((item, idx) => (
           <DraggableRow key={item.id} listId="radar" index={idx} onMove={handleMove} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5 hover:border-white/50">
             {editingId === item.id ? (
               <div className="flex items-center gap-2 w-full">
                  <input 
                    value={editName} 
                    onChange={e => setEditName(e.target.value.toUpperCase())} 
                    onKeyDown={(e) => handleEnter(e, saveEdit)}
                    className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-white focus:border-neon-blue outline-none w-full h-8 uppercase"
                    placeholder="Nome"
                    autoFocus
                  />
                  <input 
                    type="number" 
                    value={editValue} 
                    onChange={e => setEditValue(e.target.value)} 
                    onKeyDown={(e) => handleEnter(e, saveEdit)}
                    className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-white focus:border-neon-blue outline-none w-24 h-8"
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
                  <span className="font-extrabold text-white text-sm">R$ {fmt(item.value)}</span>
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

  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editValue, setEditValue] = useState('');
  const [editDate, setEditDate] = useState('');

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

  const startEdit = (item: Income) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditValue(item.value.toString());
    setEditDate(item.expectedDate);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const updatedIncomes = data.incomes.map(item => {
      if (item.id === editingId) {
        return { 
          ...item, 
          name: editName, 
          value: parseFloat(editValue) || 0,
          expectedDate: editDate 
        };
      }
      return item;
    });
    onUpdate({ ...data, incomes: updatedIncomes });
    setEditingId(null);
  };

  return (
    <CollapsibleCard 
      title="Entradas Vigentes" 
      totalValue={`R$ ${fmt(totalValue)}`}
      color="green"
      icon={<Wallet size={18}/>}
    >
      <AddForm onAdd={handleAdd}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5"><Input placeholder="Nome" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={(e) => handleEnter(e, handleAdd)} /></div>
          <div className="md:col-span-3"><Input type="number" placeholder="Valor" value={newValue} onChange={e => setNewValue(e.target.value)} onKeyDown={(e) => handleEnter(e, handleAdd)} /></div>
          <div className="md:col-span-4"><Input type="text" placeholder="Data (ex: 15/10)" value={newDate} onChange={e => setNewDate(e.target.value)} onKeyDown={(e) => handleEnter(e, handleAdd)} /></div>
        </div>
      </AddForm>

      <div className="flex flex-col gap-2">
        {incomes.length === 0 && <p className="text-slate-500 text-center text-sm py-4 italic">Nenhum registro.</p>}
        {incomes.map((item, idx) => (
          <DraggableRow key={item.id} listId="incomes" index={idx} onMove={handleMove} className="flex flex-col sm:flex-row items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:border-neon-green/50 hover:bg-white/10 transition-all group">
            {editingId === item.id ? (
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
                <input 
                  value={editName} 
                  onChange={e => setEditName(e.target.value.toUpperCase())} 
                  onKeyDown={(e) => handleEnter(e, saveEdit)}
                  className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-white focus:border-neon-green outline-none w-full h-8 uppercase"
                  placeholder="Nome"
                  autoFocus
                />
                 <input 
                  value={editDate} 
                  onChange={e => setEditDate(e.target.value.toUpperCase())} 
                  onKeyDown={(e) => handleEnter(e, saveEdit)}
                  className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-slate-300 focus:border-neon-green outline-none w-24 text-center h-8 uppercase"
                  placeholder="Data"
                />
                <div className="flex items-center gap-2 w-full sm:w-auto">
                   <span className="text-neon-green font-bold text-sm">R$</span>
                   <input 
                    type="number"
                    value={editValue} 
                    onChange={e => setEditValue(e.target.value)} 
                    onKeyDown={(e) => handleEnter(e, saveEdit)}
                    className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-white focus:border-neon-green outline-none w-24 h-8"
                    placeholder="Valor"
                  />
                  <div className="flex gap-1 shrink-0">
                    <ActionButton onClick={saveEdit} icon={<Check size={14} />} color="text-neon-green" />
                    <ActionButton onClick={() => setEditingId(null)} icon={<X size={14} />} color="text-neon-red" />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-start gap-3 flex-1 min-w-0">
                  <div className="p-1.5 bg-neon-green/10 rounded-full text-neon-green shrink-0">
                    <ArrowRight size={12} className="transform -rotate-45" />
                  </div>
                  <div className="flex flex-col items-start min-w-0">
                    <p className="font-bold text-white text-sm truncate w-full text-left">{item.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1 uppercase tracking-wider">{item.expectedDate}</p>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-4 ml-4 shrink-0">
                  <span className="font-extrabold text-neon-green text-base">R$ {fmt(item.value)}</span>
                  <div className="flex items-center gap-1">
                     <ActionButton onClick={() => handleDuplicate(item)} icon={<Copy size={14} />} />
                     <ActionButton onClick={() => startEdit(item)} icon={<Pencil size={14} />} />
                     <ActionButton onClick={() => handleRemove(item.id)} icon={<Trash2 size={14} />} color="text-slate-500 hover:text-neon-red" />
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

  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editValue, setEditValue] = useState('');

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

  const startEdit = (item: SectionItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditValue(item.value.toString());
  };

  const saveEdit = () => {
    if (!editingId) return;
    const updatedItems = section.items.map(item => {
      if (item.id === editingId) {
        return { ...item, name: editName, value: parseFloat(editValue) || 0 };
      }
      return item;
    });
    onUpdate({ ...section, items: updatedItems });
    setEditingId(null);
  };

  const handleTitleEdit = (newTitle: string) => {
    onUpdate({ ...section, title: newTitle.toUpperCase() });
  };

  return (
    <CollapsibleCard 
      title={section.title} 
      totalValue={`R$ ${fmt(total)}`}
      color="red"
      icon={<FolderOpen size={18} />}
      onEditTitle={handleTitleEdit}
    >
      <div className="flex justify-end mb-2">
        <button onClick={onDeleteSection} className="text-[10px] text-neon-red hover:underline flex items-center gap-1"><Trash2 size={12}/> Excluir Sessão</button>
      </div>

      <AddForm onAdd={handleAdd}>
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-8"><Input placeholder="Descrição" value={name} onChange={e => setName(e.target.value)} onKeyDown={(e) => handleEnter(e, handleAdd)} /></div>
          <div className="col-span-4"><Input type="number" placeholder="Valor" value={value} onChange={e => setValue(e.target.value)} onKeyDown={(e) => handleEnter(e, handleAdd)} /></div>
        </div>
      </AddForm>

      <div className="flex flex-col gap-2">
         {section.items.map((item, idx) => (
           <DraggableRow key={item.id} listId={section.id} index={idx} onMove={handleMove} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5 hover:border-neon-red/50">
             {editingId === item.id ? (
                <div className="flex items-center gap-2 w-full">
                  <input 
                    value={editName} 
                    onChange={e => setEditName(e.target.value.toUpperCase())} 
                    onKeyDown={(e) => handleEnter(e, saveEdit)}
                    className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-white focus:border-neon-red outline-none w-full h-8 uppercase"
                    placeholder="Descrição"
                    autoFocus
                  />
                  <div className="flex items-center gap-2 shrink-0">
                     <span className="text-neon-red font-bold text-sm">R$</span>
                     <input 
                      type="number"
                      value={editValue} 
                      onChange={e => setEditValue(e.target.value)} 
                      onKeyDown={(e) => handleEnter(e, saveEdit)}
                      className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-white focus:border-neon-red outline-none w-24 h-8"
                      placeholder="Valor"
                    />
                    <div className="flex gap-1">
                      <ActionButton onClick={saveEdit} icon={<Check size={14} />} color="text-neon-green" />
                      <ActionButton onClick={() => setEditingId(null)} icon={<X size={14} />} color="text-neon-red" />
                    </div>
                  </div>
                </div>
             ) : (
               <>
                 <div className="flex-1">
                    <span className="font-bold text-white text-sm">{item.name}</span>
                 </div>
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-white text-sm">R$ {fmt(item.value)}</span>
                    <div className="flex items-center gap-1">
                       <ActionButton onClick={() => handleDuplicate(item)} icon={<Copy size={14} />} />
                       <ActionButton onClick={() => startEdit(item)} icon={<Pencil size={14} />} />
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

// --- Fixed Expense Module (Renamed to Contas Pessoais) ---
export const FixedExpenseModule: React.FC<{ data: FinancialData, onUpdate: (d: FinancialData) => void }> = ({ data, onUpdate }) => {
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [date, setDate] = useState('');

  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editValue, setEditValue] = useState('');
  const [editDate, setEditDate] = useState('');

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

  const startEdit = (item: FixedExpense) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditValue(item.value.toString());
    setEditDate(item.dueDate);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const updatedList = data.fixedExpenses.map(item => {
      if (item.id === editingId) {
        return { ...item, name: editName, value: parseFloat(editValue) || 0, dueDate: editDate };
      }
      return item;
    });
    onUpdate({ ...data, fixedExpenses: updatedList });
    setEditingId(null);
  };

  return (
    <CollapsibleCard title="Contas Pessoais" totalValue={`R$ ${fmt(total)}`} color="red" icon={<AlertCircle size={18} />}>
      <AddForm onAdd={handleAdd}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5"><Input placeholder="Descrição" value={name} onChange={e => setName(e.target.value)} onKeyDown={(e) => handleEnter(e, handleAdd)} /></div>
          <div className="md:col-span-3"><Input type="number" placeholder="Valor" value={value} onChange={e => setValue(e.target.value)} onKeyDown={(e) => handleEnter(e, handleAdd)} /></div>
          <div className="md:col-span-4"><Input type="text" placeholder="Vencimento (Dia)" value={date} onChange={e => setDate(e.target.value)} onKeyDown={(e) => handleEnter(e, handleAdd)} /></div>
        </div>
      </AddForm>
      <div className="flex flex-col gap-2">
        {data.fixedExpenses.map((item, idx) => (
          <DraggableRow key={item.id} listId="fixed" index={idx} onMove={handleMove} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5 hover:border-neon-red/50">
             {editingId === item.id ? (
               <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
                 <input 
                    value={editName} 
                    onChange={e => setEditName(e.target.value.toUpperCase())} 
                    onKeyDown={(e) => handleEnter(e, saveEdit)}
                    className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-white focus:border-neon-red outline-none w-full h-8 uppercase"
                    placeholder="Descrição"
                    autoFocus
                  />
                  <input 
                    value={editDate} 
                    onChange={e => setEditDate(e.target.value.toUpperCase())} 
                    onKeyDown={(e) => handleEnter(e, saveEdit)}
                    className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-slate-300 focus:border-neon-red outline-none w-24 text-center h-8 uppercase"
                    placeholder="Venc."
                  />
                  <div className="flex items-center gap-2 shrink-0">
                     <span className="text-neon-red font-bold text-sm">R$</span>
                     <input 
                      type="number"
                      value={editValue} 
                      onChange={e => setEditValue(e.target.value)} 
                      onKeyDown={(e) => handleEnter(e, saveEdit)}
                      className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-white focus:border-neon-red outline-none w-24 h-8"
                      placeholder="Valor"
                    />
                    <div className="flex gap-1">
                      <ActionButton onClick={saveEdit} icon={<Check size={14} />} color="text-neon-green" />
                      <ActionButton onClick={() => setEditingId(null)} icon={<X size={14} />} color="text-neon-red" />
                    </div>
                  </div>
               </div>
             ) : (
               <>
                 <div className="flex-1">
                   <p className="font-bold text-white text-sm">{item.name}</p>
                   <p className="text-[10px] text-slate-400">Venc: {item.dueDate}</p>
                 </div>
                 <div className="flex items-center gap-3">
                   <span className="font-extrabold text-white text-sm">R$ {fmt(item.value)}</span>
                   <div className="flex items-center gap-1">
                      <ActionButton onClick={() => handleDuplicate(item)} icon={<Copy size={14} />} />
                      <ActionButton onClick={() => startEdit(item)} icon={<Pencil size={14} />} />
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

// --- Installment Module (Redesigned) ---
export const InstallmentModule: React.FC<{ data: FinancialData, onUpdate: (d: FinancialData) => void }> = ({ data, onUpdate }) => {
  const [name, setName] = useState('');
  const [monthlyVal, setMonthlyVal] = useState('');
  const [count, setCount] = useState('');
  const [start, setStart] = useState('');

  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editMonthlyVal, setEditMonthlyVal] = useState('');
  const [editCount, setEditCount] = useState('');
  const [editStart, setEditStart] = useState('');


  // Calculate monthly total
  const monthlyTotal = data.installments.reduce((acc, curr) => {
      const val = curr.monthlyValue || (curr.totalValue ? curr.totalValue / curr.installmentsCount : 0);
      return acc + val;
  }, 0);

  // --- Helper: Parse Month Input (e.g. "JAN" -> "2024-01") ---
  const parseMonthInput = (input: string): string => {
      if (!input) return new Date().toISOString().slice(0, 7);
      
      const cleanInput = input.trim().toUpperCase();
      const monthMap: {[key: string]: string} = {
          'JAN': '01', 'FEV': '02', 'MAR': '03', 'ABR': '04', 'MAI': '05', 'JUN': '06',
          'JUL': '07', 'AGO': '08', 'SET': '09', 'OUT': '10', 'NOV': '11', 'DEZ': '12'
      };

      // Try to find a month abbreviation
      let monthPart = '';
      let yearPart = new Date().getFullYear().toString();

      // Check if user entered just a month (e.g. "JAN") or "JAN/25"
      for (const [abbr, num] of Object.entries(monthMap)) {
          if (cleanInput.startsWith(abbr)) {
              monthPart = num;
              // Check for year
              const split = cleanInput.split(/[\/\s-]/); // split by slash, space or dash
              if (split.length > 1) {
                  let y = split[1];
                  if (y.length === 2) y = "20" + y;
                  if (y.length === 4) yearPart = y;
              }
              break;
          }
      }

      if (monthPart) {
          return `${yearPart}-${monthPart}`;
      }

      // Fallback: If user typed numbers e.g. "10/24"
      if (cleanInput.includes('/')) {
         const parts = cleanInput.split('/');
         if (parts.length === 2) {
             let m = parts[0].padStart(2, '0');
             let y = parts[1];
             if (y.length === 2) y = "20" + y;
             return `${y}-${m}`;
         }
      }

      return input; // return as is if no parsing match (let native validation handle or fail)
  };

  const handleAdd = () => {
    if (!name || !monthlyVal || !count) return;
    
    // Parse the start month
    const startYm = parseMonthInput(start);

    const item: InstallmentExpense = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      monthlyValue: parseFloat(monthlyVal),
      installmentsCount: parseInt(count),
      startMonth: startYm
    };
    onUpdate({ ...data, installments: [...data.installments, item] });
    setName(''); setMonthlyVal(''); setCount(''); setStart('');
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

  // --- Logic to Pay/Advance a Month ---
  const handleAdvanceMonth = (item: InstallmentExpense) => {
      // 1. Check if this is the last installment
      if (item.installmentsCount <= 1) {
          // Remove the item completely
          if (confirm(`Pagar a última parcela de ${item.name} e remover da lista?`)) {
              onUpdate({ ...data, installments: data.installments.filter(i => i.id !== item.id) });
          }
          return;
      }

      // 2. Decrement count
      const newCount = item.installmentsCount - 1;

      // 3. Increment Start Month
      let newStartMonth = item.startMonth;
      if (item.startMonth && item.startMonth.includes('-')) {
          const [y, m] = item.startMonth.split('-').map(Number);
          const date = new Date(y, m - 1, 1); // JS Month is 0-indexed
          date.setMonth(date.getMonth() + 1);
          
          const newY = date.getFullYear();
          const newM = (date.getMonth() + 1).toString().padStart(2, '0');
          newStartMonth = `${newY}-${newM}`;
      }

      // 4. Update
      const updatedList = data.installments.map(i => {
          if (i.id === item.id) {
              return { ...i, installmentsCount: newCount, startMonth: newStartMonth };
          }
          return i;
      });
      onUpdate({ ...data, installments: updatedList });
  };

  const startEdit = (item: InstallmentExpense) => {
    setEditingId(item.id);
    setEditName(item.name);
    const val = item.monthlyValue || (item.totalValue ? item.totalValue / item.installmentsCount : 0);
    setEditMonthlyVal(val.toString());
    setEditCount(item.installmentsCount.toString());
    
    // Convert YYYY-MM back to readable JAN/YY for editing convenience if preferred, 
    // but standard MM/YY is safer for re-parsing. Let's keep raw or format slightly.
    setEditStart(item.startMonth);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const updatedList = data.installments.map(item => {
      if (item.id === editingId) {
        // Try to parse the edited start date again
        const parsedStart = parseMonthInput(editStart);
        return { 
          ...item, 
          name: editName, 
          monthlyValue: parseFloat(editMonthlyVal), 
          installmentsCount: parseInt(editCount),
          startMonth: parsedStart
        };
      }
      return item;
    });
    onUpdate({ ...data, installments: updatedList });
    setEditingId(null);
  };

  // Helper to format YYYY-MM to JAN/YY
  const formatMonth = (ym: string) => {
    if (!ym) return '';
    if (!ym.includes('-')) return ym;
    const [y, m] = ym.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1, 1);
    const monthName = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase();
    return `${monthName}/${y.slice(2)}`;
  };

  // Helper to add months
  const getEndMonth = (startYm: string, monthsToAdd: number) => {
    if (!startYm) return '';
    if (!startYm.includes('-')) return '...';
    const [y, m] = startYm.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1, 1);
    date.setMonth(date.getMonth() + monthsToAdd - 1);
    const endY = date.getFullYear();
    const endM = date.getMonth() + 1;
    return `${endY}-${endM.toString().padStart(2, '0')}`;
  };

  return (
    <CollapsibleCard title="Parcelados" totalValue={`R$ ${fmt(monthlyTotal)}`} color="red" icon={<Calendar size={18} />}>
      <AddForm onAdd={handleAdd}>
        {/* NEW SMART LAYOUT */}
        <div className="flex flex-col gap-3">
            <Input 
                placeholder="Descrição do Gasto (ex: iPhone 15)" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                onKeyDown={(e) => handleEnter(e, handleAdd)}
            />
            <div className="grid grid-cols-3 gap-3">
               <Input 
                 type="number" 
                 placeholder="R$ Parcela" 
                 value={monthlyVal} 
                 onChange={e => setMonthlyVal(e.target.value)} 
                 onKeyDown={(e) => handleEnter(e, handleAdd)}
               />
               <Input 
                 type="number" 
                 placeholder="Qtd" 
                 value={count} 
                 onChange={e => setCount(e.target.value)} 
                 onKeyDown={(e) => handleEnter(e, handleAdd)}
               />
               <Input 
                 type="text" 
                 placeholder="Início (ex: JAN)" 
                 value={start} 
                 onChange={e => setStart(e.target.value)} 
                 onKeyDown={(e) => handleEnter(e, handleAdd)}
               />
            </div>
        </div>
      </AddForm>
      
      <div className="flex flex-col gap-2">
        {data.installments.map((item, idx) => {
           // Fallback for legacy data
           const val = item.monthlyValue || (item.totalValue ? item.totalValue / item.installmentsCount : 0);
           const startFmt = formatMonth(item.startMonth);
           const endYm = getEndMonth(item.startMonth, item.installmentsCount);
           const endFmt = formatMonth(endYm);

           return (
            <DraggableRow key={item.id} listId="installments" index={idx} onMove={handleMove} className="p-3 bg-white/5 rounded-lg border border-white/5 hover:border-neon-red/50 block">
              {editingId === item.id ? (
                 <div className="flex flex-col gap-2">
                    {/* EDIT MODE: NEW LAYOUT */}
                    <input 
                      value={editName} 
                      onChange={e => setEditName(e.target.value.toUpperCase())} 
                      onKeyDown={(e) => handleEnter(e, saveEdit)}
                      className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-white focus:border-neon-red outline-none w-full font-bold mb-1 h-8 uppercase"
                      placeholder="Nome"
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">R$</span>
                        <input 
                          type="number"
                          value={editMonthlyVal} 
                          onChange={e => setEditMonthlyVal(e.target.value)} 
                          onKeyDown={(e) => handleEnter(e, saveEdit)}
                          className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-white focus:border-neon-red outline-none w-20 h-8"
                        />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">x</span>
                         <input 
                          type="number"
                          value={editCount} 
                          onChange={e => setEditCount(e.target.value)} 
                          onKeyDown={(e) => handleEnter(e, saveEdit)}
                          className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-white focus:border-neon-red outline-none w-14 h-8"
                        />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Em:</span>
                        <input 
                          type="text"
                          value={editStart} 
                          onChange={e => setEditStart(e.target.value.toUpperCase())} 
                          onKeyDown={(e) => handleEnter(e, saveEdit)}
                          className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-slate-300 focus:border-neon-red outline-none w-20 h-8 uppercase"
                          placeholder="MM/AA"
                        />
                        <div className="flex gap-1 ml-auto">
                           <ActionButton onClick={saveEdit} icon={<Check size={14} />} color="text-neon-green" />
                           <ActionButton onClick={() => setEditingId(null)} icon={<X size={14} />} color="text-neon-red" />
                        </div>
                    </div>
                 </div>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row justify-between w-full items-start sm:items-center">
                    <div className="text-white text-sm font-medium">
                      <span className="font-bold text-white">{item.name}</span>
                      <span className="text-slate-400 mx-2">—</span> 
                      <span className="font-bold text-neon-red">{fmt(val)}</span> 
                      <span className="text-slate-500 mx-1">×</span> 
                      <span className="text-white font-bold">{item.installmentsCount}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold tracking-wider bg-black/30 px-2 py-1 rounded mt-1 sm:mt-0 uppercase">
                      {startFmt} <span className="text-neon-red">→</span> {endFmt}
                    </div>
                  </div>
                  
                  <div className="flex justify-end items-center gap-2 mt-2 pt-2 border-t border-white/5 w-full">
                     <button 
                        onClick={() => handleAdvanceMonth(item)}
                        className="mr-auto px-2 py-1 bg-neon-green/10 text-neon-green border border-neon-green/30 rounded hover:bg-neon-green/20 hover:text-white transition-colors text-[10px] font-bold flex items-center gap-1.5"
                     >
                        <CalendarCheck size={12} />
                        PAGAR 1 MÊS
                     </button>

                     <div className="flex gap-1.5">
                        <button onClick={() => startEdit(item)} className="text-slate-400 hover:text-white flex items-center gap-1 text-[10px]"><Pencil size={12} /> EDITAR</button>
                        <button onClick={() => handleDuplicate(item)} className="text-slate-400 hover:text-white flex items-center gap-1 text-[10px]"><Copy size={12} /> DUPLICAR</button>
                        <button onClick={() => onUpdate({ ...data, installments: data.installments.filter(i => i.id !== item.id) })} className="text-neon-red hover:text-white flex items-center gap-1 text-[10px]"><Trash2 size={12} /> REMOVER</button>
                     </div>
                  </div>
                </>
              )}
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

  // Sort: Highest limit first
  const sortedCards = [...data.creditCards].sort((a, b) => b.limit - a.limit);
  const totalLimit = sortedCards.reduce((acc, c) => acc + c.limit, 0);

  const handleAdd = () => {
    if (!name) return;
    const item: CreditCard = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      limit: parseFloat(limit) || 0,
      closingDay: 1, // Default unused
      dueDay: 10, // Default unused
      currentInvoiceValue: 0 // Default unused
    };
    // Add AND Sort desc is handled by render, but let's just append to data
    onUpdate({ ...data, creditCards: [...data.creditCards, item] });
    setName(''); setLimit('');
  };

  // We are removing explicit re-order because sorting is automatic now (by limit desc)
  const handleMove = (from: number, to: number) => {
    // No-op or we can allow manual override, but request asked for "Always organize descending order"
    // So drag and drop might be disabled or just ineffective if sorting overrides.
    // Let's implement manual reorder on the *underlying* data, but the render will still sort. 
    // Actually, if the requirement is "Always sort by descending limit", we should just ignore drag or re-sort after edit.
    // For now, I will keep the drag interface but sorting will visually override it on next render if we use `sortedCards` directly.
    // To respect the user request perfectly: we will force sort on every update.
  };

  const startEdit = (item: CreditCard) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditLimit(item.limit.toString());
  };

  const saveEdit = () => {
    if (!editingId) return;
    const updatedList = data.creditCards.map(item => {
      if (item.id === editingId) {
        return { 
          ...item, 
          name: editName, 
          limit: parseFloat(editLimit) || 0,
        };
      }
      return item;
    });
    // Force sort descending by limit immediately on save
    updatedList.sort((a, b) => b.limit - a.limit);
    
    onUpdate({ ...data, creditCards: updatedList });
    setEditingId(null);
  };

  return (
    <CollapsibleCard title="Cartões de Crédito" totalValue={`R$ ${fmt(totalLimit)}`} color="pink" icon={<CCIcon size={18} />}>
      <AddForm onAdd={handleAdd}>
         <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Nome do Cartão" value={name} onChange={e => setName(e.target.value)} onKeyDown={(e) => handleEnter(e, handleAdd)} />
            <Input type="number" placeholder="Limite Total" value={limit} onChange={e => setLimit(e.target.value)} onKeyDown={(e) => handleEnter(e, handleAdd)} />
         </div>
      </AddForm>

      <div className="flex flex-col gap-2">
         {sortedCards.map((item, idx) => (
           <DraggableRow key={item.id} listId="cards" index={idx} onMove={handleMove} className="p-3 bg-white/5 rounded-lg border border-white/5 hover:border-neon-pink/50 block">
              {editingId === item.id ? (
                 <div className="flex flex-col gap-2">
                    <input 
                      value={editName} 
                      onChange={e => setEditName(e.target.value.toUpperCase())} 
                      className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-white focus:border-neon-pink outline-none w-full font-bold h-8 uppercase"
                      placeholder="Nome"
                      autoFocus
                    />
                    <div className="flex gap-2 items-center">
                       <span className="text-xs font-bold text-slate-500 uppercase">Limite: R$</span>
                       <input 
                         type="number" 
                         value={editLimit} 
                         onChange={e => setEditLimit(e.target.value)} 
                         className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-white h-8 w-full" 
                         placeholder="Limite" 
                       />
                       <div className="flex gap-1 ml-auto">
                           <ActionButton onClick={saveEdit} icon={<Check size={14} />} color="text-neon-green" />
                           <ActionButton onClick={() => setEditingId(null)} icon={<X size={14} />} color="text-neon-red" />
                       </div>
                    </div>
                 </div>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                     <div>
                        <p className="font-bold text-white text-sm">{item.name}</p>
                     </div>
                     <div className="text-right flex items-center gap-4">
                        <div>
                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Limite Total</p>
                            <p className="font-extrabold text-neon-pink text-sm">R$ {fmt(item.limit)}</p>
                        </div>
                        <div className="flex gap-1">
                            <ActionButton onClick={() => startEdit(item)} icon={<Pencil size={12} />} />
                            <ActionButton onClick={() => onUpdate({ ...data, creditCards: data.creditCards.filter(i => i.id !== item.id) })} icon={<Trash2 size={12} />} color="text-slate-500 hover:text-neon-red" />
                        </div>
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

// --- Pix Module ---
export const PixModule: React.FC<{ data: FinancialData, onUpdate: (d: FinancialData) => void }> = ({ data, onUpdate }) => {
  const [type, setType] = useState<PixKey['type']>('CPF');
  const [key, setKey] = useState('');
  const [beneficiary, setBeneficiary] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editType, setEditType] = useState<PixKey['type']>('CPF');
  const [editKey, setEditKey] = useState('');
  const [editBeneficiary, setEditBeneficiary] = useState('');

  const totalKeys = data.pixKeys.length;

  // Filter keys
  const filteredKeys = data.pixKeys.filter(item => {
    const term = searchTerm.toUpperCase();
    return item.key.toUpperCase().includes(term) || (item.beneficiary || '').toUpperCase().includes(term);
  });

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
    // Only allow move if NOT searching, to keep indices sane
    if (searchTerm) return;
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
    const updatedList = data.pixKeys.map(item => {
      if (item.id === editingId) {
        return { ...item, type: editType, key: editKey, beneficiary: editBeneficiary };
      }
      return item;
    });
    onUpdate({ ...data, pixKeys: updatedList });
    setEditingId(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add toast here but for now just basic copy
  };

  const pixTypes = [
    { value: 'CPF', label: 'CPF' },
    { value: 'CNPJ', label: 'CNPJ' },
    { value: 'Telefone', label: 'Telefone' },
    { value: 'Email', label: 'Email' },
    { value: 'Aleatória', label: 'Aleatória' },
  ];

  return (
    <CollapsibleCard title="Chaves Pix" totalValue={`${totalKeys} Chaves`} color="yellow" icon={<Zap size={18} />}>
       <AddForm onAdd={handleAdd}>
          <div className="flex flex-col gap-2">
             <div className="flex gap-2">
                <div className="w-1/3">
                  <Select options={pixTypes} value={type} onChange={e => setType(e.target.value as any)} />
                </div>
                <div className="w-2/3">
                  <Input placeholder="Chave Pix" value={key} onChange={e => setKey(e.target.value)} onKeyDown={(e) => handleEnter(e, handleAdd)} />
                </div>
             </div>
             <Input placeholder="Beneficiário (opcional)" value={beneficiary} onChange={e => setBeneficiary(e.target.value)} onKeyDown={(e) => handleEnter(e, handleAdd)} />
          </div>
       </AddForm>

       {/* Search Bar */}
       <div className="relative mb-3 group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-neon-yellow transition-colors">
            <Search size={14} />
          </div>
          <input 
             type="text"
             className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-neon-yellow transition-all uppercase placeholder:normal-case"
             placeholder="Buscar chave ou nome..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
          />
       </div>

       <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
          {filteredKeys.length === 0 && <p className="text-center text-xs text-slate-500 py-2">Nenhuma chave encontrada.</p>}
          {filteredKeys.map((item, idx) => (
             <DraggableRow key={item.id} listId="pix" index={idx} onMove={handleMove} className="p-3 bg-white/5 rounded-lg border border-white/5 hover:border-neon-yellow/50 block">
                {editingId === item.id ? (
                   <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                         <select value={editType} onChange={e => setEditType(e.target.value as any)} className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-white w-1/3 h-8">
                            {pixTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                         </select>
                         <input value={editKey} onChange={e => setEditKey(e.target.value.toUpperCase())} className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-white w-2/3 h-8 uppercase" />
                      </div>
                      <input value={editBeneficiary} onChange={e => setEditBeneficiary(e.target.value.toUpperCase())} placeholder="Beneficiário" className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-white h-8 uppercase" />
                      <div className="flex justify-end gap-1">
                          <ActionButton onClick={saveEdit} icon={<Check size={14} />} color="text-neon-green" />
                          <ActionButton onClick={() => setEditingId(null)} icon={<X size={14} />} color="text-neon-red" />
                      </div>
                   </div>
                ) : (
                   <div className="flex items-center justify-between">
                      <div className="overflow-hidden">
                         <div className="flex items-center gap-2">
                            <Badge color="yellow">{item.type}</Badge>
                            {item.beneficiary && <span className="text-[10px] text-slate-400 font-bold uppercase truncate">{item.beneficiary}</span>}
                         </div>
                         <p className="text-white text-sm font-mono mt-1 truncate pr-2">{item.key}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                         <ActionButton onClick={() => copyToClipboard(item.key)} icon={<Copy size={14} />} color="text-neon-yellow hover:text-white" />
                         <ActionButton onClick={() => startEdit(item)} icon={<Pencil size={14} />} />
                         <ActionButton onClick={() => onUpdate({ ...data, pixKeys: data.pixKeys.filter(i => i.id !== item.id) })} icon={<Trash2 size={14} />} color="text-slate-500 hover:text-neon-red" />
                      </div>
                   </div>
                )}
             </DraggableRow>
          ))}
       </div>
    </CollapsibleCard>
  );
};
