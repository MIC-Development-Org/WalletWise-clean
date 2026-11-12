import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppDialog } from '@/components/kit';

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
  /** Starts the native install prompt if the browser offered one, otherwise opens the how-to sheet. */
  install: () => void;
  installed: boolean;
  platform: Platform;
}

const InstallContext = createContext<InstallApi>({ install: () => {}, installed: false, platform: 'other' });
export const useInstall = () => useContext(InstallContext);

const STEPS: Record<Platform, { title: string; steps: string[]; note?: string }> = {
  ios: {
    title: 'Add to your iPhone or iPad',
    steps: [
      'Open this page in Safari.',
      'Tap the Share button.',
      'Choose Add to Home Screen, then Add.',
      'Open WalletWise from your Home Screen.',
    ],
    note: 'Notifications on iPhone only work from the Home Screen app.',
  },
  'mac-safari': {
    title: 'Add to your Mac Dock',
    steps: ['In Safari, open the File menu.', 'Choose Add to Dock.', 'Open WalletWise from your Dock or Launchpad.'],
    note: 'Needs macOS Sonoma or later with Safari 17 or newer.',
  },
  android: {
    title: 'Install on Android',
    steps: ['Open the browser menu.', 'Tap Install app (or Add to Home screen).', 'Open WalletWise from your app drawer.'],
    note: 'Want SMS capture? Use the APK from the download section instead.',
  },
  chromium: {
    title: 'Install on your computer',
    steps: [
      'Look for the install icon at the right of the address bar.',
      'Click it, then choose Install.',
      'Open WalletWise from your Dock, Start menu or Launchpad.',
    ],
    note: 'No install icon? Open the browser menu and choose Cast, save and share, then Install page as app.',
  },
  other: {
    title: 'Install WalletWise',
    steps: ['Open this page in Chrome, Edge or Safari.', 'Use that browser’s install or Add to Home Screen option.'],
  },
};

export function InstallProvider({ children }: { children: ReactNode }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [help, setHelp] = useState(false);
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
    setHelp(true);
  }, [deferred, installed]);

  const content = STEPS[platform];
  return (
    <InstallContext.Provider value={{ install, installed, platform }}>
      {children}
      <AppDialog open={help} onClose={() => setHelp(false)} title={content.title}>
        <ol className="list-decimal space-y-2.5 pl-5 text-sm text-muted-foreground">
          {content.steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        {content.note && <p className="mt-5 rounded-xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">{content.note}</p>}
      </AppDialog>
    </InstallContext.Provider>
  );
}
