"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Timer, Pencil, Trash2, CalendarDays, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { deletePastWorkout } from "@/app/actions";

export function RecentWorkoutsList({ workouts, allExercises }: { workouts: any[], allExercises: any[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const router = useRouter();

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  if (workouts.length === 0) {
    return (
      <div className="text-center p-8 border border-dashed border-border rounded-xl bg-card/30">
        <p className="text-sm text-muted-foreground font-medium">No workouts recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {workouts.map(session => {
        const isExpanded = expandedId === session.id;
        
        const groupedSets: any = {};
        if (session.sets) {
          session.sets.forEach((s: any) => {
            if (!groupedSets[s.exerciseId]) groupedSets[s.exerciseId] = [];
            groupedSets[s.exerciseId].push(s);
          });
        }

        return (
          <Card key={session.id} className={`bg-card border-border/50 shadow-sm transition-colors cursor-pointer ${isExpanded ? 'ring-1 ring-primary' : 'hover:border-primary/50'}`} onClick={() => setExpandedId(isExpanded ? null : session.id)}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3 border-b border-border/50 pb-3">
                <div className="flex items-center text-primary font-bold">
                  <CalendarDays className="w-4 h-4 mr-2" />
                  {new Date(session.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <div className="flex gap-2">
                  <div className="flex items-center text-xs font-mono font-bold bg-muted/50 px-2 py-1 rounded-md text-muted-foreground">
                    <Timer className="w-3 h-3 mr-1" />
                    {formatTime(session.duration || 0)}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center bg-primary/5 rounded-lg p-3 border border-primary/10 mb-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{session.name || "Workout"} Volume</span>
                <span className="text-lg font-black text-primary">{session.volume || 0} <span className="text-xs text-primary/70">kg</span></span>
              </div>

              {isExpanded && (
                <div className="pt-2 animate-in slide-in-from-top-2 fade-in">
                  <div className="space-y-4 mb-4">
                    {Object.entries(groupedSets).map(([exId, sets]: [string, any]) => {
                       const exName = allExercises.find(e => e.id === exId)?.name || exId;
                       return (
                         <div key={exId} className="bg-muted/10 rounded-lg p-3 border border-border/50">
                           <p className="text-xs font-bold text-foreground mb-2 flex items-center">
                              <ChevronRight className="w-3 h-3 mr-1 text-primary" /> {exName}
                           </p>
                           <div className="space-y-1 pl-4">
                              {sets.map((s: any, sIdx: number) => (
                                <div key={sIdx} className="flex justify-between text-xs font-mono">
                                  <span className="text-muted-foreground">Set {sIdx + 1} {s.side && s.side !== 'both' ? `(${s.side})` : ''}</span>
                                  <span className="font-bold">{s.weight || 0}kg × {s.reps || 0}</span>
                                </div>
                              ))}
                           </div>
                         </div>
                       );
                    })}
                  </div>
                
                  <div className="flex gap-2 mb-1">
                     <Button 
                       size="sm" 
                       className="flex-1 font-bold shadow-md shadow-primary/20 bg-primary/10 text-primary hover:bg-primary/20" 
                       onClick={(e) => {
                         e.stopPropagation();
                         // Navigate to workouts page with query param
                         router.push(`/workouts?editSession=${session.id}`);
                       }}
                     >
                       <Pencil className="w-4 h-4 mr-2" /> Edit Workout
                     </Button>
                     <Button 
                       size="sm" 
                       variant="outline" 
                       className="flex-1 font-bold border-destructive/50 text-destructive hover:bg-destructive/10"
                       onClick={async (e) => {
                         e.stopPropagation();
                         await deletePastWorkout(session.id);
                         window.location.reload(); // Quick refresh since it's a server component parent
                       }}
                     >
                       <Trash2 className="w-4 h-4 mr-2" /> Delete
                     </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
