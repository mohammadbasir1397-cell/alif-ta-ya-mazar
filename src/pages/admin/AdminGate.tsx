import { useState } from 'react';
import { Lock, Mail } from 'lucide-react';
import type { Settings } from '@/lib/types';

interface AdminGateProps {
  settings: Settings | null;
  onSuccess: (password: string, email: string) => void;
}

const FALLBACK_EMAIL = 'ایمیل شما';
const FALLBACK_PASSWORD = 'رمز عبور دلخواه شما';

export default function AdminGate({ settings, onSuccess }: AdminGateProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const dbPassword = settings?.admin_password || 'admin123';
    const isFallback = email.trim() === FALLBACK_EMAIL && password === FALLBACK_PASSWORD;
    const isDbAuth = password === dbPassword;
    if (isFallback || isDbAuth) {
      sessionStorage.setItem('aty_admin_ok', '1');
      onSuccess(isFallback ? FALLBACK_PASSWORD : password, email.trim());
    } else {
      setError(true);
    }
  };

  return (
    <div className="container-page py-16 max-w-md mx-auto">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center text-center mb-5">
          <div className="h-12 w-12 rounded-full bg-navy-50 flex items-center justify-center mb-2">
            <Lock size={24} className="text-navy-600" />
          </div>
          <h1 className="text-lg font-bold text-navy-700">پنل مدیریت فروشگاه</h1>
          <p className="text-sm text-slate-500 mt-1">برای ورود، ایمیل و رمز مدیریت را وارد کنید.</p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div className="relative">
            <Mail size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(false); }}
              placeholder="ایمیل"
              autoFocus
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pr-10 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy-400 focus:bg-white"
            />
          </div>
          <div className="relative">
            <Lock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false); }}
              placeholder="رمز عبور"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pr-10 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy-400 focus:bg-white"
            />
          </div>
          {error && <p className="text-xs text-rose-600">ایمیل یا رمز اشتباه است. دوباره تلاش کنید.</p>}
          <button type="submit" className="w-full rounded-lg bg-navy-700 text-white py-2.5 text-sm font-bold hover:bg-navy-800 transition">
            ورود
          </button>
        </form>
        <p className="text-xs text-slate-400 mt-4 text-center">رمز پیش‌فرض: admin123 (قابل تغییر از تنظیمات)</p>
      </div>
    </div>
  );
}
