import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

/** Where the Android APK is served from. Set VITE_APK_URL to override, for example with a CDN link. */
export const APK_URL = (import.meta.env.VITE_APK_URL as string | undefined) || '/downloads/walletwise.apk';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type Platform = 'ios' | 'mac-safari' | 'android' | 'chromium' | 'other';

export function detectPlatform(ua = navigator.userAgent, maxTouch = navigator.maxTouchPoints): Platform {
  const iPadOs = /Macintosh/.test(ua) && maxTouch > 1; // iPadOS reports as a Mac
  if (/iPhone|iPad|iPod/.test(ua) || iPadOs) return 'ios';
  if (/Android/.test(ua)) return 'android';
  const safari = /Safari/.test(ua) && !/Chrome|Chromium|Edg|OPR|Firefox/.test(ua);
  if (/Macintosh/.test(ua) && safari) return 'mac-safari';
  if (/Chrome|Chromium|Edg/.test(ua)) return 'chromium';
  return 'other';
}

export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari exposes this non-standard flag for Home Screen apps.
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

interface InstallApi {
  /** Starts the native install prompt if the browser offered one, otherwise opens the install guide for this device. */
  install: () => void;
  installed: boolean;
  platform: Platform;
}

const InstallContext = createContext<InstallApi>({ install: () => {}, installed: false, platform: 'other' });
export const useInstall = () => useContext(InstallContext);

/** Which install guide page fits a platform. */
export function guideFor(p: Platform): 'apple' | 'android' | 'windows' {
  if (p === 'ios' || p === 'mac-safari') return 'apple';
  if (p === 'android') return 'android';
  return 'windows';
}

export function InstallProvider({ children }: { children: ReactNode }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const navigate = useNavigate();
  const platform = useMemo(detectPlatform, []);

  useEffect(() => {
    setInstalled(isStandalone());
    const onPrompt = (e: Event) => {
      e.preventDefault(); // keep it so our own button can trigger it
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = useCallback(() => {
    if (installed) {
      window.location.assign('/app');
      return;
    }
    if (deferred) {
      void deferred.prompt().then(() => deferred.userChoice).then((c) => {
        if (c.outcome === 'accepted') setDeferred(null);
      });
      return;
    }
    navigate(`/install/${guideFor(platform)}`);
  }, [deferred, installed, navigate, platform]);

  return <InstallContext.Provider value={{ install, installed, platform }}>{children}</InstallContext.Provider>;
}
