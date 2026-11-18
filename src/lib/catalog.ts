export type CatalogCategory = {
  slug: string;
  name: string;
};

export type CatalogProduct = {
  id?: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  categorySlug: string;
  description: string;
  priceCents: number;
  currencyCode: string;
  image: string;
  imageAlt: string;
  colors: string[];
  sizes: string[];
  label: string;
  tags: string[];
  isSample: boolean;
};

export type CatalogData =
  | {
      mode: "sample" | "database";
      categories: CatalogCategory[];
      products: CatalogProduct[];
    }
  | {
      mode: "error";
      categories: [];
      products: [];
      message: string;
    };

export const catalogCategories: CatalogCategory[] = [
  { slug: "shirts", name: "Shirts" },
  { slug: "t-shirts", name: "T-shirts" },
  { slug: "jackets", name: "Jackets" },
  { slug: "trousers", name: "Trousers" },
  { slug: "jeans", name: "Jeans" },
  { slug: "dresses", name: "Dresses" },
  { slug: "traditional-clothing", name: "Traditional clothing" },
  { slug: "casual-wear", name: "Casual wear" },
  { slug: "formal-wear", name: "Formal wear" },
];

export const catalogProducts: CatalogProduct[] = [
  {
    slug: "the-sculpted-blazer",
    name: "The Sculpted Blazer",
    brand: "Atelier Form",
    category: "Jackets",
    categorySlug: "jackets",
    priceCents: 24800,
    currencyCode: "USD",
    image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1000&q=85",
    imageAlt: "Tailored neutral blazer on a hanger",
    colors: ["Oat", "Ink", "Olive"],
    sizes: ["XS", "S", "M", "L"],
    label: "The edit",
    tags: ["tailoring", "minimal", "layering"],
    isSample: true,
    description:
      "A softly structured layer with considered proportions and a clean, modern line. Made for the pieces already in your wardrobe.",
  },
  {
    slug: "everyday-cotton-shirt",
    name: "Everyday Cotton Shirt",
    brand: "Form & Field",
    category: "Shirts",
    categorySlug: "shirts",
    priceCents: 9600,
    currencyCode: "USD",
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1000&q=85",
    imageAlt: "Crisp white cotton shirt",
    colors: ["White", "Blue", "Sand"],
    sizes: ["XS", "S", "M", "L", "XL"],
    label: "Everyday icon",
    tags: ["cotton", "everyday", "minimal"],
    isSample: true,
    description:
      "An easy cotton staple with a relaxed drape, thoughtful detailing, and enough polish to move from weekday to weekend.",
  },
  {
    slug: "the-column-dress",
    name: "The Column Dress",
    brand: "Serein Studio",
    category: "Dresses",
    categorySlug: "dresses",
    priceCents: 18400,
    currencyCode: "USD",
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1000&q=85",
    imageAlt: "Minimal black evening dress",
    colors: ["Black", "Cocoa"],
    sizes: ["XS", "S", "M", "L"],
    label: "New season",
    tags: ["occasion", "minimal", "evening"],
    isSample: true,
    description:
      "An understated silhouette that lets the person wearing it take centre stage. A refined choice for evenings and everything after.",
  },
  {
    slug: "soft-structure-knit",
    name: "Soft Structure Knit",
    brand: "Northline",
    category: "Casual wear",
    categorySlug: "casual-wear",
    priceCents: 12800,
    currencyCode: "USD",
    image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1000&q=85",
    imageAlt: "Textured neutral knit sweater",
    colors: ["Cream", "Moss", "Charcoal"],
    sizes: ["S", "M", "L", "XL"],
    label: "Bestseller",
    tags: ["knitwear", "everyday", "layering"],
    isSample: true,
    description:
      "A tactile knit with a little structure and a lot of softness. Designed to layer lightly and wear on repeat.",
  },
  {
    slug: "wide-leg-tailored-trouser",
    name: "Wide-leg Tailored Trouser",
    brand: "Atelier Form",
    category: "Trousers",
    categorySlug: "trousers",
    priceCents: 15600,
    currencyCode: "USD",
    image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=85",
    imageAlt: "Tailored trousers in a warm neutral shade",
    colors: ["Stone", "Black", "Espresso"],
    sizes: ["XS", "S", "M", "L"],
    label: "Wardrobe staple",
    tags: ["tailoring", "minimal", "workwear"],
    isSample: true,
    description:
      "A fluid, high-rise trouser with a clean finish. Cut for movement and made to pair with almost everything.",
  },
  {
    slug: "weekend-denim-jacket",
    name: "Weekend Denim Jacket",
    brand: "Common Ground",
    category: "Jackets",
    categorySlug: "jackets",
    priceCents: 17200,
    currencyCode: "USD",
    image: "https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=1000&q=85",
    imageAlt: "Classic blue denim jacket",
    colors: ["Washed blue", "Ecru"],
    sizes: ["XS", "S", "M", "L", "XL"],
    label: "Just in",
    tags: ["denim", "everyday", "layering"],
    isSample: true,
    description:
      "A familiar layer, reworked with a relaxed fit and considered finishing. The one you reach for without thinking.",
  },
  {
    slug: "linen-day-dress",
    name: "Linen Day Dress",
    brand: "Serein Studio",
    category: "Dresses",
    categorySlug: "dresses",
    priceCents: 19800,
    currencyCode: "USD",
    image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=1000&q=85",
    imageAlt: "Light, flowing summer dress",
    colors: ["Ivory", "Terracotta"],
    sizes: ["XS", "S", "M", "L"],
    label: "Warm weather",
    tags: ["linen", "warm-weather", "casual"],
    isSample: true,
    description:
      "An airy linen dress made for long afternoons. An easy shape with quiet details that reward a closer look.",
  },
  {
    slug: "everyday-utility-shirt",
    name: "Everyday Utility Shirt",
    brand: "Northline",
    category: "Shirts",
    categorySlug: "shirts",
    priceCents: 11200,
    currencyCode: "USD",
    image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=1000&q=85",
    imageAlt: "Relaxed neutral button-up shirt",
    colors: ["Sage", "Chalk"],
    sizes: ["S", "M", "L", "XL"],
    label: "Easy layers",
    tags: ["utility", "everyday", "layering"],
    isSample: true,
    description:
      "A relaxed button-up in a versatile weight, designed to be worn open, tucked in, or exactly as you like.",
  },
];

export type CatalogFilters = {
  query?: string;
  category?: string;
  brand?: string;
  color?: string;
  currencyCode?: string;
  maxPrice?: number;
  sort?: string;
};

export function filterCatalog(
  products: CatalogProduct[],
  filters: CatalogFilters,
) {
  const query = filters.query?.trim().toLowerCase() ?? "";
  const filtered = products.filter((product) => {
    const matchesQuery =
      !query ||
      [
        product.name,
        product.brand,
        product.category,
        product.description,
        ...product.tags,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    const matchesCategory =
      !filters.category || product.categorySlug === filters.category;
    const matchesBrand = !filters.brand || product.brand === filters.brand;
    const matchesCurrency =
      !filters.currencyCode || product.currencyCode === filters.currencyCode;
    const matchesColor =
      !filters.color ||
      product.colors.some(
        (color) => color.toLowerCase() === filters.color?.toLowerCase(),
      );
    const matchesPrice =
      filters.maxPrice === undefined ||
      product.priceCents <= filters.maxPrice * 100;

    return (
      matchesQuery &&
      matchesCategory &&
      matchesBrand &&
      matchesCurrency &&
      matchesColor &&
      matchesPrice
    );
  });

  if (filters.sort === "price-low") {
    return filtered.sort((a, b) => a.priceCents - b.priceCents);
  }
  if (filters.sort === "price-high") {
    return filtered.sort((a, b) => b.priceCents - a.priceCents);
  }
  if (filters.sort === "name") {
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }
  return filtered;
}

export function formatPrice(priceCents: number, currencyCode: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(priceCents / 100);
}
