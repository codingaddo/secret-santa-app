"use client";

import { useMemo } from "react";
import Image from "next/image";

export default function LoadingIndicator() {
  const deterministic = (i: number, salt = 1) => {
    const n = Math.abs(Math.sin(i * (12.9898 + salt)) * 43758.5453);
    return n - Math.floor(n);
  };

  const stars = useMemo(
    () =>
      Array.from({ length: 20 }).map((_, i) => {
        const r = deterministic(i, 1);
        const t = deterministic(i, 2);
        const s = deterministic(i, 3);
        return {
          left: `${Math.round(r * 100)}%`,
          top: `${Math.round(t * 60)}%`,
          delay: `${(s * 2).toFixed(2)}s`,
          size: `${Math.round(4 + s * 8)}px`,
        };
      }),
    []
  );

  const snow = useMemo(
    () =>
      Array.from({ length: 20 }).map((_, i) => {
        const r = deterministic(i, 5);
        const d = deterministic(i, 6);
        const s = deterministic(i, 7);
        return {
          left: `${Math.round(r * 100)}%`,
          duration: `${(4 + d * 6).toFixed(2)}s`,
          delay: `${(s * 3).toFixed(2)}s`,
          size: `${Math.round(10 + s * 12)}px`,
        };
      }),
    []
  );

  return (
    <div className="relative flex flex-col bg-blur items-center justify-center space-y-8 py-12 overflow-hidden min-h-[500px]">
      {/* Animated night sky background */}
      <div className="absolute inset-0 opacity-30" />

      {/* Twinkling stars in background */}
      <div className="absolute inset-0 pointer-events-none">
        {stars.map((s, i) => (
          <div
            key={`star-${i}`}
            className="absolute text-yellow-200 animate-[twinkle_2s_ease-in-out_infinite]"
            style={{
              left: s.left,
              top: s.top,
              animationDelay: s.delay,
              fontSize: s.size,
            }}
          >
            ⭐
          </div>
        ))}
      </div>

      {/* Snowflakes falling */}
      <div className="absolute inset-0 pointer-events-none">
        {snow.map((s, i) => (
          <div
            key={`snow-${i}`}
            className="absolute text-white opacity-70 animate-[fall_linear_infinite]"
            style={{
              left: s.left,
              animationDuration: s.duration,
              animationDelay: s.delay,
              fontSize: s.size,
            }}
          >
            ❄️
          </div>
        ))}
      </div>

      {/* Santa SVG flying across screen */}
      <div className="absolute inset-0 pointer-events-none">
        {/* First Santa flying left to right */}
        <div
          className="absolute animate-[flyAcross_12s_linear_infinite]"
          style={{ top: "20%" }}
        >
          <div className="relative">
            {/* Motion trail sparkles */}
            <div className="absolute -left-12 top-1/2 -translate-y-1/2 flex gap-3 opacity-60">
              <span className="text-2xl animate-[fadeOut_0.8s_ease-out_infinite]">
                ✨
              </span>
              <span
                className="text-xl animate-[fadeOut_0.8s_ease-out_infinite]"
                style={{ animationDelay: "0.2s" }}
              >
                ⭐
              </span>
              <span
                className="text-lg animate-[fadeOut_0.8s_ease-out_infinite]"
                style={{ animationDelay: "0.4s" }}
              >
                💫
              </span>
            </div>

            <Image
              src="/santa.svg"
              alt="Santa flying"
              width={208}
              height={80}
              priority
              className="w-52 text-white h-auto drop-shadow-2xl animate-[sleighBounce_0.6s_ease-in-out_infinite] brightness-110"
              style={{ filter: "drop-shadow(0 0 20px rgba(255, 0, 0, 0.3))" }}
            />
          </div>
        </div>

        {/* Second Santa flying right to left */}
        <div
          className="absolute animate-[flyAcrossReverse_15s_linear_infinite]"
          style={{ top: "65%", animationDelay: "5s" }}
        >
          <div className="relative scale-x-[-1]">
            {/* Motion trail sparkles (flipped) */}
            <div className="absolute -left-12 top-1/2 -translate-y-1/2 flex gap-3 opacity-60 scale-x-[-1]">
              <span className="text-2xl animate-[fadeOut_0.8s_ease-out_infinite]">
                ✨
              </span>
              <span
                className="text-xl animate-[fadeOut_0.8s_ease-out_infinite]"
                style={{ animationDelay: "0.2s" }}
              >
                ⭐
              </span>
              <span
                className="text-lg animate-[fadeOut_0.8s_ease-out_infinite]"
                style={{ animationDelay: "0.4s" }}
              >
                💫
              </span>
            </div>

            {/* <Image
              src="/santa.svg"
              alt="Santa flying"
              width={112}
              height={60}
              className="w-28 h-auto drop-shadow-2xl animate-[sleighBounce_0.6s_ease-in-out_infinite] brightness-110"
              style={{ filter: "drop-shadow(0 0 20px rgba(255, 0, 0, 0.3))" }}
            /> */}
          </div>
        </div>
      </div>

      <div className="relative z-10 w-80 h-80">
        {/* Christmas Tree in the center with lights */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <span
              className="text-9xl drop-shadow-2xl animate-[bounce_2s_ease-in-out_infinite]"
              role="img"
              aria-label="Christmas tree"
            >
              🎄
            </span>
            {/* Tree lights twinkling */}
            <span
              className="absolute top-4 left-4 text-2xl animate-ping"
              style={{ animationDelay: "0s" }}
            >
              ✨
            </span>
            <span
              className="absolute top-8 right-6 text-xl animate-ping"
              style={{ animationDelay: "0.5s" }}
            >
              ⭐
            </span>
            <span
              className="absolute bottom-12 left-8 text-xl animate-ping"
              style={{ animationDelay: "1s" }}
            >
              💫
            </span>
            <span
              className="absolute top-16 right-10 text-xl animate-ping"
              style={{ animationDelay: "1.5s" }}
            >
              🔴
            </span>
          </div>
        </div>

        {/* Presents at the base */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
          <span
            className="text-3xl animate-[bounce_2s_ease-in-out_infinite]"
            style={{ animationDelay: "0.4s" }}
          >
            🎀
          </span>
          <span
            className="text-3xl animate-[bounce_2s_ease-in-out_infinite]"
            style={{ animationDelay: "0.6s" }}
          >
            🎁
          </span>
        </div>
      </div>

      <div className="relative z-10 text-center space-y-3 max-w-md px-4">
        <h1 className="text-3xl font-bold bg-linear-to-r from-red-500 via-green-500 to-red-500 bg-clip-text text-transparent animate-[shimmer_2s_ease-in-out_infinite]">
          Secret Santa 🎁
        </h1>
        <div className="flex items-center justify-center gap-2">
          <span className="text-slate-800 text-base font-medium">
            Loading your gift assignment
          </span>
          <span className="flex gap-1 text-slate-800">
            <span className="animate-bounce" style={{ animationDelay: "0s" }}>
              .
            </span>
            <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>
              .
            </span>
            <span className="animate-bounce" style={{ animationDelay: "0.4s" }}>
              .
            </span>
          </span>
        </div>
        <p className="text-xs text-slate-700 italic font-medium">
          Santa and his reindeer are preparing something special! 🎄
        </p>
      </div>

      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(-10vh) rotate(0deg);
          }
          100% {
            transform: translateY(110vh) rotate(360deg);
          }
        }
        @keyframes shimmer {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
        @keyframes flyAcross {
          0% {
            transform: translateX(-200px) translateY(0px);
          }
          50% {
            transform: translateX(50vw) translateY(-40px);
          }
          100% {
            transform: translateX(calc(100vw + 200px)) translateY(0px);
          }
        }
        @keyframes flyAcrossReverse {
          0% {
            transform: translateX(calc(100vw + 200px)) translateY(0px);
          }
          50% {
            transform: translateX(50vw) translateY(-35px);
          }
          100% {
            transform: translateX(-200px) translateY(0px);
          }
        }
        @keyframes sleighBounce {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-8px) rotate(-2deg);
          }
        }
        @keyframes fadeOut {
          0% {
            opacity: 0.8;
            transform: translateX(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateX(-30px) scale(0.4);
          }
        }
        @keyframes twinkle {
          0%,
          100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.3);
          }
        }
      `}</style>
    </div>
  );
}
