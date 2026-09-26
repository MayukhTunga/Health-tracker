import { Activity, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function TopHeader({ avatarUrl }: { avatarUrl?: string | null }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 px-4 cursor-pointer">
          <Activity className="h-6 w-6 text-primary" />
          <span className="font-black tracking-tighter text-xl uppercase text-foreground">GymTracker</span>
        </Link>
        <div className="flex items-center px-4">
          <Link href="/profile">
            <Button variant="ghost" size="icon" className="rounded-full ring-2 ring-primary/20 hover:ring-primary transition-all overflow-hidden">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Avatar" 
                  className="h-full w-full object-cover" 
                />
              ) : (
                <div className="h-full w-full bg-muted flex items-center justify-center text-muted-foreground">
                  <User className="h-4 w-4" />
                </div>
              )}
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
