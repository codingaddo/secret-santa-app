import { createClient } from "@supabase/supabase-js";
import type { Database } from "./supabaseTypes";

// TODO: Define Database type in lib/supabaseTypes based on the actual Supabase schema.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    "Supabase URL or anon key is missing. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
  );
}

export const supabaseClient = createClient<Database>(
  supabaseUrl ?? "",
  supabaseAnonKey ?? "",
);


