"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabaseClient } from "../../lib/supabaseClient";
import type { Assignment, Participant } from "../../lib/types";
import { useAuth } from "../../lib/auth";
import LoadingIndicator from "./components/LoadingIndicator";
import HasExistingAssignment from "./components/HasExistingAssignment";
import GiftRevealOverlay from "./components/GiftRevealOverlay";

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

  // Get all eligible participants for the raining gift boxes
  const displayBoxes = useMemo(() => {
    // Build list of eligible participants
    const eligible = others.filter((p: Participant) => {
      const isTaken = takenReceiverIds.has(p.id);
      const isSelected = receiverId === p.id;
      return !isTaken || isSelected;
    });

    if (eligible.length === 0) return [];

    // Deterministic seeded random generator based on participant id
    const seeded = (seed: string, salt = 0) => {
      let h = 2166136261 >>> 0;
      for (let i = 0; i < seed.length; i += 1) {
        h ^= seed.charCodeAt(i);
        h = (h * 16777619) >>> 0;
      }
      h = (h + salt) >>> 0;
      const n = Math.abs(Math.sin(h) * 10000);
      return n - Math.floor(n);
    };

    // Give each box a random horizontal position and animation delay for rain effect
    return eligible.map((p) => ({
      participant: p,
      leftPercent: Math.round(5 + seeded(p.id, 1) * 90), // spread across 5-95% width
      animationDelay: seeded(p.id, 2) * 2, // 0-2s delay for staggered rain
      animationDuration: 3 + seeded(p.id, 3) * 2, // 3-5s fall duration
      swayAmount: 10 + seeded(p.id, 4) * 20, // 10-30px sway
    }));
  }, [others, takenReceiverIds, receiverId]);

  // Animation states for the gift reveal flow
  const [animatingId, setAnimatingId] = useState<string | null>(null);
  const [showRevealOverlay, setShowRevealOverlay] = useState(false);
  const [revealName, setRevealName] = useState("");

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

  // Wrapper used by the UI so we animate the selection locally before
  // finalizing it with the server. We intentionally DO NOT set
  // `selectingId` here (handleSelect will do that) so the RPC isn't
  // short-circuited by the early guard in handleSelect.
  function onBoxClick(id: string, disabled: boolean) {
    if (disabled) return;

    // Find the participant name for the reveal
    const selectedParticipant = others.find((p) => p.id === id);
    if (selectedParticipant) {
      setRevealName(selectedParticipant.full_name);
    }

    // Start the local animation overlay
    setAnimatingId(id);
    setShowRevealOverlay(true);

    // Finalize assignment after a short delay to let animation start
    setTimeout(() => {
      void handleSelect(id);
    }, 1000);
  }

  // Called when the reveal overlay animation completes
  const handleRevealComplete = useCallback(() => {
    setAnimatingId(null);
    setShowRevealOverlay(false);
    setRevealName("");
  }, []);

  if (authLoading || initializing) {
    return <LoadingIndicator />;
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
    <div className="space-y-8">
      {/* Header with welcome and logout */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-linear-to-br from-red-500 to-green-500 shadow-lg">
            <span className="text-lg">🎅</span>
          </div>
          <div>
            <p className="text-xs text-slate-600 uppercase tracking-wider">
              Welcome back
            </p>
            <p className="font-semibold text-slate-900">
              {participant.full_name}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="group flex items-center gap-2 rounded-full border border-white/50 bg-white/40 backdrop-blur-sm px-4 py-2 text-xs font-medium text-slate-700 hover:border-red-400 hover:text-red-600 hover:bg-white/60 transition-all duration-200"
        >
          <span>Log out</span>
          <svg
            className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
        </button>
      </div>
      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/20 backdrop-blur-sm px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      {hasExistingAssignment ? (
        <HasExistingAssignment receiver={receiver} />
      ) : (
        <div className="space-y-6">
          {/* Section header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-linear-to-r from-red-500/20 to-green-500/20 border border-white/40">
              <span className="animate-sparkle">✨</span>
              <span className="text-xs font-medium text-slate-700 uppercase tracking-wider">
                Time to pick!
              </span>
              <span
                className="animate-sparkle"
                style={{ animationDelay: "0.5s" }}
              >
                ✨
              </span>
            </div>
            <h1 className="text-3xl font-bold bg-linear-to-r from-red-600 via-green-600 to-red-600 bg-clip-text text-transparent">
              Choose Your Gift Recipient
            </h1>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Tap one of the magical gift boxes to reveal who you&apos;ll be
              gifting to.
              <span className="block mt-1 text-amber-700 font-medium">
                ⚠️ Choose wisely — you only get one chance!
              </span>
            </p>
          </div>

          {/* Gift Reveal Overlay Component */}
          <GiftRevealOverlay
            isVisible={showRevealOverlay && !receiver}
            recipientName={revealName}
            onComplete={handleRevealComplete}
          />

          {/* Raining gift boxes - mobile optimized */}
          <div className="relative h-[60vh] min-h-[350px] max-h-[500px] overflow-hidden rounded-2xl bg-linear-to-b from-slate-900/20 via-transparent to-slate-900/10">
            {/* Gift boxes raining down */}
            {displayBoxes.map(
              (
                {
                  participant: p,
                  leftPercent,
                  animationDelay,
                  animationDuration,
                },
                index
              ) => {
                const isSelected = receiverId === p.id;
                const isTaken = takenReceiverIds.has(p.id);
                const disabled =
                  hasFinalized ||
                  isTaken ||
                  (!!selectingId && selectingId !== p.id) ||
                  (!!animatingId && animatingId !== p.id);
                const isAnimating = animatingId === p.id;

                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => onBoxClick(p.id, disabled)}
                    style={{
                      left: `${Math.min(Math.max(leftPercent, 10), 75)}%`,
                      animationDelay: `${animationDelay + index * 0.4}s`,
                      animationDuration: `${animationDuration + 3}s`,
                    }}
                    className={`rain-gift absolute flex flex-col items-center p-2 rounded-xl transition-transform active:scale-95 ${
                      isAnimating ? "opacity-0! scale-0!" : ""
                    } ${
                      isTaken
                        ? "pointer-events-none opacity-30 grayscale"
                        : isSelected
                        ? "!animation-paused z-20 ring-4 ring-emerald-400 bg-emerald-500/30 shadow-2xl"
                        : "active:ring-2 active:ring-red-400 cursor-pointer"
                    } ${
                      disabled && !isSelected
                        ? "pointer-events-none opacity-30"
                        : ""
                    }`}
                  >
                    <div
                      className={`relative ${
                        !isTaken && !disabled ? "active:scale-110" : ""
                      }`}
                    >
                      <Image
                        src={isSelected ? "/open-box.png" : "/box.png"}
                        alt="Gift box"
                        width={64}
                        height={64}
                        className={`w-14 h-14 sm:w-16 sm:h-16 drop-shadow-xl ${
                          isSelected ? "animate-bounce" : ""
                        }`}
                      />
                      {!isTaken && !isSelected && !disabled && (
                        <span className="absolute -top-1 -right-1 text-xs animate-pulse">
                          ✨
                        </span>
                      )}
                    </div>

                    {/* Label below box */}
                    {/* <span className={`mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${
                    isTaken 
                      ? "bg-slate-400/50 text-slate-600" 
                      : isSelected 
                        ? "bg-emerald-500 text-white shadow-lg" 
                        : "bg-white/80 text-slate-700 shadow-sm"
                  }`}>
                    {isTaken ? "🔒" : isSelected ? `🎉 ${p.full_name}` : "🎁 Tap!"}
                  </span> */}
                  </button>
                );
              }
            )}

            {/* Touch hint at bottom */}
            {displayBoxes.length > 0 && !hasFinalized && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
                <div className="px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm shadow-lg animate-bounce">
                  <span className="text-xs font-medium text-slate-700">
                    👆 Tap a gift to reveal!
                  </span>
                </div>
              </div>
            )}

            {/* Empty state */}
            {displayBoxes.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                <span className="text-5xl mb-3">📭</span>
                <p className="text-slate-700 font-medium">No gifts available</p>
                <p className="text-xs text-slate-500">
                  All participants have been assigned
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      <style jsx>{`
        .rain-gift {
          top: -100px;
          animation: rainDown 6s ease-in-out infinite;
        }

        .rain-gift:active {
          animation-play-state: paused;
        }

        @keyframes rainDown {
          0% {
            top: -100px;
            opacity: 0;
            transform: translateX(0) rotate(-5deg);
          }
          5% {
            opacity: 1;
          }
          25% {
            transform: translateX(15px) rotate(3deg);
          }
          50% {
            transform: translateX(-10px) rotate(-3deg);
          }
          75% {
            transform: translateX(8px) rotate(2deg);
          }
          95% {
            opacity: 1;
          }
          100% {
            top: calc(100% + 20px);
            opacity: 0;
            transform: translateX(0) rotate(5deg);
          }
        }
      `}</style>
    </div>
  );
}
