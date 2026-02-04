
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

  const totalIncome = data.customSections
    ?.filter(s => s.type === 'income')
    .reduce((acc, s) => acc + s.items
      .filter(i => i.isActive !== false)
      .reduce((iAcc, item) => iAcc + item.value, 0), 0) || 0;

  const totalOutflow = data.customSections
    ?.filter(s => s.type === 'expense')
    .reduce((acc, s) => acc + s.items
      .filter(i => i.isActive !== false)
      .reduce((iAcc, item) => iAcc + (item.value - (item.paidAmount || 0)), 0), 0) || 0;

  const balance = totalIncome - totalOutflow;

  const toggleView = () => setViewMode((prev) => (prev + 1) % 3 as any);

  return (
    <div className="mb-4 sm:mb-6">
      <div className="mb-4 sm:mb-6 transform sm:hover:scale-[1.01] transition-transform duration-500">
        <Card className="border-2 border-neon-yellow/30 bg-gradient-to-b from-neon-yellow/10 to-transparent flex flex-col items-center justify-center py-4 sm:py-6 px-4 sm:px-6 shadow-[0_0_20px_rgba(255,230,0,0.1)] relative overflow-hidden h-32 sm:h-40">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon-yellow/60 to-transparent"></div>
            <div className="flex items-center gap-2 mb-1 sm:mb-2 opacity-90 relative z-10">
                <div className="p-1.5 bg-neon-yellow/10 rounded-full text-neon-yellow"><Coins size={16} /></div>
                <h3 className="text-neon-yellow text-[10px] sm:text-xs uppercase tracking-[0.2em] font-extrabold">Saldo Previsto</h3>
            </div>
            <div className="text-center relative z-10">
                <p className={`text-3xl sm:text-5xl font-black tracking-tight drop-shadow-lg ${balance >= 0 ? 'text-neon-yellow' : 'text-neon-red'}`}>
                <span className="text-sm sm:text-2xl font-bold mr-1 opacity-60">R$</span>
                {fmt(balance)}
                </p>
                <p className="text-[8px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-widest opacity-80">Saldo Consolidado</p>
            </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 items-stretch">
        <Card className="relative overflow-hidden border-t-2 border-t-neon-green/50 flex flex-col justify-center p-4 hover:bg-white/5 transition-colors h-28 sm:h-36">
          <div className="flex justify-between items-center mb-2 relative z-10">
              <h3 className="text-neon-green text-[10px] sm:text-xs uppercase tracking-[0.1em] font-bold">Entradas</h3>
              <div className="p-1.5 bg-neon-green/10 rounded-md text-neon-green shadow-neon-green/20"><TrendingUp size={16} /></div>
          </div>
          <p className="text-2xl sm:text-4xl font-black text-neon-green tracking-tight relative z-10">
            <span className="text-xs sm:text-sm text-neon-green/60 font-bold align-top mr-0.5">R$</span>
            {fmt(totalIncome)}
          </p>
        </Card>

        <div onClick={toggleView} className="group cursor-pointer h-28 sm:h-36 relative">
          <Card className="flex flex-col items-center justify-center py-2 px-3 sm:px-4 bg-black/40 border-neon-blue/30 hover:border-neon-blue/60 transition-all h-full relative overflow-hidden">
             <div className="w-full h-full flex flex-row items-center justify-between gap-3 relative z-10">
                 <div className="flex flex-col gap-1.5 absolute right-0 top-0 z-20">
                     <div className={`p-1 rounded-lg transition-all ${viewMode === 0 ? 'bg-neon-blue text-black' : 'text-slate-600 bg-white/5'}`}><PieChart size={10} /></div>
                     <div className={`p-1 rounded-lg transition-all ${viewMode === 1 ? 'bg-neon-blue text-black' : 'text-slate-600 bg-white/5'}`}><BarChart3 size={10} /></div>
                     <div className={`p-1 rounded-lg transition-all ${viewMode === 2 ? 'bg-neon-blue text-black' : 'text-slate-600 bg-white/5'}`}><Percent size={10} /></div>
                 </div>
                 {viewMode === 0 && (
                     <>
                      <div className="scale-75 sm:scale-90 origin-left"><DonutChart income={totalIncome} expense={totalOutflow} /></div>
                      <div className="flex flex-col gap-1 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-right flex-1 pr-6">
                          <div className="flex items-center justify-end gap-1.5 text-neon-green">Ativo <div className="w-1.5 h-1.5 rounded-full bg-neon-green shadow-neon-green"></div></div>
                          <div className="flex items-center justify-end gap-1.5 text-neon-red">Gasto <div className="w-1.5 h-1.5 rounded-full bg-neon-red shadow-neon-red"></div></div>
                      </div>
                     </>
                 )}
                 {viewMode === 1 && (
                     <div className="w-full flex flex-col gap-3 pr-6 pl-1">
                         <div className="space-y-1">
                             <div className="flex justify-between text-[8px] font-bold uppercase text-neon-green"><span>Capacidade</span><span>{((totalIncome / (totalIncome + totalOutflow || 1)) * 100).toFixed(0)}%</span></div>
                             <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5"><div style={{ width: `${(totalIncome / (totalIncome + totalOutflow || 1)) * 100}%` }} className="h-full bg-neon-green rounded-full shadow-neon-green"></div></div>
                         </div>
                         <div className="space-y-1">
                             <div className="flex justify-between text-[8px] font-bold uppercase text-neon-red"><span>Compromisso</span><span>{((totalOutflow / (totalIncome + totalOutflow || 1)) * 100).toFixed(0)}%</span></div>
                             <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5"><div style={{ width: `${(totalOutflow / (totalIncome + totalOutflow || 1)) * 100}%` }} className="h-full bg-neon-red rounded-full shadow-neon-red"></div></div>
                         </div>
                     </div>
                 )}
                 {viewMode === 2 && (
                     <div className="text-center w-full pr-4">
                         <h4 className="text-slate-500 text-[8px] uppercase tracking-[0.2em] font-bold mb-0.5">Risco Geral</h4>
                         <div className={`text-3xl sm:text-5xl font-black tracking-tighter ${totalOutflow > totalIncome ? 'text-neon-red' : 'text-neon-blue shadow-neon-blue'}`}>{((totalOutflow / (totalIncome || 1)) * 100).toFixed(0)}<span className="text-xl align-top">%</span></div>
                     </div>
                 )}
             </div>
          </Card>
        </div>

        <Card className="relative overflow-hidden border-t-2 border-t-neon-red/50 flex flex-col justify-center p-4 hover:bg-white/5 transition-colors h-28 sm:h-36">
          <div className="flex justify-between items-center mb-2 relative z-10">
            <h3 className="text-neon-red text-[10px] sm:text-xs uppercase tracking-[0.1em] font-bold">Saídas</h3>
            <div className="p-1.5 bg-neon-red/10 rounded-md text-neon-red shadow-neon-red/20"><TrendingDown size={16} /></div>
          </div>
          <p className="text-2xl sm:text-4xl font-black text-neon-red tracking-tight relative z-10">
            <span className="text-xs sm:text-sm text-neon-red/60 font-bold align-top mr-0.5">R$</span>
            {fmt(totalOutflow)}
          </p>
        </Card>
      </div>
    </div>
  );
};
