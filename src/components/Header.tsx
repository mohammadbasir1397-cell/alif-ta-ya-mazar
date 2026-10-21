import { Search, Menu, X, ShieldCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Settings } from '@/lib/types';
import { matchPath } from '@/lib/router';

interface HeaderProps {
  settings: Settings | null;
  categories: { id: string; name: string; slug: string }[];
  onSearch: (q: string) => void;
  searchValue: string;
  navigate: (to: string) => void;
  routePath: string;
}

export default function Header({ settings, categories, onSearch, searchValue, navigate, routePath }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const storeName = settings?.store_name || 'الف تا ی (مزار)';
  const isHome = routePath === '/';
  const isCategory = !!matchPath('/category/:slug', routePath);

  return (
    <header className={`sticky top-0 z-50 bg-white transition-shadow ${scrolled ? 'shadow-md' : 'shadow-sm'}`}>
      <div className="border-b border-slate-100 bg-navy-700 text-white text-xs">
        <div className="container-page flex items-center justify-between py-1.5">
          <span className="opacity-90">فروشگاه آنلاین {storeName}</span>
          <button onClick={() => navigate('/admin')} className="flex items-center gap-1 opacity-90 hover:opacity-100 transition-opacity">
            <ShieldCheck size={14} />
            <span>پنل مدیریت</span>
          </button>
        </div>
      </div>

      <div className="container-page flex items-center gap-3 py-3">
        <button
          onClick={() => setMobileOpen((o) => !o)}
          className="md:hidden text-navy-700"
          aria-label="منو"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <button onClick={() => navigate('/')} className="flex items-center gap-2 shrink-0">
          {settings?.logo_url ? (
            <img src={settings.logo_url} alt={storeName} fetchPriority="high" className="h-11 w-auto object-contain max-w-[160px]" />
          ) : (
            <span className="text-2xl font-extrabold text-navy-700">{storeName}</span>
          )}
        </button>

        <div className="flex-1 max-w-xl mx-auto">
          <div className="relative">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/search?q=${encodeURIComponent(searchValue)}`); }}
              placeholder="جستجوی محصولات..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pr-10 pl-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy-400 focus:bg-white transition"
            />
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Desktop categories */}
      <nav className="hidden md:block border-t border-slate-100 bg-white">
        <div className="container-page flex items-center gap-1 overflow-x-auto py-2">
          <button
            onClick={() => navigate('/')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
              isHome ? 'bg-navy-700 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            خانه
          </button>
          {categories.map((c) => {
            const active = matchPath('/category/:slug', routePath)?.slug === c.slug;
            return (
              <button
                key={c.id}
                onClick={() => navigate(`/category/${c.slug}`)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  active ? 'bg-navy-700 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <nav className="md:hidden border-t border-slate-100 bg-white">
          <div className="container-page flex flex-col py-2">
            <button
              onClick={() => { navigate('/'); setMobileOpen(false); }}
              className={`text-right px-3 py-2 rounded-md text-sm font-medium ${isHome ? 'bg-navy-700 text-white' : 'text-slate-700'}`}
            >
              خانه
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => { navigate(`/category/${c.slug}`); setMobileOpen(false); }}
                className={`text-right px-3 py-2 rounded-md text-sm font-medium ${isCategory ? 'text-slate-700' : 'text-slate-700'} hover:bg-slate-100`}
              >
                {c.name}
              </button>
            ))}
            <button
              onClick={() => { navigate('/admin'); setMobileOpen(false); }}
              className="text-right px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100 border-t border-slate-100 mt-1"
            >
              پنل مدیریت
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}
