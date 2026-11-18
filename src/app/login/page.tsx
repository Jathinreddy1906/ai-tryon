import type { Metadata } from "next";
import Link from "next/link";
import { signInWithGoogle, signInWithPassword } from "@/app/auth/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your TRYVORA account.",
};

const errorMessages: Record<string, string> = {
  invalid: "Enter a valid email address and password.",
  credentials: "We couldn't sign you in with those details. Please try again.",
  setup: "Supabase isn't configured yet. Add the project URL and publishable key to .env.local.",
  oauth: "Google sign-in isn't available. Check the Supabase Google provider settings.",
  callback: "That sign-in link has expired or could not be verified. Please try again.",
  "expired-link": "That secure link has expired. Request a new one and try again.",
};

type LoginPageProps = {
  searchParams: Promise<{ error?: string; notice?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, notice } = await searchParams;
  const configured = isSupabaseConfigured();

  return (
    <div className="auth-page">
      <section className="auth-card">
        <span className="eyebrow"><span className="eyebrow-line" /> YOUR TRYVORA ACCOUNT</span>
        <h1>Welcome <em>back.</em></h1>
        <p className="auth-intro">Sign in to revisit your personal style space.</p>

        {!configured && (
          <div className="auth-notice" role="status">
            Supabase is not configured in this environment. Authentication is disabled until you add the public project URL and publishable key.
          </div>
        )}
        {error && errorMessages[error] && <p className="auth-error" role="alert">{errorMessages[error]}</p>}
        {notice === "check-email" && <p className="auth-success" role="status">Check your inbox to verify your email address.</p>}

        <form action={signInWithPassword} className="auth-form">
          <label>
            Email address
            <input autoComplete="email" name="email" required type="email" />
          </label>
          <label>
            Password
            <input autoComplete="current-password" name="password" required type="password" />
          </label>
          <button className="button button-dark auth-submit" disabled={!configured} type="submit">Sign in</button>
        </form>

        <div className="auth-divider"><span>or</span></div>
        <form action={signInWithGoogle}>
          <button className="button button-outline auth-submit" disabled={!configured} type="submit">Continue with Google</button>
        </form>
        <div className="auth-links">
          <Link href="/forgot-password">Forgot password?</Link>
          <span>New to TRYVORA? <Link href="/signup">Create an account</Link></span>
        </div>
      </section>
    </div>
  );
}
