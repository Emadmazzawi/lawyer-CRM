import { supabase } from '../lib/supabase';

export type Routine = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  created_at: string;
};

export type RoutineStep = {
  id: string;
  routine_id: string;
  title: string;
  duration_in_seconds: number;
  order_index: number;
};

export const fetchRoutines = async () => {
  // @ts-ignore
  return await supabase
    .from('routines')
    .select('*')
    .order('created_at', { ascending: false });
};

export const fetchRoutineById = async (id: string) => {
  // @ts-ignore
  const { data: routine, error: routineError } = await supabase
    .from('routines')
    .select('*')
    .eq('id', id)
    .single();

  if (routineError) {
    return { data: null, error: routineError };
  }

  // @ts-ignore
  const { data: steps, error: stepsError } = await supabase
    .from('routine_steps')
    .select('*')
    .eq('routine_id', id)
    .order('order_index', { ascending: true });

  if (stepsError) {
    return { data: null, error: stepsError };
  }

  return { data: { routine, steps }, error: null };
};

export const createRoutine = async (
  title: string,
  description: string,
  steps: Omit<RoutineStep, 'id' | 'routine_id'>[]
) => {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    return { data: null, error: userError || new Error('Not authenticated') };
  }

  // 1. Insert Routine
  // @ts-ignore
  const { data: routineData, error: routineError } = await supabase
    .from('routines')
    .insert([
      { title, description, user_id: userData.user.id }
    ])
    .select()
    .single();

  if (routineError || !routineData) {
    return { data: null, error: routineError || new Error('Failed to create routine') };
  }

  // 2. Insert Steps
  if (steps.length > 0) {
    const stepsWithRoutineId = steps.map(step => ({
      ...step,
      routine_id: routineData.id
    }));

    // @ts-ignore
    const { error: stepsError } = await supabase
      .from('routine_steps')
      .insert(stepsWithRoutineId);

    if (stepsError) {
      // It might be useful to rollback routine if steps fail, but Supabase JS doesn't do transactions nicely.
      // So returning error here.
      return { data: null, error: stepsError };
    }
  }

  return { data: routineData, error: null };
};

export const deleteRoutine = async (id: string) => {
  // @ts-ignore
  return await supabase
    .from('routines')
    .delete()
    .eq('id', id);
};
