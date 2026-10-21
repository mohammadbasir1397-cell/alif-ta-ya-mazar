import { trackLiveVisitor, trackPwaInstallation } from './api';

const VISITOR_SESSION_KEY = 'aty_visitor_session';
const PWA_INSTALLATION_KEY = 'aty_pwa_installation';

function getTrackingId(key: string): string {
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(key, id);
  return id;
}

export function startAnalyticsTracking(): () => void {
  const visitorId = getTrackingId(VISITOR_SESSION_KEY);
  const sendHeartbeat = () => { void trackLiveVisitor(visitorId); };
  sendHeartbeat();
  const heartbeat = window.setInterval(sendHeartbeat, 60_000);

  const recordInstallation = () => {
    const installationId = getTrackingId(PWA_INSTALLATION_KEY);
    void trackPwaInstallation(installationId);
  };
  const onInstalled = () => recordInstallation();
  window.addEventListener('appinstalled', onInstalled);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || ('standalone' in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true);
  if (isStandalone) recordInstallation();

  return () => {
    window.clearInterval(heartbeat);
    window.removeEventListener('appinstalled', onInstalled);
  };
}
