import { supabase } from '../lib/supabase';

export type EventType = 'calendar_event' | 'countdown' | 'reminder';

export interface EventTask {
  id: string;
  user_id: string;
  client_id_fk: string | null;
  title: string;
  type: EventType;
  due_date: string | null;
  priority: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export type CreateEventTaskInput = Omit<EventTask, 'id' | 'created_at' | 'updated_at' | 'is_completed'> & { is_completed?: boolean };
export type UpdateEventTaskInput = Partial<Omit<EventTask, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export const getEventsTasks = async (page = 0, pageSize = 20) => {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await supabase
    .from('events_and_tasks')
    .select('id, title, type, due_date, priority, is_completed')
    .eq('is_completed', false)
    .order('due_date', { ascending: true })
    .range(from, to);

  return { data: data as Partial<EventTask>[] | null, error };
};

export const getCompletedEventsTasks = async (page = 0, pageSize = 20) => {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await supabase
    .from('events_and_tasks')
    .select('id, title, type, due_date, priority, is_completed')
    .eq('is_completed', true)
    .order('updated_at', { ascending: false })
    .range(from, to);

  return { data: data as Partial<EventTask>[] | null, error };
};

export const getEventsTasksByClient = async (clientId: string, page = 0, pageSize = 20) => {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await supabase
    .from('events_and_tasks')
    .select('id, title, type, due_date, priority')
    .eq('client_id_fk', clientId)
    .order('due_date', { ascending: true })
    .range(from, to);

  return { data: data as Partial<EventTask>[] | null, error };
};

export const createEventTask = async (eventTask: CreateEventTaskInput) => {
  const { data, error } = await supabase
    .from('events_and_tasks')
    .insert(eventTask)
    .select()
    .single();

  return { data: data as EventTask | null, error };
};

export const updateEventTask = async (id: string, updates: UpdateEventTaskInput) => {
  const { data, error } = await supabase
    .from('events_and_tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return { data: data as EventTask | null, error };
};

export const deleteEventTask = async (id: string) => {
  const { error } = await supabase
    .from('events_and_tasks')
    .delete()
    .eq('id', id);

  return { error };
};
