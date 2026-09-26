import Link from 'next/link';
import { Home, Dumbbell, TrendingUp, User } from 'lucide-react';

export function MobileNav() {
  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-card border-t border-border sm:hidden">
      <div className="grid h-full max-w-lg grid-cols-4 mx-auto font-medium">
        <Link href="/" className="inline-flex flex-col items-center justify-center px-5 hover:bg-muted/50 group transition-colors">
          <Home className="w-6 h-6 mb-1 text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="text-[10px] uppercase font-bold text-muted-foreground group-hover:text-primary transition-colors">Home</span>
        </Link>
        <Link href="/workouts" className="inline-flex flex-col items-center justify-center px-5 hover:bg-muted/50 group transition-colors">
          <Dumbbell className="w-6 h-6 mb-1 text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="text-[10px] uppercase font-bold text-muted-foreground group-hover:text-primary transition-colors">Workout</span>
        </Link>
        <Link href="/progress" className="inline-flex flex-col items-center justify-center px-5 hover:bg-muted/50 group transition-colors">
          <TrendingUp className="w-6 h-6 mb-1 text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="text-[10px] uppercase font-bold text-muted-foreground group-hover:text-primary transition-colors">Progress</span>
        </Link>
        <Link href="/profile" className="inline-flex flex-col items-center justify-center px-5 hover:bg-muted/50 group transition-colors">
          <User className="w-6 h-6 mb-1 text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="text-[10px] uppercase font-bold text-muted-foreground group-hover:text-primary transition-colors">Profile</span>
        </Link>
      </div>
    </div>
  );
}
