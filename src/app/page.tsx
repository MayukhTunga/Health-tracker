import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import Link from "next/link";
import { getWorkouts, getExercises } from "./actions";
import { CircularProgress } from "@/components/ui/circular-progress";
import { WeeklyCalendar } from "@/components/ui/weekly-calendar";
import { RecentWorkoutsList } from "@/components/ui/recent-workouts";
import { Suspense } from "react";

export default async function Home({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const resolvedParams = await searchParams;
  const dateParam = resolvedParams.date;
  
  let selectedDate = new Date();
  if (dateParam) {
    // Treat YYYY-MM-DD as local time by splitting and parsing
    const parts = dateParam.split('-');
    if (parts.length === 3) {
      selectedDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
  }
  const selectedDateString = selectedDate.toDateString();

  const allWorkouts = await getWorkouts();
  const allExercises = await getExercises();
  
  const todaysWorkouts = allWorkouts.filter((w: any) => new Date(w.date).toDateString() === selectedDateString);

  let totalVolume = 0;
  let totalDuration = 0;
  let totalSets = 0;
  
  todaysWorkouts.forEach((w: any) => {
     totalVolume += w.volume || 0;
     totalDuration += w.duration || 0;
     totalSets += w.sets ? w.sets.length : 0;
  });

  // Calculate Effort Points dynamically
  let effortPoints = 0;
  if (todaysWorkouts.length > 0) {
    // 200 base + 1 pt per 10kg + 10 pts per set + 2 pts per minute
    effortPoints = 200 + Math.floor(totalVolume / 10) + (totalSets * 10) + Math.floor(totalDuration / 60) * 2;
  }
  
  // Mock steps deterministically based on date string so it changes when clicking days
  const seed = Array.from(selectedDateString).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  // Add some steps for workouts done
  const workoutSteps = todaysWorkouts.length > 0 ? 3000 : 0;
  const mockSteps = 4000 + (seed * 17 % 6000) + workoutSteps; 
  const mockCalories = 1800 + (seed * 11 % 800) + (effortPoints);
  
  const effortGoal = 1000;
  
  return (
    <div className="flex flex-col space-y-6 pb-20">
      
      {/* Calendar Slider */}
      <Suspense fallback={<div className="h-24 bg-card animate-pulse" />}>
        <WeeklyCalendar />
      </Suspense>

      <div className="container mx-auto px-4 space-y-8">
        
        {/* Effort / Heart Points Tracker */}
        <section className="flex flex-col items-center justify-center pt-2">
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
        <section className="grid grid-cols-2 gap-4">
          <Card className="bg-card border-border/50">
            <CardContent className="p-4 flex flex-col justify-center h-full">
              <span className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-1">Steps</span>
              <span className="text-2xl font-black text-foreground">{mockSteps.toLocaleString()}</span>
            </CardContent>
          </Card>
          <Card className="bg-card border-border/50">
            <CardContent className="p-4 flex flex-col justify-center h-full">
              <span className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-1">Calories</span>
              <span className="text-2xl font-black text-foreground">{mockCalories.toLocaleString()}</span>
            </CardContent>
          </Card>
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
          <h2 className="text-lg font-bold tracking-tight text-foreground/90 mb-4 uppercase">{selectedDateString === new Date().toDateString() ? "Today's Workouts" : "Workouts on this Date"}</h2>
          <RecentWorkoutsList workouts={todaysWorkouts} allExercises={allExercises} />
        </section>
      </div>
    </div>
  );
}
