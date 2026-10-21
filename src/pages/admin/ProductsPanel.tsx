import { useState } from 'react';
import { Plus, Trash2, Pencil, Loader2, X, Upload, Tag, Eye, Check } from 'lucide-react';
import type { Category, Product, ProductImage } from '@/lib/types';
import { createProduct, updateProduct, deleteProduct, addProductImage, deleteProductImage, uploadImage } from '@/lib/api';
import { STORAGE_BUCKETS } from '@/lib/supabase';
import { formatAFN } from '@/lib/utils';
import { ConfirmDialog } from './CategoriesPanel';

interface ProductsPanelProps {
  categories: Category[];
  products: Product[];
  onChanged: () => void;
}

export default function ProductsPanel({ categories, products, onChanged }: ProductsPanelProps) {
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);

  const catName = (id: string | null) => categories.find((c) => c.id === id)?.name || '—';

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-navy-700">محصولات ({products.length})</h2>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="inline-flex items-center gap-1.5 rounded-lg bg-navy-700 text-white px-3 py-2 text-sm font-bold hover:bg-navy-800 transition">
          <Plus size={16} /> افزودن محصول
        </button>
      </div>

      <div className="space-y-2">
        {products.map((p) => (
          <div key={p.id} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-slate-800 truncate">{p.name}</p>
                <span className="text-xs text-slate-400">کود: {p.code}</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {catName(p.category_id)} • {formatAFN(p.discount_price != null ? Number(p.discount_price) : Number(p.price))}
                {!p.in_stock && ' • ناموجود'}
              </p>
              <div className="flex gap-1 mt-1">
                {p.is_new && <span className="bg-accent-100 text-accent-700 text-[10px] px-1.5 py-0.5 rounded">جدید</span>}
                {p.is_popular && <span className="bg-navy-100 text-navy-700 text-[10px] px-1.5 py-0.5 rounded">محبوب</span>}
                {p.is_discounted && <span className="bg-rose-100 text-rose-700 text-[10px] px-1.5 py-0.5 rounded">تخفیف</span>}
              </div>
            </div>
            <button onClick={() => setPreviewProduct(p)} className="p-2 text-slate-500 hover:text-navy-600 hover:bg-navy-50 rounded-md transition" title="پیش‌نمایش">
              <Eye size={16} />
            </button>
            <button onClick={() => { setEditing(p); setShowForm(true); }} className="p-2 text-slate-500 hover:text-navy-600 hover:bg-navy-50 rounded-md transition">
              <Pencil size={16} />
            </button>
            <button onClick={() => setConfirmDelete(p)} className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {products.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-8">هنوز محصولی وجود ندارد.</p>
        )}
      </div>

      {showForm && (
        <ProductForm
          product={editing}
          categories={categories}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); onChanged(); }}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="حذف محصول"
          message={`آیا از حذف «${confirmDelete.name}» مطمئن هستید؟ تمام تصاویر این محصول نیز حذف خواهند شد.`}
          onConfirm={async () => {
            await deleteProduct(confirmDelete.id);
            setConfirmDelete(null);
            onChanged();
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {previewProduct && (
        <PreviewModal product={previewProduct} catName={catName(previewProduct.category_id)} onClose={() => setPreviewProduct(null)} />
      )}
    </div>
  );
}

function ProductForm({ product, categories, onClose, onSaved }: { product: Product | null; categories: Category[]; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(product?.name || '');
  const [code, setCode] = useState(product?.code || '');
  const [description, setDescription] = useState(product?.description || '');
  const [price, setPrice] = useState(String(product?.price ?? ''));
  const [discountPrice, setDiscountPrice] = useState(product?.discount_price != null ? String(product.discount_price) : '');
  const [categoryId, setCategoryId] = useState(product?.category_id || '');
  const [isNew, setIsNew] = useState(product?.is_new || false);
  const [isPopular, setIsPopular] = useState(product?.is_popular || false);
  const [isDiscounted, setIsDiscounted] = useState(product?.is_discounted || false);
  const [inStock, setInStock] = useState(product?.in_stock ?? true);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [createdId, setCreatedId] = useState<string | null>(product?.id || null);

  const handleImages = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const url = await uploadImage(STORAGE_BUCKETS.products, file);
      if (url && createdId) {
        const img = await addProductImage(createdId, url, images.length);
        if (img) setImages((prev) => [...prev, img]);
      } else if (url) {
        // temporarily store until product saved
        setImages((prev) => [...prev, { id: 'temp-' + Date.now(), product_id: '', image_url: url, sort_order: prev.length, created_at: '' }]);
      }
    }
    setUploading(false);
  };

  const removeImage = async (img: ProductImage) => {
    if (createdId && !img.id.startsWith('temp-')) {
      await deleteProductImage(img.id);
    }
    setImages((prev) => prev.filter((i) => i.id !== img.id));
  };

  const save = async () => {
    setError('');
    if (!name.trim()) { setError('نام محصول الزامی است.'); return; }
    if (!code.trim()) { setError('کود محصول الزامی است.'); return; }
    if (!price) { setError('قیمت الزامی است.'); return; }
    setSaving(true);

    const payload = {
      name: name.trim(),
      code: code.trim(),
      description: description.trim() || null,
      price: Number(price),
      discount_price: discountPrice ? Number(discountPrice) : null,
      category_id: categoryId || null,
      is_new: isNew,
      is_popular: isPopular,
      is_discounted: isDiscounted,
      in_stock: inStock,
      sort_order: 0,
      is_bestseller: false,
      bestseller_order: 0,
    };

    let savedId = createdId;
    if (savedId) {
      await updateProduct(savedId, payload);
    } else {
      const created = await createProduct(payload);
      if (created) {
        savedId = created.id;
        setCreatedId(savedId);
        // attach temp images
        for (const img of images.filter((i) => i.id.startsWith('temp-'))) {
          await addProductImage(savedId, img.image_url, img.sort_order);
        }
      } else {
        setError('خطا در ایجاد محصول. ممکن است کود محصول تکراری باشد.');
        setSaving(false);
        return;
      }
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-5 my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-navy-700">{product ? 'ویرایش محصول' : 'افزودن محصول جدید'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">نام محصول *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="aty-input" autoFocus />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">کود محصول *</label>
              <input type="text" value={code} onChange={(e) => setCode(e.target.value)} className="aty-input" dir="ltr" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">توضیحات</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="aty-input" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">قیمت (افغانى) *</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="aty-input" dir="ltr" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">قیمت تخفیف (اختیاری)</label>
              <input type="number" value={discountPrice} onChange={(e) => setDiscountPrice(e.target.value)} className="aty-input" dir="ltr" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">دسته‌بندی</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="aty-input">
              <option value="">— انتخاب کنید —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">تصاویر محصول</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {images.map((img) => (
                <div key={img.id} className="relative h-20 w-20 rounded-lg overflow-hidden border border-slate-200 group">
                  <img src={img.image_url} alt="" className="h-full w-full object-cover" />
                  <button onClick={() => removeImage(img)} className="absolute top-0 left-0 bg-rose-600 text-white p-0.5 rounded-br-lg opacity-0 group-hover:opacity-100 transition">
                    <X size={12} />
                  </button>
                </div>
              ))}
              <label className="h-20 w-20 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-navy-400 hover:bg-navy-50 transition">
                {uploading ? <Loader2 size={18} className="animate-spin text-navy-500" /> : <Plus size={18} className="text-slate-400" />}
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleImages(e.target.files)} />
              </label>
            </div>
            <p className="text-xs text-slate-400">می‌توانید چند تصویر انتخاب کنید. اولین تصویر به عنوان تصویر اصلی نمایش داده می‌شود.</p>
            {!createdId && <p className="text-xs text-amber-600 mt-1">برای ذخیره تصاویر، ابتدا محصول را ایجاد کنید.</p>}
          </div>

          {/* Flags */}
          <div className="grid grid-cols-2 gap-2">
            <Toggle label="محصول جدید" checked={isNew} onChange={setIsNew} />
            <Toggle label="محصول محبوب" checked={isPopular} onChange={setIsPopular} />
            <Toggle label="تخفیف‌دار" checked={isDiscounted} onChange={setIsDiscounted} />
            <Toggle label="موجود در انبار" checked={inStock} onChange={setInStock} />
          </div>

          {error && <p className="text-xs text-rose-600">{error}</p>}

          <button onClick={save} disabled={saving} className="w-full rounded-lg bg-navy-700 text-white py-2.5 text-sm font-bold hover:bg-navy-800 disabled:opacity-50">
            {saving ? 'در حال ذخیره...' : product ? 'به‌روزرسانی محصول' : 'ایجاد محصول'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
        checked ? 'border-navy-400 bg-navy-50 text-navy-700' : 'border-slate-200 text-slate-600'
      }`}
    >
      <span className={`flex items-center justify-center h-4 w-4 rounded ${checked ? 'bg-navy-600 text-white' : 'bg-slate-200'}`}>
        {checked && <Check size={12} />}
      </span>
      {label}
    </button>
  );
}

function PreviewModal({ product, catName, onClose }: { product: Product; catName: string; onClose: () => void }) {
  const hasDiscount = product.discount_price != null && Number(product.discount_price) < Number(product.price);
  const price = hasDiscount ? Number(product.discount_price) : Number(product.price);
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-navy-700">پیش‌نمایش محصول</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <div className="h-40 rounded-lg bg-slate-50 flex items-center justify-center mb-3">
          <Tag size={40} className="text-slate-300" />
        </div>
        <h4 className="font-semibold text-slate-800">{product.name}</h4>
        <p className="text-xs text-slate-400 mb-2">کود: {product.code} • {catName}</p>
        <p className="text-lg font-bold text-navy-700 mb-2">{formatAFN(price)}</p>
        {hasDiscount && <p className="text-xs text-slate-400 line-through mb-2">{formatAFN(Number(product.price))}</p>}
        {product.description && <p className="text-sm text-slate-600 whitespace-pre-wrap">{product.description}</p>}
      </div>
    </div>
  );
}
