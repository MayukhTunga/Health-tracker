"use client";

import React, { useState, useEffect, useRef } from "react";
import { getProfile, updateProfile } from "../actions";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, Activity, Dumbbell, Save, LogOut, Camera } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/supabase/client";
import { SyncButton } from "@/components/ui/sync-button";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getProfile().then(setProfile);
    
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    await updateProfile(profile);
    setIsSaving(false);
    setIsEditing(false);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingImage(true);
      if (!event.target.files || event.target.files.length === 0) return;
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      const newProfile = { ...profile, avatarUrl: data.publicUrl };
      setProfile(newProfile);
      await updateProfile(newProfile);
    } catch (error) {
      alert("Error uploading avatar!");
      console.error(error);
    } finally {
      setUploadingImage(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="container mx-auto px-4 pt-6 pb-24 space-y-6">
      
      {/* Profile Header & Avatar */}
      <div className="flex flex-col items-center space-y-4 pt-4 pb-6">
        <div 
          className="relative w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-primary/20 cursor-pointer group"
          onClick={() => fileInputRef.current?.click()}
        >
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" />
          ) : (
            <User className="w-10 h-10 text-muted-foreground group-hover:opacity-50 transition-opacity" />
          )}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-6 h-6 text-white drop-shadow-md" />
          </div>
          {uploadingImage && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
               <span className="text-xs text-white">Uploading...</span>
            </div>
          )}
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleAvatarUpload} 
        />
        <h2 className="text-2xl font-bold">{profile.name}</h2>
      </div>

      <div className="flex items-center justify-between mb-2 px-1 pt-4">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Personal Info</h3>
        {!isEditing ? (
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="h-8 text-xs text-primary">Edit</Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="h-8 text-xs text-muted-foreground">Cancel</Button>
        )}
      </div>
      <Card className="bg-card border-border/50">
        <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Name</label>
            <Input disabled={!isEditing} value={profile.name} 
              onChange={e => setProfile({...profile, name: e.target.value})} 
              className="bg-background border-border/50 focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Age</label>
              <Input disabled={!isEditing} type="number" value={profile.age} 
                onChange={e => setProfile({...profile, age: parseInt(e.target.value) || 0})} 
                className="bg-background border-border/50 focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Weight (kg)</label>
              <Input disabled={!isEditing} type="number" value={profile.weight} 
                onChange={e => setProfile({...profile, weight: parseInt(e.target.value) || 0})} 
                className="bg-background border-border/50 focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Height (cm)</label>
              <Input disabled={!isEditing} type="number" value={profile.height} 
                onChange={e => setProfile({...profile, height: parseInt(e.target.value) || 0})} 
                className="bg-background border-border/50 focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Gender</label>
              <select disabled={!isEditing} value={profile.gender}
                onChange={e => setProfile({...profile, gender: e.target.value})}
                className="flex h-10 w-full rounded-md border border-border/50 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Not Specified">Not Specified</option>
              </select>
            </div>
          </div>
          {isEditing && (
            <Button 
              className="w-full mt-4 font-bold" 
              onClick={handleSave} 
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> Save Profile</>}
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="pt-4">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Integrations</h3>
          <SyncButton />
        </div>
        <Card className="bg-card border-border/50 overflow-hidden">
          <CardContent className="p-0">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Google Health</h4>
                  <p className="text-xs text-muted-foreground">Connected via Google Sign-In</p>
                </div>
              </div>
              <div className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">Active</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="pt-8 flex justify-center">
        <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={handleSignOut}>
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}

