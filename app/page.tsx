"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "../lib/auth";

export default function Home() {
  const router = useRouter();
  const { participant, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (participant) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [participant, loading, router]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 text-center text-slate-100">
      <p className="text-sm text-slate-400">Loading your Secret Santa...</p>
    </div>
  );
}

