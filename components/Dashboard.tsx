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
      {/* Hero Balance Card - Compact & Refined */}
      <div className="mb-4 transform hover:scale-[1.005] transition-transform duration-500">
        <Card className="border border-neon-yellow/20 bg-gradient-to-b from-neon-yellow/5 to-transparent flex flex-row items-center justify-between py-4 px-6 shadow-[0_0_30px_rgba(255,230,0,0.02)] relative overflow-hidden h-32">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-neon-yellow/30 to-transparent"></div>
            
            <div className="flex flex-col gap-1 z-10">
                <div className="flex items-center gap-2 mb-1 opacity-80">
                    <div className="p-1.5 bg-neon-yellow/10 rounded-full text-neon-yellow">
                       <Coins size={16} />
                    </div>
                    <h3 className="text-neon-yellow text-[10px] uppercase tracking-[0.2em] font-extrabold">Saldo Previsto</h3>
                </div>
                <p className="text-xs text-slate-500 font-medium">Entradas — Saídas</p>
            </div>
            
            <div className="text-right relative z-10">
                <p className={`text-4xl sm:text-5xl font-black tracking-tight ${balance >= 0 ? 'text-neon-yellow' : 'text-neon-red'}`}>
                <span className="text-lg font-bold mr-1 opacity-50 align-top mt-1 inline-block">R$</span>
                {fmt(balance)}
                </p>
            </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
        {/* Total Income - Compact */}
        <Card className="relative overflow-hidden group border-t-2 border-t-neon-green/50 flex flex-col justify-center p-4 hover:bg-white/5 transition-colors h-32">
          <div className="absolute -right-8 -top-8 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-500 rounded-full bg-neon-green blur-2xl w-32 h-32"></div>
          
          <div className="flex justify-between items-center mb-2 relative z-10">
              <h3 className="text-slate-400 text-[10px] uppercase tracking-[0.15em] font-bold">Entradas</h3>
              <div className="p-1.5 bg-neon-green/10 rounded-md text-neon-green">
                <TrendingUp size={14} />
              </div>
          </div>
          
          <p className="text-2xl sm:text-3xl font-black text-white tracking-tight relative z-10">
            <span className="text-xs text-slate-500 font-bold align-top mr-1">R$</span>
            {fmt(totalIncome)}
          </p>
        </Card>

        {/* Center Interactive Chart - Compact */}
        <Card className="flex flex-col items-center justify-center py-2 px-4 bg-black/40 border-neon-blue/20 cursor-pointer hover:bg-white/5 transition-colors group relative h-32" >
           <div onClick={toggleView} className="w-full h-full flex flex-row items-center justify-between gap-4">
               
               {/* Toggle Icons */}
               <div className="flex flex-col gap-1 absolute right-2 top-2 opacity-30 group-hover:opacity-100 transition-opacity">
                   <div className={`p-0.5 rounded ${viewMode === 0 ? 'text-neon-blue' : 'text-slate-700'}`}><PieChart size={10} /></div>
                   <div className={`p-0.5 rounded ${viewMode === 1 ? 'text-neon-blue' : 'text-slate-700'}`}><BarChart3 size={10} /></div>
               </div>

               {/* Mode 0: Donut */}
               {viewMode === 0 && (
                   <>
                    <div className="scale-75 origin-left">
                        <DonutChart income={totalIncome} expense={totalOutflow} />
                    </div>
                    <div className="flex flex-col gap-1 text-[9px] font-bold uppercase tracking-wider text-right flex-1 pr-4">
                        <div className="flex items-center justify-end gap-1.5 text-neon-green">
                            Entradas <div className="w-1.5 h-1.5 rounded-full bg-neon-green"></div> 
                        </div>
                        <div className="flex items-center justify-end gap-1.5 text-neon-red">
                             Saídas <div className="w-1.5 h-1.5 rounded-full bg-neon-red"></div>
                        </div>
                    </div>
                   </>
               )}

               {/* Mode 1: Bars */}
               {viewMode === 1 && (
                   <div className="w-full flex flex-col gap-3 pr-2">
                       <div className="space-y-1">
                           <div className="flex justify-between text-[9px] font-bold uppercase text-neon-green">
                               <span>Entradas</span>
                               <span>{((totalIncome / (totalIncome + totalOutflow || 1)) * 100).toFixed(0)}%</span>
                           </div>
                           <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                               <div style={{ width: `${(totalIncome / (totalIncome + totalOutflow || 1)) * 100}%` }} className="h-full bg-neon-green shadow-[0_0_5px_currentColor] rounded-full"></div>
                           </div>
                       </div>
                       <div className="space-y-1">
                           <div className="flex justify-between text-[9px] font-bold uppercase text-neon-red">
                               <span>Saídas</span>
                               <span>{((totalOutflow / (totalIncome + totalOutflow || 1)) * 100).toFixed(0)}%</span>
                           </div>
                           <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                               <div style={{ width: `${(totalOutflow / (totalIncome + totalOutflow || 1)) * 100}%` }} className="h-full bg-neon-red shadow-[0_0_5px_currentColor] rounded-full"></div>
                           </div>
                       </div>
                   </div>
               )}

               {/* Mode 2: Text Ratio */}
               {viewMode === 2 && (
                   <div className="text-center w-full">
                       <h4 className="text-slate-500 text-[9px] uppercase tracking-[0.1em] font-bold mb-0">Comprometimento</h4>
                       <div className={`text-4xl font-black tracking-tighter ${totalOutflow > totalIncome ? 'text-neon-red' : 'text-neon-blue'}`}>
                           {((totalOutflow / (totalIncome || 1)) * 100).toFixed(0)}<span className="text-xl align-top">%</span>
                       </div>
                   </div>
               )}
           </div>
        </Card>

        {/* Total Outflow - Compact */}
        <Card className="relative overflow-hidden group border-t-2 border-t-neon-red/50 flex flex-col justify-center p-4 hover:bg-white/5 transition-colors h-32">
          <div className="absolute -right-8 -top-8 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-500 rounded-full bg-neon-red blur-2xl w-32 h-32"></div>
          
          <div className="flex justify-between items-center mb-2 relative z-10">
            <h3 className="text-slate-400 text-[10px] uppercase tracking-[0.15em] font-bold">Saídas</h3>
            <div className="p-1.5 bg-neon-red/10 rounded-md text-neon-red">
              <TrendingDown size={14} />
            </div>
          </div>

          <p className="text-2xl sm:text-3xl font-black text-white tracking-tight relative z-10">
            <span className="text-xs text-slate-500 font-bold align-top mr-1">R$</span>
            {fmt(totalOutflow)}
          </p>
          
          <div className="mt-2 flex gap-1 relative z-10 opacity-70">
             <span className="text-[9px] text-neon-red font-bold bg-neon-red/10 px-1.5 py-0.5 rounded">F: {((totalFixedExpenses/totalOutflow||1)*100).toFixed(0)}%</span>
             <span className="text-[9px] text-neon-red font-bold bg-neon-red/10 px-1.5 py-0.5 rounded">P: {((totalInstallmentMonthly/totalOutflow||1)*100).toFixed(0)}%</span>
          </div>
        </Card>
      </div>
    </div>
  );
};