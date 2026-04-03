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

export const fetchRoutines = async (): Promise<{ data: Routine[] | null, error: any }> => {
  // @ts-ignore
  const { data, error } = await supabase
    .from('routines')
    .select('*')
    .order('created_at', { ascending: false });

  return { data: data as any, error };
};

export const fetchRoutineById = async (id: string): Promise<{ data: { routine: Routine, steps: RoutineStep[] } | null, error: any }> => {
  // @ts-ignore
  const { data: routine, error: routineError } = await supabase
    .from('routines')
    .select('*')
    .eq('id', id)
    .single();

  if (routineError || !routine) return { data: null, error: routineError };

  // @ts-ignore
  const { data: steps, error: stepsError } = await supabase
    .from('routine_steps')
    .select('*')
    .eq('routine_id', id)
    .order('order_index', { ascending: true });

  return { 
    data: { routine: routine as any, steps: steps as any }, 
    error: stepsError 
  };
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
  const { data, error: routineError } = await supabase
    .from('routines')
    .insert([
      { title, description, user_id: userData.user.id }
    ])
    .select();

  if (routineError || !data || data.length === 0) {
    console.error('--- [API Error] createRoutine failed:', routineError, 'Data:', data);
    return { data: null, error: routineError || new Error('Failed to create routine. Did you run the SQL migration?') };
  }

  const routineData = data[0];

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
      console.error('--- [API Error] createRoutine steps failed:', stepsError);
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
