
import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { ShieldCheck, LogIn, AlertCircle, UserPlus, Mail, Lock } from 'lucide-react';
import { Button, Input } from './ui/UIComponents';

export const AuthScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleAuth = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email || !password) {
      setError("Preencha todos os campos.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError("E-mail ou senha incorretos.");
      } else if (err.code === 'auth/email-already-in-use') {
        setError("Este e-mail já está em uso.");
      } else if (err.code === 'auth/weak-password') {
        setError("A senha deve ter pelo menos 6 caracteres.");
      } else {
        setError("Falha na autenticação. Tente novamente.");
      }
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
        <div className="text-center mb-10">
          <div className="inline-flex p-6 bg-neon-blue/5 rounded-[3rem] border-2 border-neon-blue/20 shadow-[0_0_50px_rgba(0,243,255,0.1)] mb-6 animate-in zoom-in duration-700">
            <ShieldCheck size={64} className="text-neon-blue" strokeWidth={1} />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tighter mb-4">
            FINANCIAL <span className="text-neon-blue drop-shadow-[0_0_15px_rgba(0,243,255,0.4)]">CONTROLLER</span>
          </h1>
          <p className="text-slate-500 font-medium uppercase tracking-[0.3em] text-[10px]">Your Private Intelligent Vault</p>
        </div>

        <div className="bg-neon-surface/60 backdrop-blur-3xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl">
          <h2 className="text-center text-white font-black uppercase tracking-widest text-sm mb-8">
            {isRegistering ? 'Criar Novo Acesso' : 'Acessar Cofre'}
          </h2>

          <form onSubmit={handleAuth} className="space-y-5">
            <div className="space-y-4">
              <Input 
                label="E-mail" 
                type="email" 
                placeholder="seu@email.com" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                noUppercase
              />
              <Input 
                label="Senha" 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                noUppercase
              />
            </div>

            {error && (
              <div className="p-4 bg-neon-red/10 border border-neon-red/30 rounded-2xl flex items-center gap-3 text-neon-red text-[10px] font-bold uppercase tracking-tight animate-in shake duration-300">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <Button 
              disabled={loading}
              className="w-full h-14 text-[10px] font-black tracking-[0.2em] shadow-[0_0_30px_rgba(0,243,255,0.1)] mt-4"
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  Processando...
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  {isRegistering ? <UserPlus size={18} /> : <LogIn size={18} />}
                  {isRegistering ? 'Cadastrar Acesso' : 'Desbloquear'}
                </div>
              )}
            </Button>
          </form>

          <div className="mt-8 flex flex-col items-center gap-4">
            <button 
              onClick={() => { setIsRegistering(!isRegistering); setError(null); }}
              className="text-[10px] text-slate-500 hover:text-white font-black uppercase tracking-widest transition-colors underline decoration-neon-blue/30 underline-offset-4"
            >
              {isRegistering ? 'Já tenho acesso, quero entrar' : 'Não tenho conta, quero me cadastrar'}
            </button>
            
            <p className="text-[9px] text-slate-700 font-black uppercase tracking-widest text-center">
              Powered by JOI.A. Intelligent Systems
            </p>
          </div>
        </div>

        <div className="mt-12 text-center opacity-30">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.5em]">AES-256 Encrypted Cloud</p>
        </div>
      </div>
    </div>
  );
};
