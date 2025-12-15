import React, { useState } from 'react';
import { FinancialData, Income, FixedExpense, InstallmentExpense, CreditCard, PixKey } from '../types';
import { Card, Button, Input, Select, Badge } from './ui/UIComponents';
import { Trash2, Plus, Calendar, AlertCircle, Copy, Check, CreditCard as CCIcon, ArrowRight } from 'lucide-react';

const SectionHeader = ({ title, onAdd }: { title: string, onAdd: () => void }) => (
  <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
    <h2 className="text-lg font-extrabold text-white tracking-wide uppercase flex items-center gap-2 drop-shadow-md">
      <span className="w-1.5 h-6 bg-neon-blue rounded-full shadow-[0_0_8px_#00f3ff]"></span>
      {title}
    </h2>
    <Button onClick={onAdd} variant="primary" className="h-8 px-3 text-xs font-bold">
      <Plus size={14} /> <span className="hidden sm:inline">Adicionar</span>
    </Button>
  </div>
);

// --- Income Module ---
export const IncomeModule = ({ data, onUpdate }: { data: FinancialData, onUpdate: (d: FinancialData) => void }) => {
  const [newName, setNewName] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newDate, setNewDate] = useState('');

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

  return (
    <Card className="h-full border-l-4 border-l-neon-green/30">
      <SectionHeader title="Entradas" onAdd={handleAdd} />
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-6 p-4 bg-black/20 rounded-xl border border-white/5">
        <div className="md:col-span-5"><Input placeholder="Nome da Entrada" value={newName} onChange={e => setNewName(e.target.value)} /></div>
        <div className="md:col-span-3"><Input type="number" placeholder="R$ Valor" value={newValue} onChange={e => setNewValue(e.target.value)} /></div>
        <div className="md:col-span-4"><Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} /></div>
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
        {data.incomes.length === 0 && <p className="text-slate-500 text-center text-sm py-8 font-medium italic">Nenhuma entrada registrada.</p>}
        {data.incomes.map(item => (
          <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 bg-white/5 rounded-xl border border-white/5 hover:border-neon-green/50 hover:bg-white/10 transition-all group">
            <div className="flex items-center gap-3 mb-2 sm:mb-0">
              <div className="p-2 bg-neon-green/10 rounded-full text-neon-green">
                <ArrowRight size={14} className="transform -rotate-45" />
              </div>
              <div>
                <p className="font-bold text-white text-base">{item.name}</p>
                <p className="text-xs text-slate-400 font-medium flex items-center gap-1 uppercase tracking-wider"><Calendar size={10} /> {item.expectedDate}</p>
              </div>
            </div>
            <div className="flex items-center justify-between w-full sm:w-auto gap-4 pl-11 sm:pl-0">
              <span className="font-extrabold text-neon-green text-lg drop-shadow-[0_0_3px_rgba(10,255,104,0.5)]">R$ {item.value.toFixed(2)}</span>
              <button onClick={() => handleRemove(item.id)} className="text-slate-500 hover:text-neon-red transition-colors opacity-50 group-hover:opacity-100"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

// --- Fixed Expense Module ---
export const FixedExpenseModule = ({ data, onUpdate }: { data: FinancialData, onUpdate: (d: FinancialData) => void }) => {
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [date, setDate] = useState('');

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

  return (
    <Card className="h-full border-l-4 border-l-neon-pink/30">
      <SectionHeader title="Saídas Fixas" onAdd={handleAdd} />
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-6 p-4 bg-black/20 rounded-xl border border-white/5">
        <div className="md:col-span-5"><Input placeholder="Descrição" value={name} onChange={e => setName(e.target.value)} /></div>
        <div className="md:col-span-3"><Input type="number" placeholder="R$ Valor" value={value} onChange={e => setValue(e.target.value)} /></div>
        <div className="md:col-span-4"><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
      </div>
      <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
        {data.fixedExpenses.length === 0 && <p className="text-slate-500 text-center text-sm py-8 font-medium italic">Sem saídas fixas.</p>}
        {data.fixedExpenses.map(item => {
          const daysUntil = Math.ceil((new Date(item.dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
          const urgent = daysUntil <= 3 && daysUntil >= 0;
          return (
            <div key={item.id} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 rounded-xl border transition-all duration-300 group ${urgent ? 'bg-neon-red/5 border-neon-red/30 shadow-[0_0_10px_rgba(255,0,85,0.1)]' : 'bg-white/5 border-white/5 hover:border-neon-pink/50'}`}>
              <div className="mb-2 sm:mb-0 w-full sm:w-auto">
                <div className="flex justify-between sm:block">
                    <p className="font-bold text-white text-base">{item.name}</p>
                    {urgent && <span className="sm:hidden"><Badge color="red">URGENTE</Badge></span>}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-slate-400 font-medium uppercase">Venc: {item.dueDate}</p>
                  {urgent && <span className="hidden sm:inline"><Badge color="red">Vence Logo</Badge></span>}
                </div>
              </div>
              <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                <span className="font-extrabold text-white text-lg">R$ {item.value.toFixed(2)}</span>
                <button onClick={() => onUpdate({ ...data, fixedExpenses: data.fixedExpenses.filter(i => i.id !== item.id) })} className="text-slate-500 hover:text-neon-red opacity-50 group-hover:opacity-100"><Trash2 size={16} /></button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

// --- Installment Module ---
export const InstallmentModule = ({ data, onUpdate }: { data: FinancialData, onUpdate: (d: FinancialData) => void }) => {
  const [name, setName] = useState('');
  const [total, setTotal] = useState('');
  const [count, setCount] = useState('');
  const [start, setStart] = useState('');

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

  return (
    <Card className="h-full border-l-4 border-l-neon-yellow/30">
      <SectionHeader title="Parcelados" onAdd={handleAdd} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <Input placeholder="O que você comprou?" value={name} onChange={e => setName(e.target.value)} />
        <Input type="month" value={start} onChange={e => setStart(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3 mb-6">
         <Input type="number" placeholder="Valor Total" value={total} onChange={e => setTotal(e.target.value)} />
         <Input type="number" placeholder="Nº Parcelas" value={count} onChange={e => setCount(e.target.value)} />
      </div>
      
      <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
        {data.installments.map(item => {
          const installmentValue = item.totalValue / item.installmentsCount;
          const startD = new Date(item.startMonth + "-01");
          const now = new Date();
          const monthsPassed = (now.getFullYear() - startD.getFullYear()) * 12 + (now.getMonth() - startD.getMonth());
          const remaining = Math.max(0, item.installmentsCount - monthsPassed);
          const isFinished = remaining === 0;
          const progress = ((item.installmentsCount - remaining) / item.installmentsCount) * 100;

          if (isFinished) return null;

          return (
            <div key={item.id} className="p-4 bg-white/5 rounded-xl border border-white/5 hover:border-neon-yellow/50 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-bold text-white text-sm">{item.name}</p>
                  <p className="text-xs text-slate-400 font-medium">Início: {item.startMonth}</p>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-white text-sm">R$ {installmentValue.toFixed(2)}<span className="text-[10px] font-medium text-slate-500">/mês</span></p>
                  <span className="text-xs text-neon-yellow font-bold">{remaining}x restantes</span>
                </div>
              </div>
              <div className="w-full bg-black/50 h-1.5 rounded-full overflow-hidden mb-2">
                <div className="bg-neon-yellow h-full shadow-[0_0_5px_currentColor]" style={{ width: `${progress}%` }}></div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 font-medium">Total: {item.totalValue}</span>
                <button onClick={() => onUpdate({ ...data, installments: data.installments.filter(i => i.id !== item.id) })} className="text-xs font-semibold text-slate-500 hover:text-neon-red transition-colors flex items-center gap-1">Remover</button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

// --- Credit Card Module ---
export const CreditCardModule = ({ data, onUpdate }: { data: FinancialData, onUpdate: (d: FinancialData) => void }) => {
  const [name, setName] = useState('');
  const [limit, setLimit] = useState('');
  const [used, setUsed] = useState('');

  const handleAdd = () => {
    if (!name || !limit) return;
    const item: CreditCard = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      limit: parseFloat(limit),
      currentInvoiceValue: parseFloat(used) || 0,
      closingDay: 1,
      dueDay: 10
    };
    onUpdate({ ...data, creditCards: [...data.creditCards, item] });
    setName(''); setLimit(''); setUsed('');
  };

  return (
    <Card className="h-full border-l-4 border-l-neon-blue/30">
      <SectionHeader title="Cartões de Crédito" onAdd={handleAdd} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 p-4 bg-black/20 rounded-xl border border-white/5">
        <Input placeholder="Apelido do Cartão" value={name} onChange={e => setName(e.target.value)} />
        <Input type="number" placeholder="Limite Total" value={limit} onChange={e => setLimit(e.target.value)} />
        <Input type="number" placeholder="Gasto Atual" value={used} onChange={e => setUsed(e.target.value)} />
      </div>

      <div className="space-y-4">
        {data.creditCards.map(card => {
          const available = card.limit - card.currentInvoiceValue;
          const percent = (card.currentInvoiceValue / card.limit) * 100;
          const statusColor = percent > 80 ? 'bg-neon-red shadow-neon-red' : percent > 50 ? 'bg-neon-yellow shadow-neon-yellow' : 'bg-neon-blue shadow-neon-blue';
          const borderColor = percent > 80 ? 'border-neon-red/50' : percent > 50 ? 'border-neon-yellow/50' : 'border-neon-blue/50';

          return (
            <div key={card.id} className={`p-5 bg-gradient-to-br from-white/5 to-transparent rounded-2xl border ${borderColor} relative overflow-hidden transition-all hover:scale-[1.01]`}>
              {/* Background Glow */}
              <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 ${statusColor.split(' ')[0]}`}></div>

              <div className="flex justify-between items-center mb-4 z-10 relative">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-black/40 rounded border border-white/10 text-slate-300">
                    <CCIcon size={18} />
                  </div>
                  <div>
                    <span className="font-extrabold text-white tracking-wide block text-lg">{card.name}</span>
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-widest">**** **** **** 1234</span>
                  </div>
                </div>
                <button onClick={() => onUpdate({ ...data, creditCards: data.creditCards.filter(c => c.id !== card.id) })} className="text-slate-500 hover:text-neon-red transition-colors"><Trash2 size={16} /></button>
              </div>
              
              <div className="flex justify-between text-xs text-slate-300 mb-2 z-10 relative font-bold">
                <span><span className="text-slate-500 font-medium mr-1">Fatura:</span> R$ {card.currentInvoiceValue.toLocaleString()}</span>
                <span><span className="text-slate-500 font-medium mr-1">Disp:</span> R$ {available.toLocaleString()}</span>
              </div>
              
              <div className="w-full bg-black/60 h-2.5 rounded-full overflow-hidden z-10 relative border border-white/5">
                <div className={`h-full rounded-full transition-all duration-700 shadow-[0_0_8px_currentColor] ${statusColor}`} style={{ width: `${Math.min(percent, 100)}%` }}></div>
              </div>
              
              {percent > 90 && <div className="mt-3 text-[10px] text-neon-red flex items-center gap-1 font-extrabold animate-pulse"><AlertCircle size={10} /> LIMITE CRÍTICO</div>}
            </div>
          );
        })}
      </div>
    </Card>
  );
};

// --- Pix Module ---
export const PixModule = ({ data, onUpdate }: { data: FinancialData, onUpdate: (d: FinancialData) => void }) => {
  const [type, setType] = useState('CPF');
  const [key, setKey] = useState('');

  const handleAdd = () => {
    if (!key) return;
    const item: PixKey = {
      id: Math.random().toString(36).substr(2, 9),
      type: type as any,
      key,
      active: true
    };
    onUpdate({ ...data, pixKeys: [...data.pixKeys, item] });
    setKey('');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Card className="h-full border-l-4 border-l-white/20">
      <SectionHeader title="Chaves Pix" onAdd={handleAdd} />
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="sm:w-1/3">
          <Select 
            value={type} 
            onChange={e => setType(e.target.value)}
            options={[
              {value: 'CPF', label: 'CPF'},
              {value: 'CNPJ', label: 'CNPJ'},
              {value: 'Telefone', label: 'Telefone'},
              {value: 'Email', label: 'E-mail'},
              {value: 'Aleatória', label: 'Aleatória'},
            ]} 
          />
        </div>
        <div className="flex-1">
          <Input placeholder="Cole sua chave aqui" value={key} onChange={e => setKey(e.target.value)} />
        </div>
      </div>

      <div className="space-y-3">
        {data.pixKeys.map(pk => (
          <div key={pk.id} className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${pk.active ? 'bg-white/5 border-neon-blue/30 shadow-[0_0_5px_rgba(0,243,255,0.05)]' : 'bg-black/40 border-white/5 opacity-60'}`}>
            <div className="overflow-hidden pr-2">
              <span className="text-[10px] uppercase text-neon-blue font-extrabold tracking-widest border border-neon-blue/20 px-2 py-0.5 rounded mb-1 inline-block">{pk.type}</span>
              <p className="text-sm font-bold font-mono text-slate-200 truncate">{pk.key}</p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => copyToClipboard(pk.key)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors" title="Copiar"><Copy size={16} /></button>
              <button 
                onClick={() => onUpdate({ ...data, pixKeys: data.pixKeys.map(k => k.id === pk.id ? { ...k, active: !k.active } : k) })} 
                className={`p-2 rounded-lg transition-colors ${pk.active ? 'text-neon-green hover:bg-neon-green/10' : 'text-slate-600 hover:bg-white/5'}`}
                title="Ativar/Desativar"
              >
                <Check size={16} />
              </button>
              <button onClick={() => onUpdate({ ...data, pixKeys: data.pixKeys.filter(k => k.id !== pk.id) })} className="p-2 hover:bg-neon-red/10 rounded-lg text-slate-600 hover:text-neon-red transition-colors"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};