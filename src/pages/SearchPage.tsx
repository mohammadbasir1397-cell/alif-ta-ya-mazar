import { useEffect, useState } from 'react';
import type { ProductWithImages, Settings } from '@/lib/types';
import { fetchProducts } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import Spinner from '@/components/Spinner';

interface SearchPageProps {
  query: string;
  settings: Settings | null;
  navigate: (to: string) => void;
}

export default function SearchPage({ query, settings, navigate }: SearchPageProps) {
  const [results, setResults] = useState<ProductWithImages[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const data = await fetchProducts({ search: query });
      if (!active) return;
      setResults(data);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [query]);

  return (
    <div className="container-page py-6">
      <h1 className="text-lg font-bold text-navy-700 mb-1">نتایج جستجو</h1>
      <p className="text-sm text-slate-500 mb-5">
        {query ? `برای «${query}»` : 'همه محصولات'} — {results.length} نتیجه
      </p>

      {loading ? (
        <Spinner />
      ) : results.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-500 mb-4">هیچ محصولی پیدا نشد.</p>
          <button onClick={() => navigate('/')} className="text-navy-600 hover:underline">بازگشت به خانه</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
          {results.map((p) => (
            <ProductCard key={p.id} product={p} settings={settings} navigate={navigate} />
          ))}
        </div>
      )}
    </div>
  );
}
