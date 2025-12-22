
import React, { useState, useEffect } from 'react';
import { loginUser, resetPassword } from '../services/dataService';
import { Card, Button, Input } from './ui/UIComponents';
import { LogIn, ShieldCheck, RefreshCw, KeyRound, CheckSquare, Square } from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [keepConnected, setKeepConnected] = useState(true);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setError('');
    setLoading(true);

    try {
      await loginUser(email.trim().toLowerCase(), password);
    } catch (err: any) {
      let msg = "Falha no acesso. Verifique seus dados.";
      if (err.message.includes("auth/user-not-found") || err.message.includes("auth/wrong-password") || err.message.includes("auth/invalid-credential")) {
        msg = "E-mail ou senha incorretos.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Digite seu e-mail no campo acima para resetar a senha.");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email.trim().toLowerCase());
      setResetSent(true);
      setError("Link de recuperação enviado para seu e-mail.");
    } catch (err: any) {
      setError("Erro ao enviar e-mail de recuperação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-neon-dark relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-neon-blue/5 rounded-full blur-[150px]"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-neon-pink/5 rounded-full blur-[150px]"></div>

      <div className="w-full max-w-sm transition-all duration-500">
        <div className="text-center mb-10">
          <div className="inline-flex p-4 bg-neon-blue/10 rounded-3xl mb-4 border border-neon-blue/20 shadow-neon-blue/10">
            <ShieldCheck className="text-neon-blue" size={40} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter leading-none">
            FINANCIAL <span className="text-neon-blue">CONTROLLER</span>
          </h1>
          <p className="text-slate-500 text-[10px] mt-3 font-bold uppercase tracking-[0.3em]">
            Acesso Seguro • Sincronização Cloud
          </p>
        </div>

        <Card className="p-8 border-white/10 bg-black/40 backdrop-blur-3xl shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input 
              label="E-mail" 
              type="email" 
              placeholder="seu@email.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              noUppercase={true}
              required
              autoFocus
              className="h-11"
            />
            <Input 
              label="Senha" 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              noUppercase={true}
              required
              className="h-11"
            />

            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setKeepConnected(!keepConnected)}>
               {keepConnected ? <CheckSquare size={16} className="text-neon-blue" /> : <Square size={16} className="text-slate-600" />}
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manter Conectado</span>
            </div>

            {error && (
              <div className={`p-3 border rounded-xl text-[10px] font-bold uppercase tracking-wider text-center animate-pulse ${resetSent ? 'bg-neon-green/10 border-neon-green/30 text-neon-green' : 'bg-neon-red/10 border-neon-red/30 text-neon-red'}`}>
                {error}
              </div>
            )}

            <Button 
              onClick={() => {}} 
              variant="primary" 
              className="w-full h-12 mt-4 text-sm shadow-neon-blue/20"
              disabled={loading}
            >
              {loading ? (
                <RefreshCw className="animate-spin" size={20} />
              ) : (
                <><LogIn size={20} /> ENTRAR NO SISTEMA</>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <button 
              type="button"
              onClick={handleForgotPassword}
              className="group flex items-center justify-center gap-2 mx-auto text-[10px] font-bold text-slate-500 hover:text-white transition-all uppercase tracking-widest"
            >
              <KeyRound size={12} className="group-hover:text-neon-blue transition-colors" />
              Esqueceu a senha? Crie uma nova
            </button>
          </div>
        </Card>

        <p className="text-center mt-12 text-[8px] text-slate-700 font-bold uppercase tracking-[0.4em] opacity-50">
          Criptografia Ponta-a-Ponta • Cloud AWS/GCP
        </p>
      </div>
    </div>
  );
};
