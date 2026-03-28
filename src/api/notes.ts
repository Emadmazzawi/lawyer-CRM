import { supabase } from '../lib/supabase';

export interface Note {
  id: string;
  user_id: string;
  client_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export type CreateNoteInput = Omit<Note, 'id' | 'created_at' | 'updated_at'>;
export type UpdateNoteInput = Partial<Omit<Note, 'id' | 'user_id' | 'client_id' | 'created_at' | 'updated_at'>>;

export const getNotesByClientId = async (clientId: string, page = 0, pageSize = 20) => {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await supabase
    .from('notes')
    .select('id, content, created_at')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .range(from, to);

  return { data: data as Partial<Note>[] | null, error };
};

export const createNote = async (note: CreateNoteInput) => {
  const { data, error } = await supabase
    .from('notes')
    .insert(note)
    .select()
    .single();

  return { data: data as Note | null, error };
};

export const updateNote = async (id: string, updates: UpdateNoteInput) => {
  const { data, error } = await supabase
    .from('notes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return { data: data as Note | null, error };
};

export const deleteNote = async (id: string) => {
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id);

  return { error };
};
