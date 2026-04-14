import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { Database } from '../types/supabase';

export type Routine = Database['public']['Tables']['routines']['Row'] & {
  active_days: string[];
};

export type RoutineStep = Database['public']['Tables']['routine_steps']['Row'];

export type RoutineCompletion = Database['public']['Tables']['routine_completions']['Row'];

export const fetchRoutines = async (): Promise<{ data: Routine[] | null, error: any }> => {
  const { data, error } = await supabase
    .from('routines')
    .select('*')
    .order('created_at', { ascending: false });

  return { data: data as Routine[] | null, error };
};

export const fetchRoutineById = async (id: string): Promise<{ data: { routine: Routine, steps: RoutineStep[] } | null, error: any }> => {
  const { data: routine, error: routineError } = await supabase
    .from('routines')
    .select('*')
    .eq('id', id)
    .single();

  if (routineError || !routine) return { data: null, error: routineError };

  const { data: steps, error: stepsError } = await supabase
    .from('routine_steps')
    .select('*')
    .eq('routine_id', id)
    .order('order_index', { ascending: true });

  return { 
    data: { 
      routine: routine as Routine, 
      steps: steps as RoutineStep[] 
    }, 
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

  const routineData = data[0] as Routine;

  // Insert Steps
  if (steps.length > 0) {
    const stepsWithRoutineId = steps.map(step => ({
      ...step,
      routine_id: routineData.id
    }));

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
  return await supabase
    .from('routines')
    .delete()
    .eq('id', id);
};

// ─── Daily Completion Tracking ────────────────────────
export const fetchCompletionsForRange = async (startDate: string, endDate: string): Promise<{ data: RoutineCompletion[] | null, error: any }> => {
  const { data, error } = await supabase
    .from('routine_completions')
    .select('*')
    .gte('date_string', startDate)
    .lte('date_string', endDate);
  return { data: data as RoutineCompletion[] | null, error };
};

export const fetchTodayCompletions = async (): Promise<{ data: RoutineCompletion[] | null, error: any }> => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const { data, error } = await supabase
    .from('routine_completions')
    .select('*')
    .eq('date_string', today);
  return { data: data as RoutineCompletion[] | null, error };
};

export const toggleRoutineCompletion = async (routineId: string, dateString?: string): Promise<{ completed: boolean, error: any }> => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const targetDate = dateString || today;
  
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { completed: false, error: new Error('Not authenticated') };

  // Check if already completed on target date
  const { data: existing } = await supabase
    .from('routine_completions')
    .select('id')
    .eq('routine_id', routineId)
    .eq('date_string', targetDate)
    .maybeSingle();

  if (existing) {
    // Un-complete
    const { error } = await supabase
      .from('routine_completions')
      .delete()
      .eq('id', existing.id);
    return { completed: false, error };
  } else {
    // Complete
    const { error } = await supabase
      .from('routine_completions')
      .insert([{ routine_id: routineId, user_id: userData.user.id, date_string: targetDate }]);
    return { completed: true, error };
  }
};
