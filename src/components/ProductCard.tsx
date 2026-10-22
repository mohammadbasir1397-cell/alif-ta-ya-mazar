import { MessageCircle, Tag } from 'lucide-react';
import type { ProductWithImages } from '@/lib/types';
import type { Settings } from '@/lib/types';
import { formatAFN, buildWhatsAppLink, thumbUrl } from '@/lib/utils';

interface ProductCardProps {
  product: ProductWithImages;
  settings: Settings | null;
  navigate: (to: string) => void;
}

export default function ProductCard({ product, settings, navigate }: ProductCardProps) {
  const images = product.product_images || [];
  const cover = images.length > 0 ? images[0].image_url : null;
  const hasDiscount = product.discount_price != null && Number(product.discount_price) < Number(product.price);
  const effectivePrice = hasDiscount ? Number(product.discount_price) : Number(product.price);

  const waLink = buildWhatsAppLink(settings?.whatsapp_number, product.name, product.code, formatAFN(effectivePrice));

  return (
    <div className="group flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <button onClick={() => navigate(`/product/${product.id}`)} className="relative block bg-slate-50 aspect-square overflow-hidden">
        {cover ? (
          <img
            src={thumbUrl(cover, 400, 75)}
            alt={product.name}
            loading="lazy"
            width={400}
            height={400}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-slate-300">
            <Tag size={40} />
          </div>
        )}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {product.is_new && (
            <span className="bg-accent-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">جدید</span>
          )}
          {hasDiscount && (
            <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">تخفیف</span>
          )}
          {product.is_popular && (
            <span className="bg-navy-700 text-white text-[10px] font-bold px-2 py-0.5 rounded">محبوب</span>
          )}
        </div>
        {!product.in_stock && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="bg-slate-700 text-white text-xs px-3 py-1 rounded">ناموجود</span>
          </div>
        )}
      </button>

      <div className="flex flex-col gap-2 p-3 flex-1">
        <button onClick={() => navigate(`/product/${product.id}`)} className="text-right">
          <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 leading-relaxed min-h-[2.5rem]">{product.name}</h3>
        </button>

        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-base font-bold text-navy-700">{formatAFN(effectivePrice)}</span>
          {hasDiscount && (
            <span className="text-xs text-slate-400 line-through">{formatAFN(Number(product.price))}</span>
          )}
        </div>

        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className={`mt-auto inline-flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-bold transition-colors ${
            product.in_stock
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-slate-300 text-slate-600 pointer-events-none'
          }`}
        >
          <MessageCircle size={16} />
          خرید از واتساپ
        </a>
      </div>
    </div>
  );
}
