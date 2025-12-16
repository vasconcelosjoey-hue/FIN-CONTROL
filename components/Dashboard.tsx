import React, { useState } from 'react';
import { FinancialData } from '../types';
import { Card, Badge, DonutChart } from './ui/UIComponents';
import { TrendingUp, TrendingDown, Coins, BarChart3, PieChart, Percent } from 'lucide-react';

interface DashboardProps {
  data: FinancialData;
}

export const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const [viewMode, setViewMode] = useState<0 | 1 | 2>(0); // 0: Donut, 1: Bars, 2: Text

  // Calculations
  const totalIncome = data.incomes.reduce((acc, curr) => acc + curr.value, 0);
  
  // Custom Sections Total
  const totalCustomSections = data.customSections?.reduce((acc, section) => {
      return acc + section.items.reduce((sAcc, item) => sAcc + item.value, 0);
  }, 0) || 0;

  const totalFixedExpenses = data.fixedExpenses.reduce((acc, curr) => acc + curr.value, 0);
  
  // Calculate total monthly installments
  const totalInstallmentMonthly = data.installments.reduce((acc, curr) => {
     const val = curr.monthlyValue || (curr.totalValue ? curr.totalValue / curr.installmentsCount : 0);
     return acc + val;
  }, 0);

  const totalOutflow = totalFixedExpenses + totalInstallmentMonthly + totalCustomSections;
  const balance = totalIncome - totalOutflow;

  // Formatting Helper (PT-BR)
  const fmt = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const toggleView = () => {
    setViewMode((prev) => (prev + 1) % 3 as any);
  };

  return (
    <div className="mb-6">
      {/* Hero Balance Card - Centralized & Evident */}
      <div className="mb-6 transform hover:scale-[1.01] transition-transform duration-500">
        <Card className="border-2 border-neon-yellow/30 bg-gradient-to-b from-neon-yellow/10 to-transparent flex flex-col items-center justify-center py-6 px-6 shadow-[0_0_40px_rgba(255,230,0,0.1)] relative overflow-hidden h-40">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon-yellow/60 to-transparent"></div>
            
            <div className="flex items-center gap-2 mb-2 opacity-90 relative z-10">
                <div className="p-2 bg-neon-yellow/10 rounded-full text-neon-yellow shadow-[0_0_15px_rgba(255,230,0,0.3)]">
                   <Coins size={20} />
                </div>
                <h3 className="text-neon-yellow text-sm uppercase tracking-[0.3em] font-extrabold drop-shadow-[0_0_10px_rgba(255,230,0,0.5)]">Saldo Previsto</h3>
            </div>
            
            <div className="text-center relative z-10 mt-1">
                <p className={`text-5xl sm:text-6xl font-black tracking-tight drop-shadow-lg ${balance >= 0 ? 'text-neon-yellow' : 'text-neon-red'}`}>
                <span className="text-2xl font-bold mr-2 opacity-60 align-top mt-2 inline-block">R$</span>
                {fmt(balance)}
                </p>
                <p className="text-xs text-slate-400 font-bold mt-2 uppercase tracking-widest opacity-80">Entradas — Saídas</p>
            </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
        {/* Total Income - Green */}
        <Card className="relative overflow-hidden group border-t-2 border-t-neon-green/50 flex flex-col justify-center p-5 hover:bg-white/5 transition-colors h-36">
          <div className="absolute -right-8 -top-8 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-500 rounded-full bg-neon-green blur-2xl w-32 h-32"></div>
          
          <div className="flex justify-between items-center mb-3 relative z-10">
              <h3 className="text-slate-300 text-xs uppercase tracking-[0.15em] font-bold">Entradas</h3>
              <div className="p-1.5 bg-neon-green/10 rounded-md text-neon-green shadow-neon-green">
                <TrendingUp size={18} />
              </div>
          </div>
          
          <p className="text-3xl sm:text-4xl font-black text-white tracking-tight relative z-10">
            <span className="text-sm text-slate-500 font-bold align-top mr-1">R$</span>
            {fmt(totalIncome)}
          </p>
        </Card>

        {/* Center Interactive Chart */}
        <div onClick={toggleView} className="group cursor-pointer h-36 relative">
          <Card className="flex flex-col items-center justify-center py-2 px-4 bg-black/40 border-neon-blue/30 hover:border-neon-blue/60 transition-all duration-300 h-full relative overflow-hidden" >
             <div className="w-full h-full flex flex-row items-center justify-between gap-4 relative z-10">
                 
                 {/* Toggle Icons - Now with Glow */}
                 <div className="flex flex-col gap-2 absolute right-0 top-0 z-20">
                     <div className={`p-1.5 rounded-lg transition-all duration-300 ${viewMode === 0 ? 'bg-neon-blue text-black shadow-[0_0_15px_rgba(0,243,255,0.6)]' : 'text-slate-600 bg-white/5'}`}>
                        <PieChart size={12} />
                     </div>
                     <div className={`p-1.5 rounded-lg transition-all duration-300 ${viewMode === 1 ? 'bg-neon-blue text-black shadow-[0_0_15px_rgba(0,243,255,0.6)]' : 'text-slate-600 bg-white/5'}`}>
                        <BarChart3 size={12} />
                     </div>
                     <div className={`p-1.5 rounded-lg transition-all duration-300 ${viewMode === 2 ? 'bg-neon-blue text-black shadow-[0_0_15px_rgba(0,243,255,0.6)]' : 'text-slate-600 bg-white/5'}`}>
                        <Percent size={12} />
                     </div>
                 </div>

                 {/* Mode 0: Donut */}
                 {viewMode === 0 && (
                     <>
                      <div className="scale-90 origin-left pl-2">
                          <DonutChart income={totalIncome} expense={totalOutflow} />
                      </div>
                      <div className="flex flex-col gap-2 text-[10px] font-bold uppercase tracking-wider text-right flex-1 pr-8">
                          <div className="flex items-center justify-end gap-2 text-neon-green">
                              Entradas <div className="w-2 h-2 rounded-full bg-neon-green shadow-[0_0_8px_currentColor]"></div> 
                          </div>
                          <div className="flex items-center justify-end gap-2 text-neon-red">
                               Saídas <div className="w-2 h-2 rounded-full bg-neon-red shadow-[0_0_8px_currentColor]"></div>
                          </div>
                      </div>
                     </>
                 )}

                 {/* Mode 1: Bars */}
                 {viewMode === 1 && (
                     <div className="w-full flex flex-col gap-4 pr-8 pl-2">
                         <div className="space-y-1">
                             <div className="flex justify-between text-[10px] font-bold uppercase text-neon-green">
                                 <span>Entradas</span>
                                 <span>{((totalIncome / (totalIncome + totalOutflow || 1)) * 100).toFixed(0)}%</span>
                             </div>
                             <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                 <div style={{ width: `${(totalIncome / (totalIncome + totalOutflow || 1)) * 100}%` }} className="h-full bg-neon-green shadow-[0_0_10px_currentColor] rounded-full"></div>
                             </div>
                         </div>
                         <div className="space-y-1">
                             <div className="flex justify-between text-[10px] font-bold uppercase text-neon-red">
                                 <span>Saídas</span>
                                 <span>{((totalOutflow / (totalIncome + totalOutflow || 1)) * 100).toFixed(0)}%</span>
                             </div>
                             <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                 <div style={{ width: `${(totalOutflow / (totalIncome + totalOutflow || 1)) * 100}%` }} className="h-full bg-neon-red shadow-[0_0_10px_currentColor] rounded-full"></div>
                             </div>
                         </div>
                     </div>
                 )}

                 {/* Mode 2: Text Ratio */}
                 {viewMode === 2 && (
                     <div className="text-center w-full pr-6">
                         <h4 className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-bold mb-1">Comprometimento</h4>
                         <div className={`text-5xl font-black tracking-tighter drop-shadow-lg ${totalOutflow > totalIncome ? 'text-neon-red' : 'text-neon-blue'}`}>
                             {((totalOutflow / (totalIncome || 1)) * 100).toFixed(0)}<span className="text-2xl align-top">%</span>
                         </div>
                         <p className="text-[10px] text-slate-500 font-medium mt-1">da renda mensal</p>
                     </div>
                 )}
             </div>
          </Card>
        </div>

        {/* Total Outflow - Red */}
        <Card className="relative overflow-hidden group border-t-2 border-t-neon-red/50 flex flex-col justify-center p-5 hover:bg-white/5 transition-colors h-36">
          <div className="absolute -right-8 -top-8 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-500 rounded-full bg-neon-red blur-2xl w-32 h-32"></div>
          
          <div className="flex justify-between items-center mb-3 relative z-10">
            <h3 className="text-slate-300 text-xs uppercase tracking-[0.15em] font-bold">Saídas</h3>
            <div className="p-1.5 bg-neon-red/10 rounded-md text-neon-red shadow-neon-red">
              <TrendingDown size={18} />
            </div>
          </div>

          <p className="text-3xl sm:text-4xl font-black text-white tracking-tight relative z-10">
            <span className="text-sm text-slate-500 font-bold align-top mr-1">R$</span>
            {fmt(totalOutflow)}
          </p>
          
          <div className="mt-3 flex gap-2 relative z-10 opacity-80">
             <span className="text-[10px] text-neon-red font-bold bg-neon-red/10 border border-neon-red/20 px-2 py-0.5 rounded">Fixas: {((totalFixedExpenses/totalOutflow||0)*100).toFixed(0)}%</span>
             <span className="text-[10px] text-neon-red font-bold bg-neon-red/10 border border-neon-red/20 px-2 py-0.5 rounded">Parc: {((totalInstallmentMonthly/totalOutflow||0)*100).toFixed(0)}%</span>
          </div>
        </Card>
      </div>
    </div>
  );
};