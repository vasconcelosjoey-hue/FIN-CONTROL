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
    <div className="mb-10">
      {/* Hero Balance Card - Centralized & Bigger */}
      <div className="mb-8 transform hover:scale-[1.01] transition-transform duration-500">
        <Card className="border-2 border-neon-yellow/20 bg-gradient-to-b from-neon-yellow/5 to-transparent flex flex-col items-center justify-center py-10 px-6 shadow-[0_0_50px_rgba(255,230,0,0.05)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon-yellow/50 to-transparent"></div>
            
            <div className="flex items-center gap-3 mb-4 opacity-80">
                <div className="p-2 bg-neon-yellow/10 rounded-full text-neon-yellow shadow-[0_0_15px_rgba(255,230,0,0.2)]">
                   <Coins size={28} />
                </div>
                <h3 className="text-neon-yellow text-sm uppercase tracking-[0.3em] font-extrabold drop-shadow-[0_0_10px_rgba(255,230,0,0.5)]">Saldo Previsto</h3>
            </div>
            
            <div className="text-center relative z-10">
                <p className={`text-6xl sm:text-7xl md:text-8xl font-black drop-shadow-[0_0_30px_rgba(255,230,0,0.15)] tracking-tighter ${balance >= 0 ? 'text-neon-yellow' : 'text-neon-red'}`}>
                <span className="text-3xl font-bold mr-3 opacity-50 align-top mt-4 inline-block tracking-normal">R$</span>
                {fmt(balance)}
                </p>
                <div className="h-1 w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto mt-6 mb-2"></div>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">
                    Entradas — Saídas
                </p>
            </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {/* Total Income - Green */}
        <Card className="relative overflow-hidden group border-t-4 border-t-neon-green/50 flex flex-col justify-between p-6 hover:bg-white/5 transition-colors">
          <div className="absolute -right-10 -top-10 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-500 rounded-full bg-neon-green blur-2xl w-40 h-40"></div>
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div>
              <h3 className="text-slate-400 text-xs uppercase tracking-[0.2em] font-bold">Entradas</h3>
            </div>
            <div className="p-2 bg-neon-green/10 rounded-lg text-neon-green shadow-[0_0_15px_rgba(10,255,104,0.15)]">
              <TrendingUp size={24} />
            </div>
          </div>
          <p className="text-4xl sm:text-5xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.1)] tracking-tight">
            <span className="text-lg text-slate-500 font-bold align-top mr-1">R$</span>
            {fmt(totalIncome)}
          </p>
        </Card>

        {/* Center Interactive Chart */}
        <Card className="flex flex-col items-center justify-center py-6 bg-black/40 border-neon-blue/20 cursor-pointer hover:bg-white/5 transition-colors group relative min-h-[220px]" >
           <div className="absolute top-3 right-3 opacity-30 group-hover:opacity-100 transition-opacity flex gap-2">
               <div className={`p-1 rounded ${viewMode === 0 ? 'bg-neon-blue/20 text-neon-blue' : 'text-slate-600'}`}><PieChart size={14} /></div>
               <div className={`p-1 rounded ${viewMode === 1 ? 'bg-neon-blue/20 text-neon-blue' : 'text-slate-600'}`}><BarChart3 size={14} /></div>
               <div className={`p-1 rounded ${viewMode === 2 ? 'bg-neon-blue/20 text-neon-blue' : 'text-slate-600'}`}><Percent size={14} /></div>
           </div>
           
           <div onClick={toggleView} className="w-full h-full flex flex-col items-center justify-center">
               {/* Mode 0: Donut */}
               {viewMode === 0 && (
                   <div className="animate-in fade-in zoom-in duration-300 flex flex-col items-center">
                    <div className="scale-125 mb-4">
                        <DonutChart income={totalIncome} expense={totalOutflow} />
                    </div>
                    <div className="flex gap-4 mt-2 text-[10px] font-bold uppercase tracking-widest">
                        <div className="flex items-center gap-1.5 text-neon-green">
                            <div className="w-2 h-2 rounded-full bg-neon-green shadow-[0_0_5px_currentColor]"></div> Entradas
                        </div>
                        <div className="flex items-center gap-1.5 text-neon-red">
                            <div className="w-2 h-2 rounded-full bg-neon-red shadow-[0_0_5px_currentColor]"></div> Saídas
                        </div>
                    </div>
                   </div>
               )}

               {/* Mode 1: Bars */}
               {viewMode === 1 && (
                   <div className="w-full px-6 flex flex-col gap-6 animate-in slide-in-from-bottom-2 duration-300">
                       <div className="space-y-2">
                           <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-neon-green">
                               <span>Entradas</span>
                               <span>{((totalIncome / (totalIncome + totalOutflow || 1)) * 100).toFixed(0)}%</span>
                           </div>
                           <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden border border-white/5">
                               <div style={{ width: `${(totalIncome / (totalIncome + totalOutflow || 1)) * 100}%` }} className="h-full bg-neon-green shadow-[0_0_10px_currentColor] rounded-full transition-all duration-1000"></div>
                           </div>
                       </div>
                       <div className="space-y-2">
                           <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-neon-red">
                               <span>Saídas</span>
                               <span>{((totalOutflow / (totalIncome + totalOutflow || 1)) * 100).toFixed(0)}%</span>
                           </div>
                           <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden border border-white/5">
                               <div style={{ width: `${(totalOutflow / (totalIncome + totalOutflow || 1)) * 100}%` }} className="h-full bg-neon-red shadow-[0_0_10px_currentColor] rounded-full transition-all duration-1000"></div>
                           </div>
                       </div>
                   </div>
               )}

               {/* Mode 2: Text Ratio */}
               {viewMode === 2 && (
                   <div className="text-center animate-in zoom-in duration-300">
                       <h4 className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-bold mb-2">Comprometimento da Renda</h4>
                       <div className={`text-6xl font-black tracking-tighter drop-shadow-lg ${totalOutflow > totalIncome ? 'text-neon-red' : 'text-neon-blue'}`}>
                           {((totalOutflow / (totalIncome || 1)) * 100).toFixed(1)}<span className="text-3xl align-top">%</span>
                       </div>
                       <p className="text-xs text-slate-500 mt-2 font-medium">do total arrecadado</p>
                   </div>
               )}
           </div>
           
           <div className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-4 group-hover:text-neon-blue transition-colors">
               {viewMode === 0 && "Visualização: Rosca"}
               {viewMode === 1 && "Visualização: Barras"}
               {viewMode === 2 && "Visualização: Índice"}
           </div>
        </Card>

        {/* Total Outflow - Red */}
        <Card className="relative overflow-hidden group border-t-4 border-t-neon-red/50 flex flex-col justify-between p-6 hover:bg-white/5 transition-colors">
          <div className="absolute -right-10 -top-10 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-500 rounded-full bg-neon-red blur-2xl w-40 h-40"></div>
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div>
              <h3 className="text-slate-400 text-xs uppercase tracking-[0.2em] font-bold">Saídas</h3>
            </div>
            <div className="p-2 bg-neon-red/10 rounded-lg text-neon-red shadow-[0_0_15px_rgba(255,0,85,0.15)]">
              <TrendingDown size={24} />
            </div>
          </div>
          <p className="text-4xl sm:text-5xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.1)] tracking-tight">
            <span className="text-lg text-slate-500 font-bold align-top mr-1">R$</span>
            {fmt(totalOutflow)}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 relative z-10">
            <Badge color="red">Fixas: {fmt(totalFixedExpenses)}</Badge>
            <Badge color="red">Parc: {fmt(totalInstallmentMonthly)}</Badge>
          </div>
        </Card>
      </div>
    </div>
  );
};