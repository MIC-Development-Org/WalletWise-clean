import { useEffect, useState, type ReactNode } from 'react';
import { Download, Laptop, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { APK_URL, useInstall } from '../lib/install';

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

const storeBtn =
  'flex min-w-[12.5rem] items-center gap-3 rounded-xl bg-white px-5 py-2.5 text-left text-black transition-transform hover:-translate-y-0.5 active:translate-y-0';

/** The two real ways in: install the PWA anywhere, or get the Android APK for SMS capture. */
export function StoreButtons({ className = '' }: { className?: string }) {
  const { install, installed, platform } = useInstall();
  const label =
    platform === 'ios' ? 'iPhone and iPad' : platform === 'mac-safari' ? 'Mac Dock' : platform === 'android' ? 'Android' : 'iPhone, Mac and PC';
  return (
    <div className={`flex flex-col items-center justify-center gap-3 sm:flex-row ${className}`}>
      <button type="button" onClick={install} className={storeBtn}>
        {platform === 'ios' || platform === 'android' ? <Smartphone size={26} /> : <Laptop size={26} />}
        <span className="leading-tight">
          <span className="block text-[0.65rem] tracking-wide">{installed ? 'Installed' : 'Install on'}</span>
          <span className="block text-lg font-semibold">{installed ? 'Open WalletWise' : label}</span>
        </span>
      </button>
      <ApkLink
        className={storeBtn}
        pending={
          <>
            <Download size={26} />
            <span className="leading-tight">
              <span className="block text-[0.65rem] tracking-wide">Android (APK)</span>
              <span className="block text-lg font-semibold">Publishing soon</span>
            </span>
          </>
        }
      >
        <Download size={26} />
        <span className="leading-tight">
          <span className="block text-[0.65rem] tracking-wide">Download for</span>
          <span className="block text-lg font-semibold">Android (APK)</span>
        </span>
      </ApkLink>
    </div>
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
