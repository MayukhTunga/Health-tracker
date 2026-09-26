"use client";

import React, { useState, useEffect } from "react";
import { DialogClose } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { X, Dumbbell, Check, Plus, TrendingUp, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getExerciseHistory } from "@/app/actions";

export const InstructionModalContent = ({ 
  ex, 
  isLibraryContext = false, 
  addedAnimationId = null, 
  handleAddExercise 
}: { 
  ex: any, 
  isLibraryContext?: boolean, 
  addedAnimationId?: string | null, 
  handleAddExercise?: (ex: any) => void 
}) => {
  const [history, setHistory] = useState<any[]>([]);
  
  useEffect(() => {
    getExerciseHistory(ex.id).then(setHistory);
  }, [ex.id]);

  let maxWeight = 0;
  let maxReps = 0;
  let best1RM = 0;

  history.forEach(session => {
    session.sets.forEach((set: any) => {
      const weight = Number(set.weight) || 0;
      const reps = Number(set.reps) || 0;
      if (weight > maxWeight) maxWeight = weight;
      if (reps > maxReps) maxReps = reps;
      const oneRM = weight * (1 + (reps / 30));
      if (oneRM > best1RM) best1RM = oneRM;
    });
  });

  return (
    <>
      <DialogClose id={isLibraryContext ? `close-dialog-${ex.id}` : undefined} className="absolute right-4 top-4 z-50 rounded-full p-2 bg-background/90 backdrop-blur shadow-md border border-border/50 hover:bg-muted transition-colors">
        <X className="w-5 h-5 text-foreground" />
      </DialogClose>

      <Tabs defaultValue="instructions" className="w-full flex flex-col h-[85vh]">
        <div className="px-6 pt-6 pb-2 shrink-0">
          <h2 className="text-xl font-black text-foreground mb-1 pr-8 leading-tight">{ex.name}</h2>
          <div className="flex gap-2 mb-3">
            <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-1 rounded-sm uppercase tracking-wider">{ex.muscleGroup}</span>
            <span className="text-[10px] font-bold text-muted-foreground bg-muted/50 px-2 py-1 rounded-sm uppercase tracking-wider">{ex.equipment}</span>
          </div>
          
          <TabsList className="w-full grid grid-cols-2 bg-muted/50 p-1">
            <TabsTrigger value="instructions" className="text-xs font-bold uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Instructions</TabsTrigger>
            <TabsTrigger value="history" className="text-xs font-bold uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">History</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="instructions" className="m-0 flex-1 overflow-y-auto focus-visible:outline-none flex flex-col">
          {ex.mediaUrl ? (
              <div className="w-full h-48 shrink-0 bg-white flex items-center justify-center relative border-y border-border/50">
                <img src={ex.mediaUrl} alt={ex.name} className="w-full h-full object-contain" />
              </div>
          ) : (
              <div className="w-full h-40 shrink-0 bg-muted/50 flex flex-col items-center justify-center border-y border-border/50 relative">
                <Dumbbell className="w-12 h-12 text-muted-foreground/30 mb-2" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">No media available</span>
              </div>
          )}
          <div className="p-6 flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto mb-4 scrollbar-hide">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {ex.description}
                </p>
            </div>
            
            {isLibraryContext && handleAddExercise && (
              <div className="shrink-0 mt-auto pt-4">
                <Button
                  size="lg"
                  className={`w-full font-bold transition-all duration-300 ${addedAnimationId === ex.id ? 'bg-green-500 hover:bg-green-600 text-white shadow-[0_0_20px_rgba(34,197,94,0.5)] scale-105' : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(34,197,94,0.2)]'}`}
                  onClick={() => handleAddExercise(ex)}
                  disabled={addedAnimationId === ex.id}
                >
                  {addedAnimationId === ex.id ? (
                    <><Check className="w-5 h-5 mr-2 stroke-[3]" /> ADDED!</>
                  ) : (
                    <><Plus className="w-5 h-5 mr-2" /> ADD TO ROUTINE</>
                  )}
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="m-0 p-6 pt-2 flex-1 overflow-y-auto focus-visible:outline-none">
          <div className="grid grid-cols-3 gap-2 mb-6 shrink-0">
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center leading-tight mb-1">Est. 1RM</span>
              <span className="text-lg font-black text-primary">{Math.round(best1RM)}<span className="text-xs text-primary/70 ml-0.5">kg</span></span>
            </div>
            <div className="bg-muted/30 border border-border/50 rounded-xl p-3 flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center leading-tight mb-1">Max Wgt</span>
              <span className="text-lg font-black text-foreground">{maxWeight}<span className="text-xs text-muted-foreground ml-0.5">kg</span></span>
            </div>
            <div className="bg-muted/30 border border-border/50 rounded-xl p-3 flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center leading-tight mb-1">Max Reps</span>
              <span className="text-lg font-black text-foreground">{maxReps}</span>
            </div>
          </div>

          <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3 flex items-center shrink-0">
            <TrendingUp className="w-3.5 h-3.5 mr-1" /> Performance Log
          </h3>
          
          <div className="space-y-3 pb-4">
            {history.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground bg-muted/20 rounded-xl border border-border/50">
                No logged history yet. Start working out!
              </div>
            ) : (
              history.map((session, idx) => (
                <div key={idx} className="bg-card border border-border/50 rounded-xl p-3 shadow-sm">
                  <div className="flex justify-between items-center mb-2 border-b border-border/50 pb-2">
                    <span className="text-xs font-bold text-primary flex items-center">
                      <CalendarDays className="w-3.5 h-3.5 mr-1" />
                      {new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-muted px-2 py-0.5 rounded-sm">
                      {session.workoutName}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {session.sets.map((set: any, sIdx: number) => (
                      <div key={sIdx} className="flex justify-between items-center text-sm py-0.5">
                        <span className="text-muted-foreground font-medium text-xs">Set {sIdx + 1} {set.side !== 'both' ? `(${set.side})` : ''}</span>
                        <span className="font-bold font-mono">
                          {set.weight ? `${set.weight}kg` : '-'} × {set.reps ? `${set.reps}` : '-'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
};
