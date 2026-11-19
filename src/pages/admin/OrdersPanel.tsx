import { ShoppingCart } from 'lucide-react';

export default function OrdersPanel() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
      <ShoppingCart size={36} className="mx-auto text-slate-300 mb-3" />
      <h2 className="text-base font-bold text-navy-700 mb-2">مدیریت سفارش‌ها</h2>
      <p className="text-sm text-slate-500 leading-7 max-w-lg mx-auto">
        در فروشگاه فعلی، مشتریان سفارش‌های خود را از طریق واتساپ ارسال می‌کنند و سفارش‌ها در پایگاه داده ذخیره نمی‌شوند؛
        بنابراین در حال حاضر سفارشی برای نمایش وجود ندارد و هیچ داده‌ای از دست نرفته است.
        اگر می‌خواهید مشتریان بتوانند سفارش را مستقیماً در سایت ثبت کنند و سفارش‌ها در همین بخش نمایش داده شوند،
        بخش ثبت سفارش آنلاین باید به صفحه محصول اضافه شود — کافی است آن را درخواست کنید.
      </p>
    </div>
  );
}
