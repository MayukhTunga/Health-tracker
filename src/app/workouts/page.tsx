"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Timer, Check, Plus, Play, Search, Save, X, Dumbbell, Info, Pencil, Trash2, Clock, CalendarDays, TrendingUp, GripVertical } from "lucide-react";
import { saveWorkout, getExercises, getTemplates, saveTemplate, updateTemplate, deleteTemplate, getRoutineHistory, getExerciseHistory, updatePastWorkout, deletePastWorkout, getWorkoutById } from "../actions";
import { InstructionModalContent } from "@/components/ui/instruction-modal";

// DnD Kit imports
import { DndContext, closestCenter, KeyboardSensor, MouseSensor, TouchSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Shared Helper ---
const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

// --- Extracted Subcomponents (Preventing React Remount Bugs) ---

const ExerciseInfoLink = ({ exerciseId, fallbackName, allExercises, addedAnimationId, handleAddExercise }: { exerciseId: string, fallbackName: string, allExercises: any[], addedAnimationId: string | null, handleAddExercise: (ex: any) => void }) => {
  const fullExDetails = allExercises.find(e => e.id === exerciseId) || { id: exerciseId, name: fallbackName, description: "Loading details...", muscleGroup: "Unknown", equipment: "Unknown" };
  return (
    <Dialog>
       <DialogTrigger className="focus:outline-none group text-left">
          <span className="font-bold text-sm flex items-center group-hover:text-primary transition-colors underline decoration-border/50 decoration-dashed underline-offset-4 cursor-pointer">
            {fullExDetails.name}
            <Info className="w-3.5 h-3.5 ml-1.5 text-primary/70 group-hover:text-primary" />
          </span>
       </DialogTrigger>
       <DialogContent className="w-[95vw] max-w-md rounded-2xl p-0 overflow-hidden border-border/50 bg-card [&>button]:hidden">
         <InstructionModalContent ex={fullExDetails} isLibraryContext={false} addedAnimationId={addedAnimationId} handleAddExercise={handleAddExercise} />
       </DialogContent>
    </Dialog>
  );
};

const RoutineHistoryDrawer = ({ template, allExercises, handleEditPastWorkout }: { template: any, allExercises: any[], handleEditPastWorkout: (session: any, template: any) => void }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  
  return (
    <Drawer>
      <DrawerTrigger 
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10" 
        onClick={() => getRoutineHistory(template.id).then(setHistory)}
      >
        <Clock className="w-4 h-4" />
      </DrawerTrigger>
      <DrawerContent className="h-[80vh] bg-background flex flex-col">
        <DrawerHeader className="border-b border-border/50 pb-4 shrink-0 relative">
          <DrawerClose id="close-routine-history" className="absolute right-4 top-4 rounded-full p-2 bg-muted/50 hover:bg-muted transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </DrawerClose>
          <DrawerTitle className="text-xl font-black uppercase mt-1 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-primary" />
            Routine History
          </DrawerTitle>
          <p className="text-sm font-bold text-muted-foreground mt-1">{template.name}</p>
        </DrawerHeader>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground font-medium bg-muted/10 rounded-xl border border-border/50">
              You haven't logged this routine yet!
            </div>
          ) : (
            history.map((session, idx) => {
              const isExpanded = expandedSessionId === session.id;
              
              const groupedSets: any = {};
              if (session.sets) {
                session.sets.forEach((s: any) => {
                  if (!groupedSets[s.exerciseId]) groupedSets[s.exerciseId] = [];
                  groupedSets[s.exerciseId].push(s);
                });
              }
              
              return (
                <Card key={idx} className={`bg-card border-border/50 shadow-sm transition-colors ${isExpanded ? 'ring-1 ring-primary' : 'hover:border-primary/50'}`}>
                  <CardContent className="p-4 cursor-pointer" onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}>
                    <div className="flex justify-between items-start mb-3 border-b border-border/50 pb-3">
                      <div className="flex items-center text-primary font-bold">
                        <CalendarDays className="w-4 h-4 mr-2" />
                        {new Date(session.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="flex gap-2">
                        <div className="flex items-center text-xs font-mono font-bold bg-muted/50 px-2 py-1 rounded-md text-muted-foreground">
                          <Timer className="w-3 h-3 mr-1" />
                          {formatTime(session.duration)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center bg-primary/5 rounded-lg p-3 border border-primary/10 mb-2">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Volume Lifted</span>
                      <span className="text-lg font-black text-primary">{session.volume} <span className="text-xs text-primary/70">kg</span></span>
                    </div>

                    {isExpanded && (
                      <div className="pt-2 animate-in slide-in-from-top-2 fade-in">
                        <div className="space-y-4 mb-4">
                          {Object.entries(groupedSets).map(([exId, sets]: [string, any]) => {
                             const exName = allExercises.find(e => e.id === exId)?.name || exId;
                             return (
                               <div key={exId} className="bg-muted/10 rounded-lg p-3 border border-border/50">
                                 <p className="text-xs font-bold text-foreground mb-2">{exName}</p>
                                 <div className="space-y-1 pl-2">
                                    {sets.map((s: any, sIdx: number) => (
                                      <div key={sIdx} className="flex justify-between text-xs font-mono">
                                        <span className="text-muted-foreground">Set {sIdx + 1} {s.side !== 'both' ? `(${s.side})` : ''}</span>
                                        <span className="font-bold">{s.weight || 0}kg Ãƒâ€” {s.reps || 0}</span>
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
                               document.getElementById('close-routine-history')?.click();
                               handleEditPastWorkout(session, template);
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
                               getRoutineHistory(template.id).then(setHistory);
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
            })
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

const SortableCreateItem = ({ se, i, selectedExercises, setSelectedExercises, allExercises, addedAnimationId, handleAddExercise }: { se: any, i: number, selectedExercises: any[], setSelectedExercises: (val: any[]) => void, allExercises: any[], addedAnimationId: string | null, handleAddExercise: (ex: any) => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: se.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, position: 'relative' as any, zIndex: isDragging ? 50 : 1 };
  
  return (
    <div ref={setNodeRef} style={style} className="flex flex-col p-3 bg-muted/20 rounded-xl border border-border/50 space-y-3 mb-4">
      <div className="flex justify-between items-center border-b border-border/50 pb-2">
        <div className="flex-1 pr-2 pt-1 flex items-center">
           <div {...attributes} {...listeners} className="p-2 -ml-2 mr-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-primary touch-none">
              <GripVertical className="w-5 h-5" />
           </div>
           <ExerciseInfoLink exerciseId={se.exercise.id} fallbackName={se.exercise.name} allExercises={allExercises} addedAnimationId={addedAnimationId} handleAddExercise={handleAddExercise} />
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 hover:bg-destructive/10 hover:text-destructive" onClick={() => setSelectedExercises(selectedExercises.filter((_, idx) => idx !== i))}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="space-y-2 pl-8">
        {se.defaultSets.map((set: any, setIdx: number) => (
          <div key={setIdx} className="flex justify-between items-center bg-background px-3 py-2 rounded-lg border border-border/50">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Set {setIdx + 1}</span>
            <div className="flex items-center gap-2">
              <Input 
                type="number" 
                placeholder="Reps" 
                value={set.reps}
                onChange={(e) => {
                  const newArr = [...selectedExercises];
                  newArr[i].defaultSets[setIdx].reps = e.target.value;
                  setSelectedExercises(newArr);
                }}
                className="w-20 h-8 text-center font-black bg-muted/50 border-none"
              />
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 hover:text-destructive hover:bg-destructive/10"
                onClick={() => {
                  const newArr = [...selectedExercises];
                  newArr[i].defaultSets = newArr[i].defaultSets.filter((_: any, idx: number) => idx !== setIdx);
                  setSelectedExercises(newArr);
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full text-xs font-bold text-primary hover:bg-primary/10 hover:text-primary mt-1"
          onClick={() => {
            const newArr = [...selectedExercises];
            newArr[i].defaultSets.push({ reps: "10" });
            setSelectedExercises(newArr);
          }}
        >
          <Plus className="w-3 h-3 mr-1" /> Add Set
        </Button>
      </div>
    </div>
  );
};

const SortableActiveItem = ({ exercise, exIndex, activeWorkoutData, setActiveWorkoutData, activeSets, setActiveSets, allExercises, addedAnimationId, handleAddExercise }: { exercise: any, exIndex: number, activeWorkoutData: any, setActiveWorkoutData: (val: any) => void, activeSets: any, setActiveSets: (val: any) => void, allExercises: any[], addedAnimationId: string | null, handleAddExercise: (ex: any) => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: exercise.instanceId });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, position: 'relative' as any, zIndex: isDragging ? 50 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="mb-8 bg-card rounded-xl border border-border/50 p-3 shadow-sm">
      <div className="flex justify-between items-center mb-2">
         <div className="flex items-center">
           <div {...attributes} {...listeners} className="p-2 -ml-2 mr-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-primary bg-muted/20 rounded-md touch-none">
              <GripVertical className="w-5 h-5" />
           </div>
           <ExerciseInfoLink exerciseId={exercise.id} fallbackName={exercise.name} allExercises={allExercises} addedAnimationId={addedAnimationId} handleAddExercise={handleAddExercise} />
           {exercise.isUnilateral && <span className="ml-3 text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-sm uppercase tracking-wider font-bold">Unilateral</span>}
         </div>
         
         <Button 
           variant="ghost" 
           size="icon" 
           className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
           onClick={() => {
             const newExercises = [...activeWorkoutData.exercises];
             newExercises.splice(exIndex, 1);
             setActiveWorkoutData({ ...activeWorkoutData, exercises: newExercises });
             
             const newSets = { ...activeSets };
             delete newSets[exercise.id];
             setActiveSets(newSets);
           }}
         >
           <Trash2 className="w-4 h-4" />
         </Button>
      </div>
      
      <div className="flex text-[10px] font-black text-muted-foreground uppercase tracking-wider p-2 pb-1 border-b border-border/50">
        <div className="w-8 text-center">Set</div>
        {exercise.isUnilateral && <div className="w-8 text-center">Side</div>}
        <div className="flex-1 text-center">kg</div>
        <div className="flex-1 text-center">Reps</div>
        <div className="w-16 flex items-center justify-center">Done</div>
      </div>
      
      <div className="divide-y divide-border/50">
        {activeSets[exercise.id]?.map((set: any, index: number) => (
          <div key={set.id} className={`flex items-center p-2 transition-colors ${set.completed || activeWorkoutData.isPastWorkout ? 'bg-primary/5' : ''}`}>
            <div className="w-8 text-center font-bold text-muted-foreground flex flex-col items-center">
              <span>{index + 1}</span>
            </div>
            {exercise.isUnilateral && (
              <div className="w-8 flex justify-center">
                 <Button 
                   variant="ghost" 
                   size="sm" 
                   className="h-8 w-8 p-0 font-black text-xs text-primary"
                   onClick={() => {
                     const newActiveSets = { ...activeSets };
                     newActiveSets[exercise.id][index].side = set.side === 'L' ? 'R' : 'L';
                     setActiveSets(newActiveSets);
                   }}
                 >
                   {set.side}
                 </Button>
              </div>
            )}
            <div className="flex-1 px-1">
              <Input 
                type="number" 
                inputMode="decimal"
                placeholder="0"
                value={set.weight}
                onChange={(e) => {
                  const newActiveSets = { ...activeSets };
                  newActiveSets[exercise.id][index].weight = e.target.value;
                  setActiveSets(newActiveSets);
                }}
                className="text-center font-black h-10 bg-background border-border/50"
              />
            </div>
            <div className="flex-1 px-1">
              <Input 
                type="number" 
                inputMode="numeric"
                placeholder="0"
                value={set.reps}
                onChange={(e) => {
                  const newActiveSets = { ...activeSets };
                  newActiveSets[exercise.id][index].reps = e.target.value;
                  setActiveSets(newActiveSets);
                }}
                className="text-center font-black h-10 bg-background border-border/50"
              />
            </div>
            <div className="w-16 flex justify-between items-center pl-2">
              <Button 
                size="icon" 
                variant={set.completed || activeWorkoutData.isPastWorkout ? "default" : "outline"}
                className={`rounded-lg h-8 w-8 transition-all shrink-0 ${set.completed || activeWorkoutData.isPastWorkout ? 'bg-primary text-primary-foreground shadow-[0_0_10px_rgba(34,197,94,0.3)] scale-110' : 'border-border/50 text-muted-foreground'}`}
                onClick={() => {
                  const newActiveSets = { ...activeSets };
                  newActiveSets[exercise.id][index].completed = !newActiveSets[exercise.id][index].completed;
                  setActiveSets(newActiveSets);
                }}
              >
                <Check className="h-4 w-4 stroke-[3]" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-muted-foreground hover:text-destructive ml-1"
                onClick={() => {
                  const newActiveSets = { ...activeSets };
                  newActiveSets[exercise.id].splice(index, 1);
                  setActiveSets(newActiveSets);
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2 pl-8 pr-16">
        <Button 
          variant="ghost" 
          className="w-full text-primary font-bold uppercase tracking-wider text-xs hover:bg-primary/10 hover:text-primary h-8"
          onClick={() => {
             const newActiveSets = { ...activeSets };
             newActiveSets[exercise.id].push({ id: Date.now(), weight: "", reps: "", completed: false, side: exercise.isUnilateral ? 'L' : 'both' });
             setActiveSets(newActiveSets);
          }}
        >
          <Plus className="w-3 h-3 mr-2" /> Add Set
        </Button>
      </div>
    </div>
  );
};


function WorkoutsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editSessionId = searchParams.get('editSession');
  
  // Data State
  const [templates, setTemplates] = useState<any[]>([]);
  const [allExercises, setAllExercises] = useState<any[]>([]);
  
  // Active / Edit Past Workout State
  const [activeWorkoutData, setActiveWorkoutData] = useState<any | null>(null);
  
  // Create/Edit Routine Template State
  const [isCreating, setIsCreating] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);
  const [newRoutineName, setNewRoutineName] = useState("");
  const [selectedExercises, setSelectedExercises] = useState<{id: string, exercise: any, defaultSets: { reps: string }[]}[]>([]);
  
  const [addedAnimationId, setAddedAnimationId] = useState<string | null>(null);

  // Search/Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  // Timer & active sets
  const [elapsed, setElapsed] = useState(0);
  const [activeSets, setActiveSets] = useState<{ [exerciseId: string]: any[] }>({});
  
  // Manual Timer Edit State
  const [isEditingTimer, setIsEditingTimer] = useState(false);
  const [timerInputValue, setTimerInputValue] = useState("");

  // DnD Sensors
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Initial Data Load
  useEffect(() => {
    getExercises().then(setAllExercises);
    getTemplates().then(setTemplates);
  }, []);

  const filteredExercises = allExercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === "All" || ex.muscleGroup === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const uniqueMuscleGroups = ["All", ...Array.from(new Set(allExercises.map(e => e.muscleGroup))).sort()];

  // Timer Loop (Only ticks if it's a live workout, not a past edited one)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeWorkoutData !== null && !activeWorkoutData.isPastWorkout && !isEditingTimer) {
      timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [activeWorkoutData, isEditingTimer]);

  const handleTimerSave = () => {
    const newMins = parseInt(timerInputValue);
    if (!isNaN(newMins) && newMins >= 0) {
      setElapsed(newMins * 60);
    }
    setIsEditingTimer(false);
  };

  const handleStart = (template: any) => {
    const clonedTemplate = JSON.parse(JSON.stringify(template));
    
    clonedTemplate.exercises = clonedTemplate.exercises.map((ex: any) => ({
      ...ex,
      instanceId: `instance-${ex.id}-${Math.random().toString(36).substring(7)}`
    }));

    setActiveWorkoutData(clonedTemplate);
    setElapsed(0);
    
    const initialSets: any = {};
    clonedTemplate.exercises.forEach((ex: any) => {
      const setsArr = ex.defaultSets && ex.defaultSets.length > 0 
        ? ex.defaultSets 
        : [{ reps: "" }, { reps: "" }, { reps: "" }];
        
      initialSets[ex.id] = setsArr.map((defSet: any, i: number) => ({ 
        id: Date.now() + Math.random() + i, 
        weight: "", 
        reps: defSet.reps, 
        completed: false, 
        side: ex.isUnilateral ? 'L' : 'both' 
      }));
    });
    setActiveSets(initialSets);
  };

  const handleEditPastWorkout = (session: any, template: any) => {
    const groupedSets: any = {};
    const exercisesInSession: any[] = [];
    
    session.sets.forEach((s: any) => {
      if (!groupedSets[s.exerciseId]) {
        groupedSets[s.exerciseId] = [];
        const exDetails = allExercises.find(e => e.id === s.exerciseId) || { id: s.exerciseId, name: s.exerciseId };
        exercisesInSession.push({
          ...exDetails,
          instanceId: `instance-${exDetails.id}-${Math.random().toString(36).substring(7)}`
        });
      }
      groupedSets[s.exerciseId].push({ ...s });
    });

    setActiveWorkoutData({
      id: template.id,
      name: session.name || template.name,
      exercises: exercisesInSession,
      isPastWorkout: true,
      originalSessionId: session.id,
      originalDate: session.date
    });
    
    setElapsed(session.duration || 0);
    setActiveSets(groupedSets);
    
    document.body.click(); 
  };

  // Listen for Edit URL param
  useEffect(() => {
    if (editSessionId && templates.length > 0 && allExercises.length > 0 && !activeWorkoutData) {
      getWorkoutById(editSessionId).then(session => {
        if (session) {
          const template = templates.find(t => t.id === session.templateId) || { id: session.templateId, name: session.name };
          handleEditPastWorkout(session, template);
          // Clean the URL so a refresh doesn't trigger edit again
          router.replace('/workouts');
        }
      });
    }
  }, [editSessionId, templates, allExercises, activeWorkoutData, router]);

  const handleFinish = async (templateId: number, name: string) => {
    let volume = 0;
    const completedSets: any[] = [];
    
    activeWorkoutData.exercises.forEach((ex: any) => {
       const sets = activeSets[ex.id] || [];
       sets.forEach((set: any) => {
         if (set.completed || activeWorkoutData.isPastWorkout) {
           volume += (Number(set.weight) * Number(set.reps) || 0);
           completedSets.push({ ...set, exerciseId: ex.id, completed: true });
         }
       });
    });

    if (activeWorkoutData.isPastWorkout) {
      await updatePastWorkout({ 
        id: activeWorkoutData.originalSessionId, 
        name, 
        templateId, 
        duration: elapsed, 
        volume, 
        sets: completedSets,
        date: activeWorkoutData.originalDate 
      });
    } else {
      await saveWorkout({ name, templateId, duration: elapsed, volume, sets: completedSets });
    }
    
    setActiveWorkoutData(null);
    setElapsed(0);
    router.push("/");
  };

  const openCreateFlow = () => {
    setIsCreating(true);
    setEditingTemplateId(null);
    setNewRoutineName("");
    setSelectedExercises([]);
  };

  const openEditFlow = (t: any) => {
    setIsCreating(true);
    setEditingTemplateId(t.id);
    setNewRoutineName(t.name);
    setSelectedExercises(t.exercises.map((e: any) => ({
      id: `instance-${e.id}-${Math.random().toString(36).substring(7)}`,
      exercise: allExercises.find(ex => ex.id === e.id) || e,
      defaultSets: e.defaultSets || [{ reps: "12" }, { reps: "10" }, { reps: "8" }]
    })));
  };

  const handleSaveRoutine = async () => {
    if (!newRoutineName || selectedExercises.length === 0) return;
    
    const newTemplate = {
      id: editingTemplateId || Date.now(),
      name: newRoutineName,
      desc: "Custom Routine",
      exercises: selectedExercises.map(se => ({ ...se.exercise, defaultSets: se.defaultSets }))
    };
    
    if (editingTemplateId) {
      setTemplates(templates.map(t => t.id === editingTemplateId ? newTemplate : t));
      await updateTemplate(newTemplate);
    } else {
      setTemplates([newTemplate, ...templates]);
      await saveTemplate(newTemplate);
    }
    
    setIsCreating(false);
    setEditingTemplateId(null);
    setNewRoutineName("");
    setSelectedExercises([]);
  };

  const handleDeleteTemplate = async (id: number) => {
    setTemplates(templates.filter(t => t.id !== id));
    await deleteTemplate(id);
  };

  const handleAddExercise = (ex: any) => {
    if (isCreating) {
      setSelectedExercises([...selectedExercises, { 
        id: `instance-${ex.id}-${Math.random().toString(36).substring(7)}`, 
        exercise: ex, 
        defaultSets: [{ reps: "12" }, { reps: "10" }, { reps: "8" }] 
      }]);
    } else if (activeWorkoutData) {
      const newEx = { 
        ...ex, 
        instanceId: `instance-${ex.id}-${Math.random().toString(36).substring(7)}`,
        defaultSets: [{ reps: "12" }, { reps: "10" }, { reps: "8" }] 
      };
      setActiveWorkoutData({
        ...activeWorkoutData,
        exercises: [...activeWorkoutData.exercises, newEx]
      });
      setActiveSets({
        ...activeSets,
        [ex.id]: [
          { id: Date.now(), weight: "", reps: "12", completed: false, side: ex.isUnilateral ? 'L' : 'both' },
          { id: Date.now()+1, weight: "", reps: "10", completed: false, side: ex.isUnilateral ? 'L' : 'both' },
          { id: Date.now()+2, weight: "", reps: "8", completed: false, side: ex.isUnilateral ? 'L' : 'both' }
        ]
      });
    }

    setAddedAnimationId(ex.id);
    setTimeout(() => {
      setAddedAnimationId(null);
      document.getElementById(`close-dialog-${ex.id}`)?.click();
    }, 600);
  };

  const handleDragEndCreate = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSelectedExercises((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleDragEndActive = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setActiveWorkoutData((prev: any) => {
        const oldIndex = prev.exercises.findIndex((item: any) => item.instanceId === active.id);
        const newIndex = prev.exercises.findIndex((item: any) => item.instanceId === over.id);
        const newArr = arrayMove(prev.exercises, oldIndex, newIndex);
        return { ...prev, exercises: newArr };
      });
    }
  };

  // Inline render function for Library Drawer to prevent it remounting when searchQuery updates,
  // without needing to pass 10 props to an external component.
  const renderLibraryDrawer = (triggerClassName: string, triggerContent: React.ReactNode) => (
    <Drawer>
      <DrawerTrigger className={triggerClassName}>
        {triggerContent}
      </DrawerTrigger>
      <DrawerContent className="h-[90vh] bg-background flex flex-col">
        <DrawerHeader className="border-b border-border/50 pb-4 shrink-0 relative">
          <DrawerClose className="absolute right-4 top-4 rounded-full p-2 bg-muted/50 hover:bg-muted transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </DrawerClose>
          <DrawerTitle className="text-xl font-black uppercase mt-1">Exercise Library</DrawerTitle>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search 800+ exercises..." 
              className="pl-9 h-10 bg-card border-border/50 font-medium" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex overflow-x-auto gap-2 mt-3 pb-1 snap-x scrollbar-hide">
            {uniqueMuscleGroups.map(mg => (
              <button 
                key={mg as string}
                onClick={() => setActiveFilter(mg as string)}
                className={`shrink-0 snap-center px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${activeFilter === mg ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
              >
                {mg as string}
              </button>
            ))}
          </div>
        </DrawerHeader>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredExercises.map(ex => (
            <Dialog key={ex.id}>
              <DialogTrigger className="w-full text-left focus:outline-none">
                <div className="flex gap-4 p-3 rounded-xl border border-border/50 bg-card hover:border-primary cursor-pointer transition-all hover:shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex items-center justify-center flex-shrink-0 border border-border/50 bg-white">
                    {ex.mediaUrl ? (
                      <img src={ex.mediaUrl} alt={ex.name} className="w-full h-full object-contain" loading="lazy" />
                    ) : (
                      <Dumbbell className="w-6 h-6 text-muted-foreground/50" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-foreground text-sm leading-tight">{ex.name}</h4>
                    <p className="text-[10px] font-black text-primary uppercase tracking-wider mt-1 mb-1">{ex.muscleGroup}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{ex.description}</p>
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-md rounded-2xl p-0 overflow-hidden border-border/50 bg-card [&>button]:hidden">
                <InstructionModalContent ex={ex} isLibraryContext={true} addedAnimationId={addedAnimationId} handleAddExercise={handleAddExercise} />
              </DialogContent>
            </Dialog>
          ))}
          {filteredExercises.length === 0 && (
             <div className="text-center py-10 text-muted-foreground font-medium">No exercises found.</div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );

  return (
    <div className="container mx-auto p-4 space-y-6 pb-24 overflow-hidden">
      <div className="flex items-center justify-between mt-2">
        <h1 className="text-2xl font-black uppercase tracking-tight">Routines</h1>
        {!isCreating && !activeWorkoutData && (
          <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary/10" onClick={openCreateFlow}>
            <Plus className="w-4 h-4 mr-1" /> New
          </Button>
        )}
      </div>

      {isCreating && (
        <Card className="bg-card border-primary ring-1 ring-primary/50 shadow-[0_0_20px_rgba(34,197,94,0.1)]">
          <CardContent className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-primary uppercase">{editingTemplateId ? 'Edit Routine' : 'Create Routine'}</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsCreating(false)}>
                <X className="w-5 h-5 text-muted-foreground" />
              </Button>
            </div>
            
            <Input 
              placeholder="Routine Name (e.g. Heavy Legs)" 
              value={newRoutineName}
              onChange={(e) => setNewRoutineName(e.target.value)}
              className="bg-background border-border/50 font-bold text-lg h-12"
            />

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndCreate}>
              <SortableContext items={selectedExercises.map(se => se.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-4 mt-4">
                  {selectedExercises.map((se, i) => (
                    <SortableCreateItem key={se.id} se={se} i={i} selectedExercises={selectedExercises} setSelectedExercises={setSelectedExercises} allExercises={allExercises} addedAnimationId={addedAnimationId} handleAddExercise={handleAddExercise} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {renderLibraryDrawer(
               "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 w-full border-dashed border-2 border-primary/50 text-primary hover:bg-primary/10 font-bold uppercase tracking-wider h-12",
               <><Plus className="w-4 h-4 mr-2" /> ADD EXERCISE</>
            )}

            <Button 
              className="w-full h-14 font-black text-md bg-primary text-primary-foreground shadow-[0_0_20px_rgba(34,197,94,0.3)] mt-2 rounded-xl"
              onClick={handleSaveRoutine}
              disabled={!newRoutineName || selectedExercises.length === 0}
            >
              <Save className="w-5 h-5 mr-2" /> {editingTemplateId ? 'SAVE CHANGES' : 'SAVE ROUTINE'}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {templates.map((t) => {
          const isActive = activeWorkoutData?.id === t.id;
          if (activeWorkoutData && !isActive) return null;
          
          return (
            <Card key={t.id} className={`bg-card border-border/50 overflow-hidden transition-all duration-300 ${isActive ? 'ring-2 ring-primary shadow-[0_0_20px_rgba(34,197,94,0.15)]' : ''}`}>
              <CardContent className="p-4">
                
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-lg">{activeWorkoutData?.isPastWorkout ? activeWorkoutData.name : t.name}</h3>
                    <p className="text-xs font-semibold text-primary uppercase tracking-wider mt-1">
                       {activeWorkoutData?.isPastWorkout ? new Date(activeWorkoutData.originalDate).toLocaleString('en-US') : t.desc}
                    </p>
                  </div>
                  
                  {isActive && (
                     <div className="flex items-center text-primary font-mono text-sm font-bold bg-primary/10 px-2 py-1 rounded-md shadow-inner shadow-primary/10 cursor-pointer hover:bg-primary/20 transition-colors" onClick={() => {
                        if (!isEditingTimer) {
                          setIsEditingTimer(true);
                          setTimerInputValue(Math.floor(elapsed / 60).toString());
                        }
                     }}>
                       <Timer className="w-3 h-3 mr-1" />
                       {isEditingTimer ? (
                          <div className="flex items-center gap-1">
                            <Input 
                              value={timerInputValue} 
                              onChange={e => setTimerInputValue(e.target.value)} 
                              onBlur={handleTimerSave}
                              onKeyDown={e => e.key === 'Enter' && handleTimerSave()}
                              className="w-12 h-6 p-1 text-xs text-center font-mono border-primary/50 focus:ring-primary bg-background"
                              autoFocus
                            />
                            <span>m</span>
                          </div>
                       ) : (
                          formatTime(elapsed)
                       )}
                     </div>
                  )}
                  
                  {!isActive && !isCreating && (
                    <div className="flex gap-1">
                      <RoutineHistoryDrawer template={t} allExercises={allExercises} handleEditPastWorkout={handleEditPastWorkout} />
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => openEditFlow(t)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteTemplate(t.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
                
                {!isActive && (
                  <div className="mb-4 mt-3">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 border-b border-border/50 pb-1 inline-block">Exercises in this Routine</p>
                    <div className="flex flex-wrap gap-2">
                      {t.exercises.map((e: any, idx: number) => (
                        <div key={idx} className="bg-muted/30 px-2 py-1 rounded-md border border-border/50">
                           <ExerciseInfoLink exerciseId={e.id} fallbackName={e.name} allExercises={allExercises} addedAnimationId={addedAnimationId} handleAddExercise={handleAddExercise} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!isActive && !isCreating && (
                  <Button 
                    onClick={() => handleStart(t)}
                    className="w-full font-bold bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors border border-primary/20 mt-2"
                  >
                    <Play className="w-4 h-4 mr-2 fill-current" /> START ROUTINE
                  </Button>
                )}

                {isActive && (
                  <div className="mt-6 pt-4 border-t border-border/50 animate-in slide-in-from-top-4 fade-in duration-300">
                    
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndActive}>
                      <SortableContext items={activeWorkoutData.exercises.map((ex:any) => ex.instanceId)} strategy={verticalListSortingStrategy}>
                        {activeWorkoutData.exercises.map((exercise: any, exIndex: number) => (
                           <SortableActiveItem key={exercise.instanceId} exercise={exercise} exIndex={exIndex} activeWorkoutData={activeWorkoutData} setActiveWorkoutData={setActiveWorkoutData} activeSets={activeSets} setActiveSets={setActiveSets} allExercises={allExercises} addedAnimationId={addedAnimationId} handleAddExercise={handleAddExercise} />
                        ))}
                      </SortableContext>
                    </DndContext>
                    
                    <div className="mb-6 pt-2 pb-4 border-b border-border/50">
                       {renderLibraryDrawer(
                          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 w-full border-dashed border-2 border-border/50 text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/10 font-bold uppercase tracking-wider h-12",
                          <><Plus className="w-4 h-4 mr-2" /> Add Extra Exercise</>
                       )}
                    </div>

                    <div className="pt-2">
                      <Button 
                        size="lg" 
                        className="w-full h-14 text-md font-black rounded-2xl shadow-lg shadow-primary/20" 
                        onClick={() => handleFinish(t.id, t.name)}
                      >
                        <Check className="w-5 h-5 mr-2 stroke-[3]" /> {activeWorkoutData.isPastWorkout ? 'SAVE PAST WORKOUT' : 'FINISH WORKOUT'}
                      </Button>
                      <Button 
                        variant="ghost"
                        className="w-full mt-2 font-bold text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          setActiveWorkoutData(null);
                          setElapsed(0);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default function WorkoutsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading...</div>}>
      <WorkoutsPageContent />
    </Suspense>
  );
}
