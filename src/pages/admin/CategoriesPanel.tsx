import { useState } from 'react';
import { Plus, Trash2, Pencil, GripVertical, Loader2, X, Upload, PackageSearch } from 'lucide-react';
import type { Category } from '@/lib/types';
import { createCategory, updateCategory, deleteCategory, uploadImage } from '@/lib/api';
import { STORAGE_BUCKETS } from '@/lib/supabase';
import { slugify } from '@/lib/utils';

interface CategoriesPanelProps {
  categories: Category[];
  onChanged: () => void;
}

export default function CategoriesPanel({ categories, onChanged }: CategoriesPanelProps) {
  const [editing, setEditing] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Category | null>(null);

  const openNew = () => { setEditing(null); setShowForm(true); };
  const openEdit = (c: Category) => { setEditing(c); setShowForm(true); };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-navy-700">دسته‌بندی‌ها ({categories.length})</h2>
        <button onClick={openNew} className="inline-flex items-center gap-1.5 rounded-lg bg-navy-700 text-white px-3 py-2 text-sm font-bold hover:bg-navy-800 transition">
          <Plus size={16} /> افزودن دسته
        </button>
      </div>

      <div className="space-y-2">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
            <GripVertical size={16} className="text-slate-300 shrink-0" />
            <div className="h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
              {c.image_url ? (
                <img src={c.image_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <PackageSearch size={18} className="text-slate-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{c.name}</p>
              <p className="text-xs text-slate-400">ترتیب: {c.sort_order}</p>
            </div>
            <button onClick={() => openEdit(c)} className="p-2 text-slate-500 hover:text-navy-600 hover:bg-navy-50 rounded-md transition">
              <Pencil size={16} />
            </button>
            <button onClick={() => setConfirmDelete(c)} className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {categories.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-8">هنوز دسته‌ای وجود ندارد.</p>
        )}
      </div>

      {showForm && (
        <CategoryForm
          category={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); onChanged(); }}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="حذف دسته‌بندی"
          message={`آیا از حذف «${confirmDelete.name}» مطمئن هستید؟ محصولات این دسته حذف نمی‌شوند اما دسته‌بندی آن‌ها خالی می‌شود.`}
          onConfirm={async () => {
            await deleteCategory(confirmDelete.id);
            setConfirmDelete(null);
            onChanged();
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

function CategoryForm({ category, onClose, onSaved }: { category: Category | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(category?.name || '');
  const [sortOrder, setSortOrder] = useState(category?.sort_order ?? 0);
  const [imageUrl, setImageUrl] = useState(category?.image_url || null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleImage = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    const url = await uploadImage(STORAGE_BUCKETS.categories, file);
    setUploading(false);
    if (url) setImageUrl(url);
  };

  const save = async () => {
    setError('');
    if (!name.trim()) { setError('نام دسته الزامی است.'); return; }
    setSaving(true);
    if (category) {
      await updateCategory(category.id, { name: name.trim(), sort_order: sortOrder, image_url: imageUrl });
    } else {
      await createCategory({ name: name.trim(), slug: slugify(name), sort_order: sortOrder, image_url: imageUrl });
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-navy-700">{category ? 'ویرایش دسته' : 'افزودن دسته جدید'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">نام دسته</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="aty-input" autoFocus />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">ترتیب نمایش</label>
            <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className="aty-input" dir="ltr" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">تصویر دسته (اختیاری)</label>
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                {imageUrl ? <img src={imageUrl} alt="" className="h-full w-full object-cover" /> : <PackageSearch size={18} className="text-slate-400" />}
              </div>
              <label className="inline-flex items-center gap-1.5 rounded-lg bg-navy-50 text-navy-700 px-3 py-2 text-sm cursor-pointer hover:bg-navy-100">
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                انتخاب تصویر
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImage(e.target.files?.[0])} />
              </label>
            </div>
          </div>
          {error && <p className="text-xs text-rose-600">{error}</p>}
          <button onClick={save} disabled={saving} className="w-full rounded-lg bg-navy-700 text-white py-2.5 text-sm font-bold hover:bg-navy-800 disabled:opacity-50">
            {saving ? 'در حال ذخیره...' : 'ذخیره'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ConfirmDialog({ title, message, onConfirm, onCancel }: { title: string; message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold text-navy-700 mb-2">{title}</h3>
        <p className="text-sm text-slate-600 mb-4 leading-relaxed">{message}</p>
        <div className="flex gap-2">
          <button onClick={onConfirm} className="flex-1 rounded-lg bg-rose-600 text-white py-2 text-sm font-bold hover:bg-rose-700">بله، حذف کن</button>
          <button onClick={onCancel} className="flex-1 rounded-lg bg-slate-100 text-slate-700 py-2 text-sm font-bold hover:bg-slate-200">انصراف</button>
        </div>
      </div>
    </div>
  );
}
