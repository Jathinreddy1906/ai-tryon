import type { Metadata } from "next";
import { ArrowDownRight } from "lucide-react";
import { CatalogExplorer } from "@/components/catalog-explorer";
import { getCatalogData } from "@/lib/catalog.server";

export const metadata: Metadata = {
  title: "Discover the edit",
  description: "Explore a considered sample edit of fashion by TRYVORA.",
};

export const dynamic = "force-dynamic";

type ExplorePageProps = {
  searchParams: Promise<{ category?: string }>;
};

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const data = await getCatalogData();
  const { category } = await searchParams;
  const initialCategory =
    data.mode !== "error" &&
    data.categories.some((item) => item.slug === category)
      ? category ?? ""
      : "";
  const hasSampleListings =
    data.mode === "sample" ||
    (data.mode === "database" && data.products.some((product) => product.isSample));

  return (
    <div className="page-wrap">
      <section className="page-hero explore-hero">
        <div>
          <span className="eyebrow"><span className="eyebrow-line" /> THE TRYVORA EDIT{hasSampleListings ? " · SAMPLE CATALOGUE" : ""}</span>
          <h1>Find a piece<br />that <em>feels like you.</em></h1>
        </div>
        <div className="page-hero-note">
          <span>{data.mode === "error" ? "—" : `01 — ${String(data.products.length).padStart(2, "0")}`}</span>
          <p>Thoughtful shapes, useful layers, and a few things that make you look twice.</p>
          <ArrowDownRight size={20} />
        </div>
      </section>
      <CatalogExplorer data={data} initialCategory={initialCategory} />
      {hasSampleListings && (
        <div className="catalog-disclaimer">
          <span className="eyebrow">A NOTE ABOUT THIS EDIT</span>
          <p>Sample listings are illustrative catalogue data, not live offers or items available for purchase.</p>
        </div>
      )}
    </div>
  );
}
