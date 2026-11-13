import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

/** The person using the app (photo, name, where their data lives). Links to Settings. */
export function Account({ name, photo, compact = false, onNavigate }: { name: string; photo?: string | null; compact?: boolean; onNavigate?: () => void }) {
  const shown = name || 'Your wallet';
  return (
    <Link
      to="/app/settings"
      onClick={onNavigate}
      title={shown}
      className={cn('flex w-full items-center rounded-md transition-colors hover:bg-sidebar-accent', compact ? 'justify-center p-1' : 'gap-3 px-1 py-1')}
    >
      <Avatar className="h-9 w-9">
        {photo && <AvatarImage src={photo} alt="" />}
        <AvatarFallback className="bg-primary font-bold text-primary-foreground">{shown.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      {!compact && (
        <div className="flex min-w-0 flex-1 flex-col text-left">
          <span className="truncate text-sm font-medium">{shown}</span>
          <span className="truncate text-xs text-muted-foreground">Saved on this device</span>
        </div>
      )}
    </Link>
  );
}
