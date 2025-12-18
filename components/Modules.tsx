import React, { useState } from 'react';
import { FinancialData, Income, FixedExpense, InstallmentExpense, CreditCard, PixKey, CustomSection, SectionItem, RadarItem } from '../types';
import { CollapsibleCard, Button, Input, Select, Badge } from './ui/UIComponents';
import { Trash2, Plus, Calendar, AlertCircle, Copy, Check, X, CreditCard as CCIcon, ArrowRight, Zap, FolderOpen, CalendarDays, Wallet, GripVertical, Target, Pencil, CalendarCheck, Search } from 'lucide-react';

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

// --- Income Module ---
export const IncomeModule: React.FC<{ data: FinancialData, onUpdate: (d: FinancialData) => void }> = ({ data, onUpdate }) => {
  const [newName, setNewName] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newDate, setNewDate] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editValue, setEditValue] = useState('');
  const [editDate, setEditDate] = useState('');

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
        return { ...item, name: editName, value: parseFloat(editValue) || 0, expectedDate: editDate };
      }
      return item;
    });
    onUpdate({ ...data, incomes: updatedIncomes });
    setEditingId(null);
  };

  return (
    <CollapsibleCard 
      title="ENTRADAS" 
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
        {incomes.map((item, idx) => (
          <DraggableRow key={item.id} listId="incomes" index={idx} onMove={handleMove} className="flex flex-col sm:flex-row items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:border-neon-green/50 hover:bg-white/10 transition-all group gap-3 sm:gap-0">
            {editingId === item.id ? (
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
                <input value={editName} onChange={e => setEditName(e.target.value.toUpperCase())} className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-white w-full h-8 uppercase" placeholder="Nome" autoFocus />
                <input value={editDate} onChange={e => setEditDate(e.target.value.toUpperCase())} className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-slate-300 w-24 text-center h-8 uppercase" placeholder="Data" />
                <div className="flex items-center gap-2 w-full sm:w-auto">
                   <span className="text-neon-green font-bold text-sm">R$</span>
                   <input type="number" value={editValue} onChange={e => setEditValue(e.target.value)} className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-white w-24 h-8" placeholder="Valor" />
                   <div className="flex gap-1 shrink-0">
                    <ActionButton onClick={saveEdit} icon={<Check size={14} />} color="text-neon-green" />
                    <ActionButton onClick={() => setEditingId(null)} icon={<X size={14} />} color="text-neon-red" />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-start gap-3 flex-1 min-w-0 w-full sm:w-auto">
                  <div className="p-1.5 bg-neon-green/10 rounded-full text-neon-green shrink-0"><ArrowRight size={12} className="transform -rotate-45" /></div>
                  <div className="flex flex-col items-start min-w-0 flex-1">
                    <p className="font-bold text-white text-sm truncate w-full text-left">{item.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1 uppercase tracking-wider">{item.expectedDate}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 w-full sm:w-auto">
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

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editValue, setEditValue] = useState('');

  const total = section.items.reduce((acc, i) => acc + i.value, 0);
  const isIncome = section.type === 'income';
  const color = isIncome ? 'green' : 'red';
  const neonColor = isIncome ? 'text-neon-green' : 'text-neon-red';
  const hoverBorderColor = isIncome ? 'hover:border-neon-green/50' : 'hover:border-neon-red/50';

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
      color={color}
      icon={<FolderOpen size={18} />}
      onEditTitle={handleTitleEdit}
    >
      <div className="flex justify-end mb-2">
        <button onClick={onDeleteSection} className={`text-[10px] ${neonColor} hover:underline font-bold flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity`}>
          <Trash2 size={12}/> EXCLUIR SESSÃO
        </button>
      </div>

      <AddForm onAdd={handleAdd}>
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-8"><Input placeholder="Descrição" value={name} onChange={e => setName(e.target.value)} onKeyDown={(e) => handleEnter(e, handleAdd)} /></div>
          <div className="col-span-4"><Input type="number" placeholder="Valor" value={value} onChange={e => setValue(e.target.value)} onKeyDown={(e) => handleEnter(e, handleAdd)} /></div>
        </div>
      </AddForm>

      <div className="flex flex-col gap-2">
         {section.items.map((item, idx) => (
           <DraggableRow key={item.id} listId={section.id} index={idx} onMove={handleMove} className={`flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5 ${hoverBorderColor}`}>
             {editingId === item.id ? (
                <div className="flex items-center gap-2 w-full">
                  <input value={editName} onChange={e => setEditName(e.target.value.toUpperCase())} className={`bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-white focus:border-${color === 'green' ? 'neon-green' : 'neon-red'} outline-none w-full h-8 uppercase`} placeholder="Descrição" autoFocus />
                  <div className="flex items-center gap-2 shrink-0">
                     <span className={`${neonColor} font-bold text-sm`}>R$</span>
                     <input type="number" value={editValue} onChange={e => setEditValue(e.target.value)} className={`bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-white focus:border-${color === 'green' ? 'neon-green' : 'neon-red'} outline-none w-24 h-8`} placeholder="Valor" />
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

// --- Outros módulos permanecem iguais... ---
export const FixedExpenseModule: React.FC<{ data: FinancialData, onUpdate: (d: FinancialData) => void }> = ({ data, onUpdate }) => {
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [date, setDate] = useState('');
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
          <DraggableRow key={item.id} listId="fixed" index={idx} onMove={(f, t) => {
            const list = [...data.fixedExpenses];
            list.splice(t, 0, list.splice(f, 1)[0]);
            onUpdate({ ...data, fixedExpenses: list });
          }} className="flex flex-col sm:flex-row justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5 hover:border-neon-red/50 gap-2 sm:gap-0">
             {editingId === item.id ? (
               <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
                 <input value={editName} onChange={e => setEditName(e.target.value.toUpperCase())} className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-white focus:border-neon-red outline-none w-full h-8 uppercase" placeholder="Descrição" autoFocus />
                 <input value={editDate} onChange={e => setEditDate(e.target.value.toUpperCase())} className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-slate-300 w-24 text-center h-8 uppercase" placeholder="Venc." />
                 <div className="flex items-center gap-2 shrink-0">
                    <span className="text-neon-red font-bold text-sm">R$</span>
                    <input type="number" value={editValue} onChange={e => setEditValue(e.target.value)} className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-white w-24 h-8" placeholder="Valor" />
                    <div className="flex gap-1">
                      <ActionButton onClick={saveEdit} icon={<Check size={14} />} color="text-neon-green" />
                      <ActionButton onClick={() => setEditingId(null)} icon={<X size={14} />} color="text-neon-red" />
                    </div>
                 </div>
               </div>
             ) : (
               <>
                 <div className="flex-1 w-full sm:w-auto">
                   <p className="font-bold text-white text-sm">{item.name}</p>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Venc: {item.dueDate}</p>
                 </div>
                 <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 w-full sm:w-auto">
                   <span className="font-extrabold text-white text-sm">R$ {fmt(item.value)}</span>
                   <div className="flex items-center gap-1">
                      <ActionButton onClick={() => onUpdate({...data, fixedExpenses: [...data.fixedExpenses, {...item, id: Math.random().toString(36).substr(2, 9)}]})} icon={<Copy size={14} />} />
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

export const InstallmentModule: React.FC<{ data: FinancialData, onUpdate: (d: FinancialData) => void }> = ({ data, onUpdate }) => {
  const [name, setName] = useState('');
  const [val, setVal] = useState('');
  const [qtd, setQtd] = useState('');
  const [start, setStart] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editValue, setEditValue] = useState('');
  const [editQtd, setEditQtd] = useState('');
  const [editStart, setEditStart] = useState('');

  const totalMonthly = data.installments.reduce((acc, i) => acc + i.monthlyValue, 0);

  const handleAdd = () => {
    if (!name || !val) return;
    const item: InstallmentExpense = { id: Math.random().toString(36).substr(2, 9), name, monthlyValue: parseFloat(val), installmentsCount: parseInt(qtd) || 12, startMonth: start || new Date().toISOString().slice(0, 7) };
    onUpdate({...data, installments: [...data.installments, item]});
    setName(''); setVal(''); setQtd(''); setStart('');
  };

  const handleAdvanceMonth = (item: InstallmentExpense) => {
    if (item.installmentsCount <= 1) { if (confirm(`Pagar a última parcela de ${item.name} e remover?`)) onUpdate({...data, installments: data.installments.filter(i => i.id !== item.id)}); return; }
    const newCount = item.installmentsCount - 1;
    let newStartMonth = item.startMonth;
    if (item.startMonth && item.startMonth.includes('-')) {
        const [y, m] = item.startMonth.split('-').map(Number);
        const date = new Date(y, m - 1, 1); date.setMonth(date.getMonth() + 1);
        newStartMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    }
    onUpdate({...data, installments: data.installments.map(i => i.id === item.id ? { ...i, installmentsCount: newCount, startMonth: newStartMonth } : i)});
  };

  const startEdit = (item: InstallmentExpense) => {
    setEditingId(item.id); setEditName(item.name); setEditValue(item.monthlyValue.toString()); setEditQtd(item.installmentsCount.toString()); setEditStart(item.startMonth);
  };

  const saveEdit = () => {
    if(!editingId) return;
    onUpdate({...data, installments: data.installments.map(i => i.id === editingId ? { ...i, name: editName, monthlyValue: parseFloat(editValue) || 0, installmentsCount: parseInt(editQtd) || 1, startMonth: editStart } : i)});
    setEditingId(null);
  };

  return (
      <CollapsibleCard title="Parcelamentos" totalValue={`R$ ${fmt(totalMonthly)}`} color="red" icon={<CalendarDays size={18} />}>
         <AddForm onAdd={handleAdd}>
             <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                 <div className="md:col-span-5"><Input placeholder="Descrição" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => handleEnter(e, handleAdd)}/></div>
                 <div className="md:col-span-3"><Input type="number" placeholder="Valor Mês" value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => handleEnter(e, handleAdd)}/></div>
                 <div className="md:col-span-2"><Input type="number" placeholder="Qtd" value={qtd} onChange={e => setQtd(e.target.value)} onKeyDown={e => handleEnter(e, handleAdd)}/></div>
                 <div className="md:col-span-2"><Input type="text" placeholder="Início (AAAA-MM)" value={start} onChange={e => setStart(e.target.value)} onKeyDown={e => handleEnter(e, handleAdd)}/></div>
             </div>
         </AddForm>
         <div className="flex flex-col gap-2">
             {data.installments.map((item, idx) => (
                 <DraggableRow key={item.id} listId="installments" index={idx} onMove={(f,t) => {
                    const list = [...data.installments]; list.splice(t, 0, list.splice(f, 1)[0]); onUpdate({...data, installments: list});
                 }} className="flex flex-col sm:flex-row justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5 hover:border-neon-red/50 gap-3 sm:gap-0">
                     {editingId === item.id ? (
                        <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
                           <input value={editName} onChange={e => setEditName(e.target.value.toUpperCase())} className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-white w-full h-8 uppercase" placeholder="Nome" />
                           <input value={editValue} type="number" onChange={e => setEditValue(e.target.value)} className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-white w-20 h-8" placeholder="Val" />
                           <input value={editQtd} type="number" onChange={e => setEditQtd(e.target.value)} className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-white w-16 h-8" placeholder="Qtd" />
                           <input value={editStart} onChange={e => setEditStart(e.target.value)} className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-white w-24 h-8" placeholder="Início" />
                           <div className="flex gap-1 shrink-0">
                               <ActionButton onClick={saveEdit} icon={<Check size={14} />} color="text-neon-green"/>
                               <ActionButton onClick={() => setEditingId(null)} icon={<X size={14} />} color="text-neon-red"/>
                           </div>
                        </div>
                     ) : (
                         <>
                            <div className="flex-1 min-w-0 w-full sm:w-auto">
                                <p className="font-bold text-white text-sm truncate">{item.name}</p>
                                <div className="flex gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                    <span>{item.installmentsCount}x</span>
                                    <span>Início: {item.startMonth}</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 w-full sm:w-auto">
                                <span className="font-extrabold text-white text-sm">R$ {fmt(item.monthlyValue)}</span>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => handleAdvanceMonth(item)} className="mr-2 px-2 py-1 bg-neon-green/10 text-neon-green border border-neon-green/30 rounded hover:bg-neon-green hover:text-black transition-all text-[10px] font-bold flex items-center gap-1.5"><CalendarCheck size={12} /> PAGAR 1 MÊS</button>
                                    <ActionButton onClick={() => onUpdate({...data, installments: [...data.installments, {...item, id: Math.random().toString(36).substr(2, 9)}]})} icon={<Copy size={14} />} />
                                    <ActionButton onClick={() => startEdit(item)} icon={<Pencil size={14} />} />
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

export const CreditCardModule: React.FC<{ data: FinancialData, onUpdate: (d: FinancialData) => void }> = ({ data, onUpdate }) => {
    const [name, setName] = useState(''); const [limit, setLimit] = useState('');
    const [editingId, setEditingId] = useState<string|null>(null);
    const [editName, setEditName] = useState(''); const [editLimit, setEditLimit] = useState('');
    const totalLimit = data.creditCards.reduce((acc, c) => acc + c.limit, 0);

    const handleAdd = () => {
        if(!name) return;
        onUpdate({...data, creditCards: [...data.creditCards, { id: Math.random().toString(36).substr(2, 9), name, limit: parseFloat(limit) || 0, dueDay: 0, closingDay: 0, currentInvoiceValue: 0 }]});
        setName(''); setLimit('');
    };
    
    const saveEdit = () => {
        if(!editingId) return;
        onUpdate({...data, creditCards: data.creditCards.map(c => c.id === editingId ? { ...c, name: editName, limit: parseFloat(editLimit) || 0 } : c)});
        setEditingId(null);
    };

    return (
        <CollapsibleCard title="LIMITES" totalValue={`Total Limites: R$ ${fmt(totalLimit)}`} color="pink" icon={<CCIcon size={18} />}>
            <AddForm onAdd={handleAdd}>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                    <div className="md:col-span-8"><Input placeholder="Nome do Banco" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => handleEnter(e, handleAdd)} /></div>
                    <div className="md:col-span-4"><Input type="number" placeholder="Valor do Limite" value={limit} onChange={e => setLimit(e.target.value)} onKeyDown={e => handleEnter(e, handleAdd)} /></div>
                </div>
            </AddForm>
            <div className="flex flex-col gap-3">
                {data.creditCards.map((card, idx) => (
                    <DraggableRow key={card.id} listId="creditCards" index={idx} onMove={(f,t) => { const list = [...data.creditCards]; list.splice(t,0,list.splice(f,1)[0]); onUpdate({...data, creditCards: list}); }} className="bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-xl p-4 relative group hover:border-neon-pink/50 transition-all">
                        {editingId === card.id ? (
                            <div className="flex flex-col gap-2">
                                <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Banco" />
                                <Input value={editLimit} type="number" onChange={e => setEditLimit(e.target.value)} placeholder="Limite" />
                                <div className="flex justify-end gap-2 mt-2">
                                    <Button onClick={() => setEditingId(null)} variant="ghost">Cancelar</Button>
                                    <Button onClick={saveEdit} variant="primary">Salvar</Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-between items-center gap-2">
                                <div className="min-w-0 flex-1">
                                    <h4 className="font-bold text-white tracking-wide truncate uppercase text-sm">{card.name}</h4>
                                    <div className="mt-1"><p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Limite Disponível</p><p className="text-xl font-bold text-neon-pink">R$ {fmt(card.limit)}</p></div>
                                </div>
                                <div className="flex gap-1 shrink-0"><ActionButton onClick={() => { setEditingId(card.id); setEditName(card.name); setEditLimit(card.limit.toString()); }} icon={<Pencil size={14}/>} /><ActionButton onClick={() => onUpdate({...data, creditCards: data.creditCards.filter(c => c.id !== card.id)})} icon={<Trash2 size={14}/>} color="text-red-500" /></div>
                            </div>
                        )}
                    </DraggableRow>
                ))}
            </div>
        </CollapsibleCard>
    );
};

export const PixModule: React.FC<{ data: FinancialData, onUpdate: (d: FinancialData) => void }> = ({ data, onUpdate }) => {
    const [type, setType] = useState('CPF'); const [key, setKey] = useState(''); const [beneficiary, setBeneficiary] = useState('');
    const handleAdd = () => {
        if(!key) return;
        onUpdate({...data, pixKeys: [...data.pixKeys, { id: Math.random().toString(36).substr(2, 9), type: type as any, key, beneficiary, active: true }]});
        setKey(''); setBeneficiary('');
    };
    return (
        <CollapsibleCard title="Chaves Pix" color="blue" icon={<Zap size={18} />}>
            <AddForm onAdd={handleAdd}>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                    <div className="md:col-span-3"><Select options={[{value: 'CPF', label: 'CPF'},{value: 'CNPJ', label: 'CNPJ'},{value: 'Telefone', label: 'Telefone'},{value: 'Email', label: 'Email'},{value: 'Aleatória', label: 'Aleatória'}]} value={type} onChange={e => setType(e.target.value)} /></div>
                    <div className="md:col-span-5"><Input placeholder="Chave" value={key} onChange={e => setKey(e.target.value)} /></div>
                    <div className="md:col-span-4"><Input placeholder="Beneficiário (Opcional)" value={beneficiary} onChange={e => setBeneficiary(e.target.value)} /></div>
                </div>
            </AddForm>
            <div className="flex flex-col gap-2">
                {data.pixKeys.map((pk, idx) => (
                    <DraggableRow key={pk.id} listId="pixKeys" index={idx} onMove={(f,t) => { const list = [...data.pixKeys]; list.splice(t,0,list.splice(f,1)[0]); onUpdate({...data, pixKeys: list}); }} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5 hover:border-neon-blue/50 group gap-3">
                        <div className="flex-1 overflow-hidden">
                            <div className="flex items-center gap-2 mb-1 flex-wrap"><Badge color="blue">{pk.type}</Badge>{pk.beneficiary && <span className="text-[10px] text-slate-300 font-bold truncate uppercase tracking-tight">{pk.beneficiary}</span>}</div>
                            <p className="text-sm font-mono text-white truncate select-all">{pk.key}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0"><ActionButton onClick={() => navigator.clipboard.writeText(pk.key)} icon={<Copy size={14} />} /><ActionButton onClick={() => onUpdate({...data, pixKeys: data.pixKeys.filter(p => p.id !== pk.id)})} icon={<Trash2 size={14} />} color="text-slate-500 hover:text-neon-red" /></div>
                    </DraggableRow>
                ))}
            </div>
        </CollapsibleCard>
    );
};