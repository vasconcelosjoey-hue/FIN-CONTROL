import React from 'react';
import { FinancialData } from '../types';
import { Card, Badge, DonutChart } from './ui/UIComponents';
import { TrendingUp, TrendingDown, Coins } from 'lucide-react';

interface DashboardProps {
  data: FinancialData;
}

export const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  // Calculations
  const totalIncome = data.incomes.reduce((acc, curr) => acc + curr.value, 0);
  
  // Custom Sections Total
  const totalCustomSections = data.customSections?.reduce((acc, section) => {
      return acc + section.items.reduce((sAcc, item) => sAcc + item.value, 0);
  }, 0) || 0;

  const totalFixedExpenses = data.fixedExpenses.reduce((acc, curr) => acc + curr.value, 0);
  
  // Calculate total monthly installments
  // Agora soma TODOS os parcelados listados, independente da data, para bater com o valor visualizado no módulo
  const totalInstallmentMonthly = data.installments.reduce((acc, curr) => {
     const val = curr.monthlyValue || (curr.totalValue ? curr.totalValue / curr.installmentsCount : 0);
     return acc + val;
  }, 0);

  const totalOutflow = totalFixedExpenses + totalInstallmentMonthly + totalCustomSections;
  const balance = totalIncome - totalOutflow;

  return (
    <div className="mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch mb-4">
        {/* Total Income - Green */}
        <Card className="relative overflow-hidden group border-t-2 border-t-neon-green/50 flex flex-col justify-between">
          <div className="absolute -right-6 -top-6 p-4 opacity-10 group-hover:opacity-20 transition-opacity duration-500 rounded-full bg-neon-green blur-xl w-32 h-32"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
              <h3 className="text-slate-300 text-xs uppercase tracking-widest font-bold">Entradas</h3>
              <div className="mt-1 text-sm font-semibold text-slate-400">Total Acumulado</div>
            </div>
            <div className="p-2 bg-neon-green/10 rounded-lg text-neon-green shadow-[0_0_10px_rgba(10,255,104,0.2)]">
              <TrendingUp size={20} />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">
            <span className="text-sm text-slate-400 font-bold align-top mr-1">R$</span>
            {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </Card>

        {/* Center Chart */}
        <Card className="flex flex-col items-center justify-center py-2 bg-black/40 border-neon-blue/20">
           <DonutChart income={totalIncome} expense={totalOutflow} />
           <div className="flex gap-4 mt-2 text-[10px] font-bold uppercase tracking-widest">
              <div className="flex items-center gap-1 text-neon-green">
                 <div className="w-2 h-2 rounded-full bg-neon-green shadow-[0_0_5px_currentColor]"></div> Entradas
              </div>
              <div className="flex items-center gap-1 text-neon-red">
                 <div className="w-2 h-2 rounded-full bg-neon-red shadow-[0_0_5px_currentColor]"></div> Saídas
              </div>
           </div>
        </Card>

        {/* Total Outflow - Red */}
        <Card className="relative overflow-hidden group border-t-2 border-t-neon-red/50 flex flex-col justify-between">
          <div className="absolute -right-6 -top-6 p-4 opacity-10 group-hover:opacity-20 transition-opacity duration-500 rounded-full bg-neon-red blur-xl w-32 h-32"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
              <h3 className="text-slate-300 text-xs uppercase tracking-widest font-bold">Saídas</h3>
              <div className="mt-1 text-sm font-semibold text-slate-400">Mês Atual</div>
            </div>
            <div className="p-2 bg-neon-red/10 rounded-lg text-neon-red shadow-[0_0_10px_rgba(255,0,85,0.2)]">
              <TrendingDown size={20} />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">
            <span className="text-sm text-slate-400 font-bold align-top mr-1">R$</span>
            {totalOutflow.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            <Badge color="red">Fixas: {totalFixedExpenses.toFixed(0)}</Badge>
            <Badge color="red">Parc: {totalInstallmentMonthly.toFixed(0)}</Badge>
          </div>
        </Card>
      </div>

      {/* Balance Bar - Yellow */}
      <Card className="border border-neon-yellow/30 bg-gradient-to-r from-neon-yellow/5 to-transparent flex flex-col sm:flex-row items-center justify-between p-6 shadow-[0_0_20px_rgba(255,230,0,0.05)]">
        <div className="flex items-center gap-4 mb-2 sm:mb-0">
          <div className="p-3 bg-neon-yellow/10 rounded-full text-neon-yellow shadow-[0_0_10px_rgba(255,230,0,0.2)]">
            <Coins size={24} />
          </div>
          <div>
            <h3 className="text-neon-yellow text-sm uppercase tracking-[0.2em] font-extrabold drop-shadow-[0_0_5px_rgba(255,230,0,0.5)]">Saldo Previsto</h3>
            <p className="text-xs text-slate-500 font-medium">Entradas Totais — Saídas Totais</p>
          </div>
        </div>
        <div className="text-right">
            <p className={`text-4xl font-extrabold drop-shadow-[0_0_10px_rgba(255,230,0,0.3)] ${balance >= 0 ? 'text-neon-yellow' : 'text-neon-red'}`}>
              <span className="text-lg font-bold mr-2 opacity-60 align-middle">R$</span>
              {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
        </div>
      </Card>
    </div>
  );
};