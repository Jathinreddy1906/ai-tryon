import type { Metadata } from "next";
import { ArrowLeft, CircleAlert, Cpu, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { getCatalogData } from "@/lib/catalog.server";

export const metadata: Metadata = {
  title: "AI Studio",
  description: "TRYVORA's AI try-on studio is not yet available in this preview.",
};

export const dynamic = "force-dynamic";

type TryOnPageProps = {
  searchParams: Promise<{ product?: string }>;
};

export default async function TryOnPage({ searchParams }: TryOnPageProps) {
  const { product: slug } = await searchParams;
  const catalog = await getCatalogData();
  const product =
    slug && catalog.mode !== "error"
      ? catalog.products.find((item) => item.slug === slug)
      : undefined;

  return (
    <div className="page-wrap studio-wrap">
      <Link className="back-link" href={product ? `/products/${product.slug}` : "/explore"}><ArrowLeft size={15} /> {product ? "Back to piece" : "Back to the edit"}</Link>
      <section className="studio-unavailable">
        <div className="studio-mark"><Sparkles size={22} /></div>
        <span className="eyebrow">TRYVORA AI STUDIO</span>
        <h1>A more personal<br /><em>kind of fitting.</em></h1>
        <div className="availability-banner"><CircleAlert size={18} /><span><strong>AI try-on is not available yet.</strong><br />A real inference service has not been configured for this preview. No image will be generated or represented as a result.</span></div>
        <p className="studio-description">We are building this experience around a dedicated, licensed model and a careful image-processing pipeline. Until that service is ready, generation stays disabled.</p>
        <div className="studio-assurances">
          <span><Cpu size={15} /> No fabricated results</span>
          <span><ShieldCheck size={15} /> Private photo management is separate</span>
        </div>
        {product && <div className="selected-piece"><span className="eyebrow">YOUR SELECTED PIECE</span><strong>{product.name}</strong><span>{product.brand} · {product.category}</span></div>}
        <Link className="button button-dark" href="/explore">Continue exploring</Link>
      </section>
    </div>
  );
}
