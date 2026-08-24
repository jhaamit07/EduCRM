import { useState, type FormEvent } from 'react';
import { GraduationCap, Loader2, Lock, Mail, User, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res =
      mode === 'signin'
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password, fullName.trim() || email.split('@')[0]);
    setBusy(false);
    if (res.error) setError(res.error);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12 relative overflow-hidden">
      {/* ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-500 shadow-lg shadow-sky-500/30 mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">EduCRM</h1>
          <p className="text-slate-400 mt-1 text-sm">Employee access portal</p>
        </div>

        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <div className="flex gap-1 p-1 bg-slate-800/50 rounded-lg mb-6">
            <button
              type="button"
              onClick={() => { setMode('signin'); setError(null); }}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                mode === 'signin' ? 'bg-sky-500 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(null); }}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                mode === 'signup' ? 'bg-sky-500 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <Field
                icon={<User className="w-4 h-4" />}
                label="Full Name"
                type="text"
                value={fullName}
                onChange={setFullName}
                placeholder="Jane Doe"
                required
              />
            )}
            <Field
              icon={<Mail className="w-4 h-4" />}
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@edtech.com"
              required
            />
            <Field
              icon={<Lock className="w-4 h-4" />}
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              required
              minLength={6}
            />

            {error && (
              <div className="text-sm text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-sky-500 to-emerald-500 text-white font-medium shadow-lg shadow-sky-500/20 hover:shadow-sky-500/40 hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {mode === 'signup' && (
            <p className="text-xs text-slate-500 mt-4 flex items-start gap-1.5">
              <Sparkles className="w-3.5 h-3.5 mt-0.5 text-sky-400 shrink-0" />
              The first account created becomes the Admin. All later accounts start as Sales/Counselor.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  icon, label, type, value, onChange, placeholder, required, minLength,
}: {
  icon: React.ReactNode;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
          className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
        />
      </div>
    </div>
  );
}
