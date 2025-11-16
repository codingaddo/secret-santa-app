## 1. Project Overview

This repository contains a **Secret Gift Picker (Secret Santa)** web application built with Next.js and Supabase.

The app is designed for families, friends, and small teams to run lightweight Secret Santa–style gift exchanges:

- The database is **pre-populated with participants**, each having a `full_name` and `phone_number`.
- Users **log in using only their phone number** (no passwords, no Supabase Auth session).
- After logging in:
  - If the user **has already chosen a recipient**, they see only their assigned receiver (no cards).
  - If the user **has not chosen yet**, they see a **grid of hidden cards**, each representing another participant.
- The user taps **one card** to reveal who they will gift.
- The choice is **permanent** and stored in the database.

The system enforces these rules:

- **No self-selection** (you can never pick yourself).
- **One-to-one assignments**: each receiver can only be chosen once.
- Participants who are already taken as receivers remain **visible** for everyone but their cards are **disabled (unclickable)**.

This makes it easy to run a small Secret Santa without exposing the full list of assignments or managing accounts manually.

---

## 2. Features

- **Phone-number-only login** based on pre-seeded `participants` (no separate user accounts).
- **One-time, permanent assignment per user**:
  - Once you pick, you always see the same recipient on future logins.
- **Card-based UI**:
  - All other participants are shown as cards, excluding the logged-in participant.
  - Clickable cards represent available recipients.
  - Taken recipients remain visible but are **disabled/locked**.
- **Randomized card order** on each visit for users who have not yet chosen.
- **Database-enforced integrity**:
  - No self-selection via a `CHECK` constraint and RPC logic.
  - One-to-one receiver restriction via a `UNIQUE (receiver_id)` constraint and RPC checks.
  - Assignment decision is executed on the server via a Supabase **RPC function**.
- **Clean, responsive UI**:
  - Built with TailwindCSS and the Next.js App Router.
  - Works well on desktop and mobile.

---

## 3. Tech Stack

- **Next.js 14+** (App Router)
- **React** + **TypeScript**
- **TailwindCSS** for styling
- **Supabase** for:
  - PostgreSQL database
  - SQL functions (RPC)
  - `@supabase/supabase-js` client from the frontend

Environment variables required by the Next.js app:

- `NEXT_PUBLIC_SUPABASE_URL` – your Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` – the public anon key for the project.

These are used by the client-side Supabase instance and must be configured for both local development and production.

---

## 4. Architecture / How It Works

### Lightweight auth (no Supabase Auth)

This project **does not use Supabase Auth**. Instead, it relies on a simple `localStorage`-based mechanism:

- The user enters a phone number on the **login page**.
- The frontend queries the `participants` table:
  - `select * from participants where phone_number = :normalizedPhone limit 1`.
  - The app normalizes the input to a canonical form (e.g. `"0551817972"` or `"+233 551817972"` → `"+233551817972"`).
- If a participant is found:
  - That participant record is stored in `localStorage` as the current “auth” identity.
  - An internal React context exposes this current participant to components.
- If not found:
  - The UI clearly states that the user is not registered for this exchange.

### Dashboard behavior

On the **dashboard page**:

1. The app reads the current participant from context (which is hydrated from `localStorage`).
2. If there is no current participant, the user is redirected back to `/login`.
3. If a participant exists:
   - It queries the `assignments` table for an existing record:
     - `select * from assignments where giver_id = currentParticipant.id`.
   - If an assignment exists:
     - It fetches the corresponding receiver from `participants`.
     - The UI shows:
       - “Your gift assignment 🎁”
       - “You are gifting: {receiver.full_name}”.
     - No cards are shown; the user cannot change this.
   - If no assignment exists:
     - It fetches all **other participants**:
       - `select * from participants where id <> currentParticipant.id`.
       - The logged-in participant is never shown as a card.
     - It fetches all existing assignments to build a set of **taken receiver IDs**:
       - `select receiver_id from assignments`.
     - It renders a card grid:
       - Each card corresponds to a participant (excluding the current user).
       - If a participant’s ID is in the taken set, their card is **disabled but visible** and labeled as already selected.
       - All other cards are **clickable** and show “Tap to reveal 🎁”.
     - Cards are randomized client-side on each load.

### Assignment via Supabase RPC

When the user taps a card:

- The frontend calls a Supabase RPC function:
  - `finalize_assignment(giver_id uuid, receiver_id uuid)`.
- The RPC on the database:
  - If the giver already has an assignment:
    - Returns the existing receiver (does not create a new row).
  - If `giver_id = receiver_id`:
    - Raises an error (“You cannot select yourself”).
  - If the `receiver_id` is already used in another assignment:
    - Raises an error (“This person has already been selected by someone else”).
  - Otherwise:
    - Inserts a new row into `assignments`.
    - Returns the receiver’s `participants` row.

The frontend:

- Updates local state with the receiver returned by RPC.
- “Reveals” only that card with the receiver’s details.
- Disables all cards to prevent further clicks.
- On future logins, it shows only the saved assignment.

---

## 5. Local Setup (Next.js App)

1. **Clone the repository**:

   ```bash
   git clone https://github.com/codingaddo/secret-santa-app.git
   cd secret-santa-app
   ```

2. **Install dependencies** (Node 18+ recommended):

   ```bash
   npm install
   ```

3. **Create a `.env.local` file** in the project root and set:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
   ```

4. Ensure your Supabase project is set up according to the **Supabase Setup** and **Database Schema** sections below.

---

## 6. Supabase Setup (Step-by-Step)

1. **Create a Supabase project** at `https://app.supabase.com/`.
2. Go to **Project Settings → API** and copy:
   - Your **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - Your **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. In the Supabase SQL editor:
   - Open the contents of `supabase/schema.sql`, paste it into the SQL editor, and run it.
   - Open `supabase/rpc.sql`, paste and run it.
   - Open `supabase/rls.sql`, paste and run it.
4. Optional but recommended:
   - Ensure the `pgcrypto` extension (or equivalent) is enabled if using `gen_random_uuid()` in your environment.
5. Seed the `participants` table with your exchange participants (see **Seeding Sample Data**).

Once this is done, your database will have the required tables and the RPC function to support the app.

---

## 7. Database Schema (Tables, Constraints)

All schema definitions live in `supabase/schema.sql`. At a high level:

### `participants`

- Columns:
  - `id uuid primary key default gen_random_uuid()`
  - `full_name text not null`
  - `phone_number text not null unique`
  - `created_at timestamptz not null default now()`
- Notes:
  - This table is **pre-populated**; the app does not provide a UI to edit it.
  - `phone_number` is used as the **sole login identifier**.
  - The app expects phone numbers stored in a **normalized canonical format** (e.g. `+2331234567890`).

### `assignments`

- Columns:
  - `id uuid primary key default gen_random_uuid()`
  - `giver_id uuid not null references public.participants(id)`
  - `receiver_id uuid not null references public.participants(id)`
  - `created_at timestamptz not null default now()`
- Constraints:
  - `unique (giver_id)` – each participant can only be a giver once.
  - `check (giver_id <> receiver_id)` – no one can gift themselves.
  - `unique (receiver_id)` – each receiver can only be chosen once (one-to-one mapping).

These constraints work together with the `finalize_assignment` RPC to enforce the business rules at the database level.

---

## 8. RPC Function Definition (`finalize_assignment`)

The RPC function is defined in `supabase/rpc.sql` as:

- **Signature**:

  ```sql
  create or replace function public.finalize_assignment(
    giver_id uuid,
    receiver_id uuid
  )
  returns public.participants
  language plpgsql
  security definer;
  ```

- **Behavior** (simplified):
  1. If `giver_id = receiver_id`:
     - Raise an exception: `"You cannot select yourself"`.
  2. Check for an existing assignment for this giver:
     - If one exists, return the corresponding receiver from `participants` without inserting a new row.
  3. Check whether the `receiver_id` is already taken:
     - If any `assignments` row has `receiver_id = given receiver_id`, raise an exception:
       - `"This person has already been selected by someone else"`.
  4. Insert a new row into `assignments (giver_id, receiver_id)`.
  5. Return the full `participants` row for the chosen receiver.

The frontend calls this RPC via the Supabase client (`supabase.rpc("finalize_assignment", {...})`) whenever a card is clicked.

---

## 9. Seeding Sample Data (`participants`)

To test the app, you must insert some participants into the `participants` table.

Example (adjust names and numbers as needed, and ensure phone numbers are in canonical form such as `+233XXXXXXXXX`):

```sql
insert into public.participants (full_name, phone_number)
values
  ('Alice Doe', '+233551111111'),
  ('Bob Smith', '+233552222222'),
  ('Carol Johnson', '+233553333333'),
  ('David Lee', '+233554444444');
```

You can run this SQL in the Supabase SQL editor after creating the schema.

> Important: The **login screen normalizes input**:
>
> - Inputs like `0551817972` or `+233 551817972` are converted to a canonical `+233551817972` format.
> - You should store phone numbers in this normalized `+233...` form to match lookups.

---

## 10. Running the App Locally

Once dependencies and Supabase are configured:

1. Start the development server:

   ```bash
   npm run dev
   ```

2. Open the app in your browser:

   - `http://localhost:3000`

3. Ensure:
   - The `.env.local` Supabase variables are set.
   - The `participants` table contains at least one participant with a phone number you can use to log in.

---

## 11. Usage Flow (Step-by-Step Walkthrough)

1. **Navigate to the app**:
   - Open `http://localhost:3000` (or your deployed URL).
2. **Login screen**:
   - You are redirected to `/login` if not logged in.
   - Enter your phone number in any common format (e.g. `0551817972` or `+233 551817972`).
   - The app normalizes this to `+233...` and looks up the corresponding participant.
   - If no participant is found, you see: “You are not registered for this gift exchange.”
3. **Dashboard – first time (no assignment yet)**:
   - You see a header with “Logged in as: {your full name}” and a logout button.
   - You see a heading “Choose who you will gift 🎁”.
   - Below that, a grid of cards is shown:
     - Each card corresponds to another participant (not you).
     - Cards for participants already taken as receivers are visible but **disabled** and labeled “Already selected”.
     - All other cards are clickable and show “Tap to reveal 🎁”.
   - Card order is randomized each time you visit without an assignment.
4. **Making a pick**:
   - Click any available card.
   - The card temporarily shows a loading state (e.g. “Revealing...”).
   - The frontend calls `finalize_assignment(giver_id, receiver_id)` on Supabase.
   - On success:
     - The selected card reveals your recipient’s name (and phone).
     - All cards become disabled so you cannot pick again.
5. **Future visits**:
   - When you log in again with the same phone number:
     - The app detects your existing assignment in `assignments`.
     - You see “Your gift assignment 🎁” and “You are gifting: {receiver.full_name}”.
     - No cards are shown; the assignment is permanent.
6. **Logout**:
   - On the dashboard, click the **“Log out”** button.
   - The app clears your stored participant from `localStorage` and redirects to `/login`.
   - You must log in again with a valid phone number to access the dashboard.

---

## 12. Notes / Limitations / Future Improvements

- **Auth model**:
  - The app currently uses a **pseudo-auth** model based on `localStorage` and a `participants` lookup.
  - There is no Supabase Auth mapping (`auth.users` → `participants`), so RLS is not fully enforced per-user.
  - For production use, you should:
    - Wire Supabase Auth (e.g. email or phone-based), and
    - Map authenticated users to participants, then
    - Add proper RLS policies to restrict access.
- **RLS (Row Level Security)**:
  - `assignments` has RLS enabled; `supabase/rls.sql` contains TODO-style guidance for writing policies once Auth is in place.
  - Currently, the app relies on client-side behavior and DB constraints rather than strict RLS isolation.
- **Phone number handling**:
  - Normalization currently focuses on Ghana-style formats (`0XXXXXXXXX`, `+233XXXXXXXXX`, `233XXXXXXXXX`).
  - If you intend to support other countries, you should extend the normalization and validation logic accordingly.
- **Admin / organizer tools**:
  - There is no UI for:
    - Adding/removing participants.
    - Viewing or exporting all assignments.
  - These can be managed directly via Supabase or by building a separate admin interface.
- **Idempotency & edge cases**:
  - `finalize_assignment` is idempotent for each giver: calling it multiple times returns the same existing assignment.
  - A race where two users simultaneously select the same receiver is handled by:
    - The RPC’s explicit receiver check, and
    - The `UNIQUE (receiver_id)` constraint.
  - Error messages for these edge cases are surfaced to the user, but you may want more user-friendly messaging or retry logic.
- **Styling and UX**:
  - The UI is intentionally minimal and focused on the core flow.
  - You can easily extend the design (animations, more festive styling, etc.) with TailwindCSS and React components.

This README should give you enough context to understand, run, and extend the Secret Gift Picker app. For code-level details, explore the `app/`, `lib/`, and `supabase/` directories.
