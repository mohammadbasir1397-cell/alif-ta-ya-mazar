import { useEffect, useState } from 'react';
import { getCategoryIcon } from '@/lib/categoryIcons';
import type { Category, ProductWithImages, Settings } from '@/lib/types';
import { fetchProducts } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import Spinner from '@/components/Spinner';

interface CategoryPageProps {
  slug: string;
  categories: Category[];
  settings: Settings | null;
  navigate: (to: string) => void;
}

export default function CategoryPage({ slug, categories, settings, navigate }: CategoryPageProps) {
  const category = categories.find((c) => c.slug === slug) || null;
  const [products, setProducts] = useState<ProductWithImages[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!category) { setLoading(false); return; }
      setLoading(true);
      const data = await fetchProducts({ categoryId: category.id });
      if (!active) return;
      setProducts(data);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [category?.id]);

  if (!category) {
    return (
      <div className="container-page py-16 text-center">
        <p className="text-slate-500 mb-4">این دسته‌بندی پیدا نشد.</p>
        <button onClick={() => navigate('/')} className="text-navy-600 hover:underline">بازگشت به خانه</button>
      </div>
    );
  }

  return (
    <div className="container-page py-6">
      <nav className="text-sm text-slate-500 mb-3">
        <button onClick={() => navigate('/')} className="hover:text-navy-600">خانه</button>
        <span className="mx-1">/</span>
        <span className="text-slate-700">{category.name}</span>
      </nav>

      <div className="flex items-center gap-3 mb-5">
        <div className="h-12 w-12 rounded-full bg-navy-50 flex items-center justify-center overflow-hidden shrink-0">
          {category.image_url ? (
            <img src={category.image_url} alt={category.name} loading="lazy" className="h-full w-full object-cover" />
          ) : (
            (() => { const Icon = getCategoryIcon(category.slug); return <Icon size={22} className="text-navy-500" />; })()
          )}
        </div>
        <h1 className="text-xl font-bold text-navy-700">{category.name}</h1>
        <span className="text-sm text-slate-400">({products.length} محصول)</span>
      </div>

      {loading ? (
        <Spinner label="در حال بارگذاری..." />
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-500 mb-4">هنوز محصولی در این دسته‌بندی اضافه نشده است.</p>
          <button onClick={() => navigate('/')} className="text-navy-600 hover:underline">بازگشت به خانه</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} settings={settings} navigate={navigate} />
          ))}
        </div>
      )}
    </div>
  );
}
