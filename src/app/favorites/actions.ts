"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const productSlugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const productIdSchema = z.string().uuid();

export async function saveProductFavorite(formData: FormData) {
  const parsedSlug = productSlugSchema.safeParse(formData.get("slug"));
  if (!parsedSlug.success) redirect("/explore");
  const slug = parsedSlug.data;
  if (!isSupabaseConfigured()) redirect(`/products/${slug}?favorite=unavailable`);

  const supabase = await createSupabaseServerClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || typeof userId !== "string") redirect("/login");

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id")
    .eq("slug", slug)
    .eq("publication_status", "published")
    .maybeSingle();
  if (productError || !product) {
    if (productError) console.error("Could not verify product before saving favorite.", productError);
    redirect(`/products/${slug}?favorite=unavailable`);
  }

  const { error } = await supabase
    .from("user_favorites")
    .upsert(
      { user_id: userId, product_id: product.id },
      { onConflict: "user_id,product_id", ignoreDuplicates: true },
    );
  if (error) {
    console.error("Could not save product favorite.", error);
    redirect(`/products/${slug}?favorite=error`);
  }

  revalidatePath("/account");
  revalidatePath(`/products/${slug}`);
  redirect(`/products/${slug}?favorite=saved`);
}

export async function removeProductFavorite(formData: FormData) {
  const parsedId = productIdSchema.safeParse(formData.get("productId"));
  if (!parsedId.success) redirect("/account?error=favorite-remove");

  const source = formData.get("source");
  const parsedSlug = source === "product"
    ? productSlugSchema.safeParse(formData.get("slug"))
    : null;
  if (source !== "account" && source !== "product") redirect("/account?error=favorite-remove");
  if (parsedSlug && !parsedSlug.success) redirect("/account?error=favorite-remove");
  if (!isSupabaseConfigured()) redirect("/login?error=setup");

  const supabase = await createSupabaseServerClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || typeof userId !== "string") redirect("/login");

  const { error } = await supabase
    .from("user_favorites")
    .delete()
    .eq("user_id", userId)
    .eq("product_id", parsedId.data);
  if (error) {
    console.error("Could not remove product favorite.", error);
    if (source === "product" && parsedSlug?.success) {
      redirect(`/products/${parsedSlug.data}?favorite=error`);
    }
    redirect("/account?error=favorite-remove");
  }

  revalidatePath("/account");
  if (source === "product" && parsedSlug?.success) {
    revalidatePath(`/products/${parsedSlug.data}`);
    redirect(`/products/${parsedSlug.data}?favorite=removed`);
  }
  redirect("/account?favorite=removed");
}
