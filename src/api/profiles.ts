import { supabase } from '../lib/supabase';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  push_token: string | null;
  created_at: string;
  updated_at: string;
}

export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  return { data: data as Profile | null, error };
};

export const updateProfile = async (userId: string, updates: ProfileUpdate) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();

  return { data: data as Profile | null, error };
};

// Insert is usually handled by a trigger, but provided for completeness
export const createProfile = async (profile: Partial<Profile>) => {
  const { data, error } = await supabase
    .from('profiles')
    .insert(profile)
    .select()
    .single();

  return { data: data as Profile | null, error };
};
