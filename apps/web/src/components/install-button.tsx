import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInstall } from '@/lib/install';

/** Shown until the app is installed. Uses the native prompt where the browser offers one, steps otherwise. */
export function InstallButton() {
  const { install, installed } = useInstall();
  if (installed) return null;
  return (
    <Button variant="outline" onClick={install}>
      <Download className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Install app</span>
    </Button>
  );
}
