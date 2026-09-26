"use client";

import React, { useState, useEffect } from "react";
import { getProfile, updateProfile } from "../actions";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, Activity, Dumbbell, Save, LogIn } from "lucide-react";
import Link from "next/link";
import { Switch } from "@/components/ui/switch";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    getProfile().then(setProfile);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    await updateProfile(profile);
    setIsSaving(false);
  };

  const handleGoogleHealthToggle = async (checked: boolean) => {
    setProfile({ ...profile, googleHealthSync: checked });
    // In a real app, if checked is true, this would open an OAuth popup or redirect to Google login.
    // For this prototype, we'll simulate a 1-second OAuth redirect delay.
    if (checked) {
      setIsSyncing(true);
      setTimeout(async () => {
        await updateProfile({ googleHealthSync: true });
        setIsSyncing(false);
      }, 1000);
    } else {
      await updateProfile({ googleHealthSync: false });
    }
  };

  if (!profile) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading Profile...</div>;
  }

  return (
    <div className="container mx-auto px-4 pt-6 pb-24 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col items-center justify-center space-y-3 mb-8">
        <div className="w-24 h-24 rounded-full bg-muted border-4 border-card shadow-lg flex items-center justify-center overflow-hidden">
           <User className="w-12 h-12 text-muted-foreground/50" />
        </div>
        <div className="text-center">
           <h1 className="text-2xl font-black uppercase tracking-tight">{profile.name}</h1>
           <p className="text-sm font-medium text-primary uppercase tracking-wider">Athlete Profile</p>
        </div>
      </div>

      {/* Stats Card */}
      <Card className="bg-card border-border/50 shadow-sm">
        <CardContent className="p-5">
           <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center">
                 <User className="w-4 h-4 mr-2" /> Personal Data
              </h2>
           </div>
           
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                 <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Name</label>
                 <Input 
                   value={profile.name} 
                   onChange={(e) => setProfile({...profile, name: e.target.value})} 
                   className="bg-muted/30 border-border/50 font-medium"
                 />
              </div>
              <div className="space-y-1.5">
                 <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Age</label>
                 <Input 
                   type="number"
                   value={profile.age} 
                   onChange={(e) => setProfile({...profile, age: Number(e.target.value)})} 
                   className="bg-muted/30 border-border/50 font-medium"
                 />
              </div>
              <div className="space-y-1.5">
                 <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Weight (kg)</label>
                 <Input 
                   type="number"
                   value={profile.weight} 
                   onChange={(e) => setProfile({...profile, weight: Number(e.target.value)})} 
                   className="bg-muted/30 border-border/50 font-medium"
                 />
              </div>
              <div className="space-y-1.5">
                 <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Height (cm)</label>
                 <Input 
                   type="number"
                   value={profile.height} 
                   onChange={(e) => setProfile({...profile, height: Number(e.target.value)})} 
                   className="bg-muted/30 border-border/50 font-medium"
                 />
              </div>
           </div>
           <Button 
             className="w-full mt-6 bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground transition-colors font-bold uppercase tracking-wider" 
             onClick={handleSave}
             disabled={isSaving}
           >
             {isSaving ? "Saving..." : "Save Profile"}
           </Button>
        </CardContent>
      </Card>

      {/* Integrations */}
      <Card className="bg-card border-border/50 shadow-sm overflow-hidden">
        <CardContent className="p-0">
           <div className="p-5 border-b border-border/50">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center mb-1">
                 <Activity className="w-4 h-4 mr-2" /> Integrations
              </h2>
           </div>
           
           <div className="p-5 flex items-center justify-between bg-muted/10">
              <div className="pr-4">
                 <h3 className="font-bold text-foreground">Google Health Sync</h3>
                 <p className="text-xs text-muted-foreground mt-1 leading-tight">
                    Automatically sync your steps, calories, and body metrics.
                 </p>
                 {isSyncing && <p className="text-[10px] text-primary font-bold uppercase tracking-wider mt-2 animate-pulse">Authenticating...</p>}
                 {profile.googleHealthSync && !isSyncing && <p className="text-[10px] text-primary font-bold uppercase tracking-wider mt-2 flex items-center"><LogIn className="w-3 h-3 mr-1"/> Connected</p>}
              </div>
              <Switch 
                checked={profile.googleHealthSync} 
                onCheckedChange={handleGoogleHealthToggle} 
                disabled={isSyncing}
              />
           </div>
        </CardContent>
      </Card>

      {/* Library Link */}
      <Link href="/library" className="block">
        <Card className="bg-card border-border/50 shadow-sm hover:border-primary/50 transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
             <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                   <Dumbbell className="w-5 h-5 text-primary" />
                </div>
                <div>
                   <h3 className="font-bold text-foreground">Exercise Library</h3>
                   <p className="text-xs text-muted-foreground mt-0.5">Browse 100+ exercises and tutorials</p>
                </div>
             </div>
          </CardContent>
        </Card>
      </Link>
      
    </div>
  );
}
