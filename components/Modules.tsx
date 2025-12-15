import React, { useState } from 'react';
import { FinancialData, Income, FixedExpense, InstallmentExpense, CreditCard, PixKey, CustomSection, SectionItem, RadarItem } from '../types';
import { CollapsibleCard, Button, Input, Select, Badge } from './ui/UIComponents';
import { Trash2, Plus, Calendar, AlertCircle, Copy, Check, CreditCard as CCIcon, ArrowRight, Zap, FolderOpen, CalendarDays, Wallet, GripVertical, Target } from 'lucide-react';

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
      <div className="mr-2 text-slate-600 hover:text-slate-400">
        <GripVertical size={14} />
      </div>
      {children}
    </div>
  );
};

// --- Radar Module (No Radar) ---
export const RadarModule: React.FC<{ data: FinancialData, onUpdate: (d: FinancialData) => void }> = ({ data, onUpdate }) => {
  const [name, setName] = useState('');
  const [value, setValue] = useState('');

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
             <div className="flex-1">
                <span className="font-bold text-white text-sm">{item.name}</span>
             </div>
              <div className="flex items-center gap-3">
                <span className="font-extrabold text-white text-sm">R$ {item.value.toFixed(2)}</span>
                <button onClick={() => onUpdate({...data, radarItems: items.filter(i => i.id !== item.id)})} className="text-slate-500 hover:text-white"><Trash2 size={14} /></button>
              </div>
           </DraggableRow>
         ))}
      </div>
    </CollapsibleCard>
  );
};

// --- Income Module (Split Future/Present) ---
export const IncomeModule: React.FC<{ data: FinancialData, onUpdate: (d: FinancialData) => void, type: 'current' | 'future' }> = ({ data, onUpdate, type }) => {
  const [newName, setNewName] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newDate, setNewDate] = useState('');

  // Filter Logic
  const today = new Date();
  const currentMonthStr = today.toISOString().slice(0, 7); // YYYY-MM
  
  const filteredIncomes = data.incomes.filter(item => {
    if (type === 'current') {
      return item.expectedDate.startsWith(currentMonthStr) || item.expectedDate < currentMonthStr;
    } else {
      return item.expectedDate > currentMonthStr + '-31'; 
    }
  });

  const totalValue = filteredIncomes.reduce((acc, curr) => acc + curr.value, 0);

  const handleAdd = () => {
    if (!newName || !newValue) return;
    const item: Income = {
      id: Math.random().toString(36).substr(2, 9),
      name: newName,
      value: parseFloat(newValue),
      expectedDate: newDate || new Date().toISOString().split('T')[0]
    };
    onUpdate({ ...data, incomes: [...data.incomes, item] });
    setNewName(''); setNewValue(''); setNewDate('');
  };

  const handleRemove = (id: string) => {
    onUpdate({ ...data, incomes: data.incomes.filter(i => i.id !== id) });
  };

  const handleMove = (fromIndex: number, toIndex: number) => {
    // Reorder based on the full list to avoid index issues
    const fromItem = filteredIncomes[fromIndex];
    const toItem = filteredIncomes[toIndex];
    if (!fromItem || !toItem) return;

    const allIncomes = [...data.incomes];
    const realFrom = allIncomes.findIndex(i => i.id === fromItem.id);
    const realTo = allIncomes.findIndex(i => i.id === toItem.id);

    allIncomes.splice(realTo, 0, allIncomes.splice(realFrom, 1)[0]);
    onUpdate({...data, incomes: allIncomes});
  };

  return (
    <CollapsibleCard 
      title={type === 'current' ? "Entradas Vigentes" : "Entradas Futuras"} 
      totalValue={`R$ ${totalValue.toFixed(2)}`}
      color="green"
      icon={type === 'current' ? <Wallet size={20}/> : <CalendarDays size={20}/>}
    >
      <AddForm onAdd={handleAdd}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5"><Input placeholder="Nome" value={newName} onChange={e => setNewName(e.target.value)} /></div>
          <div className="md:col-span-3"><Input type="number" placeholder="Valor" value={newValue} onChange={e => setNewValue(e.target.value)} /></div>
          <div className="md:col-span-4"><Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} /></div>
        </div>
      </AddForm>

      <div className="flex flex-col gap-2">
        {filteredIncomes.length === 0 && <p className="text-slate-500 text-center text-sm py-4 italic">Nenhum registro.</p>}
        {filteredIncomes.map((item, idx) => (
          <DraggableRow key={item.id} listId={`income-${type}`} index={idx} onMove={handleMove} className="flex flex-col sm:flex-row items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-neon-green/50 hover:bg-white/10 transition-all group">
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
              <button onClick={() => handleRemove(item.id)} className="text-slate-500 hover:text-neon-red transition-colors opacity-50 group-hover:opacity-100"><Trash2 size={14} /></button>
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
      date: new Date().toISOString().split('T')[0]
    };
    onUpdate({ ...section, items: [...section.items, item] });
    setName(''); setValue('');
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
                <button onClick={() => onUpdate({...section, items: section.items.filter(i => i.id !== item.id)})} className="text-slate-500 hover:text-neon-red"><Trash2 size={14} /></button>
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
      dueDate: date || new Date().toISOString().split('T')[0]
    };
    onUpdate({ ...data, fixedExpenses: [...data.fixedExpenses, item] });
    setName(''); setValue(''); setDate('');
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
          <div className="md:col-span-4"><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
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
               <button onClick={() => onUpdate({ ...data, fixedExpenses: data.fixedExpenses.filter(i => i.id !== item.id) })} className="text-slate-500 hover:text-neon-red"><Trash2 size={14} /></button>
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
                 <button onClick={() => onUpdate({ ...data, installments: data.installments.filter(i => i.id !== item.id) })} className="text-neon-red hover:underline">Remover</button>
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
               <div className="flex justify-between items-center">
                 <span className="font-bold text-white text-lg">{card.name}</span>
                 <button onClick={() => onUpdate({ ...data, creditCards: data.creditCards.filter(c => c.id !== card.id) })} className="text-slate-500 hover:text-neon-red"><Trash2 size={14} /></button>
               </div>
               <div className="flex justify-between text-sm text-slate-300">
                 <span className="uppercase text-[10px] tracking-widest font-bold text-slate-500">Limite Disponível</span>
                 <span className="font-mono text-neon-blue font-bold">R$ {card.limit.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
               </div>
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
               <div className="flex flex-col w-full overflow-hidden">
                 <div className="flex items-center gap-2 mb-1">
                    <Badge color="pink">{item.type}</Badge>
                    {item.beneficiary && <span className="text-xs text-slate-300 font-bold uppercase truncate">{item.beneficiary}</span>}
                 </div>
                 <span className="font-bold text-white text-sm truncate">{item.key}</span>
               </div>
               <button onClick={() => onUpdate({ ...data, pixKeys: data.pixKeys.filter(i => i.id !== item.id) })} className="text-slate-500 hover:text-neon-red ml-2 shrink-0"><Trash2 size={14} /></button>
            </DraggableRow>
          ))}
       </div>
    </CollapsibleCard>
  );
};