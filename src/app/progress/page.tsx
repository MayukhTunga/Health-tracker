import { getWorkouts, getExercises } from "../actions";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Dumbbell, CalendarDays } from "lucide-react";
import { Sparkline } from "@/components/ui/sparkline";

export default async function ProgressPage() {
  const allWorkouts = await getWorkouts();
  const allExercises = await getExercises();
  
  // Group by exercise
  const exerciseMap: Record<string, {
    sessions: Record<string, any[]>
  }> = {};
  
  allWorkouts.forEach((w: any) => {
    if (!w.sets) return;
    w.sets.forEach((set: any) => {
       if (!exerciseMap[set.exerciseId]) {
         exerciseMap[set.exerciseId] = { sessions: {} };
       }
       if (!exerciseMap[set.exerciseId].sessions[w.id]) {
         exerciseMap[set.exerciseId].sessions[w.id] = { date: w.date, sets: [] };
       }
       exerciseMap[set.exerciseId].sessions[w.id].sets.push(set);
    });
  });

  const progressData = Object.keys(exerciseMap).map(exId => {
     const exDetails = allExercises.find(e => e.id === exId);
     const sessions = Object.values(exerciseMap[exId].sessions);
     
     // Sort sessions chronologically (oldest to newest for graphing)
     sessions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
     
     // Extract Estimated 1RM for each session
     const dataPoints = sessions.map(session => {
        let max1RM = 0;
        session.sets.forEach((s: any) => {
           const weight = Number(s.weight) || 0;
           const reps = Number(s.reps) || 0;
           const rm = weight * (1 + (reps/30)); // Epley Formula
           if (rm > max1RM) max1RM = rm;
        });
        return Math.round(max1RM);
     });

     // Take up to the last 10 sessions
     const last10 = dataPoints.slice(-10);
     
     // Calculate percentage change
     let percentChange = 0;
     if (last10.length >= 2) {
       const start = last10[0];
       const end = last10[last10.length - 1];
       if (start > 0) {
         percentChange = ((end - start) / start) * 100;
       }
     }

     return {
       id: exId,
       name: exDetails?.name || exId,
       muscleGroup: exDetails?.muscleGroup || "Unknown",
       data: last10,
       percentChange,
       lastPerformed: sessions[sessions.length - 1].date
     };
  });
  
  // Sort list by most recently performed exercise
  progressData.sort((a, b) => new Date(b.lastPerformed).getTime() - new Date(a.lastPerformed).getTime());

  return (
    <div className="container mx-auto px-4 pt-6 pb-24 space-y-6">
      <div className="flex items-center gap-2 mb-2">
         <TrendingUp className="w-6 h-6 text-primary" />
         <h1 className="text-2xl font-black uppercase tracking-tight">Progress</h1>
      </div>
      
      <p className="text-sm font-medium text-muted-foreground">
        Estimated 1RM (One Rep Max) trends over your last 10 sessions.
      </p>

      <div className="space-y-4 mt-6">
         {progressData.length === 0 ? (
           <div className="text-center p-10 border border-dashed border-border/50 rounded-2xl bg-card/50 mt-10">
              <Dumbbell className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm font-bold text-muted-foreground">No exercise data found yet.<br/>Complete some workouts to see your progress!</p>
           </div>
         ) : (
           progressData.map((pd, i) => {
              const isPositive = pd.percentChange >= 0;
              return (
                <Card key={i} className="bg-card border-border/50 overflow-hidden shadow-sm hover:border-primary/50 transition-colors">
                  <CardContent className="p-4">
                     <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-foreground text-sm leading-tight pr-2">{pd.name}</h3>
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mt-1">{pd.muscleGroup}</p>
                        </div>
                        <div className={`flex items-center shrink-0 gap-1 text-xs font-black px-2 py-1 rounded-md ${isPositive ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                           {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                           {isPositive ? '+' : ''}{pd.percentChange.toFixed(1)}%
                        </div>
                     </div>
                     
                     <div className="flex flex-col gap-2 mt-2">
                        <div className="flex justify-end pr-2">
                           <div className="text-right">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Current 1RM</p>
                              <p className="text-xl font-black text-foreground leading-none">
                                 {pd.data.length > 0 ? pd.data[pd.data.length - 1] : 0}<span className="text-xs text-muted-foreground ml-0.5">kg</span>
                              </p>
                           </div>
                        </div>
                        <div className="w-full min-w-0 h-32 pt-2">
                           <Sparkline data={pd.data} />
                        </div>
                     </div>
                     
                     <div className="mt-4 pt-3 border-t border-border/50 flex items-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        <CalendarDays className="w-3 h-3 mr-1.5 opacity-70" />
                        Last trained: {new Date(pd.lastPerformed).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                     </div>
                  </CardContent>
                </Card>
              )
           })
         )}
      </div>
    </div>
  );
}
