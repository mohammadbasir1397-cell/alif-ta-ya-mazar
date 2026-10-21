import { useEffect, useState } from 'react';
import { ArrowUp, ArrowDown, Star, StarOff, Search } from 'lucide-react';
import type { Product } from '@/lib/types';
import { fetchProducts, toggleBestseller } from '@/lib/api';
import { formatAFN } from '@/lib/utils';

export default function BestsellersPanel() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [bestsellers, setBestsellers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    const data = await fetchProducts();
    setAllProducts(data as Product[]);
    setBestsellers(data.filter((p) => p.is_bestseller).sort((a, b) => a.bestseller_order - b.bestseller_order));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (p: Product) => {
    if (p.is_bestseller) {
      await toggleBestseller(p.id, false, 0);
    } else {
      await toggleBestseller(p.id, true, bestsellers.length);
    }
    load();
  };

  const move = async (p: Product, dir: -1 | 1) => {
    const sorted = [...bestsellers];
    const idx = sorted.findIndex((x) => x.id === p.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const other = sorted[swapIdx];
    await Promise.all([
      toggleBestseller(p.id, true, other.bestseller_order),
      toggleBestseller(other.id, true, p.bestseller_order),
    ]);
    load();
  };

  const filtered = allProducts.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Current bestsellers */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-bold text-navy-700 mb-3">محصولات پرفروش منتخب ({bestsellers.length})</h2>
        {loading ? (
          <p className="text-sm text-slate-500 text-center py-4">در حال بارگذاری...</p>
        ) : bestsellers.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">هنوز محصول پرفروشی انتخاب نشده است. از لیست پایین انتخاب کنید.</p>
        ) : (
          <div className="space-y-2">
            {bestsellers.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 rounded-lg border border-slate-200 p-2.5">
                <span className="flex items-center justify-center h-7 w-7 rounded-full bg-accent-500 text-white text-xs font-bold shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{p.name}</p>
                  <p className="text-xs text-slate-400">کود: {p.code}</p>
                </div>
                <div className="flex gap-0.5 shrink-0">
                  <button onClick={() => move(p, -1)} disabled={i === 0} className="p-1.5 text-slate-400 hover:text-navy-600 disabled:opacity-30"><ArrowUp size={14} /></button>
                  <button onClick={() => move(p, 1)} disabled={i === bestsellers.length - 1} className="p-1.5 text-slate-400 hover:text-navy-600 disabled:opacity-30"><ArrowDown size={14} /></button>
                </div>
                <button onClick={() => handleToggle(p)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-md transition" title="حذف از پرفروش‌ها">
                  <StarOff size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product picker */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-bold text-navy-700 mb-3">انتخاب محصولات پرفروش</h2>
        <div className="relative mb-3">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجوی محصول..." className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pr-10 pl-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy-400 focus:bg-white" />
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
        <div className="max-h-80 overflow-y-auto space-y-1">
          {filtered.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-lg border border-slate-100 p-2.5 hover:bg-slate-50 transition">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{p.name}</p>
                <p className="text-xs text-slate-400">کود: {p.code} • {formatAFN(p.discount_price != null ? Number(p.discount_price) : Number(p.price))}</p>
              </div>
              {p.is_bestseller ? (
                <button onClick={() => handleToggle(p)} className="inline-flex items-center gap-1 text-xs text-rose-600 hover:bg-rose-50 px-2 py-1.5 rounded-md">
                  <StarOff size={14} /> حذف
                </button>
              ) : (
                <button onClick={() => handleToggle(p)} className="inline-flex items-center gap-1 text-xs text-navy-600 hover:bg-navy-50 px-2 py-1.5 rounded-md">
                  <Star size={14} /> افزودن
                </button>
              )}
            </div>
          ))}
          {filtered.length === 0 && <p className="text-sm text-slate-400 text-center py-4">محصولی پیدا نشد.</p>}
        </div>
      </div>
    </div>
  );
}
