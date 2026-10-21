import type { Settings } from '@/lib/types';

interface FooterProps {
  settings: Settings | null;
  navigate: (to: string) => void;
}

export default function Footer({ settings, navigate }: FooterProps) {
  const storeName = settings?.store_name || 'الف تا ی (مزار)';
  return (
    <footer className="mt-12 border-t border-slate-100 bg-navy-800 text-slate-200">
      <div className="container-page py-8 grid gap-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 mb-2">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt={storeName} loading="lazy" className="h-9 w-auto object-contain max-w-[140px] bg-white rounded p-1" />
            ) : (
              <span className="text-xl font-extrabold text-white">{storeName}</span>
            )}
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            فروشگاه آنلاین {storeName} — خرید آسان و مطمئن از طریق واتساپ. محصولات متنوع با قیمت مناسب.
          </p>
        </div>
        <div>
          <h3 className="text-white font-semibold mb-2 text-sm">دسترسی سریع</h3>
          <ul className="space-y-1.5 text-sm text-slate-400">
            <li><button onClick={() => navigate('/')} className="hover:text-white transition">صفحه اصلی</button></li>
            <li><button onClick={() => navigate('/search?q=')} className="hover:text-white transition">جستجوی محصولات</button></li>
            <li><button onClick={() => navigate('/admin')} className="hover:text-white transition">پنل مدیریت</button></li>
          </ul>
        </div>
        <div>
          <h3 className="text-white font-semibold mb-2 text-sm">تماس از طریق واتساپ</h3>
          {settings?.whatsapp_number ? (
            <a
              href={`https://wa.me/${settings.whatsapp_number.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition"
            >
              {settings.whatsapp_number}
            </a>
          ) : (
            <p className="text-sm text-slate-400">شماره واتساپ هنوز تنظیم نشده است.</p>
          )}
        </div>
      </div>
      <div className="border-t border-navy-700 py-3 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} {storeName} — تمام حقوق محفوظ است.
      </div>
    </footer>
  );
}
