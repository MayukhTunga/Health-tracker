"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";

const DUMMY_USER_ID = '00000000-0000-0000-0000-000000000000';

// --- Profiles ---
export async function getProfile() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', DUMMY_USER_ID)
    .single();
    
  if (error || !data) return null;
  
  return {
    name: data.name,
    age: data.age,
    weight: data.weight,
    height: data.height,
    gender: data.gender,
    googleHealthSync: data.google_health_sync
  };
}

export async function updateProfile(profileData: any) {
  const mapped = {
    name: profileData.name,
    age: profileData.age,
    weight: profileData.weight,
    height: profileData.height,
    gender: profileData.gender,
    google_health_sync: profileData.googleHealthSync
  };
  
  await supabase
    .from('profiles')
    .update(mapped)
    .eq('id', DUMMY_USER_ID);
    
  revalidatePath('/profile');
  revalidatePath('/');
  return profileData;
}

// --- Exercises ---
export async function getExercises(query?: string, muscleGroup?: string) {
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
  const { data: templates } = await supabase.from('templates').select('*').eq('user_id', DUMMY_USER_ID);
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
  const tId = template.id || Date.now();
  await supabase.from('templates').insert({
    id: tId,
    user_id: DUMMY_USER_ID,
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
  await supabase.from('templates').update({
    name: template.name,
    desc_text: template.desc
  }).eq('id', template.id);
  
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
  await supabase.from('templates').delete().eq('id', templateId);
  revalidatePath('/workouts');
}

// --- Workouts ---
export async function getWorkouts() {
  const { data: workouts } = await supabase.from('workouts').select('*').eq('user_id', DUMMY_USER_ID).order('date', { ascending: false });
  const { data: sets } = await supabase.from('sets').select('*').order('set_order');
  
  if (!workouts) return [];
  
  return workouts.map(w => {
    const wSets = (sets || []).filter(s => s.workout_id === w.id).map(s => ({
      id: s.id,
      exerciseId: s.exercise_id,
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
  const numId = parseInt(workoutId);
  const { data: w } = await supabase.from('workouts').select('*').eq('id', numId).single();
  if (!w) return null;
  const { data: sets } = await supabase.from('sets').select('*').eq('workout_id', numId).order('set_order');
  
  const wSets = (sets || []).map(s => ({
    id: s.id,
    exerciseId: s.exercise_id,
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
  const wId = workout.id ? parseInt(workout.id) : Date.now();
  await supabase.from('workouts').insert({
    id: wId,
    user_id: DUMMY_USER_ID,
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
  const wId = parseInt(workout.id);
  await supabase.from('workouts').update({
    name: workout.name,
    duration: workout.duration || 0,
    volume: workout.volume || 0
  }).eq('id', wId);
  
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
  await supabase.from('workouts').delete().eq('id', parseInt(workoutId));
  revalidatePath('/');
  revalidatePath('/workouts');
}

// --- History ---
export async function getRoutineHistory(templateId: number) {
  const { data: workouts } = await supabase.from('workouts').select('*').eq('template_id', templateId).order('date', { ascending: true });
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
  const { data: sets } = await supabase.from('sets').select('*, workouts(*)').eq('exercise_id', exerciseId);
  
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
