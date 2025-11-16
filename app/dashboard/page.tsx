"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "../../lib/supabaseClient";
import type { Assignment, Participant } from "../../lib/types";
import { useAuth } from "../../lib/auth";

function shuffleParticipants(items: Participant[]): Participant[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function DashboardPage() {
  const { participant, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [initializing, setInitializing] = useState(true);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [receiver, setReceiver] = useState<Participant | null>(null);
  const [receiverId, setReceiverId] = useState<string | null>(null);
  const [others, setOthers] = useState<Participant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [hasFinalized, setHasFinalized] = useState(false);
  const [takenReceiverIds, setTakenReceiverIds] = useState<Set<string>>(
    () => new Set()
  );

  function handleLogout() {
    // Clear the stored participant for this demo login.
    try {
      window.localStorage.removeItem("participant");
    } catch {
      // ignore storage errors
    }
    logout();
    router.push("/login");
  }

  useEffect(() => {
    if (authLoading) return;
    if (!participant) {
      router.replace("/login");
      return;
    }
    const currentParticipant = participant;

    async function load() {
      setError(null);
      setInitializing(true);

      // Fetch any existing assignment for this participant.
      const { data: existingAssignment, error: assignmentError } =
        await supabaseClient
          .from("assignments")
          .select("*")
          .eq("giver_id", currentParticipant.id)
          .maybeSingle<Assignment>();

      if (assignmentError) {
        setError(
          "We could not load your assignment information. Please try again shortly."
        );
        setInitializing(false);
        return;
      }

      if (existingAssignment) {
        setAssignment(existingAssignment);
        // Load the receiver details.
        const { data: receiverData, error: receiverError } =
          await supabaseClient
            .from("participants")
            .select("*")
            .eq("id", existingAssignment.receiver_id)
            .maybeSingle<Participant>();

        if (receiverError || !receiverData) {
          setError(
            "We found an assignment but could not load the recipient details."
          );
        } else {
          setReceiver(receiverData);
          setReceiverId(receiverData.id);
        }
        setInitializing(false);
        return;
      }

      // No assignment yet: load all other participants and current assignments
      // so we can mark which receivers are already taken.
      const { data: participants, error: participantsError } =
        await supabaseClient
          .from("participants")
          .select("*")
          .neq("id", currentParticipant.id);

      if (participantsError) {
        setError(
          "We could not load the list of participants. Please refresh and try again."
        );
        setInitializing(false);
        return;
      }

      const { data: assignments, error: assignmentsError } =
        await supabaseClient.from("assignments").select("receiver_id");

      if (assignmentsError) {
        // We still show the grid, but inform the user that some cards might
        // appear available when they are already taken.
        setError(
          "We could not load the current selections. Some cards may appear available when they are already taken."
        );
      } else if (assignments) {
        setTakenReceiverIds(
          new Set(
            (assignments as { receiver_id: string }[]).map((a) => a.receiver_id)
          )
        );
      }

      setOthers(shuffleParticipants((participants ?? []) as Participant[]));
      setInitializing(false);
    }

    load();
  }, [authLoading, participant, router]);

  async function handleSelect(receiverId: string) {
    if (!participant || hasFinalized || selectingId) return;
    setError(null);
    setSelectingId(receiverId);

    try {
      const rpcClient = supabaseClient as unknown as {
        rpc: (
          fn: string,
          args: { giver_id: string; receiver_id: string }
        ) => Promise<{
          data: Participant | null;
          error: { message?: string } | null;
        }>;
      };

      const { data, error: rpcError } = await rpcClient.rpc(
        "finalize_assignment",
        {
          giver_id: participant.id,
          receiver_id: receiverId,
        }
      );

      if (rpcError) {
        // TODO: Inspect specific error codes/messages from Supabase/Postgres if needed.
        const message =
          rpcError.message ||
          "We could not finalize your assignment. Please try again.";

        // If the error indicates an existing assignment for this giver, we
        // should re-fetch and show it. We check for the word "assignment" to
        // distinguish it from "receiver already taken" errors.
        if (
          message.toLowerCase().includes("already") &&
          message.toLowerCase().includes("assignment")
        ) {
          const { data: existingAssignment } = await supabaseClient
            .from("assignments")
            .select("*")
            .eq("giver_id", participant.id)
            .maybeSingle<Assignment>();

          if (existingAssignment) {
            setAssignment(existingAssignment);
            const { data: receiverData } = await supabaseClient
              .from("participants")
              .select("*")
              .eq("id", existingAssignment.receiver_id)
              .maybeSingle<Participant>();
            if (receiverData) {
              setReceiver(receiverData);
              setReceiverId(receiverData.id);
              setHasFinalized(true);
              return;
            }
          }
        }

        setError(message);
        return;
      }

      if (!data) {
        setError(
          "The assignment did not return a recipient. Please contact the organizer."
        );
        return;
      }

      // RPC returns the receiver participant row.
      const receiverParticipant = data as Participant;
      setReceiver(receiverParticipant);
      setReceiverId(receiverParticipant.id);
      setHasFinalized(true);
    } finally {
      setSelectingId(null);
    }
  }

  if (authLoading || initializing) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-slate-50">
          Secret Santa 🎁
        </h1>
        <p className="text-sm text-slate-400">
          Loading your gift assignment...
        </p>
      </div>
    );
  }

  if (!participant) {
    // Should already be redirected, but we keep this as a safe fallback.
    return (
      <p className="text-sm text-slate-400">
        You are not logged in. Redirecting to login...
      </p>
    );
  }

  const hasExistingAssignment = !!assignment || !!receiverId;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-sm text-slate-300">
        <p>
          <span className="font-medium text-slate-50">
            {participant.full_name}
          </span>
        </p>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-full border border-slate-600 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-200 hover:border-emerald-400 hover:text-emerald-200"
        >
          Log out
        </button>
      </div>
      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      {hasExistingAssignment ? (
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold text-slate-50">
            Your gift assignment 🎁
          </h1>
          <p className="text-sm text-slate-400">
            This is your permanent Secret Santa assignment. You cannot change
            it.
          </p>
          {receiver && (
            <div className="mt-4 rounded-xl bg-slate-800 px-4 py-5 shadow-lg shadow-slate-950/40">
              <p className="text-sm text-slate-400">You are gifting:</p>
              <p className="mt-1 text-lg font-semibold text-slate-50">
                {receiver.full_name}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Phone: {receiver.phone_number}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-slate-50">
              Choose who you will gift 🎁
            </h1>
            <p className="text-sm text-slate-400">
              Tap one card to reveal your recipient. You only get one chance,
              and your selection will be saved permanently.
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {others.map((p: Participant) => {
              const isSelected = receiverId === p.id;
              const isTaken = takenReceiverIds.has(p.id);
              const disabled =
                hasFinalized ||
                isTaken ||
                (!!selectingId && selectingId !== p.id);

              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleSelect(p.id)}
                  className={`flex h-32 items-center justify-center rounded-xl border text-center text-sm font-medium transition ${
                    isSelected
                      ? "border-emerald-400 bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-900/50"
                      : isTaken
                      ? "border-slate-800 bg-slate-900/40 text-slate-500"
                      : "border-slate-700 bg-slate-900 text-slate-100 hover:border-emerald-400 hover:bg-slate-800"
                  } ${
                    disabled && !isSelected
                      ? "opacity-40 hover:border-slate-700 hover:bg-slate-900"
                      : ""
                  }`}
                >
                  {isSelected ? (
                    <div>
                      <p className="text-xs text-emerald-950/90">
                        You will be gifting
                      </p>
                      <p className="mt-1 text-base font-semibold">
                        {p.full_name}
                      </p>
                      <p className="mt-1 text-xs text-emerald-950/90">
                        Phone: {p.phone_number}
                      </p>
                    </div>
                  ) : selectingId === p.id ? (
                    "Revealing..."
                  ) : isTaken ? (
                    "Already selected"
                  ) : (
                    "Tap to reveal 🎁"
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
