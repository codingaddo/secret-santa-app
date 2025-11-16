"use client";

import { FormEvent, useState } from "react";
import { supabaseClient } from "../../lib/supabaseClient";
import type { Participant } from "../../lib/types";
import { useAuth } from "../../lib/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const router = useRouter();

  function normalizePhone(input: string): string | null {
    // Allow common Ghanaian formats like "0551817972" or "+233 551817972" and
    // normalize them to "+233XXXXXXXXX" with no spaces.
    const raw = input.replace(/\s+/g, "");

    if (!raw) return null;

    if (raw.startsWith("+233")) {
      return raw;
    }

    if (raw.startsWith("0") && raw.length >= 10) {
      return `+233${raw.slice(1)}`;
    }

    if (raw.startsWith("233")) {
      return `+${raw}`;
    }

    // TODO: Handle additional country codes or validation rules if needed.
    return null;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const trimmed = phone.trim();
    if (!trimmed) {
      setError("Please enter your phone number.");
      return;
    }

    const normalized = normalizePhone(trimmed);
    if (!normalized) {
      setError("Please enter a valid phone number in Ghana format.");
      return;
    }

    // TODO: Consider adding stricter phone validation (country codes, length, etc.).

    setSubmitting(true);
    try {
      const { data, error: dbError } = await supabaseClient
        .from("participants")
        .select("*")
        .eq("phone_number", normalized)
        .maybeSingle<Participant>();

      if (dbError) {
        setError("Unable to look up your registration. Please try again.");
        return;
      }

      if (!data) {
        setError("You are not registered for this gift exchange.");
        return;
      }

      login(data);
      router.replace("/dashboard");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-50">
          Welcome to Secret Santa 🎄
        </h1>
        <p className="text-sm text-slate-400">
          Enter the phone number you registered with to see your gift
          assignment.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-slate-200"
          >
            Enter your phone number
          </label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            placeholder="+233 555 000 111"
            disabled={submitting}
          />
          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-md shadow-emerald-900/40 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? "Checking..." : "Continue"}
        </button>
      </form>

      <p className="text-xs text-slate-500">
        This demo uses a simple localStorage-based login linked to your phone
        number and the pre-loaded participants table.
      </p>
    </div>
  );
}


