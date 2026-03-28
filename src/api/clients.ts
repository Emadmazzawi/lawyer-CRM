import { supabase } from '../lib/supabase';

export type ClientStatus = 'Consultation' | 'Awaiting Docs' | 'In Court' | 'Closed';

export interface Client {
  id: string;
  user_id: string;
  name: string;
  status: ClientStatus;
  contact_info: any; // JSONB
  created_at: string;
  updated_at: string;
}

export type CreateClientInput = Omit<Client, 'id' | 'created_at' | 'updated_at'>;
export type UpdateClientInput = Partial<Omit<Client, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export const getClients = async (page = 0, pageSize = 20) => {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await supabase
    .from('clients')
    .select('id, name, status, contact_info')
    .order('created_at', { ascending: false })
    .range(from, to);

  return { data: data as Partial<Client>[] | null, error };
};

export const getClientById = async (id: string) => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();

  return { data: data as Client | null, error };
};

export const createClient = async (client: CreateClientInput) => {
  const { data, error } = await supabase
    .from('clients')
    .insert(client)
    .select()
    .single();

  return { data: data as Client | null, error };
};

export const updateClient = async (id: string, updates: UpdateClientInput) => {
  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return { data: data as Client | null, error };
};

export const deleteClient = async (id: string) => {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id);

  return { error };
};
