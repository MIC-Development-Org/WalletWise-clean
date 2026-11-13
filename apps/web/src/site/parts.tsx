import { useEffect, useState, type ReactNode } from 'react';
import { Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { APK_URL, useInstall } from '../lib/install';
import { AndroidGlyph, AppleGlyph, WindowsGlyph } from './glyphs';

let apkCheck: Promise<boolean> | null = null;

/**
 * True only if the APK really exists. The SPA answers unknown paths with index.html, so a plain link
 * could "download" a web page named walletwise.apk. Check the response is not HTML before linking.
 */
function checkApk(): Promise<boolean> {
  apkCheck ??= fetch(APK_URL, { method: 'HEAD' })
    .then((r) => r.ok && !(r.headers.get('content-type') ?? '').includes('text/html'))
    .catch(() => false);
  return apkCheck;
}

export function useApkReady(): boolean | null {
  const [ready, setReady] = useState<boolean | null>(null);
  useEffect(() => {
    let live = true;
    void checkApk().then((v) => live && setReady(v));
    return () => {
      live = false;
    };
  }, []);
  return ready;
}

/** A download link that turns into an honest disabled state until the first APK build is published. */
export function ApkLink({ className, children, pending }: { className: string; children: ReactNode; pending?: ReactNode }) {
  const ready = useApkReady();
  if (ready === false) {
    return (
      <span aria-disabled="true" title="The first Android build is still being published" className={`${className} cursor-not-allowed opacity-50`}>
        {pending ?? children}
      </span>
    );
  }
  return (
    <a href={APK_URL} download className={className}>
      {children}
    </a>
  );
}

export function Container({ children, className = '', id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <div id={id} className={`mx-auto w-full max-w-6xl px-5 ${className}`}>
      {children}
    </div>
  );
}

/** Section heading in the Fincash style: centred, 48px, weight 500, grey 18px lead. */
export function Heading({ title, sub, align = 'center' }: { title: ReactNode; sub?: ReactNode; align?: 'center' | 'left' }) {
  return (
    <div className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-xl'}>
      <h2 className="text-[2rem] leading-[1.1] font-medium text-balance sm:text-5xl sm:leading-[1.05]">{title}</h2>
      {sub && <p className="mt-5 text-lg leading-7 text-muted-foreground text-pretty">{sub}</p>}
    </div>
  );
}

/** The one download action. It takes you to the device picker, or opens the app if it is already installed. */
export function DownloadButton({ className = '', size = 'lg' }: { className?: string; size?: 'md' | 'lg' }) {
  const { installed } = useInstall();
  return (
    <Link
      to={installed ? '/app' : '/#download'}
      className={`group inline-flex items-center justify-center gap-2.5 rounded-full bg-lime font-medium text-lime-ink shadow-[0_10px_40px_-12px_rgb(214_255_102/0.55)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_44px_-10px_rgb(214_255_102/0.7)] active:translate-y-0 ${size === 'lg' ? 'px-7 py-4 text-base' : 'px-5 py-3 text-sm'} ${className}`}
    >
      <Download size={size === 'lg' ? 19 : 17} className="transition-transform group-hover:translate-y-0.5" />
      {installed ? 'Open WalletWise' : 'Download the app'}
    </Link>
  );
}

/** A quiet line naming where it runs, so the page does not shout four buttons at once. */
export function PlatformLine({ className = '' }: { className?: string }) {
  return (
    <p className={`flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground ${className}`}>
      <span className="flex items-center gap-1.5"><AppleGlyph className="h-4 w-4" /> Mac and iPhone</span>
      <span className="flex items-center gap-1.5"><WindowsGlyph className="h-4 w-4" /> Windows</span>
      <span className="flex items-center gap-1.5"><AndroidGlyph className="h-4 w-4" /> Android</span>
    </p>
  );
}

export const pill =
  'inline-flex items-center justify-center gap-2 rounded-full bg-lime px-5 py-3 text-sm font-medium text-lime-ink transition-opacity hover:opacity-90';
export const pillGhost =
  'inline-flex items-center justify-center gap-2 rounded-full border border-line-strong px-5 py-3 text-sm font-medium transition-colors hover:bg-surface-3';

export function LimeIcon({ children }: { children: ReactNode }) {
  return (
    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-lime text-lime-ink shadow-[0_0_28px_-4px_rgb(214_255_102/0.55)]">
      {children}
    </span>
  );
}

export function NavLinkTo({ to, children, className = '' }: { to: string; children: ReactNode; className?: string }) {
  return (
    <Link to={to} className={className}>
      {children}
    </Link>
  );
}
