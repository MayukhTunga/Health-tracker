import { Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function TopHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-2 px-4">
          <Activity className="h-6 w-6 text-primary" />
          <span className="font-black tracking-tighter text-xl uppercase text-foreground">GymTracker</span>
        </div>
        <div className="flex items-center px-4">
          <Button variant="ghost" size="icon" className="rounded-full ring-2 ring-primary/20 hover:ring-primary transition-all">
            <img 
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=000000" 
              alt="Avatar" 
              className="h-8 w-8 rounded-full bg-black" 
            />
          </Button>
        </div>
      </div>
    </header>
  );
}
