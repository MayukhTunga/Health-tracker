import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedExercises() {
  const filePath = path.join(process.cwd(), 'data', 'exercises.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  const exercises = JSON.parse(raw);

  console.log(`Found ${exercises.length} exercises. Uploading to Supabase...`);

  // Map to DB schema
  const dbExercises = exercises.map(ex => ({
    id: ex.id,
    name: ex.name,
    muscle_group: ex.muscleGroup,
    equipment: ex.equipment,
    description: ex.description,
    media_url: ex.mediaUrl,
    is_unilateral: ex.isUnilateral || false
  }));

  // Batch insert
  const chunkSize = 100;
  for (let i = 0; i < dbExercises.length; i += chunkSize) {
    const chunk = dbExercises.slice(i, i + chunkSize);
    const { error } = await supabase.from('exercises').upsert(chunk, { onConflict: 'id' });
    
    if (error) {
      console.error(`Error inserting batch ${i}:`, error);
    } else {
      console.log(`Inserted batch ${i} to ${i + chunk.length}`);
    }
  }

  console.log("Seed complete!");
}

seedExercises().catch(console.error);
