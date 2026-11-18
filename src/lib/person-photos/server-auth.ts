import "server-only";

import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/database.types";

type PersonPhotoAccess =
  | {
      ok: true;
      userId: string;
      admin: SupabaseClient<Database>;
    }
  | {
      ok: false;
      response: NextResponse;
    };

export async function getPersonPhotoAccess(): Promise<PersonPhotoAccess> {
  if (!isSupabaseConfigured() || !isSupabaseAdminConfigured()) {
    return {
      ok: false,
      response: NextResponse.json(
        { photo: null, error: "Private photo storage is not configured." },
        { status: 503 },
      ),
    };
  }

  const sessionClient = await createSupabaseServerClient();
  const { data, error } = await sessionClient.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || typeof userId !== "string") {
    return {
      ok: false,
      response: NextResponse.json(
        { photo: null, error: "Sign in to manage your private photo." },
        { status: 401 },
      ),
    };
  }

  return {
    ok: true,
    userId,
    admin: createSupabaseAdminClient(),
  };
}

export function photoApiError(message: string, status: number) {
  return NextResponse.json({ photo: null, error: message }, { status });
}

export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
