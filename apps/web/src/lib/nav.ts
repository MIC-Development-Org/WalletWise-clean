import { ChartPie, House, Inbox, LayoutGrid, Receipt, UserRound, type LucideIcon } from 'lucide-react';

export type NavKey = 'home' | 'activity' | 'budgets' | 'review' | 'settings' | 'more';
export type NavItem = { key: NavKey; label: string; href: string; icon: LucideIcon; desc: string };

export const NAV: NavItem[] = [
  { key: 'home', label: 'Home', href: '/app', icon: House, desc: 'Safe to spend today' },
  { key: 'activity', label: 'Activity', href: '/app/activity', icon: Receipt, desc: 'Every transaction, searchable' },
  { key: 'budgets', label: 'Budgets & goals', href: '/app/budgets', icon: ChartPie, desc: 'Limits and savings goals' },
  { key: 'review', label: 'Review', href: '/app/review', icon: Inbox, desc: 'Captures waiting for you' },
  { key: 'settings', label: 'Settings', href: '/app/settings', icon: UserRound, desc: 'Your name and photo' },
  { key: 'more', label: 'More', href: '/app/more', icon: LayoutGrid, desc: 'Settings, export, install' },
];

export const isActive = (pathname: string, href: string) =>
  href === '/app' ? pathname === '/app' : pathname === href || pathname.startsWith(`${href}/`);

export function activeKey(pathname: string): NavKey {
  return NAV.find((n) => n.key !== 'home' && isActive(pathname, n.href))?.key ?? 'home';
}
