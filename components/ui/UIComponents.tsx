import React from 'react';

export const Card = ({ children, className = "" }: { children?: React.ReactNode, className?: string }) => (
  <div className={`bg-neon-surface/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-glass hover:border-white/20 transition-all duration-300 ${className}`}>
    {children}
  </div>
);

export const Button = ({ onClick, children, variant = 'primary', className = "", disabled = false }: { onClick?: () => void, children?: React.ReactNode, variant?: 'primary' | 'secondary' | 'danger' | 'ghost', className?: string, disabled?: boolean }) => {
  const base = "px-4 py-2.5 rounded-xl font-bold tracking-wide transition-all duration-300 transform active:scale-95 text-sm flex items-center justify-center gap-2";
  
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

export const Input = ({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) => (
  <div className="flex flex-col gap-1.5 w-full group">
    {label && <label className="text-xs text-slate-300 font-bold ml-1 group-focus-within:text-neon-blue transition-colors uppercase tracking-wider">{label}</label>}
    <input 
      className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-semibold
                 focus:outline-none focus:border-neon-blue focus:shadow-[0_0_10px_rgba(0,243,255,0.2)] 
                 transition-all text-sm placeholder:text-slate-500 w-full"
      {...props}
    />
  </div>
);

export const Select = ({ label, options, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string, options: {value: string, label: string}[] }) => (
  <div className="flex flex-col gap-1.5 w-full group">
    {label && <label className="text-xs text-slate-300 font-bold ml-1 group-focus-within:text-neon-blue transition-colors uppercase tracking-wider">{label}</label>}
    <select 
      className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-semibold
                 focus:outline-none focus:border-neon-blue focus:shadow-[0_0_10px_rgba(0,243,255,0.2)] 
                 transition-all text-sm appearance-none w-full"
      {...props}
    >
      {options.map(opt => <option key={opt.value} value={opt.value} className="bg-neon-surface text-slate-200 font-medium">{opt.label}</option>)}
    </select>
  </div>
);

export const Badge = ({ children, color = 'blue' }: { children?: React.ReactNode, color?: 'blue' | 'green' | 'red' | 'yellow' | 'pink' }) => {
  const colors = {
    blue: "bg-neon-blue/10 text-neon-blue border-neon-blue/30 shadow-[0_0_5px_rgba(0,243,255,0.1)]",
    green: "bg-neon-green/10 text-neon-green border-neon-green/30 shadow-[0_0_5px_rgba(10,255,104,0.1)]",
    red: "bg-neon-red/10 text-neon-red border-neon-red/30 shadow-[0_0_5px_rgba(255,0,85,0.1)]",
    yellow: "bg-neon-yellow/10 text-neon-yellow border-neon-yellow/30 shadow-[0_0_5px_rgba(255,230,0,0.1)]",
    pink: "bg-neon-pink/10 text-neon-pink border-neon-pink/30 shadow-[0_0_5px_rgba(188,19,254,0.1)]",
  };
  return (
    <span className={`text-xs uppercase tracking-wider px-2.5 py-1 rounded-md border font-extrabold ${colors[color] || colors.blue}`}>
      {children}
    </span>
  );
};