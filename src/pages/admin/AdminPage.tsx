import { useEffect, useState } from 'react';
import {
  LogOut, Box, FolderTree, Settings, Home, Megaphone, Flame, BarChart3,
  LayoutDashboard, ShoppingCart, UserCog, Loader2,
} from 'lucide-react';
import type { Category, ProductWithImages, Settings as SettingsType } from '@/lib/types';
import { fetchCategories, fetchProducts, fetchPrivateSettings, signOutAdmin, changeAdminPassword } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import AdminGate from './AdminGate';
import DashboardPanel from './DashboardPanel';
import ProductsPanel from './ProductsPanel';
import CategoriesPanel from './CategoriesPanel';
import OrdersPanel from './OrdersPanel';
import SettingsPanel from './SettingsPanel';
import AnnouncementsPanel from './AnnouncementsPanel';
import BestsellersPanel from './BestsellersPanel';
import AnalyticsPanel from './AnalyticsPanel';
import AccountPanel from './AccountPanel';

interface AdminPageProps {
  settings: SettingsType | null;
  navigate: (to: string) => void;
  initialTab?: Tab;
}

type Tab = 'dashboard' | 'analytics' | 'products' | 'categories' | 'orders' | 'bestsellers' | 'announcements' | 'settings' | 'account';

export type { Tab };

export default function AdminPage({ settings, navigate, initialTab }: AdminPageProps) {
  // null = session check in progress
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [tab, setTab] = useState<Tab>(initialTab || 'dashboard');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductWithImages[]>([]);
  const [currentSettings, setCurrentSettings] = useState<SettingsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [cats, prods, priv] = await Promise.all([fetchCategories(), fetchProducts(), fetchPrivateSettings()]);
    setCategories(cats);
    setProducts(prods);
    setCurrentSettings(priv);
    setLoading(false);
  };

  useEffect(() => {
    if (authed) loadData();
  }, [authed]);

  if (authed === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400">
        <Loader2 size={24} className="animate-spin" />
      </div>
    );
  }

  if (!authed) {
    return <AdminGate onSuccess={(needsChange) => { setMustChangePassword(needsChange); setAuthed(true); }} />;
  }

  if (mustChangePassword) {
    return (
      <ForceChangePassword
        onDone={() => setMustChangePassword(false)}
        onSkip={async () => {
          await signOutAdmin();
          setMustChangePassword(false);
          setAuthed(false);
        }}
      />
    );
  }

  const logout = async () => {
    await signOutAdmin();
    setAuthed(false);
  };

  const storeName = currentSettings?.store_name || settings?.store_name || 'فروشگاه';

  const tabs: { id: Tab; label: string; icon: typeof Box }[] = [
    { id: 'dashboard', label: 'نمای کلی', icon: LayoutDashboard },
    { id: 'analytics', label: 'آمار زنده', icon: BarChart3 },
    { id: 'products', label: 'محصولات', icon: Box },
    { id: 'categories', label: 'دسته‌بندی‌ها', icon: FolderTree },
    { id: 'orders', label: 'سفارش‌ها', icon: ShoppingCart },
    { id: 'bestsellers', label: 'پرفروش‌ها', icon: Flame },
    { id: 'announcements', label: 'اعلانات', icon: Megaphone },
    { id: 'settings', label: 'تنظیمات', icon: Settings },
    { id: 'account', label: 'حساب کاربری', icon: UserCog },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-navy-700 text-white">
        <div className="container-page flex items-center justify-between py-3">
          <span className="font-bold">پنل مدیریت {storeName}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/')} className="flex items-center gap-1 text-sm text-slate-200 hover:text-white transition">
              <Home size={16} /> مشاهده فروشگاه
            </button>
            <button onClick={logout} className="flex items-center gap-1 text-sm text-slate-200 hover:text-white transition">
              <LogOut size={16} /> خروج
            </button>
          </div>
        </div>
      </div>

      <div className="container-page py-5">
        <div className="flex gap-1 mb-5 border-b border-slate-200 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition ${
                tab === t.id ? 'border-navy-600 text-navy-700' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-slate-500 text-center py-12 flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" /> در حال بارگذاری...
          </p>
        ) : (
          <>
            {tab === 'dashboard' && <DashboardPanel products={products} categories={categories} onOpenTab={setTab} />}
            {tab === 'analytics' && <AnalyticsPanel />}
            {tab === 'products' && <ProductsPanel categories={categories} products={products} onChanged={loadData} />}
            {tab === 'categories' && <CategoriesPanel categories={categories} onChanged={loadData} />}
            {tab === 'orders' && <OrdersPanel />}
            {tab === 'bestsellers' && <BestsellersPanel />}
            {tab === 'announcements' && <AnnouncementsPanel />}
            {tab === 'settings' && currentSettings && <SettingsPanel settings={currentSettings} onUpdated={setCurrentSettings} />}
            {tab === 'account' && <AccountPanel onSignedOut={() => setAuthed(false)} />}
          </>
        )}
      </div>
    </div>
  );
}

function ForceChangePassword({ onDone, onSkip }: { onDone: () => void; onSkip: () => void }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError('');
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
      onDone();
    } else {
      setError('تغییر رمز ناموفق بود. دوباره تلاش کنید.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm w-full max-w-md">
        <h1 className="text-lg font-bold text-navy-700 mb-1">تغییر رمز عبور</h1>
        <p className="text-sm text-slate-500 mb-4 leading-6">
          شما با رمز موقت وارد شده‌اید. برای امنیت فروشگاه، ابتدا یک رمز عبور جدید و شخصی انتخاب کنید تا به پنل دسترسی پیدا کنید.
        </p>
        <div className="space-y-3">
          <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} placeholder="رمز عبور جدید (حداقل ۶ کاراکتر)" className="aty-input" dir="ltr" />
          <input type="password" value={confirm} onChange={(e) => { setConfirm(e.target.value); setError(''); }} placeholder="تکرار رمز عبور جدید" className="aty-input" dir="ltr" />
          {error && <p className="text-xs text-rose-600">{error}</p>}
          <button onClick={submit} disabled={busy} className="w-full rounded-lg bg-navy-700 text-white py-2.5 text-sm font-bold hover:bg-navy-800 disabled:opacity-50 flex items-center justify-center gap-2">
            {busy && <Loader2 size={16} className="animate-spin" />} ذخیره رمز جدید و ادامه
          </button>
          <button onClick={onSkip} className="w-full text-xs text-slate-400 hover:text-slate-600">انصراف و خروج</button>
        </div>
      </div>
    </div>
  );
}
