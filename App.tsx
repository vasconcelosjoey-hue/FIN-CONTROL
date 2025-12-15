import React, { useEffect, useState } from 'react';
import { FinancialData, INITIAL_DATA } from './types';
import { loadData, saveData, subscribeToData, signInUser } from './services/dataService';
import { auth } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { Dashboard } from './components/Dashboard';
import { IncomeModule, FixedExpenseModule, InstallmentModule, CreditCardModule, PixModule } from './components/Modules';
import { Share2, RefreshCw, LayoutDashboard, ShieldCheck } from 'lucide-react';
import { Button } from './components/ui/UIComponents';

function App() {
  const [data, setData] = useState<FinancialData>(INITIAL_DATA);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeData: () => void = () => {};

    if (auth) {
      const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
        if (user) {
          setUserId(user.uid);
          const initialData = await loadData(user.uid);
          setData(initialData);
          setLoading(false);
          unsubscribeData = subscribeToData(user.uid, (newData) => {
            setData(newData);
          });
        } else {
          await signInUser();
        }
      });

      return () => {
        unsubscribeAuth();
        unsubscribeData();
      };
    } else {
      const demoId = "demo_user";
      setUserId(demoId);
      loadData(demoId).then(d => {
        setData(d);
        setLoading(false);
      });
    }
  }, []);

  const handleUpdate = (newData: FinancialData) => {
    setData(newData);
    if (userId) {
      saveData(userId, newData);
    }
  };

  const copyShareLink = () => {
    const url = window.location.origin + window.location.pathname;
    navigator.clipboard.writeText(url);
    setNotification('LINK DE ACESSO COPIADO');
    setTimeout(() => setNotification(null), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neon-dark flex flex-col items-center justify-center text-neon-blue gap-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neon-blue/10 via-transparent to-transparent animate-pulse"></div>
        <RefreshCw className="animate-spin w-10 h-10 drop-shadow-[0_0_10px_#00f3ff]" /> 
        <div className="text-center z-10">
          <p className="font-extrabold tracking-widest uppercase">Inicializando Sistema</p>
          <p className="text-xs text-slate-500 mt-2 font-mono font-bold">ESTABELECENDO CONEXÃO SEGURA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-200 pb-20 selection:bg-neon-pink selection:text-white">
      {/* Navbar */}
      <nav className="border-b border-white/5 bg-neon-surface/80 backdrop-blur-md sticky top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-default">
            <h1 className="font-extrabold text-xl tracking-tight sm:block">
              FIN<span className="text-neon-blue/80 mx-0.5">/</span><span className="text-neon-blue drop-shadow-[0_0_5px_rgba(0,243,255,0.8)]">CONTROLE</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-neon-green/5 border border-neon-green/20 rounded-full text-[10px] text-neon-green uppercase tracking-wider font-extrabold shadow-[0_0_5px_rgba(10,255,104,0.1)]">
              <ShieldCheck size={12} />
              <span>Ambiente Isolado</span>
            </div>

            <Button onClick={copyShareLink} variant="secondary" className="text-xs h-9 font-bold">
              <Share2 size={14} /> <span className="hidden sm:inline">Compartilhar</span>
            </Button>
          </div>
        </div>
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-neon-blue/50 to-transparent"></div>
      </nav>

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-24 right-4 bg-neon-dark border border-neon-green text-neon-green px-6 py-3 rounded-xl shadow-[0_0_20px_rgba(10,255,104,0.3)] z-50 animate-bounce font-extrabold tracking-wide flex items-center gap-2">
          <ShieldCheck size={18} /> {notification}
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Header Summary */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-white mb-1 tracking-tight drop-shadow-lg">Dashboard</h2>
            <p className="text-slate-400 text-sm font-semibold">Resumo financeiro em tempo real</p>
          </div>
          <div className="text-[10px] text-slate-500 font-mono bg-black/40 px-3 py-1.5 rounded border border-white/5 flex items-center gap-2 font-bold">
            <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse"></div>
            UID: {userId?.substring(0, 8)}...
          </div>
        </div>

        <Dashboard data={data} />

        {/* Modules Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-10">
          
          {/* Left Column: Cash Flow */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            <IncomeModule data={data} onUpdate={handleUpdate} />
            <FixedExpenseModule data={data} onUpdate={handleUpdate} />
          </div>

          {/* Right Column: Debts & Assets */}
          <div className="lg:col-span-5 flex flex-col gap-8">
             <CreditCardModule data={data} onUpdate={handleUpdate} />
             <InstallmentModule data={data} onUpdate={handleUpdate} />
             <PixModule data={data} onUpdate={handleUpdate} />
          </div>

        </div>
      </main>

      <footer className="border-t border-white/5 mt-20 py-10 bg-black/20 text-center text-slate-600 text-sm relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-neon-pink/30 to-transparent"></div>
        <p className="font-bold tracking-wide">FINCONTROLE NEON &copy; 2024</p>
        <p className="text-[10px] mt-2 opacity-60 uppercase tracking-widest font-bold">Secure • Private • Persistent</p>
      </footer>
    </div>
  );
}

export default App;