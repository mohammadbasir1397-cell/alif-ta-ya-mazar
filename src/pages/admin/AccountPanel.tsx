import { useEffect, useState } from 'react';
import { KeyRound, Loader2, Save, LogOut, Mail, Check } from 'lucide-react';
import { changeAdminPassword, currentAdminEmail, signOutAdmin } from '@/lib/api';

interface AccountPanelProps {
  onSignedOut: () => void;
}

export default function AccountPanel({ onSignedOut }: AccountPanelProps) {
  const [email, setEmail] = useState<string>('…');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    currentAdminEmail().then((e) => setEmail(e || '—'));
  }, []);

  const save = async () => {
    setError('');
    setMsg('');
    if (password.length < 6) {
      setError('رمز عبور باید حداقل ۶ کاراکتر باشد.');
      return;
    }
    if (password !== confirm) {
      setError('رمز عبور و تکرار آن یکسان نیستند.');
      return;
    }
    setBusy(true);
    const result = await changeAdminPassword(password);
    setBusy(false);
    if (result.ok) {
      setPassword('');
      setConfirm('');
      setMsg('رمز عبور با موفقیت تغییر کرد.');
      setTimeout(() => setMsg(''), 4000);
    } else {
      setError('تغییر رمز ناموفق بود. دوباره تلاش کنید.');
    }
  };

  const logout = async () => {
    await signOutAdmin();
    onSignedOut();
  };

  return (
    <div className="space-y-5 max-w-xl">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-bold text-navy-700 mb-4">اطلاعات حساب مدیریتی</h2>
        <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
          <Mail size={18} className="text-slate-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-slate-400">ایمیل مدیریت</p>
            <p className="text-sm font-medium text-slate-700 truncate" dir="ltr">{email}</p>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-3 leading-5">
          این همان حسابی است که با آن وارد پنل می‌شوید. امنیت پنل بر اساس این حساب است؛ رمز عبور را در جای امن نگه دارید.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <h2 className="text-base font-bold text-navy-700">تغییر رمز عبور حساب</h2>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">رمز عبور جدید</label>
          <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} className="aty-input" dir="ltr" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">تکرار رمز عبور جدید</label>
          <input type="password" value={confirm} onChange={(e) => { setConfirm(e.target.value); setError(''); }} className="aty-input" dir="ltr" />
        </div>
        {error && <p className="text-xs text-rose-600">{error}</p>}
        {msg && <p className="text-sm text-green-600 flex items-center gap-1"><Check size={14} /> {msg}</p>}
        <button onClick={save} disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-navy-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-navy-800 disabled:opacity-50">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
          تغییر رمز
        </button>
      </div>

      <div className="rounded-xl border border-rose-100 bg-white p-5">
        <h2 className="text-base font-bold text-navy-700 mb-2">خروج از پنل</h2>
        <p className="text-sm text-slate-500 mb-3">با خروج، دسترسی ویرایش فروشگاه تا ورود دوباره بسته می‌شود.</p>
        <button onClick={logout} className="inline-flex items-center gap-2 rounded-lg bg-rose-50 text-rose-700 px-5 py-2.5 text-sm font-bold hover:bg-rose-100 transition">
          <LogOut size={16} /> خروج از حساب
        </button>
      </div>
    </div>
  );
}
