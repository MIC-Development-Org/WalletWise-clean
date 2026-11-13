import type { LucideIcon } from 'lucide-react';
import { Download, EllipsisVertical, FileDown, MonitorDown, Settings, ShieldCheck, Share, Smartphone, SquarePlus, SquareMenu, Globe, MousePointerClick } from 'lucide-react';

/**
 * Step by step install guides. A step may name a real screenshot in /public/install. The image is shown
 * when the file exists and quietly left out when it does not, so the page never shows a broken picture.
 */
export interface Step {
  icon: LucideIcon;
  title: string;
  body: string;
  /** File name inside /public/install, for example "iphone-share.webp". */
  shot?: string;
  /** Where the highlighted target sits in the placeholder picture. */
  at?: 'top-left' | 'top-right' | 'center' | 'bottom' | 'bottom-right';
  /** Short label on the highlight, for example "Share". */
  target?: string;
}

export interface GuideSection {
  id: string;
  title: string;
  intro?: string;
  steps: Step[];
  note?: string;
  apk?: boolean;
  /** What the screenshots show: a phone screen or a browser window. */
  frame: 'phone' | 'browser';
}

export interface Guide {
  slug: 'apple' | 'windows' | 'android';
  name: string;
  lead: string;
  sections: GuideSection[];
  /** The finished app, shown at the end. */
  after: { src: string; alt: string; tall?: boolean }[];
}

export const GUIDES: Guide[] = [
  {
    slug: 'apple',
    name: 'Mac and iPhone',
    lead: 'WalletWise installs from Safari. It then opens full screen from your Home Screen or Dock, like any other app.',
    sections: [
      {
        id: 'iphone',
        frame: 'phone',
        title: 'On iPhone and iPad',
        intro: 'You need Safari for this. Other browsers on iPhone cannot add apps to the Home Screen.',
        steps: [
          { icon: Globe, title: 'Open WalletWise in Safari', at: 'top-left', target: 'WalletWise', body: 'Go to the WalletWise site in Safari. If you opened a link inside another app, use its menu to open it in Safari.', shot: 'iphone-1-safari.webp' },
          { icon: Share, title: 'Tap the Share button', at: 'bottom', target: 'Share', body: 'It is the square with an arrow pointing up, at the bottom of the screen.', shot: 'iphone-2-share.webp' },
          { icon: SquarePlus, title: 'Choose Add to Home Screen', at: 'center', target: 'Add to Home Screen', body: 'Scroll down the list of actions until you see Add to Home Screen, then tap it.', shot: 'iphone-3-add.webp' },
          { icon: MousePointerClick, title: 'Tap Add', at: 'top-right', target: 'Add', body: 'Keep the name as WalletWise and tap Add in the top right corner.', shot: 'iphone-4-confirm.webp' },
          { icon: Smartphone, title: 'Open it from your Home Screen', at: 'center', target: 'WalletWise', body: 'Always open WalletWise from the new icon. Notifications on iPhone only work from the Home Screen app.', shot: 'iphone-5-open.webp' },
        ],
        note: 'iOS does not let any app read SMS. On iPhone you add entries with quick add, bank emails and bill scanning instead.',
      },
      {
        id: 'mac',
        frame: 'browser',
        title: 'On Mac',
        intro: 'Safari 17 on macOS Sonoma or later can add a website to the Dock. Chrome and Edge on Mac can install it too.',
        steps: [
          { icon: Globe, title: 'Open WalletWise in Safari', at: 'top-left', target: 'WalletWise', body: 'Go to the WalletWise site.', shot: 'mac-1-safari.webp' },
          { icon: SquareMenu, title: 'Open the File menu', at: 'top-left', target: 'File', body: 'Choose File in the menu bar at the top of the screen, then Add to Dock.', shot: 'mac-2-file.webp' },
          { icon: MousePointerClick, title: 'Click Add', at: 'center', target: 'Add', body: 'Keep the name as WalletWise and click Add.', shot: 'mac-3-add.webp' },
          { icon: MonitorDown, title: 'Open it from your Dock', at: 'bottom', target: 'WalletWise', body: 'WalletWise now opens in its own window. It also appears in Launchpad.', shot: 'mac-4-open.webp' },
        ],
        note: 'Using Chrome or Edge on your Mac? Click the install icon at the end of the address bar, then Install.',
      },
    ],
    after: [
      { src: '/screens/phone.webp', alt: 'WalletWise open on an iPhone', tall: true },
      { src: '/screens/laptop.webp', alt: 'WalletWise open on a Mac' },
    ],
  },
  {
    slug: 'windows',
    name: 'Windows and Linux',
    lead: 'Install it from Chrome or Edge in one click. It then runs in its own window with its own taskbar icon, and works offline.',
    sections: [
      {
        id: 'chrome-edge',
        frame: 'browser',
        title: 'Chrome, Edge and Chromium',
        intro: 'This works on Windows 10 and 11, and on Linux with Chrome, Chromium or Edge.',
        steps: [
          { icon: Globe, title: 'Open WalletWise in Chrome or Edge', at: 'top-left', target: 'WalletWise', body: 'Go to the WalletWise site in a normal browser window.', shot: 'desktop-1-open.webp' },
          { icon: Download, title: 'Click the install icon', at: 'top-right', target: 'Install', body: 'It sits at the right end of the address bar and looks like a small screen with a down arrow.', shot: 'desktop-2-icon.webp' },
          { icon: MousePointerClick, title: 'Click Install', at: 'center', target: 'Install', body: 'Confirm in the small window that appears. This takes a few seconds.', shot: 'desktop-3-install.webp' },
          { icon: MonitorDown, title: 'Open it like any app', at: 'bottom-right', target: 'WalletWise', body: 'WalletWise opens in its own window. Find it in the Start menu or your app launcher, and pin it to the taskbar if you like.', shot: 'desktop-4-open.webp' },
        ],
        note: 'No install icon? Open the browser menu. In Chrome choose Cast, save and share, then Install page as app. In Edge choose Apps, then Install this site as an app.',
      },
      {
        id: 'firefox',
        frame: 'browser',
        title: 'Firefox and other browsers',
        intro: 'Firefox on Windows and Linux cannot install web apps. You can still use WalletWise in a tab, or open it in Chrome or Edge and install it from there.',
        steps: [],
      },
    ],
    after: [{ src: '/screens/laptop.webp', alt: 'WalletWise open in its own window on a laptop' }],
  },
  {
    slug: 'android',
    name: 'Android',
    lead: 'Install the web app in a few taps, or use the APK if you want WalletWise to read your bank SMS.',
    sections: [
      {
        id: 'web-app',
        frame: 'phone',
        title: 'Install the web app',
        intro: 'The quickest way. Everything works except automatic SMS capture.',
        steps: [
          { icon: Globe, title: 'Open WalletWise in Chrome', at: 'top-left', target: 'WalletWise', body: 'Go to the WalletWise site in Chrome on your phone.', shot: 'android-1-open.webp' },
          { icon: EllipsisVertical, title: 'Open the browser menu', at: 'top-right', target: 'Menu', body: 'Tap the three dots at the top right.', shot: 'android-2-menu.webp' },
          { icon: SquarePlus, title: 'Tap Install app', at: 'center', target: 'Install app', body: 'You may see Add to Home screen instead. Choose it, then tap Install.', shot: 'android-3-install.webp' },
          { icon: Smartphone, title: 'Open it from your app drawer', at: 'center', target: 'WalletWise', body: 'WalletWise now sits with your other apps and opens full screen.', shot: 'android-4-open.webp' },
        ],
      },
      {
        id: 'apk',
        frame: 'phone',
        title: 'Install the APK for SMS capture',
        intro: 'The APK reads bank messages on your phone. Only messages from known bank sender IDs are read, and the text never leaves your phone.',
        apk: true,
        steps: [
          { icon: FileDown, title: 'Download the APK', at: 'center', target: 'Download', body: 'Use the download button on this page, then open the file when your browser finishes.', shot: 'apk-1-download.webp' },
          { icon: Settings, title: 'Allow installs from your browser', at: 'center', target: 'Allow from this source', body: 'Android asks once. Turn on Allow from this source, then go back and tap Install.', shot: 'apk-2-unknown.webp' },
          { icon: ShieldCheck, title: 'Allow restricted settings (Android 13 and later)', at: 'top-right', target: 'Allow restricted settings', body: 'Open Settings, Apps, WalletWise, tap the three dots at the top right and choose Allow restricted settings.', shot: 'apk-3-restricted.webp' },
          { icon: Smartphone, title: 'Give SMS permission', at: 'center', target: 'Allow', body: 'Open WalletWise and allow SMS when asked. You can turn this off any time in your phone settings.', shot: 'apk-4-sms.webp' },
        ],
        note: 'Android blocks sideloaded apps from restricted permissions until you allow them once. That is why step three is needed.',
      },
    ],
    after: [{ src: '/screens/phone.webp', alt: 'WalletWise open on an Android phone', tall: true }],
  },
];

export const guideBySlug = (slug: Guide['slug']) => GUIDES.find((g) => g.slug === slug)!;
