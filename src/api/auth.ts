import { supabase } from '../lib/supabase';
import { 
  SignUpWithPasswordCredentials, 
  SignInWithPasswordCredentials,
  AuthResponse,
  UserResponse
} from '@supabase/supabase-js';

export const signUp = async (credentials: SignUpWithPasswordCredentials): Promise<AuthResponse> => {
  return await supabase.auth.signUp(credentials);
};

export const signIn = async (credentials: SignInWithPasswordCredentials): Promise<AuthResponse> => {
  return await supabase.auth.signInWithPassword(credentials);
};

export const signOut = async (): Promise<{ error: any }> => {
  return await supabase.auth.signOut();
};

export const getCurrentUser = async (): Promise<UserResponse> => {
  return await supabase.auth.getUser();
};

export const signInAnonymously = async (): Promise<AuthResponse> => {
  console.log('Attempting anonymous sign-in...');
  try {
    const response = await supabase.auth.signInAnonymously();
    console.log('Supabase response:', response);
    return response;
  } catch (err) {
    console.error('Catch error in signInAnonymously:', err);
    throw err;
  }
};

export const getSession = async () => {
  return await supabase.auth.getSession();
};
