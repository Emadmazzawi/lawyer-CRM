import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

export type Routine = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  schedule_type: 'scheduled' | 'flexible';
  reminder_time: string | null;
  active_days: string[];
  alarm_enabled: boolean;
  created_at: string;
};

export type RoutineStep = {
  id: string;
  routine_id: string;
  title: string;
  duration_in_seconds: number;
  order_index: number;
  emoji: string | null;
};

export type RoutineCompletion = {
  id: string;
  routine_id: string;
  user_id: string;
  date_string: string;
  completed_at: string;
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
  steps: Omit<RoutineStep, 'id' | 'routine_id'>[],
  options?: {
    schedule_type?: 'scheduled' | 'flexible';
    reminder_time?: string | null;
    active_days?: string[];
    alarm_enabled?: boolean;
  }
) => {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    return { data: null, error: userError || new Error('Not authenticated') };
  }

  // @ts-ignore
  const { data, error: routineError } = await supabase
    .from('routines')
    .insert([
      { 
        title, 
        description, 
        user_id: userData.user.id,
        schedule_type: options?.schedule_type || 'scheduled',
        reminder_time: options?.reminder_time || null,
        active_days: options?.active_days || ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
        alarm_enabled: options?.alarm_enabled || false,
      }
    ])
    .select();

  if (routineError || !data || data.length === 0) {
    console.error('--- [API Error] createRoutine failed:', routineError, 'Data:', data);
    return { data: null, error: routineError || new Error('Failed to create routine. Did you run the SQL migration?') };
  }

  const routineData = data[0];

  // Insert Steps
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
  // First delete completions and steps to avoid foreign key or RLS cascade issues
  await supabase.from('routine_completions').delete().eq('routine_id', id);
  await supabase.from('routine_steps').delete().eq('routine_id', id);

  // @ts-ignore
  return await supabase
    .from('routines')
    .delete()
    .eq('id', id);
};

// ─── Daily Completion Tracking ────────────────────────
export const fetchTodayCompletions = async (): Promise<{ data: RoutineCompletion[] | null, error: any }> => {
  const today = format(new Date(), 'yyyy-MM-dd');
  // @ts-ignore
  const { data, error } = await supabase
    .from('routine_completions')
    .select('*')
    .eq('date_string', today);
  return { data: data as any, error };
};

export const toggleRoutineCompletion = async (routineId: string): Promise<{ completed: boolean, error: any }> => {
  const today = format(new Date(), 'yyyy-MM-dd');
  
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { completed: false, error: new Error('Not authenticated') };

  // Check if already completed today
  // @ts-ignore
  const { data: existing } = await supabase
    .from('routine_completions')
    .select('id')
    .eq('routine_id', routineId)
    .eq('date_string', today)
    .maybeSingle();

  if (existing) {
    // Un-complete
    // @ts-ignore
    const { error } = await supabase
      .from('routine_completions')
      .delete()
      .eq('id', (existing as any).id);
    return { completed: false, error };
  } else {
    // Complete
    // @ts-ignore
    const { error } = await supabase
      .from('routine_completions')
      .insert([{ routine_id: routineId, user_id: userData.user.id, date_string: today }]);
    return { completed: true, error };
  }
};
