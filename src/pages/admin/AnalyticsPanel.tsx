import { useCallback, useEffect, useState } from 'react';
import { Activity, Download, Users, ShoppingBag, RefreshCw } from 'lucide-react';
import { fetchAnalyticsStats } from '@/lib/api';
import type { AnalyticsStats } from '@/lib/types';

interface AnalyticsPanelProps {
  adminPassword: string | null;
  adminEmail: string | null;
}

const cards = [
  { key: 'active_visitors', label: 'بازدیدکنندگان فعال', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { key: 'registered_customers', label: 'مشتریان ثبت‌نام‌شده', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
  { key: 'orders', label: 'سفارش‌ها', icon: ShoppingBag, color: 'text-orange-600', bg: 'bg-orange-50' },
  { key: 'pwa_installs', label: 'نصب موفق اپلیکیشن', icon: Download, color: 'text-navy-600', bg: 'bg-navy-50' },
] as const;

export default function AnalyticsPanel({ adminPassword, adminEmail }: AnalyticsPanelProps) {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [password, setPassword] = useState(adminPassword || '');
  const [email, setEmail] = useState(adminEmail || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadStats = useCallback(async () => {
    if (!password) {
      setError('برای مشاهده آمار، رمز مدیریت را وارد کنید.');
      return;
    }
    setLoading(true);
    setError('');
    const result = await fetchAnalyticsStats(password, email);
    setLoading(false);
    if (!result) {
      setStats(null);
      setError('رمز مدیریت نادرست است یا آمار فعلاً در دسترس نیست.');
      return;
    }
    setStats(result);
  }, [password, email]);

  useEffect(() => {
    if (adminPassword) loadStats();
  }, [adminPassword, loadStats]);

  return (
    <section className="space-y-5">
      {!adminPassword && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <label className="mb-2 block text-sm font-semibold text-amber-900">ایمیل و رمز مدیریت برای مشاهده آمار</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ایمیل"
              className="aty-input flex-1 bg-white"
            />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="رمز مدیریت"
              className="aty-input flex-1 bg-white"
            />
            <button onClick={loadStats} className="rounded-lg bg-navy-700 px-4 py-2 text-sm font-bold text-white hover:bg-navy-800">نمایش آمار</button>
          </div>
        </div>
      )}

      {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      {stats && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-slate-500">{card.label}</p>
                      <p className="mt-2 text-3xl font-extrabold text-navy-700">{stats[card.key].toLocaleString('fa-AF')}</p>
                    </div>
                    <span className={`rounded-xl p-3 ${card.bg} ${card.color}`}><Icon size={22} /></span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
            <p>بازدیدکننده فعال یعنی مرورگری که در ۵ دقیقه گذشته با فروشگاه ارتباط داشته است.</p>
            <button onClick={loadStats} disabled={loading} className="inline-flex items-center gap-2 font-semibold text-navy-700 hover:text-navy-900 disabled:opacity-50">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> به‌روزرسانی
            </button>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-7 text-blue-900">
            ثبت‌نام مشتری و سفارش آنلاین در فروشگاه فعلی فعال نیست؛ خریدها از طریق واتساپ انجام می‌شوند، بنابراین این دو عدد فعلاً صفر هستند و از داده جعلی ساخته نمی‌شوند.
          </div>
        </>
      )}
    </section>
  );
}
