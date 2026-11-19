import { useEffect, useState } from 'react';
import { Box, FolderTree, Flame, Megaphone, Activity, PackageX, Loader2, RefreshCw } from 'lucide-react';
import type { Category, ProductWithImages, AnalyticsStats } from '@/lib/types';
import { fetchAllAnnouncements, fetchAnalyticsStats } from '@/lib/api';
import { formatAFN } from '@/lib/utils';
import type { Tab } from './AdminPage';

interface DashboardPanelProps {
  products: ProductWithImages[];
  categories: Category[];
  onOpenTab: (tab: Tab) => void;
}

export default function DashboardPanel({ products, categories, onOpenTab }: DashboardPanelProps) {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [announcementCount, setAnnouncementCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setBusy(true);
    const [s, a] = await Promise.all([fetchAnalyticsStats(), fetchAllAnnouncements()]);
    setStats(s);
    setAnnouncementCount(a.length);
    setBusy(false);
  };

  useEffect(() => { load(); }, []);

  const outOfStock = products.filter((p) => !p.in_stock).length;
  const bestsellers = products.filter((p) => p.is_bestseller).length;
  const imageCount = products.reduce((sum, p) => sum + (p.product_images?.length || 0), 0);
  const latest = products.slice(0, 5);

  const cards = [
    { label: 'کل محصولات', value: products.length, icon: Box, tab: 'products' as Tab, color: 'text-navy-600', bg: 'bg-navy-50' },
    { label: 'دسته‌بندی‌ها', value: categories.length, icon: FolderTree, tab: 'categories' as Tab, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'پرفروش‌های منتخب', value: bestsellers, icon: Flame, tab: 'bestsellers' as Tab, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'اعلانات', value: announcementCount ?? '…', icon: Megaphone, tab: 'announcements' as Tab, color: 'text-sky-600', bg: 'bg-sky-50' },
    { label: 'بازدیدکننده فعال', value: stats ? stats.active_visitors : '…', icon: Activity, tab: 'analytics' as Tab, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'ناموجود', value: outOfStock, icon: PackageX, tab: 'products' as Tab, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={c.label}
              onClick={() => onOpenTab(c.tab)}
              className="rounded-xl border border-slate-200 bg-white p-4 text-right shadow-sm hover:border-navy-300 transition"
            >
              <span className={`inline-flex rounded-lg p-2 ${c.bg} ${c.color}`}><Icon size={18} /></span>
              <p className="mt-2 text-2xl font-extrabold text-navy-700">{typeof c.value === 'number' ? c.value.toLocaleString('fa-AF') : c.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{c.label}</p>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-navy-700">آخرین محصولات</h2>
          <button onClick={() => onOpenTab('products')} className="text-sm text-navy-600 hover:text-navy-800">مدیریت محصولات</button>
        </div>
        <div className="space-y-2">
          {latest.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-lg border border-slate-100 p-2.5">
              <div className="h-10 w-10 rounded-md bg-slate-50 overflow-hidden shrink-0 flex items-center justify-center">
                {p.product_images && p.product_images.length > 0 ? (
                  <img src={p.product_images[0].image_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Box size={16} className="text-slate-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{p.name}</p>
                <p className="text-xs text-slate-400">کود: {p.code}</p>
              </div>
              <span className="text-sm text-navy-700 font-semibold shrink-0">
                {formatAFN(p.discount_price != null ? Number(p.discount_price) : Number(p.price))}
              </span>
            </div>
          ))}
          {latest.length === 0 && <p className="text-sm text-slate-500 text-center py-4">هنوز محصولی وجود ندارد.</p>}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
        <p>در مجموع {imageCount.toLocaleString('fa-AF')} تصویر محصول در فروشگاه ذخیره شده است.</p>
        <button onClick={load} disabled={busy} className="inline-flex items-center gap-2 font-semibold text-navy-700 hover:text-navy-900 disabled:opacity-50">
          <RefreshCw size={16} className={busy ? 'animate-spin' : ''} /> به‌روزرسانی آمار
        </button>
      </div>
    </div>
  );
}
