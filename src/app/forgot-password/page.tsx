import type { Metadata } from "next";
import Link from "next/link";
import { requestPasswordReset } from "@/app/auth/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Request a secure password reset link for TRYVORA.",
};

type ForgotPasswordPageProps = {
  searchParams: Promise<{ error?: string; notice?: string }>;
};

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const { error, notice } = await searchParams;
  const configured = isSupabaseConfigured();

  return (
    <div className="auth-page">
      <section className="auth-card">
        <span className="eyebrow"><span className="eyebrow-line" /> ACCOUNT ACCESS</span>
        <h1>Let’s get you <em>back.</em></h1>
        <p className="auth-intro">Enter the email address linked to your TRYVORA account.</p>
        {!configured && <div className="auth-notice" role="status">Supabase is not configured. Password reset is disabled in this environment.</div>}
        {error === "invalid" && <p className="auth-error" role="alert">Enter a valid email address.</p>}
        {error === "setup" && <p className="auth-error" role="alert">Supabase is not configured. Add the project URL and publishable key to .env.local.</p>}
        {error === "send-failed" && <p className="auth-error" role="alert">We could not send a reset email. Please try again later.</p>}
        {notice === "reset-email" && <p className="auth-success" role="status">If an account matches that address, a reset link will arrive shortly.</p>}
        <form action={requestPasswordReset} className="auth-form">
          <label>
            Email address
            <input autoComplete="email" name="email" required type="email" />
          </label>
          <button className="button button-dark auth-submit" disabled={!configured} type="submit">Send reset link</button>
        </form>
        <div className="auth-links auth-links-center"><Link href="/login">Back to sign in</Link></div>
      </section>
    </div>
  );
}
