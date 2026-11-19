import type { Metadata } from "next";
import { ArrowLeft, ArrowUpRight, Check, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { formatPrice } from "@/lib/catalog";
import { getCatalogData } from "@/lib/catalog.server";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
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

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
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
          <p className="detail-note"><Check size={14} /> AI try-on requires a live catalogue item, a signed-in adult, and explicit consent. Preview results are not fit guarantees.</p>
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
