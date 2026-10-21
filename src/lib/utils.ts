/** Format a number as Afghan Afghani (AFN) currency in Dari. */
export function formatAFN(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '';
  return `${new Intl.NumberFormat('fa-AF', { maximumFractionDigits: 0 }).format(amount)} افغانى`;
}

/** Convert digits in a string to Persian/Dari digits. */
export function toFaDigits(input: string | number): string {
  const fa = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(input).replace(/\d/g, (d) => fa[Number(d)]);
}

/** Build a WhatsApp order link with a prefilled message for a product. */
export function buildWhatsAppLink(
  phone: string | null | undefined,
  productName: string,
  productCode: string,
  price: string
): string {
  const number = (phone || '').replace(/\D/g, '');
  if (!number) return '#';
  const text = encodeURIComponent(
    `سلام، می‌خواهم این محصول را سفارش دهم:\n\n` +
      `نام محصول: ${productName}\n` +
      `کود محصول: ${productCode}\n` +
      `قیمت: ${price}\n\n` +
      `لطفاً اطلاعات بیشتر و نحوه پرداخت را بفرمایید.`
  );
  return `https://wa.me/${number}?text=${text}`;
}

/** Create a URL-friendly slug from a Persian/Dari string. */
export function slugify(input: string): string {
  const base = input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\u0600-\u06FFa-z0-9-]/g, '');
  const random = Math.random().toString(36).slice(2, 8);
  return `${base || 'item'}-${random}`;
}
