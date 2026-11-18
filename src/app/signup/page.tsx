import type { Metadata } from "next";
import Link from "next/link";
import { signUpWithPassword } from "@/app/auth/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create your TRYVORA account.",
};

const errorMessages: Record<string, string> = {
  invalid: "Enter your name, a valid email, and a password with at least 10 characters.",
  setup: "Supabase isn't configured yet. Add the project URL and publishable key to .env.local.",
  "signup-failed": "We couldn't create your account. Check the details and try again.",
};

type SignupPageProps = {
  searchParams: Promise<{ error?: string; notice?: string }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { error, notice } = await searchParams;
  const configured = isSupabaseConfigured();

  return (
    <div className="auth-page">
      <section className="auth-card">
        <span className="eyebrow"><span className="eyebrow-line" /> MAKE ROOM FOR YOUR STYLE</span>
        <h1>A little more <em>you.</em></h1>
        <p className="auth-intro">Create an account to begin your TRYVORA space.</p>
        {!configured && (
          <div className="auth-notice" role="status">
            Supabase is not configured in this environment. Account creation is disabled until you connect a project.
          </div>
        )}
        {error && errorMessages[error] && <p className="auth-error" role="alert">{errorMessages[error]}</p>}
        {notice === "verify-email" && <p className="auth-success" role="status">If this email can be registered, check your inbox for a verification link.</p>}
        <form action={signUpWithPassword} className="auth-form">
          <label>
            Your name
            <input autoComplete="name" maxLength={120} minLength={2} name="name" required />
          </label>
          <label>
            Email address
            <input autoComplete="email" name="email" required type="email" />
          </label>
          <label>
            Password <span className="auth-field-hint">At least 10 characters</span>
            <input autoComplete="new-password" minLength={10} name="password" required type="password" />
          </label>
          <button className="button button-dark auth-submit" disabled={!configured} type="submit">Create account</button>
        </form>
        <div className="auth-links auth-links-center">
          <span>Already have an account? <Link href="/login">Sign in</Link></span>
        </div>
        <p className="auth-privacy-note">Your account is for your personal TRYVORA experience. We never use uploaded photos to train models.</p>
      </section>
    </div>
  );
}
