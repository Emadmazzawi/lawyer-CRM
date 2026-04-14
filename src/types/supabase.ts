export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string | null
          push_token: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name?: string | null
          push_token?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string | null
          push_token?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          user_id: string
          name: string
          status: 'Consultation' | 'Awaiting Docs' | 'In Court' | 'Closed'
          contact_info: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          status?: 'Consultation' | 'Awaiting Docs' | 'In Court' | 'Closed'
          contact_info?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          status?: 'Consultation' | 'Awaiting Docs' | 'In Court' | 'Closed'
          contact_info?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      cases: {
        Row: {
          id: string
          user_id: string
          client_id: string
          title: string
          description: string | null
          status: 'Open' | 'Pending' | 'Closed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          client_id: string
          title: string
          description?: string | null
          status?: 'Open' | 'Pending' | 'Closed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          client_id?: string
          title?: string
          description?: string | null
          status?: 'Open' | 'Pending' | 'Closed'
          created_at?: string
          updated_at?: string
        }
      }
      notes: {
        Row: {
          id: string
          user_id: string
          client_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          client_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          client_id?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
      events_and_tasks: {
        Row: {
          id: string
          user_id: string
          client_id_fk: string | null
          title: string
          type: 'calendar_event' | 'countdown' | 'reminder'
          due_date: string | null
          priority: string | null
          is_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          client_id_fk?: string | null
          title: string
          type: 'calendar_event' | 'countdown' | 'reminder'
          due_date?: string | null
          priority?: string | null
          is_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          client_id_fk?: string | null
          title?: string
          type?: 'calendar_event' | 'countdown' | 'reminder'
          due_date?: string | null
          priority?: string | null
          is_completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      routines: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          schedule_type: 'scheduled' | 'flexible'
          reminder_time: string | null
          active_days: Json
          alarm_enabled: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          schedule_type?: 'scheduled' | 'flexible'
          reminder_time?: string | null
          active_days?: Json
          alarm_enabled?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          schedule_type?: 'scheduled' | 'flexible'
          reminder_time?: string | null
          active_days?: Json
          alarm_enabled?: boolean
          created_at?: string
        }
      }
      routine_steps: {
        Row: {
          id: string
          routine_id: string
          title: string
          duration_in_seconds: number
          order_index: number
          emoji: string | null
        }
        Insert: {
          id?: string
          routine_id: string
          title: string
          duration_in_seconds: number
          order_index: number
          emoji?: string | null
        }
        Update: {
          id?: string
          routine_id?: string
          title?: string
          duration_in_seconds?: number
          order_index?: number
          emoji?: string | null
        }
      }
      routine_completions: {
        Row: {
          id: string
          routine_id: string
          user_id: string
          date_string: string
          completed_at: string
        }
        Insert: {
          id?: string
          routine_id: string
          user_id: string
          date_string: string
          completed_at?: string
        }
        Update: {
          id?: string
          routine_id?: string
          user_id?: string
          date_string?: string
          completed_at?: string
        }
      }
      step_completions: {
        Row: {
          id: string
          step_id: string
          user_id: string
          date_string: string
          completed_at: string
        }
        Insert: {
          id?: string
          step_id: string
          user_id: string
          date_string: string
          completed_at?: string
        }
        Update: {
          id?: string
          step_id?: string
          user_id?: string
          date_string?: string
          completed_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      client_status: 'Consultation' | 'Awaiting Docs' | 'In Court' | 'Closed'
      event_type: 'calendar_event' | 'countdown' | 'reminder'
      case_status: 'Open' | 'Pending' | 'Closed'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
