import React, { memo, useEffect, useMemo, useState, useTransition, Suspense } from 'react';

// ۱. بهینه‌سازی کارت محصول و اصلاح خودکار مسیر عکس‌ها برای لود صحیح در موبایل و گیت‌هاب پیجز
const ProductCard = memo(function ProductCard({ product }: { product: any }) {
  const imageUrl = product.image && product.image.startsWith('/') 
    ? `./${product.image.slice(1)}` 
    : product.image;

  return (
    <article className="product-card">
      <img
        src={imageUrl} 
        alt={product.name}
        loading="lazy"         // بارگذاری تنبل برای محصولات پایین صفحه
        decoding="async"       // پردازش تصویر در پس‌زمینه بدون کند کردن اسکرول مرورگر
        width={400}
        height={400}
      />
      <h3>{product.name}</h3>
      <p>{product.price}</p>
    </article>
  );
});

function HomePage({ products }: { products: any[] }) {
  // مموایز کردن ۲۰ محصول اول برای جلوگیری از تکرار پردازش سنگین آرایه‌ها
  const visibleProducts = useMemo(
    () => products.slice(0, 20),
    [products]
  );

  return (
    <section className="product-grid">
      {visibleProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </section>
  );
}

export default function App() {
  // ۲. ترفند سرعت بالا: لود آنی تنظیمات سایت از کش مرورگر برای حذف سفید شدن صفحه در لودهای بعدی
  const [settings, setSettings] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('app_settings');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });
  
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  // استفاده از قابلیت Concurrent در ری‌اکت ۱۸ برای روان‌تر شدن تغییرات استیت سایت
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        // دریافت تنظیمات اولیه سایت در صورتی که در کش نباشد
        if (!settings) {
          const settingsResult = await fetchSettings();
          if (active) {
            setSettings(settingsResult);
            localStorage.setItem('app_settings', JSON.stringify(settingsResult));
          }
        }

        // دریافت مستقل و غیرمسدودکننده (Non-blocking) دسته‌بندی‌ها
        if (typeof fetchCategories === 'function') {
          fetchCategories().then((categoriesResult) => {
            if (active) setCategories(categoriesResult);
          });
        }

        // دریافت مستقل محصولات فروشگاه و اعمال با لودر هوشمند برای جلوگیری از فریز شدن UI
        if (typeof fetchProducts === 'function') {
          fetchProducts().then((productsResult) => {
            if (active) {
              startTransition(() => {
                setProducts(productsResult);
              });
            }
          });
        }

      } catch (error) {
        console.error("خطا در دریافت اطلاعات سایت:", error);
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [settings]);

  // نمایش اسکلتون موقت تا زمانی که ساختار و منوی اصلی سایت لود شود
  if (!settings) {
    return <div className="app-shell-placeholder">در حال بارگذاری سایت...</div>;
  }

  return (
    <div className={`app-container ${isPending ? 'app-loading' : ''}`}>
      <Header settings={settings} categories={categories} />
      
      {/* مدیریت هوشمند وضعیت بارگذاری لیست محصولات */}
      <Suspense fallback={<div className="loading-spinner">در حال دریافت محصولات...</div>}>
        <HomePage products={products} />
      </Suspense>
    </div>
  );
}
