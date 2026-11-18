import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { updatePassword } from "@/app/auth/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Choose a new password",
  description: "Set a new password for your TRYVORA account.",
};

type UpdatePasswordPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function UpdatePasswordPage({ searchParams }: UpdatePasswordPageProps) {
  const { error } = await searchParams;
  if (!isSupabaseConfigured()) redirect("/login?error=setup");

  const supabase = await createSupabaseServerClient();
  const { data, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !data?.claims?.sub) redirect("/login?error=expired-link");

  return (
    <div className="auth-page">
      <section className="auth-card">
        <span className="eyebrow"><span className="eyebrow-line" /> SECURE ACCOUNT RECOVERY</span>
        <h1>Choose a new <em>password.</em></h1>
        <p className="auth-intro">Use at least 10 characters. Your old password will stop working once this is saved.</p>
        {error === "invalid" && <p className="auth-error" role="alert">Enter matching passwords with at least 10 characters.</p>}
        {error === "update-failed" && <p className="auth-error" role="alert">We could not update your password. Request a fresh reset link and try again.</p>}
        <form action={updatePassword} className="auth-form">
          <label>
            New password
            <input autoComplete="new-password" minLength={10} name="password" required type="password" />
          </label>
          <label>
            Confirm new password
            <input autoComplete="new-password" minLength={10} name="confirmPassword" required type="password" />
          </label>
          <button className="button button-dark auth-submit" type="submit">Update password</button>
        </form>
      </section>
    </div>
  );
}
