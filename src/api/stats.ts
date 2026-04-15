import { supabase } from '../lib/supabase';

export interface DashboardStats {
  activeCountdowns: number;
  upcomingEvents: number;
  totalClients: number;
  completedRoutines: number;
}

export const getDashboardStats = async (): Promise<{ data: DashboardStats | null; error: any }> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return { data: null, error: new Error('Not authenticated') };
    const userId = userData.user.id;

    const [countdowns, events, clients, routines] = await Promise.all([
      supabase
        .from('events_and_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('type', 'countdown')
        .eq('is_completed', false),
      supabase
        .from('events_and_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('type', 'calendar_event')
        .eq('is_completed', false),
      supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabase
        .from('routine_completions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),
    ]);

    return {
      data: {
        activeCountdowns: countdowns.count || 0,
        upcomingEvents: events.count || 0,
        totalClients: clients.count || 0,
        completedRoutines: routines.count || 0,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return { data: null, error };
  }
};
