import { useEffect, useState } from 'react';
import { ChevronLeft, Flame, ArrowLeft } from 'lucide-react';
import { getCategoryIcon } from '@/lib/categoryIcons';
import type { Announcement, AnnouncementSettings, Category, ProductWithImages, Settings } from '@/lib/types';
import { fetchProducts, fetchActiveAnnouncements, fetchBestsellers, fetchAnnouncementSettings } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import AnnouncementSlider from '@/components/AnnouncementSlider';
import Spinner from '@/components/Spinner';

interface HomepageProps {
  categories: Category[];
  settings: Settings | null;
  navigate: (to: string) => void;
}

export default function Homepage({ categories, settings, navigate }: HomepageProps) {
  const [newProducts, setNewProducts] = useState<ProductWithImages[]>([]);
  const [discounted, setDiscounted] = useState<ProductWithImages[]>([]);
  const [popular, setPopular] = useState<ProductWithImages[]>([]);
  const [bestsellers, setBestsellers] = useState<ProductWithImages[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [annSettings, setAnnSettings] = useState<AnnouncementSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const [n, d, p, bs, ann, annSet] = await Promise.all([
        fetchProducts({ isNew: true }),
        fetchProducts({ isDiscounted: true }),
        fetchProducts({ isPopular: true }),
        fetchBestsellers(),
        fetchActiveAnnouncements(),
        fetchAnnouncementSettings(),
      ]);
      if (!active) return;
      setNewProducts(n);
      setDiscounted(d);
      setPopular(p);
      setBestsellers(bs);
      setAnnouncements(ann);
      setAnnSettings(annSet);
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  const heroOverlay = settings?.hero_overlay ?? 50;
  const heroPos = settings?.hero_text_position || 'center';
  const posClass =
    heroPos === 'right' ? 'items-start text-right' : heroPos === 'left' ? 'items-end text-left' : 'items-center text-center';

  return (
    <div>
      {/* Hero Cover */}
      <section className="relative">
        {settings?.hero_image_url ? (
          <img
            src={settings.hero_image_url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            fetchPriority="high"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-l from-navy-800 to-navy-600" />
        )}
        <div
          className="absolute inset-0 bg-navy-900"
          style={{ opacity: heroOverlay / 100 }}
        />
        <div className={`relative container-page py-12 md:py-20 flex flex-col ${posClass} gap-3`}>
          <h1 className="text-2xl md:text-4xl font-extrabold text-white drop-shadow-lg">
            {settings?.store_name || 'الف تا ی (مزار)'}
          </h1>
          <p className="text-sm md:text-lg text-white/90 max-w-xl leading-relaxed drop-shadow-md">
            {settings?.hero_text || 'به فروشگاه آنلاین ما خوش آمدید. محصولات متنوع را انتخاب کنید و به راحتی از طریق واتساپ سفارش دهید.'}
          </p>
        </div>
      </section>

      {/* Announcements Slider */}
      {announcements.length > 0 && (
        <section className="container-page pt-4">
          <AnnouncementSlider announcements={announcements} settings={annSettings} navigate={navigate} />
        </section>
      )}

      {/* Categories */}
      <section className="container-page py-8">
        <h2 className="text-lg font-bold text-navy-700 mb-4">دسته‌بندی محصولات</h2>
        {categories.length === 0 ? (
          <p className="text-sm text-slate-500">هنوز دسته‌بندی اضافه نشده است.</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-3">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => navigate(`/category/${c.slug}`)}
                className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 hover:border-navy-400 hover:shadow-md transition-all"
              >
                <div className="h-14 w-14 rounded-full bg-navy-50 flex items-center justify-center overflow-hidden">
                  {c.image_url ? (
                    <img src={c.image_url} alt={c.name} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    (() => { const Icon = getCategoryIcon(c.slug); return <Icon size={24} className="text-navy-500" />; })()
                  )}
                </div>
                <span className="text-xs font-medium text-slate-700 text-center line-clamp-2 leading-tight">{c.name}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {loading ? (
        <Spinner label="در حال بارگذاری محصولات..." />
      ) : (
        <div className="container-page pb-8 space-y-10">
          {/* Best-Sellers */}
          {bestsellers.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-navy-700 flex items-center gap-2">
                  <Flame size={20} className="text-accent-500" />
                  محصولات پرفروش
                </h2>
                <button onClick={() => navigate('/search?q=')} className="text-sm text-navy-500 hover:text-navy-700 flex items-center gap-0.5">
                  مشاهده همه محصولات
                  <ArrowLeft size={16} />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                {bestsellers.slice(0, 10).map((p) => (
                  <ProductCard key={p.id} product={p} settings={settings} navigate={navigate} />
                ))}
              </div>
            </section>
          )}

          <Section title="محصولات جدید" products={newProducts} settings={settings} navigate={navigate} navigateAll="/search?q=" />
          <Section title="محصولات تخفیف‌دار" products={discounted} settings={settings} navigate={navigate} />
          <Section title="محصولات محبوب" products={popular} settings={settings} navigate={navigate} />
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  products,
  settings,
  navigate,
  navigateAll,
}: {
  title: string;
  products: ProductWithImages[];
  settings: Settings | null;
  navigate: (to: string) => void;
  navigateAll?: string;
}) {
  if (products.length === 0) return null;
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-navy-700">{title}</h2>
        {navigateAll && (
          <button onClick={() => navigate(navigateAll)} className="text-sm text-navy-500 hover:text-navy-700 flex items-center gap-0.5">
            مشاهده همه
            <ChevronLeft size={16} />
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
        {products.slice(0, 10).map((p) => (
          <ProductCard key={p.id} product={p} settings={settings} navigate={navigate} />
        ))}
      </div>
    </section>
  );
}
