import { useEffect, useState } from 'react';
import type { Category, Settings } from '@/lib/types';
import { fetchSettings, fetchCategories } from '@/lib/api';
import { startAnalyticsTracking } from '@/lib/analytics';
import { useRouter, matchPath } from '@/lib/router';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Homepage from '@/pages/Homepage';
import CategoryPage from '@/pages/CategoryPage';
import SearchPage from '@/pages/SearchPage';
import ProductPage from '@/pages/ProductPage';
import AdminPage from '@/pages/admin/AdminPage';

function App() {
  const { route, navigate } = useRouter();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => startAnalyticsTracking(), []);

  useEffect(() => {
    let active = true;
    (async () => {
      const [s, c] = await Promise.all([fetchSettings(), fetchCategories()]);
      if (!active) return;
      setSettings(s);
      setCategories(c);
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const searchMatch = matchPath('/search', route.path);
    if (searchMatch) {
      const q = decodeURIComponent(route.path.split('?q=')[1] || '');
      setSearchValue(q);
    }
  }, [route.path]);

  const path = route.path.split('?')[0];
  const isAdmin = path === '/admin' || path === '/admin-panel';

  const renderPage = () => {
    if (isAdmin) return <AdminPage settings={settings} navigate={navigate} initialTab={path === '/admin-panel' ? 'analytics' : undefined} />;

    const catMatch = matchPath('/category/:slug', path);
    if (catMatch) return <CategoryPage slug={catMatch.slug} categories={categories} settings={settings} navigate={navigate} />;

    if (path === '/search') {
      const q = decodeURIComponent(route.path.split('?q=')[1] || '');
      return <SearchPage query={q} settings={settings} navigate={navigate} />;
    }

    const prodMatch = matchPath('/product/:id', path);
    if (prodMatch) return <ProductPage id={prodMatch.id} settings={settings} navigate={navigate} />;

    return <Homepage categories={categories} settings={settings} navigate={navigate} />;
  };

  if (isAdmin) {
    return <>{renderPage()}</>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header
        settings={settings}
        categories={categories}
        onSearch={setSearchValue}
        searchValue={searchValue}
        navigate={navigate}
        routePath={path}
      />
      <main className="flex-1">{renderPage()}</main>
      <Footer settings={settings} navigate={navigate} />
    </div>
  );
}

export default App;
