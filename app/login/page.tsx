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
    <div className="space-y-8">
      {/* Header Section with Festive Design */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-linear-to-br from-red-500 to-green-500 mb-2 animate-pulse">
          <span className="text-3xl" role="img" aria-label="Christmas tree">
            🎄
          </span>
        </div>
        <h1 className="text-4xl font-bold bg-linear-to-r from-red-500 via-green-500 to-red-500 bg-clip-text text-transparent">
          Secret Santa 2025
        </h1>
        <p className="text-slate-700 text-base max-w-md mx-auto">
          Enter your registered phone number to discover who you&apos;ll be
          gifting this holiday season
        </p>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label
            htmlFor="phone"
            className="block text-sm font-semibold text-slate-800 mb-2"
          >
            Phone Number
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-slate-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
            </div>
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-white/40 bg-white/40 text-slate-900 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all duration-200 backdrop-blur-md"
              placeholder="0244123456"
              disabled={submitting}
              aria-describedby={error ? "phone-error" : undefined}
            />
          </div>
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/20 backdrop-blur-sm border border-red-500/40">
              <svg
                className="h-5 w-5 text-red-700 shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p id="phone-error" className="text-sm text-red-800" role="alert">
                {error}
              </p>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="group relative w-full overflow-hidden rounded-xl bg-linear-to-r from-emerald-500 to-green-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-emerald-900/40 transition-all duration-200 hover:shadow-xl hover:shadow-emerald-900/50 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-emerald-500/50 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {submitting ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Checking...</span>
              </>
            ) : (
              <>
                <span>Continue</span>
                <svg
                  className="h-5 w-5 transition-transform group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </>
            )}
          </span>
          <div className="absolute inset-0 bg-linear-to-r from-green-600 to-emerald-500 opacity-0 transition-opacity group-hover:opacity-100" />
        </button>
      </form>

      {/* Info Section */}
      <div className="pt-4 border-t border-white/30">
        <div className="flex items-start gap-3 p-4 rounded-lg bg-white/30 backdrop-blur-sm border border-white/40">
          <svg
            className="h-5 w-5 text-slate-700 shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-800">How it works</p>
            <p className="text-xs text-slate-700 leading-relaxed">
              Use the phone number you registered with to securely access your
              Secret Santa assignment. Your gift recipient will be revealed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
