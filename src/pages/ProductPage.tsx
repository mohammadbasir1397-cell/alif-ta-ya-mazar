import { useEffect, useState } from 'react';
import { MessageCircle, ChevronLeft, Tag, CheckCircle2, XCircle } from 'lucide-react';
import type { ProductWithImages, Settings } from '@/lib/types';
import { fetchProductById } from '@/lib/api';
import { formatAFN, buildWhatsAppLink, thumbUrl } from '@/lib/utils';
import Spinner from '@/components/Spinner';

interface ProductPageProps {
  id: string;
  settings: Settings | null;
  navigate: (to: string) => void;
}

export default function ProductPage({ id, settings, navigate }: ProductPageProps) {
  const [product, setProduct] = useState<ProductWithImages | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setActiveImage(0);
      const data = await fetchProductById(id);
      if (!active) return;
      setProduct(data);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    setActiveImage(0);
  }, [id]);

  if (loading) return <Spinner label="در حال بارگذاری محصول..." />;

  if (!product) {
    return (
      <div className="container-page py-16 text-center">
        <p className="text-slate-500 mb-4">محصول پیدا نشد.</p>
        <button onClick={() => navigate('/')} className="text-navy-600 hover:underline">بازگشت به خانه</button>
      </div>
    );
  }

  const images = product.product_images || [];
  const cover = images[activeImage]?.image_url || null;
  const hasDiscount = product.discount_price != null && Number(product.discount_price) < Number(product.price);
  const effectivePrice = hasDiscount ? Number(product.discount_price) : Number(product.price);
  const waLink = buildWhatsAppLink(settings?.whatsapp_number, product.name, product.code, formatAFN(effectivePrice));

  return (
    <div className="container-page py-6">
      <nav className="text-sm text-slate-500 mb-4">
        <button onClick={() => navigate('/')} className="hover:text-navy-600">خانه</button>
        {product.category && (
          <>
            <span className="mx-1">/</span>
            <button onClick={() => navigate(`/category/${product.category!.slug}`)} className="hover:text-navy-600">
              {product.category.name}
            </button>
          </>
        )}
        <span className="mx-1">/</span>
        <span className="text-slate-700">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Images */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative order-1 flex-1 rounded-xl border border-slate-200 bg-slate-50 aspect-square flex items-center justify-center overflow-hidden">
            {cover ? (
              <img key={cover} src={cover} alt={product.name} width={600} height={600} className="h-full w-full object-contain animate-image-fade" />
            ) : (
              <Tag size={56} className="text-slate-300" />
            )}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImage((activeImage - 1 + images.length) % images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-navy-700 shadow-md transition hover:bg-white"
                  aria-label="تصویر قبلی"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setActiveImage((activeImage + 1) % images.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-navy-700 shadow-md transition hover:bg-white"
                  aria-label="تصویر بعدی"
                >
                  <ChevronLeft size={18} className="rotate-180" />
                </button>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="order-2 flex shrink-0 gap-2 overflow-x-auto pb-1 sm:w-20 sm:flex-col sm:overflow-y-auto sm:overflow-x-hidden sm:pb-0">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(i)}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-slate-50 transition sm:h-20 sm:w-20 ${
                    i === activeImage ? 'border-navy-600 ring-2 ring-navy-100' : 'border-slate-200 hover:border-navy-300'
                  }`}
                  aria-label={`نمایش تصویر ${i + 1}`}
                >
                  <img src={thumbUrl(img.image_url, 160, 70)} alt="" loading="lazy" width={80} height={80} className="h-full w-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {product.is_new && <span className="bg-accent-500 text-white text-xs font-bold px-2 py-0.5 rounded">جدید</span>}
              {product.is_popular && <span className="bg-navy-700 text-white text-xs font-bold px-2 py-0.5 rounded">محبوب</span>}
              {hasDiscount && <span className="bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded">تخفیف</span>}
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-navy-700 leading-relaxed">{product.name}</h1>
            <p className="text-sm text-slate-500 mt-1">کود محصول: {product.code}</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-2xl font-extrabold text-navy-700">{formatAFN(effectivePrice)}</span>
            {hasDiscount && (
              <span className="text-base text-slate-400 line-through">{formatAFN(Number(product.price))}</span>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm">
            {product.in_stock ? (
              <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                <CheckCircle2 size={16} /> موجود
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-rose-600 font-medium">
                <XCircle size={16} /> ناموجود
              </span>
            )}
          </div>

          {product.description && (
            <div className="text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
              <h2 className="font-semibold text-slate-700 mb-1">توضیحات</h2>
              <p className="whitespace-pre-wrap">{product.description}</p>
            </div>
          )}

          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center justify-center gap-2 rounded-xl py-3 text-base font-bold transition-colors mt-2 ${
              product.in_stock ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-slate-300 text-slate-600 pointer-events-none'
            }`}
          >
            <MessageCircle size={20} />
            خرید از واتساپ
          </a>

          <button onClick={() => navigate('/')} className="inline-flex items-center justify-center gap-1 text-sm text-slate-500 hover:text-navy-600 mt-1">
            <ChevronLeft size={16} />
            بازگشت به خانه
          </button>
        </div>
      </div>
    </div>
  );
}
