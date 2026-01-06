
import React, { useState } from 'react';
import { FinancialData } from '../types';
import { Card, DonutChart } from './ui/UIComponents';
import { TrendingUp, TrendingDown, Coins, BarChart3, PieChart, Percent } from 'lucide-react';

interface DashboardProps {
  data: FinancialData;
}

export const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const [viewMode, setViewMode] = useState<0 | 1 | 2>(0);
  const fmt = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // 1. Entradas (Fixas + Custom)
  const baseIncome = data.incomes
    .filter(i => i.isActive !== false)
    .reduce((acc, curr) => acc + curr.value, 0);
    
  const customIncomeTotal = data.customSections
    ?.filter(s => s.type === 'income')
    .reduce((acc, s) => acc + s.items
      .filter(i => i.isActive !== false)
      .reduce((iAcc, item) => iAcc + item.value, 0), 0) || 0;
  
  const totalIncome = baseIncome + customIncomeTotal;

  // 2. Saídas (Fixas + Parcelamentos + Custom)
  const totalFixedExpenses = data.fixedExpenses
    .filter(e => e.isActive !== false)
    .reduce((acc, curr) => acc + (curr.value - (curr.paidAmount || 0)), 0);
  
  const totalInstallmentMonthly = data.installments
    .filter(e => e.isActive !== false)
    .reduce((acc, curr) => acc + (curr.monthlyValue - (curr.paidAmount || 0)), 0);

  const customExpenseTotal = data.customSections
    ?.filter(s => s.type === 'expense')
    .reduce((acc, s) => acc + s.items
      .filter(i => i.isActive !== false)
      .reduce((iAcc, item) => iAcc + (item.value - (item.paidAmount || 0)), 0), 0) || 0;

  const totalOutflow = totalFixedExpenses + totalInstallmentMonthly + customExpenseTotal;
  const balance = totalIncome - totalOutflow;

  const toggleView = () => setViewMode((prev) => (prev + 1) % 3 as any);

  return (
    <div className="mb-6">
      <div className="mb-6 transform hover:scale-[1.01] transition-transform duration-500">
        <Card className="border-2 border-neon-yellow/30 bg-gradient-to-b from-neon-yellow/10 to-transparent flex flex-col items-center justify-center py-6 px-6 shadow-[0_0_40px_rgba(255,230,0,0.1)] relative overflow-hidden h-40">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon-yellow/60 to-transparent"></div>
            <div className="flex items-center gap-2 mb-2 opacity-90 relative z-10">
                <div className="p-2 bg-neon-yellow/10 rounded-full text-neon-yellow shadow-[0_0_15px_rgba(255,230,0,0.3)]"><Coins size={20} /></div>
                <h3 className="text-neon-yellow text-sm uppercase tracking-[0.3em] font-extrabold drop-shadow-[0_0_10px_rgba(255,230,0,0.5)]">Saldo Previsto</h3>
            </div>
            <div className="text-center relative z-10 mt-1">
                <p className={`text-5xl sm:text-6xl font-black tracking-tight drop-shadow-lg ${balance >= 0 ? 'text-neon-yellow' : 'text-neon-red'}`}>
                <span className="text-2xl font-bold mr-2 opacity-60 align-top mt-2 inline-block">R$</span>
                {fmt(balance)}
                </p>
                <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest opacity-80">Saldo considerando apenas itens Ativos</p>
            </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
        <Card className="relative overflow-hidden group border-t-2 border-t-neon-green/50 flex flex-col justify-center p-5 hover:bg-white/5 transition-colors h-36">
          <div className="flex justify-between items-center mb-3 relative z-10">
              <h3 className="text-slate-300 text-xs uppercase tracking-[0.15em] font-bold">Entradas</h3>
              <div className="p-1.5 bg-neon-green/10 rounded-md text-neon-green"><TrendingUp size={18} /></div>
          </div>
          <p className="text-3xl sm:text-4xl font-black text-white tracking-tight relative z-10">
            <span className="text-sm text-slate-500 font-bold align-top mr-1">R$</span>
            {fmt(totalIncome)}
          </p>
        </Card>

        <div onClick={toggleView} className="group cursor-pointer h-36 relative">
          <Card className="flex flex-col items-center justify-center py-2 px-4 bg-black/40 border-neon-blue/30 hover:border-neon-blue/60 transition-all h-full relative overflow-hidden">
             <div className="w-full h-full flex flex-row items-center justify-between gap-4 relative z-10">
                 <div className="flex flex-col gap-2 absolute right-0 top-0 z-20">
                     <div className={`p-1.5 rounded-lg transition-all ${viewMode === 0 ? 'bg-neon-blue text-black' : 'text-slate-600 bg-white/5'}`}><PieChart size={12} /></div>
                     <div className={`p-1.5 rounded-lg transition-all ${viewMode === 1 ? 'bg-neon-blue text-black' : 'text-slate-600 bg-white/5'}`}><BarChart3 size={12} /></div>
                     <div className={`p-1.5 rounded-lg transition-all ${viewMode === 2 ? 'bg-neon-blue text-black' : 'text-slate-600 bg-white/5'}`}><Percent size={12} /></div>
                 </div>
                 {viewMode === 0 && (
                     <>
                      <div className="scale-90 origin-left pl-2"><DonutChart income={totalIncome} expense={totalOutflow} /></div>
                      <div className="flex flex-col gap-2 text-[10px] font-bold uppercase tracking-wider text-right flex-1 pr-8">
                          <div className="flex items-center justify-end gap-2 text-neon-green">Ativo <div className="w-2 h-2 rounded-full bg-neon-green shadow-neon-green"></div></div>
                          <div className="flex items-center justify-end gap-2 text-neon-red">Gasto <div className="w-2 h-2 rounded-full bg-neon-red shadow-neon-red"></div></div>
                      </div>
                     </>
                 )}
                 {viewMode === 1 && (
                     <div className="w-full flex flex-col gap-4 pr-8 pl-2">
                         <div className="space-y-1">
                             <div className="flex justify-between text-[10px] font-bold uppercase text-neon-green"><span>Capacidade</span><span>{((totalIncome / (totalIncome + totalOutflow || 1)) * 100).toFixed(0)}%</span></div>
                             <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5"><div style={{ width: `${(totalIncome / (totalIncome + totalOutflow || 1)) * 100}%` }} className="h-full bg-neon-green rounded-full"></div></div>
                         </div>
                         <div className="space-y-1">
                             <div className="flex justify-between text-[10px] font-bold uppercase text-neon-red"><span>Compromisso</span><span>{((totalOutflow / (totalIncome + totalOutflow || 1)) * 100).toFixed(0)}%</span></div>
                             <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5"><div style={{ width: `${(totalOutflow / (totalIncome + totalOutflow || 1)) * 100}%` }} className="h-full bg-neon-red rounded-full"></div></div>
                         </div>
                     </div>
                 )}
                 {viewMode === 2 && (
                     <div className="text-center w-full pr-6">
                         <h4 className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-bold mb-1">Risco Financeiro</h4>
                         <div className={`text-5xl font-black tracking-tighter ${totalOutflow > totalIncome ? 'text-neon-red' : 'text-neon-blue'}`}>{((totalOutflow / (totalIncome || 1)) * 100).toFixed(0)}<span className="text-2xl align-top">%</span></div>
                     </div>
                 )}
             </div>
          </Card>
        </div>

        <Card className="relative overflow-hidden group border-t-2 border-t-neon-red/50 flex flex-col justify-center p-5 hover:bg-white/5 transition-colors h-36">
          <div className="flex justify-between items-center mb-3 relative z-10">
            <h3 className="text-slate-300 text-xs uppercase tracking-[0.15em] font-bold">Saídas (Restante)</h3>
            <div className="p-1.5 bg-neon-red/10 rounded-md text-neon-red"><TrendingDown size={18} /></div>
          </div>
          <p className="text-3xl sm:text-4xl font-black text-white tracking-tight relative z-10">
            <span className="text-sm text-slate-500 font-bold align-top mr-1">R$</span>
            {fmt(totalOutflow)}
          </p>
        </Card>
      </div>
    </div>
  );
};
