
import React, { useState } from 'react';
import { FinancialData, CustomSection, SectionItem, RadarItem, DreamItem, PixKey, CreditCard } from '../types';
import { CollapsibleCard, Button, Input, CurrencyInput, Select, Badge, Card, Modal } from './ui/UIComponents';
import { Trash2, Plus, Wallet, GripVertical, Target, Pencil, Check, X, CreditCard as CCIcon, Zap, Power, Star, ArrowLeft, Trophy, CalendarCheck, CheckCircle2, AlertTriangle } from 'lucide-react';

const AddForm = ({ children, onAdd }: { children?: React.ReactNode, onAdd: () => void }) => (
  <div className="mb-4 pt-4 border-t border-white/5" onKeyDown={e => e.key === 'Enter' && onAdd()}>
    {children}
    <Button onClick={onAdd} variant="primary" className="w-full mt-4 h-12 shadow-lg">
      <Plus size={18} /> Adicionar Novo Registro
    </Button>
  </div>
);

const fmt = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
      ...(isInstallment ? { installmentsCount: parseInt(count) || 1, currentInstallment: 1, startMonth: start } : {})
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
        items: section.items.map(i => i.id === item.id ? { ...i, currentInstallment: (i.currentInstallment || 1) + 1 } : i) 
      }, true);
    }
    setPayInstallmentModal({ isOpen: false });
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
           <Button onClick={() => setIsDeleteModalOpen(true)} variant="ghost" className="text-slate-600 hover:text-neon-red px-2 h-7"><Trash2 size={12} /> Excluir Sessão</Button>
        </div>
        
        <AddForm onAdd={handleAdd}>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className={`${isInstallment ? 'sm:col-span-4' : 'sm:col-span-7'}`}><Input label="Descrição" placeholder="EX: SALÁRIO, ALUGUEL..." value={name} onChange={e => setName(e.target.value)} /></div>
            <div className={`${isInstallment ? 'sm:col-span-3' : 'sm:col-span-5'}`}><CurrencyInput label={isInstallment ? "Vlr Mensal" : "Valor"} value={val} onValueChange={setVal} /></div>
            {isInstallment && (
              <>
                <div className="sm:col-span-2"><Input label="Parcelas" type="number" value={count} onChange={e => setCount(e.target.value)} placeholder="12" /></div>
                <div className="sm:col-span-3"><Input label="Início" type="month" value={start} onChange={e => setStart(e.target.value)} /></div>
              </>
            )}
          </div>
        </AddForm>

        <div className="flex flex-col gap-2 mt-4">
          {section.items.map((item, idx) => (
            <DraggableRow key={item.id} index={idx} listId={section.id} onMove={(f, t) => { const n = [...section.items]; const [m] = n.splice(f,1); n.splice(t,0,m); onUpdate({...section, items: n}, true); }}>
              <div className="flex-1 flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-2xl transition-all">
                {editingId === item.id ? (
                  <EditRowLayout onSave={handleSaveEdit} onCancel={() => setEditingId(null)}>
                    <div className={`${isInstallment ? 'sm:col-span-4' : 'sm:col-span-6'}`}><Input label="NOME" value={editData.name || ''} onChange={e => setEditData({...editData, name: e.target.value})} /></div>
                    <div className="sm:col-span-3"><CurrencyInput label="VALOR" value={editData.value || 0} onValueChange={v => setEditData({...editData, value: v})} /></div>
                    <div className="sm:col-span-3"><CurrencyInput label="PAGO" value={editData.paidAmount || 0} onValueChange={v => setEditData({...editData, paidAmount: v})} /></div>
                    {isInstallment && <div className="sm:col-span-2"><Input label="PARC" type="number" value={String(editData.installmentsCount || '')} onChange={e => setEditData({...editData, installmentsCount: parseInt(e.target.value)})} /></div>}
                  </EditRowLayout>
                ) : (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className={`font-black text-xs sm:text-sm tracking-tight truncate ${item.isActive !== false ? 'text-white' : 'text-slate-700 line-through'}`}>{item.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {isInstallment && (
                          <div className="flex items-center gap-2">
                             <Badge color="yellow">{item.currentInstallment || 1} / {item.installmentsCount}X</Badge>
                             <button 
                                onClick={() => setPayInstallmentModal({ isOpen: true, item })}
                                className="bg-neon-green/10 text-neon-green p-1 rounded-full border border-neon-green/30 hover:bg-neon-green hover:text-black transition-all"
                                title="Quitar este mês"
                             >
                               <CheckCircle2 size={12} />
                             </button>
                          </div>
                        )}
                        {item.paidAmount && item.paidAmount > 0 ? <Badge color="green">Pago: R$ {fmt(item.paidAmount)}</Badge> : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-2">
                      <span className={`font-mono font-black text-xs sm:text-sm ${item.isActive !== false ? (section.type === 'income' ? 'text-neon-green' : 'text-neon-red') : 'text-slate-800'}`}>R$ {fmt(item.value - (item.paidAmount || 0))}</span>
                      <ToggleStatusButton active={item.isActive !== false} onClick={() => onUpdate({...section, items: section.items.map(i => i.id === item.id ? {...i, isActive: !i.isActive} : i)}, true)} color={color} />
                      <ActionButton icon={<Pencil size={14} />} onClick={() => { setEditingId(item.id); setEditData(item); }} />
                      <ActionButton icon={<Trash2 size={14} />} color="text-slate-700 hover:text-neon-red" onClick={() => onUpdate({...section, items: section.items.filter(i => i.id !== item.id)}, true)} />
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
        title="Quitar Parcela Mensal"
        confirmText={(payInstallmentModal.item?.currentInstallment || 1) >= (payInstallmentModal.item?.installmentsCount || 1) ? "Quitar e Remover" : "Confirmar Pagamento"}
        onConfirm={() => payInstallmentModal.item && handlePayInstallment(payInstallmentModal.item)}
      >
        <div className="space-y-4">
          <p>Deseja confirmar o pagamento da parcela <strong className="text-white">{payInstallmentModal.item?.currentInstallment}/{payInstallmentModal.item?.installmentsCount}</strong> de <strong className="text-white">{payInstallmentModal.item?.name}</strong>?</p>
          {(payInstallmentModal.item?.currentInstallment || 1) >= (payInstallmentModal.item?.installmentsCount || 1) ? (
            <div className="p-3 bg-neon-yellow/10 border border-neon-yellow/30 rounded-xl flex items-start gap-3">
              <AlertTriangle className="text-neon-yellow shrink-0" size={18} />
              <p className="text-xs text-neon-yellow font-bold uppercase tracking-tight">Esta é a última parcela. Após confirmar, este registro será removido automaticamente da lista.</p>
            </div>
          ) : (
            <p className="text-xs text-slate-500 uppercase font-black tracking-widest">A parcela será avançada automaticamente para o próximo mês.</p>
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
        Você tem certeza que deseja excluir a sessão <strong className="text-white">"{section.title}"</strong>? <br/><br/>
        Isso apagará permanentemente todos os registros vinculados a ela. Esta ação não pode ser desfeita.
      </Modal>
    </>
  );
};

export const CreditCardModule: React.FC<{ data: FinancialData, onUpdate: (updater: (prev: FinancialData) => FinancialData, immediate?: boolean) => void }> = ({ data, onUpdate }) => {
  const [name, setName] = useState('');
  const [limit, setLimit] = useState(0);
  const [closing, setClosing] = useState('');
  const [due, setDue] = useState('');
  const [invoice, setInvoice] = useState(0);

  const handleAdd = () => {
    if (!name || limit === 0) return;
    const newCard: CreditCard = { id: Math.random().toString(36).substr(2, 9), name: name.toUpperCase(), limit, closingDay: parseInt(closing) || 1, dueDay: parseInt(due) || 1, currentInvoiceValue: invoice };
    onUpdate(prev => ({ ...prev, creditCards: [...(prev.creditCards || []), newCard] }), true);
    setName(''); setLimit(0); setClosing(''); setDue(''); setInvoice(0);
  };

  return (
    <CollapsibleCard title="Cartões de Crédito" icon={<CCIcon size={18}/>} color="blue">
      <AddForm onAdd={handleAdd}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2"><Input label="Nome do Cartão" value={name} onChange={e => setName(e.target.value)} /></div>
          <CurrencyInput label="Limite Total" value={limit} onValueChange={setLimit} />
          <CurrencyInput label="Fatura Atual" value={invoice} onValueChange={setInvoice} />
          <Input label="Fechamento (Dia)" type="number" value={closing} onChange={e => setClosing(e.target.value)} />
          <Input label="Vencimento (Dia)" type="number" value={due} onChange={e => setDue(e.target.value)} />
        </div>
      </AddForm>
      <div className="space-y-2 mt-4">
        {data.creditCards?.map(card => (
          <div key={card.id} className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl flex justify-between items-center">
            <div>
              <p className="font-black text-xs uppercase text-white">{card.name}</p>
              <div className="flex gap-2 mt-1">
                <Badge color="blue">Limite: R$ {fmt(card.limit)}</Badge>
                <Badge color="red">Fatura: R$ {fmt(card.currentInvoiceValue)}</Badge>
              </div>
            </div>
            <ActionButton icon={<Trash2 size={14} />} color="text-slate-700 hover:text-neon-red" onClick={() => onUpdate(prev => ({ ...prev, creditCards: prev.creditCards.filter(c => c.id !== card.id) }), true)} />
          </div>
        ))}
      </div>
    </CollapsibleCard>
  );
};

export const PixModule: React.FC<{ data: FinancialData, onUpdate: (updater: (prev: FinancialData) => FinancialData, immediate?: boolean) => void }> = ({ data, onUpdate }) => {
  const [type, setType] = useState<PixKey['type']>('Aleatória');
  const [key, setKey] = useState('');
  const [ben, setBen] = useState('');

  const handleAdd = () => {
    if (!key) return;
    const newKey: PixKey = { id: Math.random().toString(36).substr(2, 9), type, key, beneficiary: ben, active: true };
    onUpdate(prev => ({ ...prev, pixKeys: [...(prev.pixKeys || []), newKey] }), true);
    setKey(''); setBen('');
  };

  return (
    <CollapsibleCard title="Chaves Pix" icon={<Zap size={18}/>} color="yellow">
      <AddForm onAdd={handleAdd}>
        <div className="grid grid-cols-1 gap-3">
          <Select label="Tipo" value={type} onChange={e => setType(e.target.value as any)} options={[
            {value: 'CPF', label: 'CPF'}, {value: 'CNPJ', label: 'CNPJ'}, {value: 'Telefone', label: 'Telefone'}, {value: 'Email', label: 'E-mail'}, {value: 'Aleatória', label: 'Aleatória'}
          ]} />
          <Input 
            label="Chave" 
            value={key} 
            onChange={e => setKey(e.target.value)} 
            noUppercase={type === 'Aleatória' || type === 'Email'} 
          />
          <Input label="Beneficiário" value={ben} onChange={e => setBen(e.target.value)} />
        </div>
      </AddForm>
      <div className="space-y-2 mt-4">
        {data.pixKeys?.map(pk => (
          <div key={pk.id} className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2">
                <Badge color="yellow">{pk.type}</Badge>
                <p className={`font-mono text-[10px] text-white truncate max-w-[150px] ${(pk.type !== 'Aleatória' && pk.type !== 'Email') ? 'uppercase' : ''}`}>{pk.key}</p>
              </div>
              {pk.beneficiary && <p className="text-[9px] text-slate-500 font-bold mt-1 uppercase truncate">{pk.beneficiary}</p>}
            </div>
            <ActionButton icon={<Trash2 size={14} />} color="text-slate-700 hover:text-neon-red" onClick={() => onUpdate(prev => ({ ...prev, pixKeys: prev.pixKeys.filter(k => k.id !== pk.id) }), true)} />
          </div>
        ))}
      </div>
    </CollapsibleCard>
  );
};

export const RadarModule: React.FC<{ data: FinancialData, onUpdate: (updater: (prev: FinancialData) => FinancialData, immediate?: boolean) => void }> = ({ data, onUpdate }) => {
  const [name, setName] = useState('');
  const [val, setVal] = useState(0);

  const handleAdd = () => {
    if (!name || val === 0) return;
    const newItem: RadarItem = { id: Math.random().toString(36).substr(2, 9), name: name.toUpperCase(), value: val };
    onUpdate(prev => ({ ...prev, radarItems: [...(prev.radarItems || []), newItem] }), true);
    setName(''); setVal(0);
  };

  return (
    <CollapsibleCard title="Radar de Gastos" icon={<Target size={18}/>} color="pink">
      <AddForm onAdd={handleAdd}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Item" value={name} onChange={e => setName(e.target.value)} />
          <CurrencyInput label="Valor Estimado" value={val} onValueChange={setVal} />
        </div>
      </AddForm>
      <div className="space-y-2 mt-4">
        {data.radarItems?.map(item => (
          <div key={item.id} className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl flex justify-between items-center">
            <p className="font-black text-xs uppercase text-white">{item.name}</p>
            <div className="flex items-center gap-3">
              <span className="font-mono font-black text-xs text-neon-pink">R$ {fmt(item.value)}</span>
              <ActionButton icon={<Trash2 size={14} />} color="text-slate-700 hover:text-neon-red" onClick={() => onUpdate(prev => ({ ...prev, radarItems: prev.radarItems.filter(i => i.id !== item.id) }), true)} />
            </div>
          </div>
        ))}
      </div>
    </CollapsibleCard>
  );
};

export const DreamsModule: React.FC<{ data: FinancialData, onUpdate: (updater: (prev: FinancialData) => FinancialData, immediate?: boolean) => void, onBack: () => void }> = ({ data, onUpdate, onBack }) => {
  const [name, setName] = useState('');
  const [val, setVal] = useState(0);
  const totalDreamsValue = data.dreams?.filter(d => d.isActive).reduce((acc, curr) => acc + curr.value, 0) || 0;

  const handleAdd = () => {
    if (!name || val === 0) return;
    const newItem: DreamItem = { id: Math.random().toString(36).substr(2, 9), name: name.toUpperCase(), value: val, isActive: true };
    onUpdate(prev => ({ ...prev, dreams: [...(prev.dreams || []), newItem] }), true);
    setName(''); setVal(0);
  };

  return (
    <div className="animate-in slide-in-from-right duration-500">
      <div className="flex items-center gap-4 mb-8">
        <Button onClick={onBack} variant="secondary" className="w-12 h-12 p-0 rounded-2xl"><ArrowLeft size={20} /></Button>
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Meus <span className="text-neon-pink">Dreams</span></h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Planejamento e Conquistas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <Card className="border-neon-pink/30 bg-neon-pink/5">
          <p className="text-[10px] font-black text-neon-pink uppercase tracking-widest mb-1">Orçamento Reservado</p>
          <CurrencyInput value={data.dreamsTotalBudget} onValueChange={v => onUpdate(prev => ({...prev, dreamsTotalBudget: v}))} />
        </Card>
        <Card className="border-neon-blue/30 bg-neon-blue/5 flex flex-col justify-center">
          <p className="text-[10px] font-black text-neon-blue uppercase tracking-widest mb-1">Total Necessário</p>
          <p className="text-2xl font-black text-white">R$ {fmt(totalDreamsValue)}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card className="p-6">
            <h4 className="text-xs font-black uppercase mb-4 text-white flex items-center gap-2"><Trophy size={14} className="text-neon-yellow"/> Adicionar Meta</h4>
            <div className="space-y-4" onKeyDown={e => e.key === 'Enter' && handleAdd()}>
              <Input label="Qual o seu sonho?" value={name} onChange={e => setName(e.target.value)} />
              <CurrencyInput label="Quanto custa?" value={val} onValueChange={setVal} />
              <Button onClick={handleAdd} className="w-full h-12 bg-neon-pink/20 text-neon-pink border-neon-pink/50 hover:bg-neon-pink hover:text-white">Adicionar aos Dreams</Button>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-3">
          {data.dreams?.map(dream => (
            <div key={dream.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-3xl flex justify-between items-center group">
              <div className="flex items-center gap-4">
                <button onClick={() => onUpdate(prev => ({...prev, dreams: prev.dreams.map(d => d.id === dream.id ? {...d, isActive: !d.isActive} : d)}), true)} 
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${dream.isActive ? 'border-neon-green bg-neon-green/10 text-neon-green shadow-neon-green/20' : 'border-white/10 text-slate-700'}`}>
                  <Star size={18} fill={dream.isActive ? "currentColor" : "none"} />
                </button>
                <div>
                  <p className={`font-black uppercase tracking-tight text-sm ${dream.isActive ? 'text-white' : 'text-slate-700 line-through'}`}>{dream.name}</p>
                  <p className="text-xs font-mono font-bold text-neon-pink">R$ {fmt(dream.value)}</p>
                </div>
              </div>
              <ActionButton icon={<Trash2 size={16} />} color="text-slate-800 group-hover:text-neon-red" onClick={() => onUpdate(prev => ({...prev, dreams: prev.dreams.filter(d => d.id !== dream.id)}), true)} />
            </div>
          ))}
          {(!data.dreams || data.dreams.length === 0) && (
            <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem] opacity-20 font-black uppercase tracking-widest">Nenhum sonho listado ainda</div>
          )}
        </div>
      </div>
    </div>
  );
};
