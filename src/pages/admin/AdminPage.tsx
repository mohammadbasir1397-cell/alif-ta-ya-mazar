import { useEffect, useState } from 'react';
import {
  LogOut, Box, FolderTree, Settings, Home, Megaphone, Flame, BarChart3,
  LayoutDashboard, ShoppingCart, UserCog, Loader2,
} from 'lucide-react';
import type { Category, ProductWithImages, Settings as SettingsType } from '@/lib/types';
import { fetchCategories, fetchProducts, fetchPrivateSettings, signOutAdmin } from '@/lib/api';
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
    return <AdminGate onSuccess={() => setAuthed(true)} />;
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
