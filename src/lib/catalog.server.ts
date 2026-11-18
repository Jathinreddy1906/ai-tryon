import "server-only";

import {
  catalogCategories,
  catalogProducts,
  type CatalogCategory,
  type CatalogData,
  type CatalogProduct,
} from "@/lib/catalog";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getCatalogData(): Promise<CatalogData> {
  if (!isSupabaseConfigured()) {
    return {
      mode: "sample",
      categories: catalogCategories,
      products: catalogProducts,
    };
  }

  const supabase = await createSupabaseServerClient();
  const [categoryResult, productResult] = await Promise.all([
    supabase
      .from("categories")
      .select("id, slug, name")
      .eq("is_active", true)
      .order("sort_order")
      .order("name"),
    supabase
      .from("products")
      .select(
        "slug, name, brand, description, category_id, image_url, image_alt, colors, available_sizes, price_cents, currency_code, tags, label, is_sample",
      )
      .eq("publication_status", "published")
      .order("sort_order")
      .order("name")
      .limit(500),
  ]);

  if (categoryResult.error || productResult.error) {
    console.error("Failed to load the TRYVORA catalogue.", {
      categories: categoryResult.error,
      products: productResult.error,
    });
    return catalogueError();
  }

  const categoryById = new Map(
    categoryResult.data.map((category) => [category.id, category]),
  );
  const missingCategory = productResult.data.find(
    (product) => !categoryById.has(product.category_id),
  );
  if (missingCategory) {
    console.error(
      `Published catalogue product "${missingCategory.slug}" has no active category.`,
    );
    return catalogueError();
  }

  const categories: CatalogCategory[] = categoryResult.data.map(
    ({ slug, name }) => ({ slug, name }),
  );
  const products: CatalogProduct[] = productResult.data.map((product) => {
    const category = categoryById.get(product.category_id);
    if (!category) {
      throw new Error(`Missing active category for "${product.slug}".`);
    }

    return {
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      category: category.name,
      categorySlug: category.slug,
      description: product.description,
      priceCents: product.price_cents,
      currencyCode: product.currency_code,
      image: product.image_url,
      imageAlt: product.image_alt,
      colors: product.colors,
      sizes: product.available_sizes,
      label: product.label,
      tags: product.tags,
      isSample: product.is_sample,
    };
  });

  return { mode: "database", categories, products };
}

function catalogueError(): CatalogData {
  return {
    mode: "error",
    categories: [],
    products: [],
    message:
      "The catalogue could not be loaded. Check the Supabase catalogue migration and try again.",
  };
}
