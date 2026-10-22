import { useEffect, useState, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Announcement, AnnouncementSettings, FitMode, ImagePosition } from '@/lib/types';
import { thumbUrl } from '@/lib/utils';

interface AnnouncementSliderProps {
  announcements: Announcement[];
  settings: AnnouncementSettings | null;
  navigate: (to: string) => void;
}

const INTERVAL_MS = 3000;

const POSITION_MAP: Record<ImagePosition, string> = {
  center: 'center center',
  top: 'top center',
  bottom: 'bottom center',
  left: 'center left',
  right: 'center right',
};

export default function AnnouncementSlider({ announcements, settings, navigate }: AnnouncementSliderProps) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef(0);
  const count = announcements.length;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const goNext = useCallback(() => {
    setCurrent((value) => (count <= 1 ? 0 : (value + 1) % count));
  }, [count]);

  const goPrev = useCallback(() => {
    setCurrent((value) => (count <= 1 ? 0 : (value - 1 + count) % count));
  }, [count]);

  useEffect(() => {
    if (count <= 1 || paused) return;
    const timer = setInterval(goNext, INTERVAL_MS);
    return () => clearInterval(timer);
  }, [count, paused, goNext]);

  useEffect(() => {
    setCurrent(0);
  }, [count]);

  if (count === 0) return null;

  const fitMode: FitMode = settings?.fit_mode || 'contain';
  const position: ImagePosition = settings?.image_position || 'center';
  const borderRadius = settings?.border_radius ?? 12;
  const bgColor = settings?.bg_color || '#0f1d38';
  const height = isMobile ? (settings?.mobile_height ?? 200) : (settings?.desktop_height ?? 300);
  const maxWidth = isMobile ? (settings?.mobile_width ?? 600) : (settings?.desktop_width ?? 1152);
  const objectFit = fitMode === 'fill' ? 'fill' : fitMode === 'cover' ? 'cover' : 'contain';
  const objectPosition = POSITION_MAP[position];

  const handleClick = (announcement: Announcement) => {
    if (!announcement.link_url) return;
    if (announcement.link_url.startsWith('/')) {
      navigate(announcement.link_url);
    } else {
      window.open(announcement.link_url, '_blank', 'noopener,noreferrer');
    }
  };

  const onTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0].clientX;
    touchDeltaX.current = 0;
  };

  const onTouchMove = (event: React.TouchEvent) => {
    if (touchStartX.current !== null) touchDeltaX.current = event.touches[0].clientX - touchStartX.current;
  };

  const onTouchEnd = () => {
    if (Math.abs(touchDeltaX.current) > 50) {
      if (touchDeltaX.current > 0) goPrev();
      else goNext();
    }
    touchStartX.current = null;
    touchDeltaX.current = 0;
  };

  return (
    <div
      className="mx-auto flex flex-col gap-3 md:flex-row"
      style={{ maxWidth: `${maxWidth}px` }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="relative order-1 min-w-0 flex-1 overflow-hidden"
        style={{ height: `${height}px`, borderRadius: `${borderRadius}px`, backgroundColor: bgColor }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {announcements.map((announcement, index) => (
          <div
            key={announcement.id}
            className={`absolute inset-0 transition-opacity duration-700 ${index === current ? 'visible opacity-100' : 'invisible opacity-0'}`}
          >
            <button
              onClick={() => handleClick(announcement)}
              className={`block h-full w-full ${announcement.link_url ? 'cursor-pointer' : 'cursor-default'}`}
              aria-label={announcement.title || 'اعلان'}
            >
              <img
                src={announcement.image_url}
                alt={announcement.title || ''}
                className="h-full w-full object-contain"
                style={{ objectFit, objectPosition }}
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            </button>
          </div>
        ))}

        {count > 1 && (
          <>
            <button onClick={goPrev} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white transition-colors hover:bg-black/60" aria-label="قبلی">
              <ChevronRight size={22} />
            </button>
            <button onClick={goNext} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white transition-colors hover:bg-black/60" aria-label="بعدی">
              <ChevronLeft size={22} />
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="order-2 flex shrink-0 gap-2 overflow-x-auto pb-1 md:w-20 md:flex-col md:overflow-y-auto md:overflow-x-hidden md:pb-0">
          {announcements.map((announcement, index) => (
            <button
              key={announcement.id}
              onClick={() => setCurrent(index)}
              className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 bg-slate-50 transition md:h-16 md:w-20 ${index === current ? 'border-navy-600 ring-2 ring-navy-100' : 'border-slate-200 hover:border-navy-300'}`}
              aria-label={`نمایش اعلان ${index + 1}`}
            >
              <img src={announcement.image_url} alt="" className="h-full w-full object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
