import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const ERROR_MESSAGES = {
  invalidPayload: "datos inválidos",
  invitationNotFound: "código inválido o vencido",
  emailMismatch: "email incorrecto",
  invitationExpired: "código inválido o vencido",
  invitationUsed: "código inválido o vencido",
} as const;

type ErrorCode = keyof typeof ERROR_MESSAGES;

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  let payload: {
    code?: string;
    email?: string;
    password?: string;
    fullName?: string;
    photoConsent?: boolean;
  };

  try {
    payload = await request.json();
  } catch {
    return errorResponse(ERROR_MESSAGES.invalidPayload);
  }

  const code = typeof payload.code === "string" ? payload.code.trim().toUpperCase() : "";
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const password = typeof payload.password === "string" ? payload.password : "";
  const fullName = typeof payload.fullName === "string" ? payload.fullName.trim() : "";
  const photoConsent = payload.photoConsent === true;

  if (
    code.length !== 5 ||
    !email ||
    !fullName ||
    password.length < 6 ||
    password.length > 72
  ) {
    return errorResponse(ERROR_MESSAGES.invalidPayload);
  }

  const admin = createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: invitation, error: invitationError } = await admin
    .from("invitations")
    .select("id, email, status, expires_at")
    .eq("code", code)
    .maybeSingle();

  if (invitationError || !invitation) {
    return errorResponse(ERROR_MESSAGES.invitationNotFound, 404);
  }

  if (invitation.email.toLowerCase() !== email) {
    return errorResponse(ERROR_MESSAGES.emailMismatch);
  }

  if (invitation.status !== "pending") {
    return errorResponse(ERROR_MESSAGES.invitationUsed);
  }

  if (new Date(invitation.expires_at).getTime() < Date.now()) {
    return errorResponse(ERROR_MESSAGES.invitationExpired);
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (createError) {
    const isDuplicate = createError.status === 422;
    return errorResponse(
      isDuplicate
        ? ERROR_MESSAGES.invitationUsed
        : (createError.message ?? ERROR_MESSAGES.invalidPayload),
      isDuplicate ? 409 : 400,
    );
  }

  const userId = created.user?.id;
  if (!userId) {
    return errorResponse(ERROR_MESSAGES.invalidPayload, 500);
  }

  const { error: updateError } = await admin
    .from("users")
    .update({
      full_name: fullName,
      role: "parent",
      status: "active",
      photo_consent: photoConsent,
    })
    .eq("id", userId);

  if (updateError) {
    return errorResponse(ERROR_MESSAGES.invalidPayload, 500);
  }

  const { error: invitationUpdateError } = await admin
    .from("invitations")
    .update({ status: "used" })
    .eq("id", invitation.id);

  if (invitationUpdateError) {
    return errorResponse(ERROR_MESSAGES.invalidPayload, 500);
  }

  // Server-side sign-in: the @supabase/ssr server client sets the auth
  // cookies on this response via the cookieStore.
  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Route handlers can always set cookies; unreachable.
        }
      },
    },
  });

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return errorResponse(ERROR_MESSAGES.invalidPayload, 500);
  }

  const response = NextResponse.json({ error: null });
  cookieStore.getAll().forEach((cookie) => {
    response.cookies.set(cookie.name, cookie.value, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  });
  return response;
}
