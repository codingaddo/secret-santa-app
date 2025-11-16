-- finalize_assignment(giver_id uuid, receiver_id uuid) RETURNS participants
-- This function enforces the business rules for selecting a Secret Santa
-- recipient. It will:
--   - refuse self-assignment,
--   - return an existing assignment if one already exists for the giver, and
--   - otherwise create a new assignment row and return the chosen receiver.

create or replace function public.finalize_assignment(
  giver_id uuid,
  receiver_id uuid
)
returns public.participants
language plpgsql
security definer
as $$
declare
  existing_assignment public.assignments;
  existing_receiver public.participants;
  receiver_taken boolean;
begin
  if giver_id = receiver_id then
    raise exception 'You cannot select yourself';
  end if;

  -- Check whether this giver already has an assignment.
  select *
  into existing_assignment
  from public.assignments
  where assignments.giver_id = finalize_assignment.giver_id
  limit 1;

  if existing_assignment.id is not null then
    select *
    into existing_receiver
    from public.participants
    where participants.id = existing_assignment.receiver_id;

    return existing_receiver;
  end if;

  -- Enforce that each receiver is only used once (one-to-one mapping).
  select exists (
    select 1 from public.assignments
    where receiver_id = finalize_assignment.receiver_id
  )
  into receiver_taken;

  if receiver_taken then
    raise exception 'This person has already been selected by someone else';
  end if;

  -- Insert the new assignment.
  insert into public.assignments (giver_id, receiver_id)
  values (finalize_assignment.giver_id, finalize_assignment.receiver_id)
  returning * into existing_assignment;

  select *
  into existing_receiver
  from public.participants
  where participants.id = existing_assignment.receiver_id;

  return existing_receiver;
end;
$$;

-- TODO: Set an appropriate search_path for this function if your database
-- uses custom schemas. For the default Supabase configuration, the public
-- schema is used and this is typically sufficient.


