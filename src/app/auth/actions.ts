"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSiteUrl, isSupabaseConfigured } from "@/lib/supabase/config";

const emailSchema = z.string().trim().email();
const passwordSchema = z.string().min(10).max(128);
const signUpSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: emailSchema,
  password: passwordSchema,
});

export async function signInWithPassword(formData: FormData) {
  const parsed = z.object({ email: emailSchema, password: z.string().min(1) }).safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) redirect("/login?error=invalid");
  if (!isSupabaseConfigured()) redirect("/login?error=setup");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) redirect("/login?error=credentials");

  redirect("/account");
}

export async function signUpWithPassword(formData: FormData) {
  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) redirect("/signup?error=invalid");
  if (!isSupabaseConfigured()) redirect("/signup?error=setup");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.name },
      emailRedirectTo: `${getSiteUrl()}/auth/callback?next=/account`,
    },
  });

  if (error) redirect("/signup?error=signup-failed");
  if (data.session) redirect("/account");

  redirect("/signup?notice=verify-email");
}

export async function signInWithGoogle() {
  if (!isSupabaseConfigured()) redirect("/login?error=setup");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${getSiteUrl()}/auth/callback?next=/account`,
    },
  });

  if (error || !data.url) redirect("/login?error=oauth");
  redirect(data.url);
}

export async function requestPasswordReset(formData: FormData) {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) redirect("/forgot-password?error=invalid");
  if (!isSupabaseConfigured()) redirect("/forgot-password?error=setup");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${getSiteUrl()}/auth/callback?next=/auth/update-password`,
  });

  if (error) redirect("/forgot-password?error=send-failed");
  redirect("/forgot-password?notice=reset-email");
}

export async function updatePassword(formData: FormData) {
  const parsed = z.object({
    password: passwordSchema,
    confirmPassword: z.string(),
  }).safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success || parsed.data.password !== parsed.data.confirmPassword) {
    redirect("/auth/update-password?error=invalid");
  }
  if (!isSupabaseConfigured()) redirect("/login?error=setup");

  const supabase = await createSupabaseServerClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claimsData?.claims?.sub) redirect("/login?error=expired-link");

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) redirect("/auth/update-password?error=update-failed");

  redirect("/account?notice=password-updated");
}

export async function signOut() {
  if (!isSupabaseConfigured()) redirect("/login?error=setup");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) redirect("/account?error=sign-out");

  redirect("/");
}

export async function updateProfile(formData: FormData) {
  const parsed = z.object({
    name: z.string().trim().max(120),
  }).safeParse({ name: formData.get("name") });
  if (!parsed.success) redirect("/account?error=profile-invalid");
  if (!isSupabaseConfigured()) redirect("/login?error=setup");

  const supabase = await createSupabaseServerClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || typeof claimsData?.claims?.sub !== "string") redirect("/login");

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.name || null })
    .eq("id", claimsData.claims.sub);
  if (error) redirect("/account?error=profile-update");

  redirect("/account?notice=profile-updated");
}

export async function updatePreferences(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/login?error=setup");

  const supabase = await createSupabaseServerClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || typeof claimsData?.claims?.sub !== "string") redirect("/login");

  const cleanValues = (field: string) =>
    formData
      .getAll(field)
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter(Boolean)
      .slice(0, 20);

  const { error } = await supabase
    .from("user_preferences")
    .upsert({
      user_id: claimsData.claims.sub,
      preferred_styles: cleanValues("styles"),
      preferred_colors: cleanValues("colors"),
      preferred_categories: cleanValues("categories"),
    }, { onConflict: "user_id" });
  if (error) redirect("/account?error=preferences-update");

  redirect("/account?notice=preferences-updated");
}
