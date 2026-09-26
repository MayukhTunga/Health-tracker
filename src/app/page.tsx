import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { getWorkouts, getGoogleFitData } from "./actions";
import { CircularProgress } from "@/components/ui/circular-progress";
import { WeeklyCalendar } from "@/components/ui/weekly-calendar";
import { RecentWorkoutsList } from "@/components/ui/recent-workouts";
import { Suspense } from "react";
import { SyncButton } from "@/components/ui/sync-button";

export default async function Home({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const resolvedParams = await searchParams;
  const dateParam = resolvedParams.date;
  
  let selectedDate = new Date();
  if (dateParam) {
    const parts = dateParam.split('-');
    if (parts.length === 3) {
      selectedDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
  }
  const selectedDateString = selectedDate.toDateString();

  // Parallel fetching! getWorkouts uses a JOIN now, so it's super fast.
  const [allWorkouts, fitData] = await Promise.all([
    getWorkouts(),
    getGoogleFitData()
  ]);
  
  const todaysWorkouts = allWorkouts.filter((w: any) => new Date(w.date).toDateString() === selectedDateString);

  let totalVolume = 0;
  let totalDuration = 0;
  let totalSets = 0;
  
  todaysWorkouts.forEach((w: any) => {
     totalVolume += w.volume || 0;
     totalDuration += w.duration || 0;
     totalSets += w.sets ? w.sets.length : 0;
  });

  // Real data from Google Fit!
  // If it's today, show live sync data. If it's a past date, we don't have historical fit data implemented, so fallback to 0.
  const isToday = selectedDateString === new Date().toDateString();
  const steps = isToday ? fitData.steps : 0;
  const calories = isToday ? fitData.calories : 0;

  // Calculate Effort Points dynamically (Workouts + Steps)
  let effortPoints = 0;
  
  // Points from Workouts
  if (todaysWorkouts.length > 0) {
    effortPoints += 200 + Math.floor(totalVolume / 10) + (totalSets * 10) + Math.floor(totalDuration / 60) * 2;
  }
  
  // Points from Steps (1 point per 10 steps)
  effortPoints += Math.floor(steps / 10);
  
  const effortGoal = 1000;
  
  return (
    <div className="flex flex-col space-y-6 pb-20">
      
      {/* Calendar Slider */}
      <Suspense fallback={<div className="h-24 bg-card animate-pulse" />}>
        <WeeklyCalendar />
      </Suspense>

      <div className="container mx-auto px-4 space-y-8">
        
        {/* Effort / Heart Points Tracker */}
        <section className="flex flex-col items-center justify-center pt-2 relative">
          <CircularProgress value={effortPoints} max={effortGoal} size={180} strokeWidth={16}>
            <span className="text-4xl font-black text-foreground">{effortPoints}</span>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Effort Pts</span>
          </CircularProgress>
          <p className="text-sm font-medium text-muted-foreground mt-4 text-center">
            {effortPoints >= effortGoal 
              ? <><span className="text-primary font-bold">Goal crushed!</span> Incredible work today.</>
              : <>You're <span className="text-primary font-bold">{effortGoal - effortPoints} pts</span> away from your daily goal! Keep pushing.</>
            }
          </p>
        </section>

        {/* Steps & Calories */}
        <section className="flex flex-col gap-3">
          {isToday && (
            <div className="flex justify-between items-center px-1">
              <h3 className="text-sm font-bold text-foreground tracking-tight uppercase">Daily Activity</h3>
              <SyncButton />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-card border-border/50">
              <CardContent className="p-4 flex flex-col justify-center h-full">
                <span className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-1">Steps</span>
                <span className="text-2xl font-black text-foreground">{steps.toLocaleString()}</span>
              </CardContent>
            </Card>
            <Card className="bg-card border-border/50">
              <CardContent className="p-4 flex flex-col justify-center h-full">
                <span className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-1">Calories</span>
                <span className="text-2xl font-black text-foreground">{calories.toLocaleString()}</span>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Start Workout Action */}
        <section>
          <Link href="/workouts">
            <Button size="lg" className="w-full h-16 text-lg font-bold rounded-2xl shadow-[0_0_20px_rgba(34,197,94,0.3)] bg-primary text-primary-foreground hover:bg-primary/90 transition-all">
              <Plus className="mr-2 h-6 w-6 stroke-[3]" />
              SELECT WORKOUT
            </Button>
          </Link>
        </section>

        {/* Recent Workouts */}
        <section>
          <h2 className="text-lg font-bold tracking-tight text-foreground/90 mb-4 uppercase">{isToday ? "Today's Workouts" : "Workouts on this Date"}</h2>
          <RecentWorkoutsList workouts={todaysWorkouts} />
        </section>
      </div>
    </div>
  );
}
