import { useState } from 'react';
import { Lock, Mail, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AdminGateProps {
  onSuccess: () => void;
}

export default function AdminGate({ onSuccess }: AdminGateProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('ایمیل و رمز عبور الزامی است.');
      return;
    }
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (authError) {
      setError('ایمیل یا رمز عبور نادرست است.');
      return;
    }
    onSuccess();
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
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              placeholder="ایمیل"
              autoFocus
              dir="ltr"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pr-10 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy-400 focus:bg-white"
            />
          </div>
          <div className="relative">
            <Lock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="رمز عبور"
              dir="ltr"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pr-10 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy-400 focus:bg-white"
            />
          </div>
          {error && <p className="text-xs text-rose-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-navy-700 text-white py-2.5 text-sm font-bold hover:bg-navy-800 transition disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'ورود'}
          </button>
        </form>
      </div>
    </div>
  );
}
