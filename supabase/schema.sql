-- Participants table: pre-populated list of people in the Secret Santa.
create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone_number text not null unique,
  created_at timestamptz not null default now()
);

-- Assignments table: records who is gifting whom.
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  giver_id uuid not null references public.participants (id),
  receiver_id uuid not null references public.participants (id),
  created_at timestamptz not null default now(),
  constraint assignments_giver_unique unique (giver_id),
  constraint assignments_no_self_gift check (giver_id <> receiver_id),
  constraint assignments_receiver_unique unique (receiver_id)
);

-- This schema now enforces a strict one-to-one mapping where each receiver can
-- only be selected once via the assignments_receiver_unique constraint.

-- TODO: Ensure the pgcrypto extension is enabled in the Supabase project so
-- that gen_random_uuid() is available, or update this schema to use an
-- alternative UUID generation strategy if needed.


