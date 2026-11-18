import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "My account",
  description: "Your private TRYVORA account.",
};

type AccountPageProps = {
  searchParams: Promise<{ error?: string; notice?: string }>;
};

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const { error, notice } = await searchParams;
  if (!isSupabaseConfigured()) {
    return (
      <div className="auth-page">
        <section className="auth-card">
          <span className="eyebrow">MY TRYVORA</span>
          <h1>Your space is <em>waiting.</em></h1>
          <div className="auth-notice" role="status">Connect a Supabase project to enable user accounts. No account data is stored in this preview.</div>
          <Link className="button button-outline" href="/login">Go to sign in</Link>
        </section>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || typeof userId !== "string") redirect("/login");

  const [{ data: profile, error: profileError }, { data: userData, error: userError }] =
    await Promise.all([
      supabase.from("profiles").select("full_name, created_at").eq("id", userId).maybeSingle(),
      supabase.auth.getUser(),
    ]);

  return (
    <div className="account-page">
      <section className="account-card">
        <span className="eyebrow"><span className="eyebrow-line" /> YOUR PRIVATE SPACE</span>
        <h1>Good to see you{profile?.full_name ? `, ${profile.full_name}` : ""}.</h1>
        <p className="account-email">{userError ? "Account email could not be loaded." : userData.user?.email}</p>
        {profileError && (
          <div className="auth-error" role="alert">
            Your account is verified, but the profile could not be loaded. Apply the Supabase migration and try again.
          </div>
        )}
        {error === "sign-out" && <p className="auth-error" role="alert">We could not sign you out. Please try again.</p>}
        {notice === "password-updated" && <p className="auth-success" role="status">Your password has been updated.</p>}
        <div className="account-status">
          <span>Account status</span><strong>Private profile</strong>
          <span>Saved looks</span><strong>Available in a later phase</strong>
          <span>Try-on</span><strong>Unavailable until a real model is configured</strong>
        </div>
        <div className="account-actions">
          <Link className="button button-outline" href="/explore">Explore the edit</Link>
          <Link className="button button-outline" href="/account/photos">Manage private photo</Link>
          <form action={signOut}>
            <button className="button button-dark" type="submit">Sign out</button>
          </form>
        </div>
      </section>
    </div>
  );
}
