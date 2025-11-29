"use client";

import type { Participant } from "../../../lib/types";

export default function HasExistingAssignment({
  receiver,
}: {
  receiver: Participant | null;
}) {
  if (!receiver) return null;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="text-center space-y-4 pb-6">
        <div className="relative inline-flex items-center justify-center">
          <div className="absolute inset-0 w-20 h-20 rounded-full bg-linear-to-br from-red-500 to-green-500 blur-xl opacity-50 animate-pulse" />
          <div className="relative w-20 h-20 rounded-full bg-linear-to-br from-red-500 via-amber-500 to-green-500 flex items-center justify-center shadow-xl">
            <span className="text-4xl animate-bounce" style={{ animationDuration: '2s' }}>🎁</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Assignment Confirmed</span>
          </div>
          <h1 className="text-4xl font-extrabold bg-linear-to-r from-red-500 via-amber-500 to-green-500 bg-clip-text text-transparent">
            Your Gift Assignment
          </h1>
        </div>
        <p className="text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
          This is your permanent Secret Santa assignment. Keep it a secret and
          spread the holiday joy! 🎄✨
        </p>
      </div>

      {receiver && (
        <div className="relative group">
          {/* Decorative elements */}
          <div
            className="absolute -top-3 -right-3 text-4xl animate-bounce z-10"
            style={{ animationDuration: "2s" }}
          >
            🎄
          </div>
          <div
            className="absolute -bottom-2 -left-2 text-3xl animate-bounce z-10"
            style={{ animationDuration: "2.5s", animationDelay: "0.5s" }}
          >
            ⭐
          </div>

          {/* Main card */}
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-white/50 to-white/30 backdrop-blur-xl p-8 transition-all duration-300 border border-white/40 shadow-xl">
            {/* Animated background pattern */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-4 left-4 text-5xl opacity-10 animate-float">❄️</div>
              <div className="absolute top-16 right-8 text-4xl opacity-10 animate-float" style={{ animationDelay: '0.5s' }}>❄️</div>
              <div className="absolute bottom-12 left-12 text-3xl opacity-10 animate-float" style={{ animationDelay: '1s' }}>❄️</div>
              <div className="absolute bottom-4 right-4 text-4xl opacity-10 animate-float" style={{ animationDelay: '1.5s' }}>❄️</div>
              {/* Gradient orbs */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-500/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-green-500/20 rounded-full blur-3xl" />
            </div>

            <div className="relative space-y-5">
              {/* Label */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-linear-to-r from-red-500/20 to-green-500/20 border border-white/50">
                  <span className="text-lg">🎅</span>
                  <p className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                    You are gifting to
                  </p>
                </div>
              </div>

              {/* Recipient name */}
              <div className="space-y-3">
                <p className="text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  {receiver.full_name}
                </p>
                <div className="h-1.5 w-24 bg-linear-to-r from-red-500 via-amber-500 to-green-500 rounded-full shadow-lg"></div>
              </div>

              {/* Contact info */}
              <div className="flex items-center gap-4 pt-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-linear-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/30">
                  <svg
                    className="w-6 h-6 text-white"
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
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">
                    Contact Number
                  </p>
                  <p className="text-lg font-bold text-slate-800 tracking-wide">
                    {receiver.phone_number}
                  </p>
                </div>
              </div>

              {/* Gift reminder */}
              <div className="mt-6 pt-6 border-t border-white/30">
                <div className="flex items-start gap-4 p-5 rounded-2xl bg-linear-to-r from-amber-500/10 to-orange-500/10 backdrop-blur-sm border border-amber-500/30">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-linear-to-br from-amber-400 to-orange-500 shadow-lg">
                    <span className="text-2xl">💝</span>
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <p className="text-base font-bold text-amber-900">
                      Gift Reminder
                    </p>
                    <p className="text-sm text-amber-800 leading-relaxed">
                      Remember to prepare a thoughtful gift and keep your
                      identity secret until the big reveal! 🤫
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
