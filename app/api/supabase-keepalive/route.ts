import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

type KeepAliveSuccess = {
  ok: true;
  pingedAt: string;
};

type KeepAliveFailure = {
  ok: false;
  error: string;
  pingedAt: string;
};

export async function GET() {
  const pingedAt = new Date().toISOString();

  try {
    const supabase = createSupabaseAdminClient();

    // Try a tiny write to a lightweight keep_alive table.
    const { error: insertError } = await supabase.from("keep_alive").insert({});

    if (insertError) {
      console.error("Supabase keep_alive insert failed:", insertError);

      // Fallback: cheap read from participants if keep_alive does not exist or insert fails.
      const { error: selectError } = await supabase
        .from("participants")
        .select("id")
        .limit(1);

      if (selectError) {
        console.error(
          "Supabase fallback participants query failed:",
          selectError
        );

        const failureResponse: KeepAliveFailure = {
          ok: false,
          error: selectError.message || "Unknown Supabase error",
          pingedAt,
        };

        return NextResponse.json(failureResponse, { status: 500 });
      }
    }

    const successResponse: KeepAliveSuccess = {
      ok: true,
      pingedAt,
    };

    return NextResponse.json(successResponse);
  } catch (err) {
    console.error("Unexpected error in Supabase keepalive endpoint:", err);

    const errorMessage =
      err instanceof Error
        ? err.message
        : "Unknown error during Supabase keepalive ping";

    const failureResponse: KeepAliveFailure = {
      ok: false,
      error: errorMessage,
      pingedAt,
    };

    return NextResponse.json(failureResponse, { status: 500 });
  }
}
