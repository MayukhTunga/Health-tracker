"use client";

import React, { useState, useEffect } from "react";
import { getExercises } from "../actions";
import { Card, CardContent } from "@/components/ui/card";
import { Dumbbell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { InstructionModalContent } from "@/components/ui/instruction-modal";

export default function LibraryPage() {
  const [exercises, setExercises] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getExercises().then(setExercises);
  }, []);

  const filtered = exercises.filter(ex => ex.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="container mx-auto px-4 pt-6 pb-24 space-y-6">
      <div className="flex items-center gap-2 mb-2">
         <Dumbbell className="w-6 h-6 text-primary" />
         <h1 className="text-2xl font-black uppercase tracking-tight">Exercise Library</h1>
      </div>
      
      <p className="text-sm font-medium text-muted-foreground">
        Browse the complete database of exercises.
      </p>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search exercises..." 
          className="pl-9 bg-card border-border/50 h-12 rounded-xl text-base"
        />
      </div>

      <div className="space-y-3 mt-4">
        {filtered.map((ex: any) => (
          <Dialog key={ex.id}>
            <DialogTrigger className="w-full text-left focus:outline-none">
              <Card className="bg-card border-border/50 overflow-hidden shadow-sm hover:border-primary/50 transition-colors cursor-pointer text-left w-full">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-foreground text-sm leading-tight pr-2">{ex.name}</h3>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mt-1">{ex.muscleGroup}</p>
                  </div>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-md w-[95vw] p-0 bg-card border-border/50 max-h-[85vh] overflow-hidden flex flex-col rounded-2xl">
               <InstructionModalContent ex={ex} />
            </DialogContent>
          </Dialog>
        ))}
      </div>
    </div>
  );
}
