import type { Metadata } from "next";
import { ArrowLeft, ArrowUpRight, Check, Heart, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { removeProductFavorite, saveProductFavorite } from "@/app/favorites/actions";
import { ProductCard } from "@/components/product-card";
import { formatPrice } from "@/lib/catalog";
import { getCatalogData } from "@/lib/catalog.server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ favorite?: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const catalog = await getCatalogData();
  const product = catalog.mode === "error"
    ? undefined
    : catalog.products.find((item) => item.slug === slug);
  return { title: product?.name ?? "Piece details" };
}

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const [{ slug }, { favorite: favoriteNotice }] = await Promise.all([params, searchParams]);
  const catalog = await getCatalogData();

  if (catalog.mode === "error") {
    return (
      <div className="page-wrap product-detail-wrap">
        <section className="empty-state" role="alert">
          <span className="eyebrow">Catalogue unavailable</span>
          <h1>We could not load this piece.</h1>
          <p>{catalog.message}</p>
          <Link className="button button-outline" href="/explore">Back to the catalogue</Link>
        </section>
      </div>
    );
  }

  const product = catalog.products.find((item) => item.slug === slug);
  if (!product) notFound();

  const similarProducts = catalog.products
    .filter((item) => item.categorySlug === product.categorySlug && item.slug !== product.slug)
    .slice(0, 3);
  let userId: string | null = null;
  let isFavorite = false;
  let favoriteLoadError = false;

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
    const claimUserId = claimsData?.claims?.sub;

    if (!claimsError && typeof claimUserId === "string") {
      userId = claimUserId;
      if (!product.id) {
        favoriteLoadError = true;
      } else {
        const { data: savedProduct, error: favoriteError } = await supabase
          .from("user_favorites")
          .select("product_id")
          .eq("user_id", claimUserId)
          .eq("product_id", product.id)
          .maybeSingle();
        if (favoriteError) {
          console.error("Could not load product favorite state.", favoriteError);
          favoriteLoadError = true;
        } else {
          isFavorite = Boolean(savedProduct);
        }
      }
    }
  }

  return (
    <div className="page-wrap product-detail-wrap">
      <Link className="back-link" href="/explore"><ArrowLeft size={15} /> Back to the edit</Link>
      <div className="product-detail">
        <div className="detail-image">
          <Image
            alt={product.imageAlt}
            fill
            priority
            sizes="(max-width: 760px) 100vw, 58vw"
            src={product.image}
          />
          <span className="product-label">{product.isSample ? "Sample listing" : product.label}</span>
        </div>
        <section className="detail-copy">
          <span className="eyebrow">{product.brand} · {product.category}</span>
          <h1>{product.name}</h1>
          <span className="detail-price">
            {formatPrice(product.priceCents, product.currencyCode)}
            <small>{product.isSample ? `${product.currencyCode} · sample listing` : product.currencyCode}</small>
          </span>
          <p className="detail-description">{product.description}</p>
          {isSupabaseConfigured() && (
            <div className="favorite-control">
              {favoriteNotice === "saved" && <p className="auth-success" role="status">Saved to your favorites.</p>}
              {favoriteNotice === "removed" && <p className="auth-success" role="status">Removed from your favorites.</p>}
              {(favoriteNotice === "error" || favoriteNotice === "unavailable") && (
                <p className="auth-error" role="alert">
                  {favoriteNotice === "unavailable"
                    ? "This piece could not be saved. Check that the catalogue and favorites migrations are applied."
                    : "Your favorites could not be updated. Please try again."}
                </p>
              )}
              {favoriteLoadError ? (
                <p className="auth-error" role="alert">
                  Favorites are unavailable. Apply the saved-products migration and try again.
                </p>
              ) : userId && product.id ? (
                isFavorite ? (
                  <form action={removeProductFavorite}>
                    <input name="productId" type="hidden" value={product.id} />
                    <input name="source" type="hidden" value="product" />
                    <input name="slug" type="hidden" value={product.slug} />
                    <button className="button button-outline favorite-button" type="submit">
                      <Heart size={15} fill="currentColor" /> Remove from favorites
                    </button>
                  </form>
                ) : (
                  <form action={saveProductFavorite}>
                    <input name="slug" type="hidden" value={product.slug} />
                    <button className="button button-outline favorite-button" type="submit">
                      <Heart size={15} /> Save to favorites
                    </button>
                  </form>
                )
              ) : (
                <Link className="button button-outline favorite-button" href="/login">
                  <Heart size={15} /> Sign in to save this piece
                </Link>
              )}
            </div>
          )}
          <div className="detail-options">
            <div className="detail-option-heading"><span>Colour</span><span>{product.colors.length} considered shades</span></div>
            <div className="swatch-list">
              {product.colors.map((color, index) => (
                <span className="color-swatch" key={color}>
                  <i className={`swatch swatch-${index}`} aria-hidden="true" />
                  {color}
                </span>
              ))}
            </div>
          </div>
          <div className="detail-options">
            <div className="detail-option-heading"><span>Available sizes</span><span>Catalogue information</span></div>
            <div className="size-list">{product.sizes.map((size) => <span key={size}>{size}</span>)}</div>
          </div>
          {product.tags.length > 0 && (
            <div className="detail-options">
              <div className="detail-option-heading"><span>Style notes</span><span>Catalogue tags</span></div>
              <div className="size-list">{product.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
            </div>
          )}
          <Link className="button button-dark detail-tryon" href={`/try-on?product=${product.slug}`}>
            <Sparkles size={16} /> Explore in the AI studio <ArrowUpRight size={16} />
          </Link>
          <p className="detail-note"><Check size={14} /> AI try-on is currently unavailable in this preview. No generated result will be shown.</p>
          <p className="detail-footnote">
            {product.isSample ? "Illustrative sample listing" : "Catalogue listing"} · Not available for purchase
          </p>
        </section>
      </div>
      {similarProducts.length > 0 && (
        <section className="related-section">
          <div className="section-heading">
            <div><span className="eyebrow">MORE TO CONSIDER</span><h2>In the same <em>spirit.</em></h2></div>
            <Link className="text-link" href="/explore">Explore everything <ArrowUpRight size={15} /></Link>
          </div>
          <div className="product-grid">
            {similarProducts.map((item) => <ProductCard key={item.slug} product={item} />)}
          </div>
        </section>
      )}
    </div>
  );
}
