import { useEffect, useState } from 'react';
import { Plus, Trash2, Loader2, X, Upload, ArrowUp, ArrowDown, Eye, EyeOff, ExternalLink, Calendar, RotateCcw, Save, Maximize, Maximize2, Monitor, Smartphone } from 'lucide-react';
import type { Announcement, AnnouncementSettings, FitMode, ImagePosition } from '@/lib/types';
import { fetchAllAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement, uploadImage, fetchAnnouncementSettings, updateAnnouncementSettings } from '@/lib/api';
import { STORAGE_BUCKETS } from '@/lib/supabase';
import { ConfirmDialog } from './CategoriesPanel';

export default function AnnouncementsPanel() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Announcement | null>(null);
  const [annSettings, setAnnSettings] = useState<AnnouncementSettings | null>(null);

  const load = async () => {
    setLoading(true);
    const [data, settings] = await Promise.all([fetchAllAnnouncements(), fetchAnnouncementSettings()]);
    setItems(data);
    setAnnSettings(settings);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleActive = async (a: Announcement) => {
    await updateAnnouncement(a.id, { active: !a.active });
    load();
  };

  const move = async (a: Announcement, dir: -1 | 1) => {
    const sorted = [...items].sort((x, y) => x.sort_order - y.sort_order);
    const idx = sorted.findIndex((x) => x.id === a.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const other = sorted[swapIdx];
    await Promise.all([
      updateAnnouncement(a.id, { sort_order: other.sort_order }),
      updateAnnouncement(other.id, { sort_order: a.sort_order }),
    ]);
    load();
  };

  const isExpired = (a: Announcement) => {
    if (!a.end_date) return false;
    return new Date(a.end_date) < new Date(new Date().toDateString());
  };
  const isUpcoming = (a: Announcement) => {
    if (!a.start_date) return false;
    return new Date(a.start_date) > new Date(new Date().toDateString());
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-navy-700">اعلانات و تخفیفات ({items.length})</h2>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="inline-flex items-center gap-1.5 rounded-lg bg-navy-700 text-white px-3 py-2 text-sm font-bold hover:bg-navy-800 transition">
          <Plus size={16} /> افزودن اعلان
        </button>
      </div>

      {!loading && annSettings && (
        <DisplaySettingsCard settings={annSettings} items={items} onSaved={load} />
      )}

      {loading ? (
        <p className="text-sm text-slate-500 text-center py-8">در حال بارگذاری...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-8">هنوز اعلانی وجود ندارد. روی «افزودن اعلان» کلیک کنید.</p>
      ) : (
        <div className="space-y-2">
          {[...items].sort((a, b) => a.sort_order - b.sort_order).map((a) => (
            <div key={a.id} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex flex-col gap-0.5 shrink-0">
                <button onClick={() => move(a, -1)} className="text-slate-400 hover:text-navy-600"><ArrowUp size={14} /></button>
                <button onClick={() => move(a, 1)} className="text-slate-400 hover:text-navy-600"><ArrowDown size={14} /></button>
              </div>
              <div className="h-16 w-24 rounded-md overflow-hidden bg-slate-100 shrink-0">
                <img src={a.image_url} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{a.title || '(بدون عنوان)'}</p>
                <div className="flex items-center gap-2 flex-wrap mt-0.5">
                  {a.link_url && <span className="text-xs text-navy-500 flex items-center gap-0.5"><ExternalLink size={11} /> لینک</span>}
                  {a.start_date && <span className="text-xs text-slate-400 flex items-center gap-0.5"><Calendar size={11} /> شروع: {a.start_date}</span>}
                  {a.end_date && <span className="text-xs text-slate-400 flex items-center gap-0.5"><Calendar size={11} /> پایان: {a.end_date}</span>}
                </div>
                <div className="flex gap-1 mt-1">
                  {isExpired(a) && <span className="bg-slate-200 text-slate-600 text-[10px] px-1.5 py-0.5 rounded">منقضی شده</span>}
                  {isUpcoming(a) && <span className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 rounded">برنامه‌ریزی شده</span>}
                  {!a.active && <span className="bg-slate-200 text-slate-600 text-[10px] px-1.5 py-0.5 rounded">غیرفعال</span>}
                  {a.active && !isExpired(a) && !isUpcoming(a) && <span className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0.5 rounded">فعال</span>}
                </div>
              </div>
              <button onClick={() => toggleActive(a)} className="p-2 text-slate-500 hover:text-navy-600 hover:bg-navy-50 rounded-md transition" title={a.active ? 'غیرفعال کردن' : 'فعال کردن'}>
                {a.active ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
              <button onClick={() => { setEditing(a); setShowForm(true); }} className="p-2 text-slate-500 hover:text-navy-600 hover:bg-navy-50 rounded-md transition">
                <Plus size={16} />
              </button>
              <button onClick={() => setConfirmDelete(a)} className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <AnnouncementForm
          announcement={editing}
          nextOrder={items.length}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="حذف اعلان"
          message="آیا از حذف این اعلان مطمئن هستید؟"
          onConfirm={async () => { await deleteAnnouncement(confirmDelete.id); setConfirmDelete(null); load(); }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

function AnnouncementForm({ announcement, nextOrder, onClose, onSaved }: { announcement: Announcement | null; nextOrder: number; onClose: () => void; onSaved: () => void }) {
  const [imageUrl, setImageUrl] = useState(announcement?.image_url || null);
  const [linkUrl, setLinkUrl] = useState(announcement?.link_url || '');
  const [title, setTitle] = useState(announcement?.title || '');
  const [active, setActive] = useState(announcement?.active ?? true);
  const [startDate, setStartDate] = useState(announcement?.start_date || '');
  const [endDate, setEndDate] = useState(announcement?.end_date || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleImage = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    const url = await uploadImage(STORAGE_BUCKETS.announcements, file);
    setUploading(false);
    if (url) setImageUrl(url);
  };

  const save = async () => {
    setError('');
    if (!imageUrl) { setError('لطفاً یک تصویر آپلود کنید.'); return; }
    setSaving(true);
    const payload = {
      image_url: imageUrl,
      link_url: linkUrl.trim() || null,
      title: title.trim() || null,
      active,
      start_date: startDate || null,
      end_date: endDate || null,
      sort_order: announcement?.sort_order ?? nextOrder,
    };
    if (announcement) {
      await updateAnnouncement(announcement.id, payload);
    } else {
      await createAnnouncement(payload);
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-5 my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-navy-700">{announcement ? 'ویرایش اعلان' : 'افزودن اعلان جدید'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">تصویر اعلان *</label>
            <div className="flex items-start gap-3">
              <div className="h-24 w-full max-w-[200px] rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                {imageUrl ? <img src={imageUrl} alt="" className="h-full w-full object-cover" /> : <span className="text-xs text-slate-400">پیش‌نمایش</span>}
              </div>
              <label className="inline-flex items-center gap-1.5 rounded-lg bg-navy-50 text-navy-700 px-3 py-2 text-sm cursor-pointer hover:bg-navy-100">
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                انتخاب تصویر
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImage(e.target.files?.[0])} />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">عنوان (اختیاری)</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثلاً: تخفیف ویژه نوروز" className="aty-input" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">لینک مقصد (اختیاری)</label>
            <input type="text" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="/product/xxx یا /category/xxx یا https://..." className="aty-input" dir="ltr" />
            <p className="text-xs text-slate-400 mt-1">برای لینک به محصول یا دسته داخل سایت، از /product/ یا /category/ استفاده کنید.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">تاریخ شروع (اختیاری)</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="aty-input" dir="ltr" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">تاریخ پایان (اختیاری)</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="aty-input" dir="ltr" />
            </div>
          </div>

          <button onClick={() => setActive(!active)} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${active ? 'border-green-400 bg-green-50 text-green-700' : 'border-slate-200 text-slate-600'}`}>
            {active ? <Eye size={16} /> : <EyeOff size={16} />}
            {active ? 'فعال (نمایش در سایت)' : 'غیرفعال'}
          </button>

          {error && <p className="text-xs text-rose-600">{error}</p>}

          <button onClick={save} disabled={saving} className="w-full rounded-lg bg-navy-700 text-white py-2.5 text-sm font-bold hover:bg-navy-800 disabled:opacity-50">
            {saving ? 'در حال ذخیره...' : 'ذخیره اعلان'}
          </button>
        </div>
      </div>
    </div>
  );
}

const DEFAULT_SETTINGS = {
  desktop_width: 1152,
  desktop_height: 300,
  mobile_width: 600,
  mobile_height: 200,
  fit_mode: 'contain' as FitMode,
  image_position: 'center' as ImagePosition,
  border_radius: 12,
  bg_color: '#0f1d38',
};

function DisplaySettingsCard({ settings, items, onSaved }: { settings: AnnouncementSettings; items: Announcement[]; onSaved: () => void }) {
  const [dw, setDw] = useState(settings.desktop_width);
  const [dh, setDh] = useState(settings.desktop_height);
  const [mw, setMw] = useState(settings.mobile_width);
  const [mh, setMh] = useState(settings.mobile_height);
  const [fit, setFit] = useState<FitMode>(settings.fit_mode);
  const [pos, setPos] = useState<ImagePosition>(settings.image_position);
  const [radius, setRadius] = useState(settings.border_radius);
  const [bgColor, setBgColor] = useState(settings.bg_color);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const previewImage = items[0]?.image_url;

  const posMap: Record<ImagePosition, string> = {
    center: 'center center',
    top: 'top center',
    bottom: 'bottom center',
    left: 'center left',
    right: 'center right',
  };

  const previewW = previewDevice === 'desktop' ? Math.min(dw, 400) : Math.min(mw, 200);
  const previewH = previewDevice === 'desktop' ? Math.min(dh, 150) : Math.min(mh, 100);
  const previewScale = previewDevice === 'desktop' ? 400 / dw : 200 / mw;

  const objectFit = fit === 'fill' ? 'fill' : fit === 'cover' ? 'cover' : 'contain';

  const reset = () => {
    setDw(DEFAULT_SETTINGS.desktop_width);
    setDh(DEFAULT_SETTINGS.desktop_height);
    setMw(DEFAULT_SETTINGS.mobile_width);
    setMh(DEFAULT_SETTINGS.mobile_height);
    setFit(DEFAULT_SETTINGS.fit_mode);
    setPos(DEFAULT_SETTINGS.image_position);
    setRadius(DEFAULT_SETTINGS.border_radius);
    setBgColor(DEFAULT_SETTINGS.bg_color);
  };

  const save = async () => {
    setSaving(true);
    await updateAnnouncementSettings({
      desktop_width: dw,
      desktop_height: dh,
      mobile_width: mw,
      mobile_height: mh,
      fit_mode: fit,
      image_position: pos,
      border_radius: radius,
      bg_color: bgColor,
    });
    setSaving(false);
    setMsg('تنظیمات نمایش ذخیره شد.');
    setTimeout(() => setMsg(''), 3000);
    onSaved();
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 mb-4">
      <h3 className="text-base font-bold text-navy-700 mb-1">تنظیمات نمایش بنر اعلانات</h3>
      <p className="text-xs text-slate-500 mb-4">اندازه و نحوه نمایش تصاویر اعلانات را کنترل کنید. این تنظیمات روی همه اعلانات اعمال می‌شود.</p>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Controls */}
        <div className="space-y-4">
          {/* Fit mode quick buttons */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">حالت نمایش تصویر</label>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setFit('contain')} className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition ${fit === 'contain' ? 'border-navy-400 bg-navy-50 text-navy-700' : 'border-slate-200 text-slate-600'}`}>
                <Maximize size={15} /> نمایش کامل (Contain)
              </button>
              <button onClick={() => setFit('cover')} className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition ${fit === 'cover' ? 'border-navy-400 bg-navy-50 text-navy-700' : 'border-slate-200 text-slate-600'}`}>
                <Maximize2 size={15} /> پر کردن بنر (Cover)
              </button>
              <button onClick={() => setFit('fill')} className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition ${fit === 'fill' ? 'border-navy-400 bg-navy-50 text-navy-700' : 'border-slate-200 text-slate-600'}`}>
                <Maximize2 size={15} /> کشیدن (Fill)
              </button>
            </div>
            {fit === 'fill' && <p className="text-xs text-amber-600 mt-1">هشدار: در حالت Fill، نسبت تصویر تغییر می‌کند و ممکن است تصویر کشیده شود.</p>}
            {fit === 'contain' && <p className="text-xs text-green-600 mt-1">تمام تصویر بدون برش نمایش داده می‌شود.</p>}
          </div>

          {/* Image position */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">موقعیت تصویر</label>
            <div className="flex gap-1.5 flex-wrap">
              {(['center', 'top', 'bottom', 'left', 'right'] as ImagePosition[]).map((p) => (
                <button key={p} onClick={() => setPos(p)} className={`px-3 py-1.5 rounded-lg text-sm border transition ${pos === p ? 'border-navy-400 bg-navy-50 text-navy-700' : 'border-slate-200 text-slate-600'}`}>
                  {p === 'center' ? 'وسط' : p === 'top' ? 'بالا' : p === 'bottom' ? 'پایین' : p === 'left' ? 'چپ' : 'راست'}
                </button>
              ))}
            </div>
          </div>

          {/* Desktop dimensions */}
          <div className="border-t border-slate-100 pt-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Monitor size={15} className="text-navy-600" />
              <span className="text-sm font-medium text-slate-700">اندازه دسکتاپ</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">عرض (px): {dw}</label>
                <input type="range" min={400} max={1920} step={16} value={dw} onChange={(e) => setDw(Number(e.target.value))} className="w-full accent-navy-600" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">ارتفاع (px): {dh}</label>
                <input type="range" min={100} max={600} step={10} value={dh} onChange={(e) => setDh(Number(e.target.value))} className="w-full accent-navy-600" />
              </div>
            </div>
          </div>

          {/* Mobile dimensions */}
          <div className="border-t border-slate-100 pt-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Smartphone size={15} className="text-navy-600" />
              <span className="text-sm font-medium text-slate-700">اندازه موبایل</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">عرض (px): {mw}</label>
                <input type="range" min={280} max={800} step={8} value={mw} onChange={(e) => setMw(Number(e.target.value))} className="w-full accent-navy-600" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">ارتفاع (px): {mh}</label>
                <input type="range" min={80} max={400} step={5} value={mh} onChange={(e) => setMh(Number(e.target.value))} className="w-full accent-navy-600" />
              </div>
            </div>
          </div>

          {/* Border radius + bg color */}
          <div className="border-t border-slate-100 pt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">گردی گوشه‌ها (px): {radius}</label>
              <input type="range" min={0} max={32} step={1} value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="w-full accent-navy-600" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">رنگ پس‌زمینه (اطراف تصویر)</label>
              <div className="flex items-center gap-2">
                <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="h-8 w-12 rounded border border-slate-200 cursor-pointer" />
                <input type="text" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="aty-input text-xs" dir="ltr" />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap pt-2">
            <button onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-navy-700 text-white px-4 py-2 text-sm font-bold hover:bg-navy-800 disabled:opacity-50">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              ذخیره تغییرات
            </button>
            <button onClick={reset} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 text-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-200">
              <RotateCcw size={15} /> بازنشانی به پیش‌فرض
            </button>
            <button onClick={() => setFit('contain')} className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 text-green-700 px-3 py-2 text-sm font-medium hover:bg-green-100">
              <Maximize size={15} /> نمایش کامل تصویر
            </button>
            <button onClick={() => setFit('cover')} className="inline-flex items-center gap-1.5 rounded-lg bg-accent-50 text-accent-700 px-3 py-2 text-sm font-medium hover:bg-accent-100">
              <Maximize2 size={15} /> پر کردن بنر
            </button>
          </div>
          {msg && <p className="text-sm text-green-600">{msg}</p>}
        </div>

        {/* Live Preview */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-slate-700">پیش‌نمایش زنده</span>
            <div className="flex gap-1 ml-auto">
              <button onClick={() => setPreviewDevice('desktop')} className={`px-2.5 py-1 rounded text-xs border transition ${previewDevice === 'desktop' ? 'border-navy-400 bg-navy-50 text-navy-700' : 'border-slate-200 text-slate-500'}`}>
                <Monitor size={12} className="inline" /> دسکتاپ
              </button>
              <button onClick={() => setPreviewDevice('mobile')} className={`px-2.5 py-1 rounded text-xs border transition ${previewDevice === 'mobile' ? 'border-navy-400 bg-navy-50 text-navy-700' : 'border-slate-200 text-slate-500'}`}>
                <Smartphone size={12} className="inline" /> موبایل
              </button>
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 flex items-center justify-center">
            <div
              className="overflow-hidden mx-auto"
              style={{
                width: `${previewW}px`,
                height: `${previewH}px`,
                borderRadius: `${radius * previewScale}px`,
                backgroundColor: bgColor,
              }}
            >
              {previewImage ? (
                <img
                  src={previewImage}
                  alt="پیش‌نمایش"
                  className="w-full h-full"
                  style={{ objectFit, objectPosition: posMap[pos] }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                  اعلانی برای پیش‌نمایش نیست
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center">
            {previewDevice === 'desktop' ? `${dw} × ${dh}px` : `${mw} × ${mh}px`}
            {' — '}حالت: {fit === 'contain' ? 'نمایش کامل' : fit === 'cover' ? 'پر کردن' : 'کشیدن'}
          </p>
        </div>
      </div>
    </div>
  );
}
