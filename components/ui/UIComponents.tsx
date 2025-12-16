import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, GripVertical, Pencil, Check, X } from 'lucide-react';

export const Card = ({ children, className = "", onClick }: { children?: React.ReactNode, className?: string, onClick?: () => void }) => (
  <div onClick={onClick} className={`bg-neon-surface/60 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-glass hover:border-white/20 transition-all duration-300 ${className}`}>
    {children}
  </div>
);

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

  useEffect(() => {
    setEditValue(title);
  }, [title]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSaveTitle = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (editValue.trim()) {
      onEditTitle?.(editValue.trim());
      setIsEditing(false);
    } else {
      setEditValue(title); // Revert if empty
      setIsEditing(false);
    }
  };

  const colors = {
    blue: "border-neon-blue/30 shadow-neon-blue/5 hover:border-neon-blue/60",
    green: "border-neon-green/30 shadow-neon-green/5 hover:border-neon-green/60",
    red: "border-neon-red/30 shadow-neon-red/5 hover:border-neon-red/60",
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
    <div className={`bg-neon-surface/80 backdrop-blur-xl border rounded-xl transition-all duration-300 ${colors[color]} ${isOpen ? 'shadow-md' : 'shadow-sm'}`}>
      <div 
        className="p-3 flex justify-between items-center cursor-pointer hover:bg-white/5 transition-colors"
        onClick={(e) => {
            // Only toggle if not editing and not clicking input
            if (!isEditing && !(e.target as HTMLElement).closest('button') && !(e.target as HTMLElement).closest('input')) {
                setIsOpen(!isOpen);
            }
        }}
      >
        <div className="flex items-center gap-2 flex-1 mr-4">
          {icon && <div className={`${textColors[color]}`}>{icon}</div>}
          
          {isEditing ? (
            <div className="flex items-center gap-1 flex-1" onClick={e => e.stopPropagation()}>
                <input 
                    ref={inputRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                        if(e.key === 'Enter') handleSaveTitle();
                        if(e.key === 'Escape') {
                            setEditValue(title);
                            setIsEditing(false);
                        }
                    }}
                    onBlur={() => handleSaveTitle()}
                    className="bg-black/50 border border-white/20 rounded px-2 py-0.5 text-sm font-bold text-white focus:outline-none focus:border-neon-blue w-full max-w-[200px] h-7 uppercase"
                />
            </div>
          ) : (
            <div className="flex items-center gap-2 group">
                <h3 className="text-sm font-bold text-white tracking-wide uppercase drop-shadow-sm truncate max-w-[150px] sm:max-w-[300px]">{title}</h3>
                {onEditTitle && (
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsEditing(true);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-white p-1"
                    >
                        <Pencil size={12} />
                    </button>
                )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {totalValue && (
            <span className={`font-mono font-bold text-sm ${textColors[color]} drop-shadow-[0_0_3px_currentColor]`}>
              {totalValue}
            </span>
          )}
          <div className="text-slate-500">
            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
      </div>
      
      {/* Used inline style for max-height to ensure it overrides any CSS limits and allows massive lists */}
      <div 
        className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        style={{ maxHeight: isOpen ? '20000px' : '0px' }}
      >
        <div className="p-3 pt-0 border-t border-white/5 text-sm">
          {children}
        </div>
      </div>
    </div>
  );
};

export const Button = ({ onClick, children, variant = 'primary', className = "", disabled = false }: { onClick?: () => void, children?: React.ReactNode, variant?: 'primary' | 'secondary' | 'danger' | 'ghost', className?: string, disabled?: boolean }) => {
  const base = "px-4 py-2 rounded-lg font-bold tracking-wide transition-all duration-300 transform active:scale-95 text-xs sm:text-sm flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-neon-blue/10 text-neon-blue border border-neon-blue hover:bg-neon-blue hover:text-black hover:shadow-neon-blue",
    secondary: "bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/30",
    danger: "bg-neon-red/10 text-neon-red border border-neon-red/50 hover:bg-neon-red hover:text-white hover:shadow-neon-pink",
    ghost: "text-slate-400 hover:text-white hover:bg-white/5"
  };
  
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${base} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed shadow-none' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

export const Input = ({ label, onChange, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) => (
  <div className="flex flex-col gap-1 w-full group">
    {label && <label className="text-[10px] text-slate-400 font-bold ml-1 group-focus-within:text-neon-blue transition-colors uppercase tracking-wider">{label}</label>}
    <input 
      className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white font-medium text-sm
                 focus:outline-none focus:border-neon-blue focus:shadow-[0_0_8px_rgba(0,243,255,0.15)] 
                 transition-all placeholder:text-slate-600 placeholder:text-xs w-full h-9 uppercase"
      onChange={(e) => {
          e.target.value = e.target.value.toUpperCase();
          onChange?.(e);
      }}
      {...props}
    />
  </div>
);

export const Select = ({ label, options, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string, options: {value: string, label: string}[] }) => (
  <div className="flex flex-col gap-1 w-full group">
    {label && <label className="text-[10px] text-slate-400 font-bold ml-1 group-focus-within:text-neon-blue transition-colors uppercase tracking-wider">{label}</label>}
    <select 
      className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white font-medium text-sm
                 focus:outline-none focus:border-neon-blue focus:shadow-[0_0_8px_rgba(0,243,255,0.15)] 
                 transition-all appearance-none w-full h-9"
      {...props}
    >
      {options.map(opt => <option key={opt.value} value={opt.value} className="bg-neon-surface text-slate-200 font-medium">{opt.label}</option>)}
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
    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border font-bold ${colors[color] || colors.blue}`}>
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
  const expensePercent = total > 0 ? (expense / total) * 100 : 0;
  
  const incomeOffset = circumference - (incomePercent / 100) * circumference;
  const expenseOffset = circumference - (expensePercent / 100) * circumference;

  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg
        height="100%"
        width="100%"
        viewBox="0 0 80 80" // adjusted viewbox
        className="transform -rotate-90"
      >
        <circle
          stroke="#1e1e2e"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx="40"
          cy="40"
        />
        {/* Expense Circle (Red) - Base */}
        <circle
          stroke="#ff0055"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset: 0 }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx="40"
          cy="40"
          className="drop-shadow-[0_0_3px_rgba(255,0,85,0.5)]"
        />
        {/* Income Circle (Green) - Overlay */}
        <circle
          stroke="#0aff68"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset: incomeOffset }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx="40"
          cy="40"
          className="drop-shadow-[0_0_3px_rgba(10,255,104,0.5)] transition-all duration-1000 ease-out"
        />
      </svg>
    </div>
  );
};

export const DraggableModuleWrapper = ({ children, id, index, onMove }: { children?: React.ReactNode, id: string, index: number, onMove: (dragIndex: number, hoverIndex: number) => void }) => {
  const handleDragStart = (e: React.DragEvent) => {
    // IMPORTANT: Tag this as a MODULE drag to avoid conflict with ROW drags
    e.dataTransfer.setData('type', 'MODULE');
    e.dataTransfer.setData('moduleIndex', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Allow dropping
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Stop bubbling
    
    const type = e.dataTransfer.getData('type');
    if (type !== 'MODULE') return; // Ignore if it's a row being dropped

    const fromIndex = parseInt(e.dataTransfer.getData('moduleIndex'));
    if (!isNaN(fromIndex) && fromIndex !== index) {
      onMove(fromIndex, index);
    }
  };

  return (
    <div 
      draggable 
      onDragStart={handleDragStart} 
      onDragOver={handleDragOver} 
      onDrop={handleDrop}
      className="relative group transition-transform duration-200 ease-in-out"
    >
      <div className="absolute -left-4 top-4 opacity-0 group-hover:opacity-30 cursor-grab active:cursor-grabbing text-slate-500 hover:text-white transition-opacity z-10">
        <GripVertical size={16} />
      </div>
      {children}
    </div>
  );
};