import { useEffect, useState } from 'react';
import { LogOut, Box, FolderTree, Settings, Home, Megaphone, Flame, BarChart3 } from 'lucide-react';
import type { Category, Product, Settings as SettingsType } from '@/lib/types';
import { fetchCategories, fetchProducts } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import AdminGate from './AdminGate';
import ProductsPanel from './ProductsPanel';
import CategoriesPanel from './CategoriesPanel';
import SettingsPanel from './SettingsPanel';
import AnnouncementsPanel from './AnnouncementsPanel';
import BestsellersPanel from './BestsellersPanel';
import AnalyticsPanel from './AnalyticsPanel';

interface AdminPageProps {
  settings: SettingsType | null;
  navigate: (to: string) => void;
  initialTab?: Tab;
}

type Tab = 'analytics' | 'products' | 'categories' | 'bestsellers' | 'announcements' | 'settings';

export default function AdminPage({ settings, navigate, initialTab }: AdminPageProps) {
  const [authed, setAuthed] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [tab, setTab] = useState<Tab>(initialTab || 'products');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSettings, setCurrentSettings] = useState(settings);

  useEffect(() => { setCurrentSettings(settings); }, [settings]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session);
      setCheckingAuth(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session);
    });
    return () => { listener.subscription.unsubscribe(); };
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [cats, prods] = await Promise.all([fetchCategories(), fetchProducts()]);
    setCategories(cats);
    setProducts(prods as Product[]);
    setLoading(false);
  };

  useEffect(() => {
    if (authed) loadData();
  }, [authed]);

  if (checkingAuth) {
    return <div className="container-page py-16 text-center text-slate-500">در حال بررسی...</div>;
  }

  if (!authed) return <AdminGate onSuccess={() => setAuthed(true)} />;
  if (!currentSettings) return <div className="container-page py-16 text-center text-slate-500">تنظیمات بارگذاری نشد.</div>;

  const logout = async () => {
    await supabase.auth.signOut();
    setAuthed(false);
  };

  const tabs: { id: Tab; label: string; icon: typeof Box }[] = [
    { id: 'analytics', label: 'آمار زنده', icon: BarChart3 },
    { id: 'products', label: 'محصولات', icon: Box },
    { id: 'categories', label: 'دسته‌بندی‌ها', icon: FolderTree },
    { id: 'bestsellers', label: 'پرفروش‌ها', icon: Flame },
    { id: 'announcements', label: 'اعلانات', icon: Megaphone },
    { id: 'settings', label: 'تنظیمات', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-navy-700 text-white">
        <div className="container-page flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <span className="font-bold">پنل مدیریت {currentSettings.store_name}</span>
          </div>
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
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${
                tab === t.id ? 'border-navy-600 text-navy-700' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-slate-500 text-center py-12">در حال بارگذاری...</p>
        ) : (
          <>
            {tab === 'analytics' && <AnalyticsPanel />}
            {tab === 'products' && <ProductsPanel categories={categories} products={products} onChanged={loadData} />}
            {tab === 'categories' && <CategoriesPanel categories={categories} onChanged={loadData} />}
            {tab === 'bestsellers' && <BestsellersPanel />}
            {tab === 'announcements' && <AnnouncementsPanel />}
            {tab === 'settings' && <SettingsPanel settings={currentSettings} onUpdated={setCurrentSettings} />}
          </>
        )}
      </div>
    </div>
  );
}
