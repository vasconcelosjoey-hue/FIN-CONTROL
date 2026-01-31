
import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebaseConfig';
import { ShieldCheck, LogIn, AlertCircle } from 'lucide-react';
import { Button } from './ui/UIComponents';

export const AuthScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error(err);
      setError("Falha na autenticação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-neon-blue/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-neon-pink/20 rounded-full blur-[120px] animate-pulse delay-700"></div>

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex p-6 bg-neon-blue/5 rounded-[3rem] border-2 border-neon-blue/20 shadow-[0_0_50px_rgba(0,243,255,0.1)] mb-8 animate-in zoom-in duration-700">
            <ShieldCheck size={64} className="text-neon-blue" strokeWidth={1} />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tighter mb-4">
            FINANCIAL <span className="text-neon-blue drop-shadow-[0_0_15px_rgba(0,243,255,0.4)]">CONTROLLER</span>
          </h1>
          <p className="text-slate-500 font-medium uppercase tracking-[0.3em] text-[10px]">Your Private Intelligent Vault</p>
        </div>

        <div className="bg-neon-surface/60 backdrop-blur-3xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl">
          <p className="text-center text-slate-300 text-sm mb-8 leading-relaxed">
            Bem-vindo ao seu novo centro de comando financeiro. Acesse sua conta de forma segura para gerenciar seus planos.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-neon-red/10 border border-neon-red/30 rounded-2xl flex items-center gap-3 text-neon-red text-xs font-bold uppercase tracking-tight animate-in shake duration-300">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <Button 
            onClick={handleLogin} 
            disabled={loading}
            className="w-full h-16 text-sm font-black tracking-[0.2em] shadow-[0_0_30px_rgba(0,243,255,0.15)]"
          >
            {loading ? (
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                Autenticando...
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <LogIn size={20} /> Entrar com Google
              </div>
            )}
          </Button>

          <p className="text-center text-[9px] text-slate-600 font-black uppercase tracking-widest mt-8">
            Powered by JOI.A. Intelligent Systems
          </p>
        </div>

        <div className="mt-12 text-center opacity-30">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.5em]">AES-256 Encrypted Cloud</p>
        </div>
      </div>
    </div>
  );
};
