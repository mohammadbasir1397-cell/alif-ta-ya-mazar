import { useState } from 'react';
import { Upload, Eye, Save, Loader2, Trash2, Image as ImageIcon } from 'lucide-react';
import type { Settings } from '@/lib/types';
import { updateSettings, uploadImage } from '@/lib/api';
import { STORAGE_BUCKETS } from '@/lib/supabase';

interface SettingsPanelProps {
  settings: Settings;
  onUpdated: (s: Settings) => void;
}

export default function SettingsPanel({ settings, onUpdated }: SettingsPanelProps) {
  const [storeName, setStoreName] = useState(settings.store_name);
  const [whatsapp, setWhatsapp] = useState(settings.whatsapp_number || '');
  const [heroText, setHeroText] = useState(settings.hero_text || '');
  const [logoPreview, setLogoPreview] = useState<string | null>(settings.logo_url);
  const [heroImage, setHeroImage] = useState<string | null>(settings.hero_image_url);
  const [heroOverlay, setHeroOverlay] = useState(settings.hero_overlay);
  const [heroPos, setHeroPos] = useState<'center' | 'right' | 'left'>(settings.hero_text_position || 'center');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [msg, setMsg] = useState('');

  const handleLogo = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    const url = await uploadImage(STORAGE_BUCKETS.logo, file);
    setUploading(false);
    if (url) {
      setLogoPreview(url);
      const updated = await updateSettings({ logo_url: url });
      if (updated) onUpdated(updated);
      setMsg('لوگو با موفقیت آپلود شد.');
    } else {
      setMsg('خطا در آپلود لوگو.');
    }
    setTimeout(() => setMsg(''), 3000);
  };

  const handleHeroImage = async (file: File | undefined) => {
    if (!file) return;
    setUploadingHero(true);
    const url = await uploadImage(STORAGE_BUCKETS.logo, file, 'hero');
    setUploadingHero(false);
    if (url) {
      setHeroImage(url);
      const updated = await updateSettings({ hero_image_url: url });
      if (updated) onUpdated(updated);
      setMsg('تصویر کاور آپلود شد. ذخیره شد.');
    } else {
      setMsg('خطا در آپلود تصویر کاور.');
    }
    setTimeout(() => setMsg(''), 3000);
  };

  const removeHeroImage = async () => {
    setHeroImage(null);
    const updated = await updateSettings({ hero_image_url: null });
    if (updated) onUpdated(updated);
    setMsg('تصویر کاور حذف شد.');
    setTimeout(() => setMsg(''), 3000);
  };

  const save = async () => {
    setSaving(true);
    const patch: Parameters<typeof updateSettings>[0] = {
      store_name: storeName,
      whatsapp_number: whatsapp,
      hero_text: heroText,
      hero_overlay: heroOverlay,
      hero_text_position: heroPos,
    };
    const updated = await updateSettings(patch);
    setSaving(false);
    if (updated) {
      onUpdated(updated);
      setMsg('تنظیمات ذخیره شد.');
    } else {
      setMsg('خطا در ذخیره‌سازی.');
    }
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Logo */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-bold text-navy-700 mb-4">لوگوی فروشگاه</h2>
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="h-24 w-24 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
            {logoPreview ? (
              <img src={logoPreview} alt="پیش‌نمایش لوگو" className="h-full w-full object-contain" />
            ) : (
              <span className="text-xs text-slate-400">بدون لوگو</span>
            )}
          </div>
          <div className="flex-1">
            <label className="inline-flex items-center gap-2 rounded-lg bg-navy-50 text-navy-700 px-4 py-2 text-sm font-medium cursor-pointer hover:bg-navy-100 transition">
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              انتخاب فایل لوگو
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogo(e.target.files?.[0])} />
            </label>
            <p className="text-xs text-slate-500 mt-2">
              فایل را انتخاب کنید؛ لوگو بلافاصله آپلود و نمایش داده می‌شود. نام فروشگاه در صورت عدم وجود لوگو نمایش داده می‌شود.
            </p>
          </div>
        </div>
      </div>

      {/* Homepage Cover */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-bold text-navy-700 mb-4">کاور صفحه اصلی (هیرو)</h2>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="w-full sm:w-64 h-32 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 relative">
              {heroImage ? (
                <>
                  <img src={heroImage} alt="پیش‌نمایش کاور" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-navy-900" style={{ opacity: heroOverlay / 100 }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white text-sm font-bold drop-shadow">پیش‌نمایش</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-1 text-slate-400">
                  <ImageIcon size={28} />
                  <span className="text-xs">بدون تصویر (گرادیان پیش‌فرض)</span>
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <label className="inline-flex items-center gap-2 rounded-lg bg-navy-50 text-navy-700 px-4 py-2 text-sm font-medium cursor-pointer hover:bg-navy-100 transition">
                {uploadingHero ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                آپلود تصویر کاور
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleHeroImage(e.target.files?.[0])} />
              </label>
              {heroImage && (
                <button onClick={removeHeroImage} className="block text-sm text-rose-600 hover:text-rose-700 flex items-center gap-1">
                  <Trash2 size={14} /> حذف تصویر کاور
                </button>
              )}
              <p className="text-xs text-slate-500">
                تصویر را آپلود کنید. تغییرات بلافاصله ذخیره و در صفحه اصلی نمایش داده می‌شود. توصیه: تصویر با ابعاد وسیع (۱۹۲۰×۶۰۰ پیکسل).
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">تاریکی پس‌زمینه (روی تصویر): {heroOverlay}%</label>
            <input type="range" min={0} max={80} value={heroOverlay} onChange={(e) => setHeroOverlay(Number(e.target.value))} className="w-full accent-navy-600" />
            <p className="text-xs text-slate-400 mt-1">مقدار بالاتر = متن خواناتر. صفر = بدون تاریکی.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">موقعیت متن</label>
            <div className="flex gap-2">
              {(['center', 'right', 'left'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setHeroPos(p)}
                  className={`px-4 py-2 rounded-lg text-sm border transition ${heroPos === p ? 'border-navy-400 bg-navy-50 text-navy-700' : 'border-slate-200 text-slate-600'}`}
                >
                  {p === 'center' ? 'وسط' : p === 'right' ? 'راست' : 'چپ'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">متن خوش‌آمدگویی</label>
            <textarea value={heroText} onChange={(e) => setHeroText(e.target.value)} rows={2} className="aty-input" />
          </div>
        </div>
      </div>

      {/* Store Info */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <h2 className="text-base font-bold text-navy-700">اطلاعات فروشگاه</h2>
        <Field label="نام فروشگاه">
          <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} className="aty-input" />
        </Field>
        <Field label="شماره واتساپ (با کد کشور، مثال: 93790000000)">
          <input type="text" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="93790000000" className="aty-input" dir="ltr" />
        </Field>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-navy-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-navy-800 transition disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          ذخیره تنظیمات
        </button>
        {msg && <p className="text-sm text-green-600 flex items-center gap-1"><Eye size={14} /> {msg}</p>}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
      {children}
    </div>
  );
}
