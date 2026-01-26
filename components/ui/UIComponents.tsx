
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, GripVertical, Pencil, Check, X, AlertTriangle } from 'lucide-react';

export const Card = ({ children, className = "", onClick }: { children?: React.ReactNode, className?: string, onClick?: () => void }) => (
  <div onClick={onClick} className={`bg-neon-surface/60 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-glass hover:border-white/20 transition-all duration-300 ${className}`}>
    {children}
  </div>
);

export const Modal = ({ isOpen, onClose, title, children, confirmText = "Confirmar", confirmVariant = "primary", onConfirm }: { isOpen: boolean, onClose: () => void, title: string, children?: React.ReactNode, confirmText?: string, confirmVariant?: any, onConfirm: () => void }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Enter') {
        onConfirm();
        onClose();
      }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onConfirm, onClose]);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-neon-dark border border-white/10 w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-300">
        <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-4 flex items-center gap-2">
          {confirmVariant === 'danger' && <AlertTriangle className="text-neon-red" size={24} />}
          {title}
        </h3>
        <div className="mb-8 text-slate-400 font-medium leading-relaxed">
          {children}
        </div>
        <div className="flex gap-3">
          <Button onClick={onClose} variant="secondary" className="flex-1 py-4">Cancelar</Button>
          <Button onClick={() => { onConfirm(); onClose(); }} variant={confirmVariant} className="flex-1 py-4">{confirmText}</Button>
        </div>
      </div>
    </div>
  );
};

export const CollapsibleCard = ({ 
  title, 
  totalValue, 
  color = 'blue', 
  children, 
  defaultOpen = false,
  icon,
  onEditTitle
}: { 
  title: string, 
  totalValue?: string, 
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'pink' | 'white', 
  children?: React.ReactNode, 
  defaultOpen?: boolean,
  icon?: React.ReactNode,
  onEditTitle?: (newTitle: string) => void
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setEditValue(title); }, [title]);
  useEffect(() => { if (isEditing && inputRef.current) inputRef.current.focus(); }, [isEditing]);

  const handleSaveTitle = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (editValue.trim()) {
      onEditTitle?.(editValue.trim());
      setIsEditing(false);
    } else {
      setEditValue(title);
      setIsEditing(false);
    }
  };

  const colors = {
    blue: "border-neon-blue/30 shadow-neon-blue/5 hover:border-neon-blue/60",
    green: "border-neon-green/40 shadow-neon-green/5 hover:border-neon-green/70",
    red: "border-neon-red/40 shadow-neon-red/5 hover:border-neon-red/70",
    yellow: "border-neon-yellow/30 shadow-neon-yellow/5 hover:border-neon-yellow/60",
    pink: "border-neon-pink/30 shadow-neon-pink/5 hover:border-neon-pink/60",
    white: "border-white/30 shadow-[0_0_10px_rgba(255,255,255,0.05)] hover:border-white/60",
  };

  const textColors = {
    blue: "text-neon-blue",
    green: "text-neon-green",
    red: "text-neon-red",
    yellow: "text-neon-yellow",
    pink: "text-neon-pink",
    white: "text-white",
  };

  return (
    <div className={`bg-neon-surface/80 backdrop-blur-xl border rounded-2xl transition-all duration-300 ${colors[color]} ${isOpen ? 'shadow-lg' : 'shadow-sm'}`}>
      <div 
        className="p-4 flex justify-between items-center cursor-pointer hover:bg-white/5 transition-colors gap-2"
        onClick={(e) => {
            if (!isEditing && !(e.target as HTMLElement).closest('button') && !(e.target as HTMLElement).closest('input')) {
                setIsOpen(!isOpen);
            }
        }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {icon && <div className={`${textColors[color]} shrink-0`}>{icon}</div>}
          
          {isEditing ? (
            <div className="flex items-center gap-1 flex-1" onClick={e => e.stopPropagation()}>
                <input 
                    ref={inputRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                        if(e.key === 'Enter') handleSaveTitle();
                        if(e.key === 'Escape') { setEditValue(title); setIsEditing(false); }
                    }}
                    onBlur={() => handleSaveTitle()}
                    className="bg-black/50 border border-white/20 rounded px-3 py-1 text-sm font-black text-white focus:outline-none focus:border-neon-blue w-full uppercase"
                />
            </div>
          ) : (
            <div className="flex items-center gap-2 group min-w-0">
                <h3 className="text-sm sm:text-base font-black text-white tracking-tighter uppercase drop-shadow-sm truncate">{title}</h3>
                {onEditTitle && (
                    <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-white p-1">
                        <Pencil size={12} />
                    </button>
                )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {totalValue && (
            <span className={`font-mono font-black text-sm sm:text-base ${textColors[color]} drop-shadow-[0_0_8px_currentColor] whitespace-nowrap`}>
              {totalValue}
            </span>
          )}
          <div className="text-slate-500 shrink-0">
            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
      </div>
      
      <div 
        className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        style={{ maxHeight: isOpen ? '20000px' : '0px' }}
      >
        <div className="p-4 pt-0 border-t border-white/5 text-sm">
          {children}
        </div>
      </div>
    </div>
  );
};

export const Button = ({ onClick, children, variant = 'primary', className = "", disabled = false }: { onClick?: () => void, children?: React.ReactNode, variant?: 'primary' | 'secondary' | 'danger' | 'ghost', className?: string, disabled?: boolean }) => {
  const base = "px-4 py-2 rounded-xl font-black tracking-widest transition-all duration-300 transform active:scale-95 text-[10px] sm:text-xs flex items-center justify-center gap-2 uppercase";
  
  const variants = {
    primary: "bg-neon-blue/10 text-neon-blue border border-neon-blue/50 hover:bg-neon-blue hover:text-black hover:shadow-neon-blue",
    secondary: "bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:border-white/30 hover:text-white",
    danger: "bg-neon-red/10 text-neon-red border border-neon-red/50 hover:bg-neon-red hover:text-white hover:shadow-neon-red",
    ghost: "text-slate-500 hover:text-white hover:bg-white/5 border border-transparent"
  };
  
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed shadow-none' : ''} ${className}`}>
      {children}
    </button>
  );
};

export const Input = ({ label, onChange, noUppercase = false, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string, noUppercase?: boolean }) => (
  <div className="flex flex-col gap-1.5 w-full group">
    {label && <label className="text-[10px] text-slate-500 font-black ml-1 group-focus-within:text-neon-blue transition-colors uppercase tracking-[0.2em]">{label}</label>}
    <input 
      className={`bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-sm
                 focus:outline-none focus:border-neon-blue focus:shadow-[0_0_12px_rgba(0,243,255,0.15)] 
                 transition-all placeholder:text-slate-800 placeholder:text-[10px] w-full h-12 ${!noUppercase ? 'uppercase' : ''}`}
      onChange={(e) => {
          if (!noUppercase && props.type !== 'number' && props.type !== 'month') {
            e.target.value = e.target.value.toUpperCase();
          }
          onChange?.(e);
      }}
      {...props}
    />
  </div>
);

export const CurrencyInput = ({ 
  label, 
  value, 
  onValueChange, 
  ...props 
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & { 
  label?: string, 
  value: number, 
  onValueChange: (val: number) => void 
}) => {
  const [displayValue, setDisplayValue] = useState('');
  useEffect(() => {
    const formatted = (value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (parseBRL(displayValue) !== value) setDisplayValue(formatted);
  }, [value]);

  const parseBRL = (valStr: string): number => {
    if (!valStr) return 0;
    const cleanStr = valStr.replace(/\D/g, '');
    return Number(cleanStr) / 100;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '');
    if (raw === '') raw = '0';
    const numValue = Number(raw) / 100;
    setDisplayValue(numValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    onValueChange(numValue);
  };

  return (
    <div className="flex flex-col gap-1.5 w-full group">
      {label && <label className="text-[10px] text-slate-500 font-black ml-1 group-focus-within:text-neon-blue transition-colors uppercase tracking-[0.2em]">{label}</label>}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-600 uppercase pointer-events-none">R$</span>
        <input 
          {...props}
          type="text"
          value={displayValue}
          onChange={handleChange}
          className={`bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-3 text-white font-bold text-[13px]
                     focus:outline-none focus:border-neon-blue focus:shadow-[0_0_12px_rgba(0,243,255,0.15)] 
                     transition-all placeholder:text-slate-800 placeholder:text-[10px] w-full h-12 ${props.className || ''}`}
        />
      </div>
    </div>
  );
};

export const Select = ({ label, options, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string, options: {value: string, label: string}[] }) => (
  <div className="flex flex-col gap-1.5 w-full group">
    {label && <label className="text-[10px] text-slate-500 font-black ml-1 group-focus-within:text-neon-blue transition-colors uppercase tracking-[0.2em]">{label}</label>}
    <select 
      className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-sm
                 focus:outline-none focus:border-neon-blue focus:shadow-[0_0_12px_rgba(0,243,255,0.15)] 
                 transition-all appearance-none w-full h-12"
      {...props}
    >
      {options.map(opt => <option key={opt.value} value={opt.value} className="bg-neon-surface text-slate-200">{opt.label}</option>)}
    </select>
  </div>
);

export const Badge = ({ children, color = 'blue' }: { children?: React.ReactNode, color?: 'blue' | 'green' | 'red' | 'yellow' | 'pink' | 'white' }) => {
  const colors = {
    blue: "bg-neon-blue/10 text-neon-blue border-neon-blue/30 shadow-[0_0_5px_rgba(0,243,255,0.1)]",
    green: "bg-neon-green/10 text-neon-green border-neon-green/30 shadow-[0_0_5px_rgba(10,255,104,0.1)]",
    red: "bg-neon-red/10 text-neon-red border-neon-red/30 shadow-[0_0_5px_rgba(255,0,85,0.1)]",
    yellow: "bg-neon-yellow/10 text-neon-yellow border-neon-yellow/30 shadow-[0_0_5px_rgba(255,230,0,0.1)]",
    pink: "bg-neon-pink/10 text-neon-pink border-neon-pink/30 shadow-[0_0_5px_rgba(188,19,254,0.1)]",
    white: "bg-white/10 text-white border-white/30 shadow-[0_0_5px_rgba(255,255,255,0.3)]",
  };
  return (
    <span className={`text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-lg border font-black ${colors[color] || colors.blue}`}>
      {children}
    </span>
  );
};

export const DonutChart = ({ income, expense }: { income: number, expense: number }) => {
  const total = income + expense;
  const radius = 40;
  const stroke = 10;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const incomePercent = total > 0 ? (income / total) * 100 : 0;
  const incomeOffset = circumference - (incomePercent / 100) * circumference;
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg height="100%" width="100%" viewBox="0 0 80 80" className="transform -rotate-90">
        <circle stroke="#1e1e2e" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx="40" cy="40" />
        <circle stroke="#ff0055" fill="transparent" strokeWidth={stroke} strokeDasharray={`${circumference} ${circumference}`} style={{ strokeDashoffset: 0 }} strokeLinecap="round" r={normalizedRadius} cx="40" cy="40" className="drop-shadow-[0_0_3px_rgba(255,0,85,0.5)]" />
        <circle stroke="#0aff68" fill="transparent" strokeWidth={stroke} strokeDasharray={`${circumference} ${circumference}`} style={{ strokeDashoffset: incomeOffset }} strokeLinecap="round" r={normalizedRadius} cx="40" cy="40" className="drop-shadow-[0_0_3px_rgba(10,255,104,0.5)] transition-all duration-1000 ease-out" />
      </svg>
    </div>
  );
};

export const DraggableModuleWrapper: React.FC<{ children?: React.ReactNode; id: string; index: number; onMove: (dragIndex: number, hoverIndex: number) => void; }> = ({ children, id, index, onMove }) => {
  const handleDragStart = (e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'SELECT') { e.preventDefault(); return; }
    e.dataTransfer.setData('type', 'MODULE');
    e.dataTransfer.setData('moduleIndex', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  };
  return (
    <div draggable onDragStart={handleDragStart} onDragOver={e => e.preventDefault()} onDrop={e => {
        e.preventDefault(); e.stopPropagation();
        if (e.dataTransfer.getData('type') !== 'MODULE') return;
        const fromIndex = parseInt(e.dataTransfer.getData('moduleIndex'));
        if (!isNaN(fromIndex) && fromIndex !== index) onMove(fromIndex, index);
    }} className="relative group transition-transform duration-200">
      <div className="absolute -left-5 top-4 opacity-0 group-hover:opacity-40 cursor-grab active:cursor-grabbing text-slate-500 hover:text-white transition-opacity z-10"><GripVertical size={18} /></div>
      {children}
    </div>
  );
};
