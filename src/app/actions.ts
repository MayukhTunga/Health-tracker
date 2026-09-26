"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { pullGoogleFitData, pushGoogleFitWeight } from "@/lib/google-fit";

import { cookies } from "next/headers";

async function getUserInfo() { 
  const supabase = await createClient(); 
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('Unauthorized'); 
  
  // Read custom google_provider_token cookie if not in session
  const cookieStore = await cookies();
  const providerToken = session.provider_token || cookieStore.get('google_provider_token')?.value;
  
  return { supabase, userId: session.user.id, providerToken }; 
}

// --- Sync ---
export async function getGoogleFitData() {
  const { providerToken } = await getUserInfo();
  if (!providerToken) return { steps: 0, calories: 0 };
  return await pullGoogleFitData(providerToken);
}

export async function forceSyncGoogleFit() {
  revalidatePath('/');
}

// --- Profiles ---
export async function getProfile() {
  const supabaseServer = await createClient(); 
  const { data: { user } } = await supabaseServer.auth.getUser(); 
  if (!user) throw new Error('Unauthorized'); 
  const userId = user.id;
  
  const { data, error } = await supabaseServer
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (error || !data) {
    // Create the profile since it doesn't exist
    const newProfile = {
      id: userId,
      name: user.user_metadata.full_name || "New User",
      age: 25,
      weight: 75,
      height: 175,
      gender: "Not Specified",
      google_health_sync: true, 
      avatar_url: user.user_metadata.avatar_url || null
    };
    await supabaseServer.from('profiles').insert(newProfile);
    return {
      name: newProfile.name,
      age: newProfile.age,
      weight: newProfile.weight,
      height: newProfile.height,
      gender: newProfile.gender,
      googleHealthSync: newProfile.google_health_sync,
      avatarUrl: newProfile.avatar_url
    };
  }
  
  return {
    name: data.name,
    age: data.age,
    weight: data.weight,
    height: data.height,
    gender: data.gender,
    googleHealthSync: data.google_health_sync,
    avatarUrl: data.avatar_url
  };
}

export async function updateProfile(profileData: any) {
  const { supabase, userId, providerToken } = await getUserInfo();

  const mapped: any = {
    name: profileData.name,
    age: profileData.age,
    weight: profileData.weight,
    height: profileData.height,
    gender: profileData.gender,
    google_health_sync: profileData.googleHealthSync
  };
  
  if (profileData.avatarUrl !== undefined) {
    mapped.avatar_url = profileData.avatarUrl;
  }
  
  await supabase
    .from('profiles')
    .update(mapped)
    .eq('id', userId);
    
  // Push weight to Google Fit if sync is enabled
  if (profileData.googleHealthSync && profileData.weight && providerToken) {
    await pushGoogleFitWeight(providerToken, profileData.weight);
  }
    
  revalidatePath('/profile');
  revalidatePath('/');
  return profileData;
}

// --- Exercises ---
// Anyone can get exercises, but we still use server client
export async function getExercises(query?: string, muscleGroup?: string) {
  const supabase = await createClient(); 
  
  let req = supabase.from('exercises').select('*');
  
  if (muscleGroup && muscleGroup !== "All") {
    req = req.eq('muscle_group', muscleGroup);
  }
  if (query) {
    req = req.ilike('name', `%${query}%`);
  }
  
  const { data } = await req;
  return (data || []).map(ex => ({
    id: ex.id,
    name: ex.name,
    muscleGroup: ex.muscle_group,
    equipment: ex.equipment,
    description: ex.description,
    mediaUrl: ex.media_url,
    isUnilateral: ex.is_unilateral
  }));
}

// --- Templates ---
export async function getTemplates() {
  const { supabase, userId } = await getUserInfo();
  const { data: templates } = await supabase.from('templates').select('*').eq('user_id', userId);
  const { data: tEx } = await supabase.from('template_exercises').select('*, exercises(*)').order('order_index');
  
  if (!templates) return [];
  
  return templates.map(t => {
    const exercisesForTemplate = (tEx || []).filter(x => x.template_id === t.id).map(x => ({
      id: x.exercise_id,
      name: x.exercises.name,
      isUnilateral: x.exercises.is_unilateral,
      defaultSets: x.default_sets || []
    }));
    return {
      id: t.id,
      name: t.name,
      desc: t.desc_text,
      exercises: exercisesForTemplate
    };
  });
}

export async function saveTemplate(template: any) {
  const { supabase, userId } = await getUserInfo();
  const tId = template.id || Date.now();
  await supabase.from('templates').insert({
    id: tId,
    user_id: userId,
    name: template.name,
    desc_text: template.desc
  });
  
  if (template.exercises && template.exercises.length > 0) {
    const exInserts = template.exercises.map((ex: any, idx: number) => ({
      template_id: tId,
      exercise_id: ex.id,
      order_index: idx,
      default_sets: ex.defaultSets || []
    }));
    await supabase.from('template_exercises').insert(exInserts);
  }
  revalidatePath('/workouts');
}

export async function updateTemplate(template: any) {
  const { supabase, userId } = await getUserInfo();
  await supabase.from('templates').update({
    name: template.name,
    desc_text: template.desc
  }).eq('id', template.id).eq('user_id', userId);
  
  await supabase.from('template_exercises').delete().eq('template_id', template.id);
  
  if (template.exercises && template.exercises.length > 0) {
    const exInserts = template.exercises.map((ex: any, idx: number) => ({
      template_id: template.id,
      exercise_id: ex.id,
      order_index: idx,
      default_sets: ex.defaultSets || []
    }));
    await supabase.from('template_exercises').insert(exInserts);
  }
  revalidatePath('/workouts');
}

export async function deleteTemplate(templateId: number) {
  const { supabase, userId } = await getUserInfo();
  await supabase.from('templates').delete().eq('id', templateId).eq('user_id', userId);
  revalidatePath('/workouts');
}

// --- Workouts ---
export async function getWorkouts() {
  const { supabase, userId } = await getUserInfo();
  const { data: workouts } = await supabase.from('workouts').select('*').eq('user_id', userId).order('date', { ascending: false });
  
  if (!workouts || workouts.length === 0) return [];
  
  // Get all sets for these workouts
  const workoutIds = workouts.map(w => w.id);
  const { data: sets } = await supabase.from('sets').select('*, exercises(name, is_unilateral)').in('workout_id', workoutIds).order('set_order');
  
  return workouts.map(w => {
    const wSets = (sets || []).filter(s => s.workout_id === w.id).map(s => ({
      id: s.id,
      exerciseId: s.exercise_id,
      exerciseName: (s as any).exercises?.name || "Unknown Exercise",
      isUnilateral: (s as any).exercises?.is_unilateral || false,
      weight: s.weight ? s.weight.toString() : "",
      reps: s.reps ? s.reps.toString() : "",
      completed: s.completed,
      side: s.side
    }));
    return {
      id: w.id.toString(),
      templateId: w.template_id,
      name: w.name,
      date: w.date,
      duration: w.duration,
      volume: w.volume,
      sets: wSets
    };
  });
}

export async function getWorkoutById(workoutId: string) {
  const { supabase, userId } = await getUserInfo();
  const numId = parseInt(workoutId);
  const { data: w } = await supabase.from('workouts').select('*').eq('id', numId).eq('user_id', userId).single();
  if (!w) return null;
  const { data: sets } = await supabase.from('sets').select('*, exercises(name, is_unilateral)').eq('workout_id', numId).order('set_order');
  
  const wSets = (sets || []).map(s => ({
    id: s.id,
    exerciseId: s.exercise_id,
    exerciseName: (s as any).exercises?.name || "Unknown Exercise",
    isUnilateral: (s as any).exercises?.is_unilateral || false,
    weight: s.weight ? s.weight.toString() : "",
    reps: s.reps ? s.reps.toString() : "",
    completed: s.completed,
    side: s.side
  }));
  return {
    id: w.id.toString(),
    templateId: w.template_id,
    name: w.name,
    date: w.date,
    duration: w.duration,
    volume: w.volume,
    sets: wSets
  };
}

export async function saveWorkout(workout: any) {
  const { supabase, userId } = await getUserInfo();
  const wId = workout.id ? parseInt(workout.id) : Date.now();
  await supabase.from('workouts').insert({
    id: wId,
    user_id: userId,
    template_id: workout.templateId || null,
    name: workout.name,
    date: workout.date || new Date().toISOString(),
    duration: workout.duration || 0,
    volume: workout.volume || 0
  });
  
  if (workout.sets && workout.sets.length > 0) {
    const setInserts = workout.sets.map((s: any, idx: number) => ({
      workout_id: wId,
      exercise_id: s.exerciseId,
      weight: s.weight ? parseFloat(s.weight) : null,
      reps: s.reps ? parseInt(s.reps) : null,
      completed: s.completed || false,
      side: s.side || 'both',
      set_order: idx
    }));
    await supabase.from('sets').insert(setInserts);
  }
  revalidatePath('/');
  revalidatePath('/workouts');
}

export async function updatePastWorkout(workout: any) {
  const { supabase, userId } = await getUserInfo();
  const wId = parseInt(workout.id);
  await supabase.from('workouts').update({
    name: workout.name,
    duration: workout.duration || 0,
    volume: workout.volume || 0
  }).eq('id', wId).eq('user_id', userId);
  
  await supabase.from('sets').delete().eq('workout_id', wId);
  
  if (workout.sets && workout.sets.length > 0) {
    const setInserts = workout.sets.map((s: any, idx: number) => ({
      workout_id: wId,
      exercise_id: s.exerciseId,
      weight: s.weight ? parseFloat(s.weight) : null,
      reps: s.reps ? parseInt(s.reps) : null,
      completed: s.completed || false,
      side: s.side || 'both',
      set_order: idx
    }));
    await supabase.from('sets').insert(setInserts);
  }
  revalidatePath('/');
  revalidatePath('/workouts');
}

export async function deletePastWorkout(workoutId: string) {
  const { supabase, userId } = await getUserInfo();
  await supabase.from('workouts').delete().eq('id', parseInt(workoutId)).eq('user_id', userId);
  revalidatePath('/');
  revalidatePath('/workouts');
}

// --- History ---
export async function getRoutineHistory(templateId: number) {
  const { supabase, userId } = await getUserInfo();
  const { data: workouts } = await supabase.from('workouts').select('*').eq('template_id', templateId).eq('user_id', userId).order('date', { ascending: true });
  return (workouts || []).map(w => ({
    id: w.id.toString(),
    templateId: w.template_id,
    name: w.name,
    date: w.date,
    duration: w.duration,
    volume: w.volume
  }));
}

export async function getExerciseHistory(exerciseId: string) {
  const { supabase, userId } = await getUserInfo();
  
  // Need to only get sets that belong to workouts owned by this user
  // We can join with workouts to filter by user_id
  const { data: sets } = await supabase
    .from('sets')
    .select('*, workouts!inner(*)')
    .eq('exercise_id', exerciseId)
    .eq('workouts.user_id', userId);
  
  if (!sets) return [];
  
  const sessionsMap: Record<string, any> = {};
  sets.forEach(s => {
    const w = (s as any).workouts;
    if (!w) return;
    const dateStr = w.date;
    if (!sessionsMap[dateStr]) {
      sessionsMap[dateStr] = { date: dateStr, workoutName: w.name, sets: [] };
    }
    sessionsMap[dateStr].sets.push({
      weight: s.weight ? s.weight.toString() : "",
      reps: s.reps ? s.reps.toString() : "",
      completed: s.completed,
      side: s.side,
      set_order: s.set_order
    });
  });
  
  const result = Object.values(sessionsMap).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  result.forEach(r => {
    r.sets.sort((a: any, b: any) => a.set_order - b.set_order);
  });
  return result;
}
