import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut, updatePreferences, updateProfile } from "@/app/auth/actions";
import { removeProductFavorite } from "@/app/favorites/actions";
import { getCatalogData } from "@/lib/catalog.server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "My account",
  description: "Your private TRYVORA account.",
};

type AccountPageProps = {
  searchParams: Promise<{ error?: string; notice?: string }>;
};

function PreferenceFields({
  name,
  title,
  values,
  options,
}: {
  name: string;
  title: string;
  values: string[];
  options: string[];
}) {
  return (
    <fieldset className="preference-fieldset">
      <legend>{title}</legend>
      <div className="preference-options">
        {options.map((option) => (
          <label key={option}>
            <input
              defaultChecked={values.includes(option)}
              name={name}
              type="checkbox"
              value={option}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

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

  const [
    { data: profile, error: profileError },
    { data: preferences, error: preferencesError },
    { data: favorites, error: favoritesError },
    { data: userData, error: userError },
  ] =
    await Promise.all([
      supabase.from("profiles").select("full_name, created_at").eq("id", userId).maybeSingle(),
      supabase
        .from("user_preferences")
        .select("preferred_styles, preferred_colors, preferred_categories")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("user_favorites")
        .select("product_id, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase.auth.getUser(),
    ]);
  if (favoritesError) console.error("Could not load saved TRYVORA products.", favoritesError);
  const catalog = favoritesError ? null : await getCatalogData();
  const favoriteIds = new Set((favorites ?? []).map((favorite) => favorite.product_id));
  const savedProducts =
    catalog && catalog.mode !== "error"
      ? catalog.products.filter(
          (product): product is typeof product & { id: string } =>
            Boolean(product.id && favoriteIds.has(product.id)),
        )
      : [];

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
        {notice === "profile-updated" && <p className="auth-success" role="status">Your profile has been updated.</p>}
        {notice === "preferences-updated" && <p className="auth-success" role="status">Your style preferences have been saved.</p>}
        {notice === "favorite-removed" && <p className="auth-success" role="status">Removed from your favorites.</p>}
        {error === "profile-invalid" && <p className="auth-error" role="alert">Enter a valid profile name.</p>}
        {error === "profile-update" && <p className="auth-error" role="alert">Your profile could not be updated.</p>}
        {error === "preferences-update" && <p className="auth-error" role="alert">Your style preferences could not be saved.</p>}
        {error === "favorite-remove" && <p className="auth-error" role="alert">The favorite could not be removed. Please try again.</p>}
        <div className="account-status">
          <span>Account status</span><strong>Private profile</strong>
          <span>Saved products</span><strong>{favoritesError ? "Unavailable" : `${favorites?.length ?? 0} favorites`}</strong>
          <span>Try-on</span><strong>Unavailable until a real model is configured</strong>
        </div>
        <div className="account-actions">
          <Link className="button button-outline" href="/explore">Explore the edit</Link>
          <Link className="button button-outline" href="/account/photos">Manage private photo</Link>
          <form action={signOut}>
            <button className="button button-dark" type="submit">Sign out</button>
          </form>
        </div>
        <section className="account-preferences">
          <h2>Saved pieces</h2>
          {favoritesError ? (
            <p className="auth-error" role="alert">Apply the saved-products migration to use favorites.</p>
          ) : catalog?.mode === "error" ? (
            <p className="auth-error" role="alert">{catalog.message}</p>
          ) : savedProducts.length ? (
            <ul className="saved-product-list">
              {savedProducts.map((product) => (
                <li key={product.id}>
                  <Link href={`/products/${product.slug}`}>
                    <strong>{product.name}</strong>
                    <span>{product.brand} · {product.category}</span>
                  </Link>
                  <form action={removeProductFavorite}>
                    <input name="productId" type="hidden" value={product.id} />
                    <input name="source" type="hidden" value="account" />
                    <button className="button button-outline" type="submit">Remove</button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <p className="account-empty">Your saved pieces will appear here. Explore the catalogue and save a favorite.</p>
          )}
        </section>
        <form className="account-preferences" action={updateProfile}>
          <h2>Profile details</h2>
          <label>
            Display name
            <input name="name" maxLength={120} defaultValue={profile?.full_name ?? ""} />
          </label>
          <button className="button button-outline" type="submit">Save profile</button>
        </form>
        <form className="account-preferences" action={updatePreferences}>
          <h2>Style preferences</h2>
          {preferencesError && <p className="auth-error" role="alert">Apply the preferences migration to enable saved style settings.</p>}
          <PreferenceFields
            name="styles"
            title="Preferred styles"
            values={preferences?.preferred_styles ?? []}
            options={["Minimal", "Classic", "Streetwear", "Romantic", "Sport"]}
          />
          <PreferenceFields
            name="colors"
            title="Preferred colors"
            values={preferences?.preferred_colors ?? []}
            options={["Black", "White", "Beige", "Blue", "Green", "Red"]}
          />
          <PreferenceFields
            name="categories"
            title="Preferred categories"
            values={preferences?.preferred_categories ?? []}
            options={["Tops", "Dresses", "Outerwear", "Bottoms", "Accessories"]}
          />
          <button className="button button-outline" type="submit">Save preferences</button>
        </form>
      </section>
    </div>
  );
}
