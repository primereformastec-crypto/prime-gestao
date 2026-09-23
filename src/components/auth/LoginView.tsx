import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Shield, Lock, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    setTimeout(() => {
      const res = login(username.trim(), password.trim(), rememberMe);
      if (!res.success) {
        setError(res.error || 'Credenciais inválidas.');
        setLoading(false);
      }
    }, 400);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col justify-between relative overflow-hidden font-sans select-none">
      {/* Background Gradients & Glow Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-sky-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/15 blur-[140px] pointer-events-none" />
      
      {/* Top Bar */}
      <header className="p-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-sky-500/20 font-black text-lg">
            P
          </div>
          <div>
            <span className="text-white font-extrabold text-base tracking-tight block">PRIME GESTÃO</span>
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Obras & Reformas</span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] text-emerald-400 font-medium">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Servidor Operacional Seguro</span>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          {/* Card Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 mb-1">
              <Shield className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Acesso Corporativo
            </h1>
            <p className="text-xs text-slate-400">
              Introduza as suas credenciais para aceder ao sistema oficial de gestão da empresa.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Email / Username */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                Email ou Utilizador
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="admin@primegestao.pt"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-300">
                  Palavra-passe
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-slate-500 hover:text-slate-300 absolute right-3 top-2.5 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-sky-600 focus:ring-sky-500"
                />
                <span className="text-xs text-slate-400">Manter sessão iniciada</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-600/25 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50"
            >
              {loading ? (
                <span>A autenticar...</span>
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-xs text-slate-500 relative z-10">
        <p>PRIME Gestão © {new Date().getFullYear()} — Plataforma Oficial de Reformas & Obras</p>
        <p className="text-[10px] text-slate-600 mt-1">Conexão encriptada de ponta a ponta (SSL/TLS 256-bit)</p>
      </footer>
    </div>
  );
};
