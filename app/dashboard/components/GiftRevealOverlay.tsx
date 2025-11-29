"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";

interface GiftRevealOverlayProps {
    isVisible: boolean;
    recipientName: string;
    onComplete?: () => void;
}

export default function GiftRevealOverlay({
    isVisible,
    recipientName,
    onComplete,
}: GiftRevealOverlayProps) {
    // Animation phases
    const [phase, setPhase] = useState<
        "idle" | "shake" | "open" | "reveal" | "celebrate"
    >("idle");

    // Generate confetti pieces with deterministic positions
    const confettiPieces = useMemo(() => {
        const colors = [
            "#ef4444", "#f97316", "#f59e0b", "#22c55e",
            "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
            "#fbbf24", "#10b981",
        ];
        return Array.from({ length: 50 }).map((_, i) => ({
            id: i,
            color: colors[i % colors.length],
            left: `${10 + (i % 10) * 9}%`,
            delay: `${(i % 15) * 0.05}s`,
            duration: `${1.5 + (i % 5) * 0.3}s`,
            size: 8 + (i % 4) * 3,
        }));
    }, []);

    // Generate sparkle particles
    const sparkles = useMemo(() => {
        return Array.from({ length: 20 }).map((_, i) => ({
            id: i,
            left: `${15 + (i % 7) * 12}%`,
            top: `${20 + Math.floor(i / 7) * 20}%`,
            delay: `${i * 0.1}s`,
            size: 12 + (i % 3) * 8,
        }));
    }, []);

    useEffect(() => {
        if (!isVisible) {
            // Reset phase when overlay closes - use timeout to avoid sync setState in effect
            const resetTimer = setTimeout(() => setPhase("idle"), 0);
            return () => clearTimeout(resetTimer);
        }

        const timers: NodeJS.Timeout[] = [];

        // Start animation sequence with shake
        timers.push(setTimeout(() => setPhase("shake"), 10));

        // Phase 2: Box opens (lid lifts)
        timers.push(setTimeout(() => setPhase("open"), 800));

        // Phase 3: Name reveals with glow
        timers.push(setTimeout(() => setPhase("reveal"), 1400));

        // Phase 4: Celebration (confetti burst)
        timers.push(setTimeout(() => setPhase("celebrate"), 1800));

        // Notify completion
        timers.push(
            setTimeout(() => {
                onComplete?.();
            }, 4000)
        );

        return () => timers.forEach(clearTimeout);
    }, [isVisible, onComplete]);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
            {/* Backdrop with animated gradient */}
            <div
                className={`absolute inset-0 transition-all duration-1000 ${phase === "celebrate"
                    ? "bg-linear-to-br from-red-900/90 via-black/90 to-green-900/90"
                    : "bg-black/80"
                    } backdrop-blur-xl`}
            />

            {/* Radial glow effect */}
            <div
                className={`absolute inset-0 transition-opacity duration-1000 ${phase === "reveal" || phase === "celebrate" ? "opacity-100" : "opacity-0"
                    }`}
                style={{
                    background:
                        "radial-gradient(circle at 50% 40%, rgba(251, 191, 36, 0.3) 0%, transparent 50%)",
                }}
            />

            {/* Sparkles layer */}
            {(phase === "reveal" || phase === "celebrate") && (
                <div className="absolute inset-0 pointer-events-none">
                    {sparkles.map((s) => (
                        <div
                            key={s.id}
                            className="absolute animate-sparkle-burst"
                            style={{
                                left: s.left,
                                top: s.top,
                                animationDelay: s.delay,
                                fontSize: `${s.size}px`,
                            }}
                        >
                            ✨
                        </div>
                    ))}
                </div>
            )}

            {/* Main content */}
            <div className="relative z-10 flex flex-col items-center justify-center px-4">
                {/* Gift box container */}
                <div
                    className={`relative transition-all duration-700 ${phase === "shake" ? "animate-shake" : ""
                        } ${phase === "open" || phase === "reveal" || phase === "celebrate" ? "scale-110" : "scale-100"}`}
                >
                    {/* Glow ring behind box */}
                    <div
                        className={`absolute inset-0 -m-8 rounded-full transition-all duration-1000 ${phase === "reveal" || phase === "celebrate"
                            ? "opacity-100 scale-125"
                            : "opacity-0 scale-100"
                            }`}
                        style={{
                            background:
                                "radial-gradient(circle, rgba(251, 191, 36, 0.4) 0%, transparent 70%)",
                        }}
                    />

                    {/* The gift box */}
                    <div className="relative w-64 h-64 sm:w-72 sm:h-72">
                        {/* Box base - always visible */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-32 sm:w-56 sm:h-36">
                            <Image
                                src={phase === "open" || phase === "reveal" || phase === "celebrate" ? "/open-box.png" : "/box.png"}
                                alt="Gift box"
                                fill
                                className="object-contain drop-shadow-2xl"
                                priority
                            />
                        </div>

                        {/* Magic particles rising from box */}
                        {(phase === "open" || phase === "reveal" || phase === "celebrate") && (
                            <div className="absolute bottom-20 left-1/2 -translate-x-1/2">
                                {[...Array(8)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="absolute animate-float-up"
                                        style={{
                                            left: `${-30 + i * 10}px`,
                                            animationDelay: `${i * 0.15}s`,
                                            animationDuration: `${1.5 + (i % 3) * 0.5}s`,
                                        }}
                                    >
                                        <span className="text-2xl">{["✨", "⭐", "💫", "🌟"][i % 4]}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Name card rising from box */}
                        <div
                            className={`absolute left-1/2 -translate-x-1/2 transition-all duration-1000 ease-out ${phase === "reveal" || phase === "celebrate"
                                ? "bottom-28 opacity-100 scale-100"
                                : "bottom-16 opacity-0 scale-75"
                                }`}
                        >
                            <div
                                className={`relative bg-linear-to-br from-white via-amber-50 to-white px-8 py-5 rounded-2xl shadow-2xl border-2 transition-all duration-500 ${phase === "celebrate"
                                    ? "border-amber-400 shadow-amber-400/50"
                                    : "border-emerald-400 shadow-emerald-400/30"
                                    }`}
                            >
                                {/* Decorative corners */}
                                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-amber-500 rounded-tl-lg" />
                                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-amber-500 rounded-tr-lg" />
                                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-amber-500 rounded-bl-lg" />
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-amber-500 rounded-br-lg" />

                                {/* Label */}
                                <p className="text-xs text-amber-600 font-medium uppercase tracking-widest mb-1 text-center">
                                    🎁 You&apos;re gifting to
                                </p>

                                {/* Name */}
                                <p
                                    className={`text-2xl sm:text-3xl font-bold text-slate-900 text-center transition-all duration-500 ${phase === "celebrate" ? "animate-pulse" : ""
                                        }`}
                                >
                                    {recipientName}
                                </p>

                                {/* Sparkle decorations */}
                                <span className="absolute -top-3 -right-3 text-xl animate-spin-slow">✨</span>
                                <span className="absolute -bottom-3 -left-3 text-xl animate-spin-slow" style={{ animationDirection: "reverse" }}>⭐</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Celebration text */}
                <div
                    className={`mt-8 text-center transition-all duration-700 ${phase === "celebrate"
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-8"
                        }`}
                >
                    <p className="text-4xl sm:text-5xl mb-3">🎄🎉🎅</p>
                    <p className="text-white text-lg font-medium">
                        Time to find the perfect gift!
                    </p>
                </div>
            </div>

            {/* Confetti explosion */}
            {phase === "celebrate" && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {confettiPieces.map((piece) => (
                        <div
                            key={piece.id}
                            className="confetti-piece absolute top-0"
                            style={{
                                left: piece.left,
                                backgroundColor: piece.color,
                                width: `${piece.size}px`,
                                height: `${piece.size * 1.5}px`,
                                animationDelay: piece.delay,
                                animationDuration: piece.duration,
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Styles */}
            <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          10% { transform: translateX(-8px) rotate(-3deg); }
          20% { transform: translateX(8px) rotate(3deg); }
          30% { transform: translateX(-6px) rotate(-2deg); }
          40% { transform: translateX(6px) rotate(2deg); }
          50% { transform: translateX(-4px) rotate(-1deg); }
          60% { transform: translateX(4px) rotate(1deg); }
          70% { transform: translateX(-2px) rotate(0deg); }
          80% { transform: translateX(2px) rotate(0deg); }
          90% { transform: translateX(-1px) rotate(0deg); }
        }

        .animate-shake {
          animation: shake 0.8s ease-in-out;
        }

        @keyframes float-up {
          0% {
            transform: translateY(0) scale(0.5);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          100% {
            transform: translateY(-120px) scale(1);
            opacity: 0;
          }
        }

        .animate-float-up {
          animation: float-up 2s ease-out infinite;
        }

        @keyframes sparkle-burst {
          0% {
            transform: scale(0) rotate(0deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.5) rotate(180deg);
            opacity: 1;
          }
          100% {
            transform: scale(0) rotate(360deg);
            opacity: 0;
          }
        }

        .animate-sparkle-burst {
          animation: sparkle-burst 1.5s ease-out infinite;
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }

        @keyframes confetti-fall {
          0% {
            transform: translateY(-10px) rotate(0deg) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg) scale(0.5);
            opacity: 0;
          }
        }

        .confetti-piece {
          border-radius: 3px;
          animation: confetti-fall 3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
      `}</style>
        </div>
    );
}
