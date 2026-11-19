import { useState } from 'react';
import { Lock, Mail, Loader2, ShieldCheck } from 'lucide-react';
import { signInAdmin, claimFirstAdmin } from '@/lib/api';

interface AdminGateProps {
  onSuccess: () => void;
}

export default function AdminGate({ onSuccess }: AdminGateProps) {
  const [mode, setMode] = useState<'signin' | 'setup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [storePassword, setStorePassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('ایمیل و رمز عبور الزامی است.');
      return;
    }
    setBusy(true);
    const result = mode === 'signin'
      ? await signInAdmin(email.trim(), password)
      : await claimFirstAdmin(email.trim(), password, storePassword);
    setBusy(false);
    if (result.ok) {
      onSuccess();
    } else {
      setError(result.error || 'خطایی رخ داد. دوباره تلاش کنید.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm w-full max-w-md">
        <div className="flex flex-col items-center text-center mb-5">
          <div className="h-12 w-12 rounded-full bg-navy-50 flex items-center justify-center mb-2">
            <Lock size={24} className="text-navy-600" />
          </div>
          <h1 className="text-lg font-bold text-navy-700">پنل مدیریت فروشگاه</h1>
          <p className="text-sm text-slate-500 mt-1">
            {mode === 'signin' ? 'با حساب مدیریتی خود وارد شوید.' : 'برای بار اول، حساب مدیریتی را ایجاد کنید.'}
          </p>
        </div>

        <div className="flex gap-1 rounded-lg bg-slate-100 p-1 mb-4">
          <button
            type="button"
            onClick={() => { setMode('signin'); setError(''); }}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition ${mode === 'signin' ? 'bg-white text-navy-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            ورود
          </button>
          <button
            type="button"
            onClick={() => { setMode('setup'); setError(''); }}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition ${mode === 'setup' ? 'bg-white text-navy-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            راه‌اندازی اولیه
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div className="relative">
            <Mail size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              placeholder="ایمیل مدیریت"
              autoFocus
              className="aty-input pr-10"
              dir="ltr"
            />
          </div>
          <div className="relative">
            <Lock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder={mode === 'signin' ? 'رمز عبور حساب' : 'رمز عبور جدید (حداقل ۶ کاراکتر)'}
              className="aty-input pr-10"
              dir="ltr"
            />
          </div>
          {mode === 'setup' && (
            <div className="relative">
              <ShieldCheck size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={storePassword}
                onChange={(e) => { setStorePassword(e.target.value); setError(''); }}
                placeholder="رمز فعلی مدیریت فروشگاه (برای تأیید)"
                className="aty-input pr-10"
                dir="ltr"
              />
              <p className="text-xs text-slate-400 mt-1">
                برای ساختن حساب مدیریتی، رمز فعلی فروشگاه لازم است. این امکان فقط تا زمانی که هیچ حساب مدیریتی وجود نداشته باشد فعال است.
              </p>
            </div>
          )}
          {error && <p className="text-xs text-rose-600 leading-5">{error}</p>}
          <button type="submit" disabled={busy} className="w-full rounded-lg bg-navy-700 text-white py-2.5 text-sm font-bold hover:bg-navy-800 transition disabled:opacity-50 flex items-center justify-center gap-2">
            {busy && <Loader2 size={16} className="animate-spin" />}
            {mode === 'signin' ? 'ورود به پنل' : 'ایجاد حساب مدیریتی'}
          </button>
        </form>
      </div>
    </div>
  );
}
