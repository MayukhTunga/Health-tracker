"use server";

import { promises as fs } from "fs";
import path from "path";
import { revalidatePath } from "next/cache";

const DATA_FILE = path.join(process.cwd(), "local_db.json");

// Ensure db exists
async function ensureDb() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify({ workouts: [], exercises: [], templates: [] }));
  }
}

export async function getLocalData() {
  await ensureDb();
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  const data = JSON.parse(raw);
  
  if (!data.profile) {
    data.profile = {
      name: "Guest User",
      age: 25,
      weight: 75,
      height: 175,
      gender: "Not Specified",
      googleHealthSync: false
    };
  }
  
  if (!data.templates) {
    data.templates = [
      { 
        id: 1, 
        name: "Push Day", 
        desc: "Chest, Shoulders, Triceps", 
        exercises: [
          { id: "Barbell_Bench_Press_-_Medium_Grip", name: "Barbell Bench Press - Medium Grip", isUnilateral: false, defaultSets: [{ reps: "12" }, { reps: "10" }, { reps: "8" }] }
        ] 
      }
    ];
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
  }
  return data;
}

export async function getTemplates() {
  const data = await getLocalData();
  return data.templates || [];
}

export async function saveTemplate(template: any) {
  const data = await getLocalData();
  data.templates.unshift(template);
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
  revalidatePath("/workouts");
  return template;
}

export async function deleteTemplate(templateId: number) {
  const data = await getLocalData();
  data.templates = data.templates.filter((t: any) => t.id !== templateId);
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
  revalidatePath("/workouts");
  return { success: true };
}

export async function updateTemplate(template: any) {
  const data = await getLocalData();
  const index = data.templates.findIndex((t: any) => t.id === template.id);
  if (index !== -1) {
    data.templates[index] = template;
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    revalidatePath("/workouts");
  }
  return template;
}

export async function saveWorkout(workout: any) {
  const data = await getLocalData();
  workout.id = Date.now().toString();
  workout.date = new Date().toISOString();
  if (!data.workouts) data.workouts = [];
  data.workouts.unshift(workout);
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
  revalidatePath("/");
  revalidatePath("/workouts");
  return workout;
}

export async function updatePastWorkout(workout: any) {
  const data = await getLocalData();
  const index = data.workouts?.findIndex((w: any) => w.id === workout.id);
  if (index !== undefined && index !== -1) {
    data.workouts[index] = workout;
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    revalidatePath("/");
    revalidatePath("/workouts");
  }
  return workout;
}

export async function deletePastWorkout(workoutId: string) {
  const data = await getLocalData();
  if (data.workouts) {
    data.workouts = data.workouts.filter((w: any) => w.id !== workoutId);
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    revalidatePath("/");
    revalidatePath("/workouts");
  }
  return { success: true };
}

export async function getWorkoutById(workoutId: string) {
  const data = await getLocalData();
  if (!data.workouts) return null;
  return data.workouts.find((w: any) => w.id === workoutId) || null;
}

export async function getRoutineHistory(templateId: number) {
  const data = await getLocalData();
  if (!data.workouts) return [];
  return data.workouts.filter((w: any) => w.templateId === templateId);
}

export async function getExerciseHistory(exerciseId: string) {
  const data = await getLocalData();
  if (!data.workouts) return [];
  
  const history: any[] = [];
  
  data.workouts.forEach((workout: any) => {
    const setsForExercise = workout.sets?.filter((s: any) => s.exerciseId === exerciseId);
    if (setsForExercise && setsForExercise.length > 0) {
      history.push({
        workoutId: workout.id,
        workoutName: workout.name,
        date: workout.date,
        sets: setsForExercise
      });
    }
  });
  
  return history;
}

export async function getWorkouts() {
  const data = await getLocalData();
  // Sort descending by date
  return data.workouts.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// Fetch Exercises from the JSON Dataset
export async function getExercises(query?: string, muscleGroup?: string) {
  const EXERCISES_FILE = path.join(process.cwd(), "data", "exercises.json");
  const raw = await fs.readFile(EXERCISES_FILE, "utf-8");
  let exercises = JSON.parse(raw);
  
  if (muscleGroup && muscleGroup !== "All") {
    exercises = exercises.filter((ex: any) => ex.muscleGroup === muscleGroup);
  }
  
  if (query) {
    const lowerQuery = query.toLowerCase();
    exercises = exercises.filter((ex: any) => ex.name.toLowerCase().includes(lowerQuery));
  }
  
  return exercises;
}


export async function getProfile() { const data = await getLocalData(); return data.profile; }
export async function updateProfile(profileData: any) { const data = await getLocalData(); data.profile = { ...data.profile, ...profileData }; await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2)); revalidatePath('/profile'); revalidatePath('/'); return data.profile; }
