import { useEffect } from 'react';

/** Set VITE_SITE_URL at build time to the real domain. Used for canonical, Open Graph and structured data. */
export const SITE_URL = ((import.meta.env.VITE_SITE_URL as string | undefined) ?? 'https://walletwise.pages.dev').replace(/\/$/, '');

export interface PageMeta {
  title: string;
  description: string;
  keywords: string;
  path: string;
  /** Pages that should not be indexed, such as the 404 page. */
  noindex?: boolean;
}

export const PAGES = {
  home: {
    title: 'WalletWise: know what you can spend today',
    description:
      'WalletWise is a free personal finance app for hostel students. See what is safe to spend today, track expenses, set budgets and savings goals, and capture bank SMS on your phone without uploading it.',
    keywords: 'student budget app, hostel expense tracker, personal finance app India, spend tracker, budget planner, bank SMS expense tracker, savings goals, UPI expense tracker, WalletWise',
    path: '/',
  },
  features: {
    title: 'Features: budgets, SMS capture and sync | WalletWise',
    description:
      'Safe-to-spend today, quick add, budgets and goals, a review list for payments the app is unsure of, offline first sync, and privacy by design. See everything WalletWise does.',
    keywords: 'expense tracker features, budget tracking, safe to spend, offline expense app, SMS parsing, duplicate payment detection, student finance app',
    path: '/features',
  },
  compare: {
    title: 'Compare platforms: iPhone, Android, Mac and Windows | WalletWise',
    description:
      'See what WalletWise does on each device. Android reads bank SMS on the phone, iPhone uses email and quick add, and Mac and Windows install the web app.',
    keywords: 'WalletWise Android, WalletWise iPhone, install PWA, SMS capture Android, expense app Windows Mac, platform comparison',
    path: '/compare',
  },
  team: {
    title: 'Team: Undercut Engineers, Team G | WalletWise',
    description:
      'WalletWise is built by Undercut Engineers, Team G of the Microsoft Innovations Club at VIT Chennai. Meet the students behind the app.',
    keywords: 'Undercut Engineers, Team G, Microsoft Innovations Club, VIT Chennai, student developers, WalletWise team',
    path: '/team',
  },
  privacy: {
    title: 'Privacy Policy | WalletWise',
    description:
      'What WalletWise collects, what stays on your phone, and how your data is protected. Raw SMS never leaves your device and you can delete your data at any time.',
    keywords: 'WalletWise privacy policy, SMS privacy, data protection, expense app privacy, student finance privacy',
    path: '/privacy',
  },
  terms: {
    title: 'Terms of Service | WalletWise',
    description: 'The terms for using WalletWise: what the app is, what you agree to, and what we do not promise.',
    keywords: 'WalletWise terms, terms of service, terms and conditions, expense app terms',
    path: '/terms',
  },
  installApple: {
    title: 'Install WalletWise on iPhone and Mac | WalletWise',
    description: 'Step by step: add WalletWise to your iPhone Home Screen from Safari, or to your Mac Dock with File, Add to Dock. Free and no App Store account needed.',
    keywords: 'install WalletWise iPhone, add to Home Screen, Add to Dock Mac, install PWA Safari, expense app iPhone',
    path: '/install/apple',
  },
  installWindows: {
    title: 'Install WalletWise on Windows and Linux | WalletWise',
    description: 'Install WalletWise from Chrome or Edge in one click. It runs in its own window, works offline and needs no store account.',
    keywords: 'install WalletWise Windows, install PWA Chrome, install web app Edge, expense tracker Linux, desktop expense app',
    path: '/install/windows',
  },
  installAndroid: {
    title: 'Install WalletWise on Android, with SMS capture | WalletWise',
    description: 'Install the WalletWise web app on Android, or use the APK to capture bank SMS on your phone. Includes the Android 13 restricted settings step.',
    keywords: 'install WalletWise Android, WalletWise APK, Android 13 restricted settings, SMS expense tracker, sideload APK',
    path: '/install/android',
  },
  notFound: {
    title: 'Page not found | WalletWise',
    description: 'This page does not exist. Head back to WalletWise to see what you can spend today.',
    keywords: 'WalletWise',
    path: '/404',
    noindex: true,
  },
} satisfies Record<string, PageMeta>;

function upsert(selector: string, create: () => HTMLElement, set: (el: HTMLElement) => void) {
  let el = document.head.querySelector<HTMLElement>(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  set(el);
}

const meta = (attr: 'name' | 'property', key: string, content: string) =>
  upsert(
    `meta[${attr}="${key}"]`,
    () => {
      const m = document.createElement('meta');
      m.setAttribute(attr, key);
      return m;
    },
    (m) => m.setAttribute('content', content),
  );

const JSON_LD_ID = 'ww-jsonld';

function jsonLd(page: PageMeta, url: string) {
  const org = {
    '@type': 'Organization',
    name: 'Undercut Engineers (Team G)',
    parentOrganization: { '@type': 'Organization', name: 'Microsoft Innovations Club, VIT Chennai' },
    url: SITE_URL,
  };
  const graph: object[] = [
    { '@type': 'WebSite', name: 'WalletWise', url: SITE_URL, inLanguage: 'en-IN' },
    { '@type': 'WebPage', name: page.title, description: page.description, url },
  ];
  if (page.path === '/') {
    graph.push({
      '@type': 'SoftwareApplication',
      name: 'WalletWise',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Android, iOS, macOS, Windows (installable web app)',
      description: page.description,
      url: SITE_URL,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
      author: org,
    });
  }
  if (page.path === '/team') graph.push(org);
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
}

/** Sets the title, description, keywords, canonical, Open Graph, Twitter and structured data for a page. */
export function Seo({ page }: { page: PageMeta }) {
  useEffect(() => {
    const url = `${SITE_URL}${page.path === '/404' ? window.location.pathname : page.path}`;
    const image = `${SITE_URL}/screens/laptop.webp`;
    document.title = page.title;
    meta('name', 'description', page.description);
    meta('name', 'keywords', page.keywords);
    meta('name', 'robots', page.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');
    meta('name', 'author', 'Undercut Engineers, Team G, Microsoft Innovations Club, VIT Chennai');
    meta('property', 'og:type', 'website');
    meta('property', 'og:site_name', 'WalletWise');
    meta('property', 'og:locale', 'en_IN');
    meta('property', 'og:title', page.title);
    meta('property', 'og:description', page.description);
    meta('property', 'og:url', url);
    meta('property', 'og:image', image);
    meta('property', 'og:image:alt', 'WalletWise on a laptop, tablet and phone');
    meta('name', 'twitter:card', 'summary_large_image');
    meta('name', 'twitter:title', page.title);
    meta('name', 'twitter:description', page.description);
    meta('name', 'twitter:image', image);
    upsert(
      'link[rel="canonical"]',
      () => {
        const l = document.createElement('link');
        l.rel = 'canonical';
        return l;
      },
      (l) => l.setAttribute('href', url),
    );
    upsert(
      `script#${JSON_LD_ID}`,
      () => {
        const s = document.createElement('script');
        s.id = JSON_LD_ID;
        s.type = 'application/ld+json';
        return s;
      },
      (s) => {
        s.textContent = jsonLd(page, url);
      },
    );
  }, [page]);
  return null;
}
