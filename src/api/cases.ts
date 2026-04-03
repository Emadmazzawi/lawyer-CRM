import { supabase } from '../lib/supabase';

export type CaseStatus = 'Open' | 'Pending' | 'Closed';

export interface Case {
  id: string;
  user_id: string;
  client_id: string;
  title: string;
  description: string | null;
  status: CaseStatus;
  created_at: string;
  updated_at: string;
}

export type CreateCaseInput = Omit<Case, 'id' | 'created_at' | 'updated_at'>;
export type UpdateCaseInput = Partial<Omit<Case, 'id' | 'user_id' | 'client_id' | 'created_at' | 'updated_at'>>;

export const getCasesByClientId = async (clientId: string) => {
  const { data, error } = await supabase
    .from('cases')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  return { data: data as Case[] | null, error };
};

export const getCaseById = async (id: string) => {
  const { data, error } = await supabase
    .from('cases')
    .select('*')
    .eq('id', id)
    .single();

  return { data: data as Case | null, error };
};

export const createCase = async (caseInput: CreateCaseInput) => {
  const { data, error } = await supabase
    .from('cases')
    .insert(caseInput)
    .select()
    .single();

  return { data: data as Case | null, error };
};

export const updateCase = async (id: string, updates: UpdateCaseInput) => {
  const { data, error } = await supabase
    .from('cases')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return { data: data as Case | null, error };
};

export const deleteCase = async (id: string) => {
  const { error } = await supabase
    .from('cases')
    .delete()
    .eq('id', id);

  return { error };
};
