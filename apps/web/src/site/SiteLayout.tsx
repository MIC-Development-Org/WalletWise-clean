import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { ArrowUp, Menu, X } from 'lucide-react';
import { Logo } from '../components/Logo';
import { InstallProvider, isStandalone, useInstall } from '../lib/install';
import { Reveal } from '../components/Reveal';
import { Container, StoreButtons } from './parts';

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/features', label: 'Features' },
  { to: '/compare', label: 'Compare' },
];

function Header() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { install, installed } = useInstall();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors ${isActive ? 'text-lime' : 'text-white hover:text-lime'}`;

  return (
    <header className="sticky top-0 z-40 bg-ink/80 backdrop-blur-xl">
      <Container className="flex h-[4.75rem] items-center justify-between">
        <Link to="/" aria-label="WalletWise home">
          <Logo className="h-9" />
        </Link>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end className={linkCls}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <button
          type="button"
          onClick={install}
          className="hidden rounded-full bg-lime px-5 py-3 text-sm font-medium text-lime-ink transition-opacity hover:opacity-90 md:inline-block"
        >
          {installed ? 'Open app' : 'Download'}
        </button>
        <button
          type="button"
          className="grid h-11 w-11 place-items-center rounded-full border border-line-strong md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </Container>
      {open && (
        <div className="fixed inset-x-0 top-[4.75rem] bottom-0 z-30 flex flex-col bg-ink px-5 pt-4 md:hidden">
          <nav aria-label="Mobile">
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} end className={({ isActive }) => `block border-b border-line py-5 text-2xl font-medium ${isActive ? 'text-lime' : ''}`}>
                {l.label}
              </NavLink>
            ))}
          </nav>
          <button type="button" onClick={install} className="mt-8 rounded-full bg-lime px-6 py-4 text-center font-medium text-lime-ink">
            {installed ? 'Open app' : 'Download'}
          </button>
        </div>
      )}
    </header>
  );
}

function Footer() {
  const col = 'space-y-3.5 text-sm text-muted-foreground';
  const a = 'transition-colors hover:text-white';
  return (
    <footer className="px-3 pb-3 sm:px-4 sm:pb-4">
      <div className="relative overflow-hidden rounded-3xl bg-lime/5">
        <div className="pointer-events-none absolute -top-32 -left-24 h-72 w-72 rounded-full bg-lime/10 blur-[90px]" aria-hidden="true" />
        <Container className="relative z-10 pt-14 lg:pt-16">
          <div className="grid gap-12 lg:grid-cols-[1.5fr_0.7fr_0.7fr_1.2fr]">
            <div>
              <Logo className="h-9" />
              <p className="mt-5 max-w-xs text-sm leading-6 text-muted-foreground">
                A personal finance app for hostel students. Track spending, set budgets and see what is safe to spend today.
              </p>
              <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-line-strong px-3.5 py-1.5 text-xs text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-lime" /> Made for hostel students at VIT Chennai
              </p>
            </div>

            <nav aria-label="Product">
              <h3 className="mb-5 text-sm font-medium">Product</h3>
              <ul className={col}>
                <li><Link to="/features" className={a}>Features</Link></li>
                <li><Link to="/compare" className={a}>Compare platforms</Link></li>
                <li><Link to="/#download" className={a}>Download</Link></li>
                <li><Link to="/app" className={a}>Open web app</Link></li>
              </ul>
            </nav>

            <nav aria-label="Learn more">
              <h3 className="mb-5 text-sm font-medium">Learn more</h3>
              <ul className={col}>
                <li><Link to="/#how-it-works" className={a}>How it works</Link></li>
                <li><Link to="/features#privacy" className={a}>Privacy</Link></li>
                <li><Link to="/#faq" className={a}>FAQ</Link></li>
              </ul>
            </nav>

            <div>
              <h3 className="mb-5 text-sm font-medium">Get the app</h3>
              <p className="mb-5 max-w-xs text-sm leading-6 text-muted-foreground">Install it like any other app. It works offline and syncs when you are back online.</p>
              <StoreButtons className="!items-start sm:!flex-col" />
            </div>
          </div>

          <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-line pt-6 text-sm text-muted-foreground sm:flex-row">
            <p>© {new Date().getFullYear()} WalletWise. Built by Team G, Microsoft Innovations Club.</p>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-2 rounded-full border border-line-strong px-4 py-2 transition-colors hover:bg-white/10 hover:text-white"
            >
              Back to top <ArrowUp size={15} />
            </button>
          </div>
        </Container>

        <p
          aria-hidden="true"
          className="pointer-events-none -mt-2 mb-[-0.18em] block bg-gradient-to-b from-white/[0.13] to-transparent bg-clip-text text-center text-[21vw] leading-[0.9] font-semibold tracking-tight text-transparent select-none lg:text-[17rem]"
        >
          WalletWise
        </p>
      </div>
    </footer>
  );
}

/** Marketing site shell. An installed app skips straight to the app. */
export function SiteLayout() {
  const { pathname, hash } = useLocation();
  // The installed app should open on the dashboard, never on the landing page.
  const standalone = typeof window !== 'undefined' && isStandalone();

  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView();
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  useEffect(() => {
    document.documentElement.classList.add('js-reveal');
    return () => document.documentElement.classList.remove('js-reveal');
  }, []);

  if (standalone && pathname === '/') return <Navigate to="/app" replace />;

  return (
    <InstallProvider>
      <Header />
      <main>
        <Outlet />
      </main>
      <Reveal>
        <Footer />
      </Reveal>
    </InstallProvider>
  );
}
