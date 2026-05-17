import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signInAnonymously 
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { User, Lock, ArrowRight, UserPlus, AlertCircle, Loader2, Ghost } from 'lucide-react';

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [anonLoading, setAnonLoading] = useState(false);

  // We internally treat username as part of an email to satisfy Firebase Auth
  const INTERNAL_DOMAIN = 'profitly-umkm.id';
  const getEmail = (u: string) => {
    const trimmed = u.toLowerCase().trim();
    if (trimmed.includes('@')) return trimmed;
    return `${trimmed}@${INTERNAL_DOMAIN}`;
  };

  const handleAnonymousLogin = async () => {
    setError(null);
    setAnonLoading(true);
    try {
      await signInAnonymously(auth);
    } catch (err: any) {
      console.error("Anonymous Auth Error:", err);
      setError('Gagal masuk secara anonim. Pastikan fitur ini sudah aktif di Firebase.');
    } finally {
      setAnonLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (username.length < 3) {
      setError('Username minimal 3 karakter');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password minimal 6 karakter');
      setLoading(false);
      return;
    }

    const email = getEmail(username);

    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Set the display name to the actual username for the UI
        await updateProfile(userCredential.user, {
          displayName: username,
        });
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      if (err.code === 'auth/user-not-found') {
        setError('Username tidak ditemukan. Silakan klik "Daftar Sekarang" jika belum punya akun.');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Username atau Password salah. Jika ini akun baru, pastikan Anda sudah klik "Daftar".');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Username ini sudah terdaftar. Silakan "Masuk" atau gunakan username lain.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Fitur Login ini belum diaktifkan di Firebase. Pastikan Email/Password & Anonymous auth sudah ON.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Format username tidak valid. Jangan gunakan spasi/karakter aneh.');
      } else {
        setError(`Terjadi kesalahan: ${err.message || 'Coba lagi nanti'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-slate-50 p-4 font-sans py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-10 text-center border border-slate-100 flex flex-col relative overflow-hidden"
      >
        {/* Background glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/10 blur-3xl rounded-full"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-emerald-500/10 blur-3xl rounded-full"></div>

        <div className="relative">
          <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-200 transform -rotate-3 overflow-hidden">
            <span className="text-white font-black text-4xl">P</span>
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
          </div>

          <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">
            PROFITLY <span className="text-emerald-500 font-bold">UMKM</span>
          </h1>
          <p className="text-slate-400 mb-10 font-medium text-sm leading-relaxed uppercase tracking-widest">
            {mode === 'login' ? 'Selamat Datang Kembali' : 'Bergabung Sekarang'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5 text-left">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                <input 
                  required
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username anda"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                <input 
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700"
                />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 p-4 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold border border-rose-100"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              disabled={loading || anonLoading}
              type="submit"
              className="w-full py-4.5 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-slate-800 disabled:opacity-50 disabled:grayscale transition-all transform active:scale-95 flex items-center justify-center gap-3 shadow-2xl shadow-slate-200 mt-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? <ArrowRight className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                  {mode === 'login' ? 'Masuk ke Aplikasi' : 'Buat Akun'}
                </>
              )}
            </button>

            <div className="relative py-2 flex items-center">
              <div className="flex-grow border-t border-slate-100"></div>
              <span className="flex-shrink mx-4 text-[10px] font-bold text-slate-300 uppercase tracking-widest">Atau</span>
              <div className="flex-grow border-t border-slate-100"></div>
            </div>

            <button 
              type="button"
              disabled={loading || anonLoading}
              onClick={handleAnonymousLogin}
              className="w-full py-4 bg-white border-2 border-slate-100 text-slate-500 rounded-2xl font-bold text-sm hover:bg-slate-50 hover:border-slate-200 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {anonLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
              ) : (
                <>
                  <Ghost className="w-4 h-4" />
                  Masuk Tanpa Daftar (Anonim)
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-center gap-2">
            <p className="text-slate-400 text-xs font-medium">
              {mode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'}
            </p>
            <button 
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
              className="text-emerald-600 font-black text-xs uppercase tracking-widest hover:underline decoration-2 underline-offset-4"
            >
              {mode === 'login' ? 'Daftar Sekarang' : 'Masuk Sekarang'}
            </button>
          </div>
        </div>
      </motion.div>
      
      <p className="mt-8 text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] text-center">
        Profitly UMKM — Sistem Monitoring Keuangan Terpadu
      </p>
    </div>
  );
}
