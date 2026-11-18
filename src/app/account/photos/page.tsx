import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PersonPhotoManager } from "@/components/person-photo-manager";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "My private photo",
  description: "Manage your private personal photo for future TRYVORA experiences.",
};

export const dynamic = "force-dynamic";

export default async function AccountPhotosPage() {
  if (!isSupabaseConfigured()) redirect("/login?error=setup");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || typeof data?.claims?.sub !== "string") redirect("/login");

  return (
    <div className="account-page">
      <section className="account-card account-photo-card">
        <Link className="back-link account-photo-back" href="/account">
          ← Back to my account
        </Link>
        <span className="eyebrow"><span className="eyebrow-line" /> PRIVATE PHOTO</span>
        <h1>Your photo,<br /><em>on your terms.</em></h1>
        <p className="auth-intro">
          Save one personal photo to your private account, or replace and delete it whenever you
          choose. Saving a photo does not start an AI try-on.
        </p>
        {isSupabaseAdminConfigured() ? (
          <PersonPhotoManager />
        ) : (
          <div className="auth-notice" role="status">
            Private photo storage is not configured for this deployment. Ask the administrator to
            apply the photo storage migration and set the server-only Supabase service role key.
          </div>
        )}
      </section>
    </div>
  );
}
