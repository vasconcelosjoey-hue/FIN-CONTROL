
import React, { useState } from 'react';
import { FinancialData, CustomSection, SectionItem, RadarItem, DreamItem, PixKey, CreditCard } from '../types';
import { CollapsibleCard, Button, Input, CurrencyInput, Select, Badge, Card, Modal } from './ui/UIComponents';
import { Trash2, Plus, Wallet, GripVertical, Target, Pencil, Check, X, CreditCard as CCIcon, Zap, Power, Star, ArrowLeft, Trophy, CalendarCheck, CheckCircle2, AlertTriangle, DollarSign } from 'lucide-react';

const AddForm = ({ children, onAdd }: { children?: React.ReactNode, onAdd: () => void }) => (
  <div className="mb-4 pt-4 border-t border-white/5" onKeyDown={e => e.key === 'Enter' && onAdd()}>
    {children}
    <Button onClick={onAdd} variant="primary" className="w-full mt-4 h-12 shadow-lg">
      <Plus size={18} /> Adicionar Novo Registro
    </Button>
  </div>
);

const fmt = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const getInstallmentMonth = (startMonth?: string, current: number = 1) => {
  if (!startMonth) return '---';
  try {
    const parts = startMonth.split('-');
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    
    // JS Date meses são 0-indexed. 
    // Fórmula: (mês_escolhido - 1) + (parcela_atual - 1)
    const targetDate = new Date(year, (month - 1) + (current - 1), 15);
    
    return targetDate.toLocaleString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');
  } catch (e) {
    console.error("Erro ao calcular mês:", e);
    return '---';
  }
};

const ActionButton = ({ onClick, icon, color = "text-slate-600 hover:text-white" }: { onClick: () => void, icon: React.ReactNode, color?: string }) => (
  <button onClick={(e) => { e.stopPropagation(); onClick(); }} className={`${color} transition-colors p-2 rounded-lg hover:bg-white/5 shrink-0`}>
    {icon}
  </button>
);

const DraggableRow: React.FC<{ children: React.ReactNode; index: number; listId: string; onMove: (f: number, t: number) => void }> = ({ children, index, listId, onMove }) => {
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
    }} className="flex items-center group/row">
      <div className="mr-2 text-slate-800 group-hover/row:text-slate-600 transition-colors shrink-0 cursor-grab active:cursor-grabbing"><GripVertical size={14} /></div>
      {children}
    </div>
  );
};

const EditRowLayout: React.FC<{ children: React.ReactNode, onSave: () => void, onCancel: () => void }> = ({ children, onSave, onCancel }) => (
  <div className="w-full flex flex-col gap-4 py-4 px-2" onKeyDown={e => e.key === 'Enter' && onSave()}>
    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 w-full items-end">
      {children}
    </div>
    <div className="flex flex-col sm:flex-row gap-3 w-full pt-2">
      <Button onClick={onSave} variant="primary" className="flex-1 h-12 text-[10px]"><Check size={18} /> Confirmar Alteração</Button>
      <Button onClick={onCancel} variant="secondary" className="flex-1 h-12 text-[10px]"><X size={18} /> Cancelar</Button>
    </div>
  </div>
);

const ToggleStatusButton = ({ active, onClick, color }: { active: boolean, onClick: () => void, color: string }) => (
  <button 
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-[8px] font-black tracking-[0.2em] transition-all active:scale-95 shrink-0 ${
      active 
      ? `bg-neon-green/10 border-neon-green/40 text-neon-green shadow-neon-green/10` 
      : `bg-neon-red/10 border-neon-red/40 text-neon-red shadow-neon-red/10`
    }`}
  >
    <Power size={12} /> {active ? 'ON' : 'OFF'}
  </button>
);

export const CustomSectionModule: React.FC<{ section: CustomSection, onUpdate: (s: CustomSection, immediate?: boolean) => void, onDeleteSection: () => void }> = ({ section, onUpdate, onDeleteSection }) => {
  const [name, setName] = useState('');
  const [val, setVal] = useState(0);
  const [count, setCount] = useState('');
  const [start, setStart] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<SectionItem>>({});
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [payInstallmentModal, setPayInstallmentModal] = useState<{ isOpen: boolean, item?: SectionItem }>({ isOpen: false });

  const total = section.items.filter(i => i.isActive !== false).reduce((acc, curr) => acc + (curr.value - (curr.paidAmount || 0)), 0);
  const color = section.type === 'income' ? 'green' : 'red';
  const isInstallment = section.structure === 'installment';

  const handleAdd = () => {
    if (!name || val === 0) return;
    const newItem: SectionItem = { 
      id: Math.random().toString(36).substr(2, 9), 
      name: name.toUpperCase(), 
      value: val, 
      isActive: true,
      ...(isInstallment ? { installmentsCount: parseInt(count) || 1, currentInstallment: 1, startMonth: start || new Date().toISOString().slice(0, 7) } : {})
    };
    onUpdate({ ...section, items: [...section.items, newItem] }, true);
    setName(''); setVal(0); setCount(''); setStart('');
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    onUpdate({ ...section, items: section.items.map(i => i.id === editingId ? { ...i, ...editData } : i) }, true);
    setEditingId(null);
  };

  const handlePayInstallment = (item: SectionItem) => {
    const isLast = (item.currentInstallment || 1) >= (item.installmentsCount || 1);
    
    if (isLast) {
      onUpdate({ ...section, items: section.items.filter(i => i.id !== item.id) }, true);
    } else {
      onUpdate({ 
        ...section, 
        items: section.items.map(i => i.id === item.id ? { ...i, currentInstallment: (i.currentInstallment || 1) + 1, paidAmount: 0 } : i) 
      }, true);
    }
    setPayInstallmentModal({ isOpen: false });
  };

  const handleQuickPay = (itemId: string, paidVal: number) => {
    onUpdate({
        ...section,
        items: section.items.map(i => i.id === itemId ? { ...i, paidAmount: paidVal } : i)
    }, false);
  };

  return (
    <>
      <CollapsibleCard 
        title={section.title} 
        totalValue={`R$ ${fmt(total)}`} 
        color={color} 
        icon={section.type === 'income' ? <Wallet size={18}/> : (isInstallment ? <CalendarCheck size={18}/> : <Zap size={18}/>)} 
        onEditTitle={(nt) => onUpdate({...section, title: nt}, true)}
      >
        <div className="flex justify-end mb-4">
           <button onClick={() => setIsDeleteModalOpen(true)} className="text-[10px] font-black uppercase tracking-widest text-slate-700 hover:text-neon-red flex items-center gap-1 transition-colors"><Trash2 size={10} /> Excluir Sessão</button>
        </div>
        
        <AddForm onAdd={handleAdd}>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className={`${isInstallment ? 'sm:col-span-4' : 'sm:col-span-7'}`}><Input label="Descrição" placeholder="EX: SALÁRIO, ALUGUEL..." value={name} onChange={e => setName(e.target.value)} /></div>
            <div className={`${isInstallment ? 'sm:col-span-3' : 'sm:col-span-5'}`}><CurrencyInput label={isInstallment ? "Vlr Parcela" : "Valor"} value={val} onValueChange={setVal} /></div>
            {isInstallment && (
              <>
                <div className="sm:col-span-2"><Input label="Parcelas" type="number" value={count} onChange={e => setCount(e.target.value)} placeholder="12" /></div>
                <div className="sm:col-span-3"><Input label="Referência (Mês 1)" type="month" value={start} onChange={e => setStart(e.target.value)} /></div>
              </>
            )}
          </div>
        </AddForm>

        <div className="flex flex-col gap-2 mt-4">
          {section.items.map((item, idx) => (
            <DraggableRow key={item.id} index={idx} listId={section.id} onMove={(f, t) => { const n = [...section.items]; const [m] = n.splice(f,1); n.splice(t,0,m); onUpdate({...section, items: n}, true); }}>
              <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-2xl transition-all gap-3">
                {editingId === item.id ? (
                  <EditRowLayout onSave={handleSaveEdit} onCancel={() => setEditingId(null)}>
                    <div className={`${isInstallment ? 'sm:col-span-4' : 'sm:col-span-8'}`}><Input label="NOME" value={editData.name || ''} onChange={e => setEditData({...editData, name: e.target.value})} /></div>
                    <div className="sm:col-span-4"><CurrencyInput label="VALOR BASE" value={editData.value || 0} onValueChange={v => setEditData({...editData, value: v})} /></div>
                    {isInstallment && (
                        <>
                            <div className="sm:col-span-2"><Input label="PARC" type="number" value={String(editData.installmentsCount || '')} onChange={e => setEditData({...editData, installmentsCount: parseInt(e.target.value)})} /></div>
                            <div className="sm:col-span-3"><Input label="REF (MÊS 1)" type="month" value={editData.startMonth || ''} onChange={e => setEditData({...editData, startMonth: e.target.value})} /></div>
                        </>
                    )}
                  </EditRowLayout>
                ) : (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className={`font-black text-xs sm:text-sm tracking-tight truncate ${item.isActive !== false ? 'text-white' : 'text-slate-700 line-through'}`}>{item.name}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {isInstallment && (
                          <div className="flex items-center gap-1.5 shrink-0">
                             <Badge color="yellow">{item.currentInstallment} / {item.installmentsCount}X</Badge>
                             <div className="flex items-center bg-black/40 rounded-lg pr-2 border border-white/5 shadow-inner">
                                <button 
                                  onClick={() => setPayInstallmentModal({ isOpen: true, item })}
                                  className="bg-neon-green/10 text-neon-green p-1.5 rounded-l-lg border-r border-white/10 hover:bg-neon-green hover:text-black transition-all"
                                  title="Quitar este mês"
                                >
                                  <CheckCircle2 size={12} />
                                </button>
                                <span className="text-[10px] font-black text-neon-yellow ml-2 tracking-widest">{getInstallmentMonth(item.startMonth, item.currentInstallment)}</span>
                             </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-xl border border-white/5">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Pago</span>
                            <div className="w-36">
                                <CurrencyInput 
                                    className="h-8 text-[13px] bg-transparent border-none p-0 focus:ring-0 focus:shadow-none font-black text-neon-green" 
                                    value={item.paidAmount || 0} 
                                    onValueChange={(v) => handleQuickPay(item.id, v)} 
                                />
                            </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <div className="text-right flex flex-col">
                        <span className={`font-mono font-black text-sm sm:text-base leading-none ${item.isActive !== false ? (section.type === 'income' ? 'text-neon-green' : 'text-neon-red shadow-[0_0_10px_rgba(255,0,85,0.2)]') : 'text-slate-800'}`}>
                            R$ {fmt(item.value - (item.paidAmount || 0))}
                        </span>
                        {item.paidAmount && item.paidAmount > 0 ? (
                            <span className="text-[8px] font-black text-slate-500 mt-1 uppercase">A pagar</span>
                        ) : null}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <ToggleStatusButton active={item.isActive !== false} onClick={() => onUpdate({...section, items: section.items.map(i => i.id === item.id ? {...i, isActive: !i.isActive} : i)}, true)} color={color} />
                        <ActionButton icon={<Pencil size={14} />} onClick={() => { setEditingId(item.id); setEditData(item); }} />
                        <ActionButton icon={<Trash2 size={14} />} color="text-slate-700 hover:text-neon-red" onClick={() => onUpdate({...section, items: section.items.filter(i => i.id !== item.id)}, true)} />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </DraggableRow>
          ))}
          {section.items.length === 0 && (
            <div className="py-8 text-center border-2 border-dashed border-white/5 rounded-3xl opacity-30 text-[10px] font-black uppercase tracking-widest">Nenhum item nesta sessão</div>
          )}
        </div>
      </CollapsibleCard>

      <Modal
        isOpen={payInstallmentModal.isOpen}
        onClose={() => setPayInstallmentModal({ isOpen: false })}
        title="Quitar Parcela"
        confirmText={(payInstallmentModal.item?.currentInstallment || 1) >= (payInstallmentModal.item?.installmentsCount || 1) ? "Quitar e Finalizar" : "Confirmar Pagamento"}
        onConfirm={() => payInstallmentModal.item && handlePayInstallment(payInstallmentModal.item)}
      >
        <div className="space-y-4">
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Registro</p>
            <p className="text-white font-black text-lg uppercase">{payInstallmentModal.item?.name}</p>
            <div className="flex gap-4 mt-3">
              <div>
                <p className="text-[8px] text-slate-600 font-black uppercase">Parcela</p>
                <p className="text-neon-yellow font-black">{payInstallmentModal.item?.currentInstallment} / {payInstallmentModal.item?.installmentsCount}</p>
              </div>
              <div>
                <p className="text-[8px] text-slate-600 font-black uppercase">Vigente</p>
                <p className="text-neon-blue font-black uppercase">{getInstallmentMonth(payInstallmentModal.item?.startMonth, payInstallmentModal.item?.currentInstallment)}</p>
              </div>
            </div>
          </div>
          
          {(payInstallmentModal.item?.currentInstallment || 1) >= (payInstallmentModal.item?.installmentsCount || 1) ? (
            <div className="p-3 bg-neon-yellow/10 border border-neon-yellow/30 rounded-xl flex items-start gap-3">
              <AlertTriangle className="text-neon-yellow shrink-0" size={18} />
              <p className="text-xs text-neon-yellow font-bold uppercase tracking-tight">Esta é a última parcela. O registro será finalizado hoje.</p>
            </div>
          ) : (
            <p className="text-xs text-slate-400 font-medium leading-relaxed">Ao confirmar, o sistema zerará o abatimento (Pago) e avançará para o mês seguinte (<span className="text-white font-bold">{getInstallmentMonth(payInstallmentModal.item?.startMonth, (payInstallmentModal.item?.currentInstallment || 1) + 1)}</span>).</p>
          )}
        </div>
      </Modal>

      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        title="Excluir Sessão?" 
        confirmText="Sim, Apagar Tudo" 
        confirmVariant="danger"
        onConfirm={onDeleteSection}
      >
        Deseja excluir permanentemente a sessão <strong className="text-white">"{section.title}"</strong> e todos os seus registros?
      </Modal>
    </>
  );
};

// Fix: Export CreditCardModule
export const CreditCardModule: React.FC<{ data: FinancialData, onUpdate: (d: FinancialData | ((p: FinancialData) => FinancialData), immediate?: boolean) => void }> = ({ data, onUpdate }) => {
  const [name, setName] = useState('');
  const [limit, setLimit] = useState(0);
  const [closing, setClosing] = useState('');
  const [due, setDue] = useState('');
  const [current, setCurrent] = useState(0);

  const handleAdd = () => {
    if (!name) return;
    const newItem: CreditCard = {
      id: Math.random().toString(36).substr(2, 9),
      name: name.toUpperCase(),
      limit,
      closingDay: parseInt(closing) || 1,
      dueDay: parseInt(due) || 1,
      currentInvoiceValue: current
    };
    onUpdate((prev: FinancialData) => ({ ...prev, creditCards: [...(prev.creditCards || []), newItem] }), true);
    setName(''); setLimit(0); setClosing(''); setDue(''); setCurrent(0);
  };

  return (
    <CollapsibleCard title="Cartões de Crédito" icon={<CCIcon size={18} />} color="pink">
      <AddForm onAdd={handleAdd}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Cartão" value={name} onChange={e => setName(e.target.value)} />
          <CurrencyInput label="Limite" value={limit} onValueChange={setLimit} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Fechamento" type="number" value={closing} onChange={e => setClosing(e.target.value)} />
            <Input label="Vencimento" type="number" value={due} onChange={e => setDue(e.target.value)} />
          </div>
          <CurrencyInput label="Fatura Atual" value={current} onValueChange={setCurrent} />
        </div>
      </AddForm>
      <div className="flex flex-col gap-2 mt-4">
        {(data.creditCards || []).map(card => (
          <div key={card.id} className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl flex justify-between items-center group">
            <div>
              <p className="font-black text-xs text-white uppercase tracking-tight">{card.name}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase">Lim: {fmt(card.limit)} • Fecha dia {card.closingDay}</p>
            </div>
            <div className="text-right flex items-center gap-3">
              <span className="font-mono font-black text-neon-pink">R$ {fmt(card.currentInvoiceValue)}</span>
              <ActionButton icon={<Trash2 size={14} />} color="text-slate-700 hover:text-neon-red" onClick={() => onUpdate((prev: FinancialData) => ({ ...prev, creditCards: prev.creditCards.filter(c => c.id !== card.id) }), true)} />
            </div>
          </div>
        ))}
      </div>
    </CollapsibleCard>
  );
};

// Fix: Export RadarModule
export const RadarModule: React.FC<{ data: FinancialData, onUpdate: (d: FinancialData | ((p: FinancialData) => FinancialData), immediate?: boolean) => void }> = ({ data, onUpdate }) => {
  const [name, setName] = useState('');
  const [val, setVal] = useState(0);

  const handleAdd = () => {
    if (!name || val === 0) return;
    const newItem: RadarItem = { id: Math.random().toString(36).substr(2, 9), name: name.toUpperCase(), value: val };
    onUpdate((prev: FinancialData) => ({ ...prev, radarItems: [...(prev.radarItems || []), newItem] }), true);
    setName(''); setVal(0);
  };

  return (
    <CollapsibleCard title="Radar de Gastos" icon={<AlertTriangle size={18} />} color="yellow">
      <AddForm onAdd={handleAdd}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Item" value={name} onChange={e => setName(e.target.value)} />
          <CurrencyInput label="Valor" value={val} onValueChange={setVal} />
        </div>
      </AddForm>
      <div className="flex flex-col gap-2 mt-4">
        {(data.radarItems || []).map(item => (
          <div key={item.id} className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl flex justify-between items-center">
            <p className="font-black text-xs text-white uppercase">{item.name}</p>
            <div className="flex items-center gap-3">
              <span className="font-mono font-black text-neon-yellow">R$ {fmt(item.value)}</span>
              <ActionButton icon={<Trash2 size={14} />} color="text-slate-700 hover:text-neon-red" onClick={() => onUpdate((prev: FinancialData) => ({ ...prev, radarItems: prev.radarItems.filter(i => i.id !== item.id) }), true)} />
            </div>
          </div>
        ))}
      </div>
    </CollapsibleCard>
  );
};

// Fix: Export PixModule
export const PixModule: React.FC<{ data: FinancialData, onUpdate: (d: FinancialData | ((p: FinancialData) => FinancialData), immediate?: boolean) => void }> = ({ data, onUpdate }) => {
  const [key, setKey] = useState('');
  const [type, setType] = useState<any>('Aleatória');
  const [beneficiary, setBeneficiary] = useState('');

  const handleAdd = () => {
    if (!key) return;
    const newItem: PixKey = { id: Math.random().toString(36).substr(2, 9), type, key, beneficiary: beneficiary.toUpperCase(), active: true };
    onUpdate((prev: FinancialData) => ({ ...prev, pixKeys: [...(prev.pixKeys || []), newItem] }), true);
    setKey(''); setBeneficiary('');
  };

  return (
    <CollapsibleCard title="Chaves Pix" icon={<Zap size={18} />} color="blue">
      <AddForm onAdd={handleAdd}>
        <div className="flex flex-col gap-3">
          <Select label="Tipo" value={type} onChange={e => setType(e.target.value as any)} options={[
            { value: 'Aleatória', label: 'Aleatória' },
            { value: 'CPF', label: 'CPF' },
            { value: 'CNPJ', label: 'CNPJ' },
            { value: 'Telefone', label: 'Telefone' },
            { value: 'Email', label: 'Email' }
          ]} />
          <Input label="Chave" value={key} onChange={e => setKey(e.target.value)} noUppercase={type === 'Email'} />
          <Input label="Beneficiário" value={beneficiary} onChange={e => setBeneficiary(e.target.value)} />
        </div>
      </AddForm>
      <div className="flex flex-col gap-2 mt-4">
        {(data.pixKeys || []).map(pk => (
          <div key={pk.id} className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl flex justify-between items-center">
            <div>
              <p className="font-black text-[10px] text-neon-blue uppercase tracking-widest">{pk.type}</p>
              <p className="text-xs text-white font-bold">{pk.key}</p>
              {pk.beneficiary && <p className="text-[8px] text-slate-600 font-black uppercase mt-0.5">{pk.beneficiary}</p>}
            </div>
            <ActionButton icon={<Trash2 size={14} />} color="text-slate-700 hover:text-neon-red" onClick={() => onUpdate((prev: FinancialData) => ({ ...prev, pixKeys: prev.pixKeys.filter(k => k.id !== pk.id) }), true)} />
          </div>
        ))}
      </div>
    </CollapsibleCard>
  );
};

// Fix: Export DreamsModule
export const DreamsModule: React.FC<{ data: FinancialData, onUpdate: (d: FinancialData | ((p: FinancialData) => FinancialData), imm?: boolean) => void, onBack: () => void }> = ({ data, onUpdate, onBack }) => {
  const [name, setName] = useState('');
  const [val, setVal] = useState(0);

  const handleAdd = () => {
    if (!name || val === 0) return;
    const newItem: DreamItem = { id: Math.random().toString(36).substr(2, 9), name: name.toUpperCase(), value: val, isActive: true };
    onUpdate((prev: FinancialData) => ({ ...prev, dreams: [...(prev.dreams || []), newItem] }), true);
    setName(''); setVal(0);
  };

  const totalDreams = (data.dreams || []).filter(d => d.isActive).reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="animate-in slide-in-from-right duration-500">
      <div className="flex items-center gap-4 mb-8">
        <Button onClick={onBack} variant="ghost" className="p-2 rounded-full"><ArrowLeft size={24} /></Button>
        <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tighter">My <span className="text-neon-pink">Dreams</span></h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <Card className="lg:col-span-2 border-neon-pink/30 bg-gradient-to-br from-neon-pink/10 to-transparent p-8 flex flex-col justify-center">
          <p className="text-[10px] text-neon-pink font-black uppercase tracking-[0.4em] mb-2">Meta Total Acumulada</p>
          <p className="text-5xl sm:text-6xl font-black text-white tracking-tighter">
            <span className="text-2xl text-slate-600 mr-2">R$</span>
            {fmt(totalDreams)}
          </p>
        </Card>
        
        <Card className="border-neon-blue/30 p-8 flex flex-col justify-center">
          <p className="text-[10px] text-neon-blue font-black uppercase tracking-[0.4em] mb-2">Orçamento Atual</p>
          <div className="flex flex-col gap-2">
            <CurrencyInput value={data.dreamsTotalBudget || 0} onValueChange={(v) => onUpdate((prev: FinancialData) => ({ ...prev, dreamsTotalBudget: v }), false)} className="text-2xl font-black text-neon-blue bg-transparent border-none p-0 focus:ring-0" />
            <div className="w-full h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
                <div style={{ width: `${Math.min(100, (data.dreamsTotalBudget / (totalDreams || 1)) * 100)}%` }} className="h-full bg-neon-blue shadow-neon-blue transition-all duration-1000"></div>
            </div>
          </div>
        </Card>
      </div>

      <div className="max-w-3xl mx-auto space-y-8">
        <AddForm onAdd={handleAdd}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Qual o seu sonho?" placeholder="EX: VIAGEM PARA JAPÃO, NOVO CARRO..." value={name} onChange={e => setName(e.target.value)} />
            <CurrencyInput label="Valor Estimado" value={val} onValueChange={setVal} />
          </div>
        </AddForm>

        <div className="grid grid-cols-1 gap-4">
          {(data.dreams || []).map(dream => (
            <div key={dream.id} className="p-5 bg-neon-surface/60 border border-white/5 rounded-3xl flex justify-between items-center group hover:border-neon-pink/30 transition-all">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${dream.isActive ? 'bg-neon-pink/10 text-neon-pink' : 'bg-slate-900 text-slate-700'}`}><Trophy size={20} /></div>
                <div>
                    <p className={`font-black text-lg uppercase tracking-tight ${dream.isActive ? 'text-white' : 'text-slate-700 line-through'}`}>{dream.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                        <Badge color={dream.isActive ? 'pink' : 'white'}>{dream.isActive ? 'Em foco' : 'Pausado'}</Badge>
                        <span className="text-[10px] font-black text-slate-600 uppercase">{((dream.value / (totalDreams || 1)) * 100).toFixed(0)}% do total</span>
                    </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <p className={`font-mono font-black text-xl ${dream.isActive ? 'text-white' : 'text-slate-800'}`}>R$ {fmt(dream.value)}</p>
                <div className="flex items-center gap-2">
                    <ToggleStatusButton active={dream.isActive} onClick={() => onUpdate((prev: FinancialData) => ({ ...prev, dreams: prev.dreams.map(d => d.id === dream.id ? { ...d, isActive: !d.isActive } : d) }), true)} color="pink" />
                    <ActionButton icon={<Trash2 size={16} />} color="text-slate-800 hover:text-neon-red" onClick={() => onUpdate((prev: FinancialData) => ({ ...prev, dreams: prev.dreams.filter(d => d.id !== dream.id) }), true)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
