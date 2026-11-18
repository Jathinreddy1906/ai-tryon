import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice, type CatalogProduct } from "@/lib/catalog";

export function ProductCard({
  product,
  priority = false,
}: {
  product: CatalogProduct;
  priority?: boolean;
}) {
  return (
    <article className="product-card">
      <Link
        aria-label={`View ${product.name} by ${product.brand}`}
        className="product-image-link"
        href={`/products/${product.slug}`}
      >
        <div className="product-image">
          <Image
            alt={product.imageAlt}
            fill
            priority={priority}
            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 25vw"
            src={product.image}
          />
          <span className="product-label">{product.isSample ? "Sample listing" : product.label}</span>
          <span className="product-arrow" aria-hidden="true"><ArrowUpRight size={17} /></span>
        </div>
      </Link>
      <div className="product-copy">
        <div>
          <span className="product-brand">{product.brand}</span>
          <h3><Link href={`/products/${product.slug}`}>{product.name}</Link></h3>
        </div>
        <span className="product-price">{formatPrice(product.priceCents, product.currencyCode)}</span>
      </div>
      <span className="product-category">{product.category} · {product.colors.slice(0, 2).join(" / ")}</span>
    </article>
  );
}
