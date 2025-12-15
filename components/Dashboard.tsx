import React from 'react';
import { FinancialData } from '../types';
import { Card, Badge } from './ui/UIComponents';
import { TrendingUp, TrendingDown, CreditCard, Wallet, AlertTriangle } from 'lucide-react';

interface DashboardProps {
  data: FinancialData;
}

export const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  // Calculations
  const totalIncome = data.incomes.reduce((acc, curr) => acc + curr.value, 0);
  const currentMonth = new Date().toISOString().slice(0, 7); 
  const totalFixedExpenses = data.fixedExpenses.reduce((acc, curr) => acc + curr.value, 0);
  
  const totalInstallmentMonthly = data.installments.reduce((acc, curr) => {
    const start = new Date(curr.startMonth + "-01");
    const now = new Date();
    const end = new Date(start);
    end.setMonth(start.getMonth() + curr.installmentsCount);
    
    if (now >= start && now < end) {
      return acc + (curr.totalValue / curr.installmentsCount);
    }
    return acc;
  }, 0);

  const totalOutflow = totalFixedExpenses + totalInstallmentMonthly;
  const projectedBalance = totalIncome - totalOutflow;
  
  const totalLimit = data.creditCards.reduce((acc, curr) => acc + curr.limit, 0);
  const totalUsed = data.creditCards.reduce((acc, curr) => acc + curr.currentInvoiceValue, 0);
  const usagePercentage = totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0;

  const balanceStatus = projectedBalance >= 0 ? 'green' : 'red';
  const usageStatus = usagePercentage > 80 ? 'red' : usagePercentage > 50 ? 'yellow' : 'green';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
      {/* Total Income - Neon Green Theme */}
      <Card className="relative overflow-hidden group border-t-2 border-t-neon-green/50">
        <div className="absolute -right-6 -top-6 p-4 opacity-10 group-hover:opacity-20 transition-opacity duration-500 rounded-full bg-neon-green blur-xl w-32 h-32"></div>
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div>
            <h3 className="text-slate-300 text-xs uppercase tracking-widest font-bold">Entradas</h3>
            <div className="mt-1 text-sm font-semibold text-slate-400">Recorrente Mensal</div>
          </div>
          <div className="p-2 bg-neon-green/10 rounded-lg text-neon-green shadow-[0_0_10px_rgba(10,255,104,0.2)]">
            <TrendingUp size={20} />
          </div>
        </div>
        <p className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">
          <span className="text-sm text-slate-400 font-bold align-top mr-1">R$</span>
          {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
      </Card>

      {/* Total Outflow - Neon Pink Theme */}
      <Card className="relative overflow-hidden group border-t-2 border-t-neon-pink/50">
        <div className="absolute -right-6 -top-6 p-4 opacity-10 group-hover:opacity-20 transition-opacity duration-500 rounded-full bg-neon-pink blur-xl w-32 h-32"></div>
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div>
            <h3 className="text-slate-300 text-xs uppercase tracking-widest font-bold">Saídas</h3>
            <div className="mt-1 text-sm font-semibold text-slate-400">Mês Atual</div>
          </div>
          <div className="p-2 bg-neon-pink/10 rounded-lg text-neon-pink shadow-[0_0_10px_rgba(188,19,254,0.2)]">
            <TrendingDown size={20} />
          </div>
        </div>
        <p className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">
          <span className="text-sm text-slate-400 font-bold align-top mr-1">R$</span>
          {totalOutflow.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge color="pink">Fixas: {totalFixedExpenses.toFixed(0)}</Badge>
          <Badge color="yellow">Parc: {totalInstallmentMonthly.toFixed(0)}</Badge>
        </div>
      </Card>

      {/* Credit Card Health - Neon Blue Theme */}
      <Card className="relative overflow-hidden group border-t-2 border-t-neon-blue/50">
        <div className="absolute -right-6 -top-6 p-4 opacity-10 group-hover:opacity-20 transition-opacity duration-500 rounded-full bg-neon-blue blur-xl w-32 h-32"></div>
        <div className="flex justify-between items-start mb-2 relative z-10">
          <div>
            <h3 className="text-slate-300 text-xs uppercase tracking-widest font-bold">Cartões</h3>
            <span className="text-sm font-semibold text-slate-400">Limite Comprometido</span>
          </div>
          <div className="p-2 bg-neon-blue/10 rounded-lg text-neon-blue shadow-[0_0_10px_rgba(0,243,255,0.2)]">
            <CreditCard size={20} />
          </div>
        </div>
        
        <div className="flex items-end gap-2 mt-2">
          <p className="text-3xl font-extrabold text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
            {usagePercentage.toFixed(0)}<span className="text-lg">%</span>
          </p>
        </div>
        
        <div className="w-full bg-black/50 h-2 mt-4 rounded-full overflow-hidden border border-white/5 relative">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_currentColor] ${usageStatus === 'red' ? 'bg-neon-red text-neon-red' : usageStatus === 'yellow' ? 'bg-neon-yellow text-neon-yellow' : 'bg-neon-blue text-neon-blue'}`} 
            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
          />
        </div>
        {usagePercentage > 80 && (
           <div className="absolute bottom-3 right-4 flex items-center gap-1 text-[10px] text-neon-red font-bold animate-pulse">
             <AlertTriangle size={10} /> ALERTA
           </div>
        )}
      </Card>

      {/* Projected Balance - Conditional Theme */}
      <Card className={`relative overflow-hidden group border-t-2 ${balanceStatus === 'green' ? 'border-t-neon-green/50 shadow-neon-green/10' : 'border-t-neon-red/50 shadow-neon-red/10'}`}>
        <div className={`absolute -right-6 -top-6 p-4 opacity-10 group-hover:opacity-20 transition-opacity duration-500 rounded-full blur-xl w-32 h-32 ${balanceStatus === 'green' ? 'bg-neon-green' : 'bg-neon-red'}`}></div>
        
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div>
            <h3 className="text-slate-300 text-xs uppercase tracking-widest font-bold">Saldo Projetado</h3>
            <div className="mt-1 text-sm font-semibold text-slate-400">Final do Mês</div>
          </div>
          <div className={`p-2 rounded-lg ${balanceStatus === 'green' ? 'bg-neon-green/10 text-neon-green' : 'bg-neon-red/10 text-neon-red'} shadow-lg`}>
            <Wallet size={20} />
          </div>
        </div>

        <p className={`text-2xl sm:text-3xl font-extrabold mt-1 drop-shadow-[0_0_8px_rgba(0,0,0,0.8)] ${balanceStatus === 'green' ? 'text-neon-green' : 'text-neon-red'}`}>
          <span className="text-sm opacity-70 font-bold align-top mr-1">R$</span>
          {projectedBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>

        {balanceStatus === 'red' && (
           <div className="mt-4 px-3 py-1 bg-neon-red/10 border border-neon-red/20 rounded text-xs font-bold text-neon-red inline-flex items-center gap-2 w-full justify-center">
             <AlertTriangle size={12} /> Negativo
           </div>
        )}
      </Card>
    </div>
  );
};