// TODO: Replace this placeholder Database type with the generated types from Supabase
// using `supabase gen types typescript ...` or similar. For now we define minimal
// shapes needed by this app for type-safety without over-specifying the schema.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      participants: {
        Row: {
          id: string;
          full_name: string;
          phone_number: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          phone_number: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["participants"]["Insert"]>;
      };
      assignments: {
        Row: {
          id: string;
          giver_id: string;
          receiver_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          giver_id: string;
          receiver_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["assignments"]["Insert"]>;
      };
    };
    Functions: {
      finalize_assignment: {
        Args: {
          giver_id: string;
          receiver_id: string;
        };
        Returns: {
          id: string;
          full_name: string;
          phone_number: string;
          created_at: string;
        };
      };
    };
  };
}


