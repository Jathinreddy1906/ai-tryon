"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { filterCatalog, formatPrice, type CatalogData } from "@/lib/catalog";

const pageSize = 6;

type CatalogExplorerProps = {
  data: CatalogData;
  initialCategory?: string;
};

export function CatalogExplorer({
  data,
  initialCategory = "",
}: CatalogExplorerProps) {
  if (data.mode === "error") {
    return (
      <div className="catalog-layout">
        <section className="empty-state" role="alert">
          <span className="eyebrow">Catalogue unavailable</span>
          <h2>We could not load the edit.</h2>
          <p>{data.message}</p>
          <Link className="button button-outline" href="/explore">Try again</Link>
        </section>
      </div>
    );
  }

  return (
    <CatalogExplorerResults
      categories={data.categories}
      initialCategory={initialCategory}
      products={data.products}
      sampleMode={data.mode === "sample" || data.products.some((product) => product.isSample)}
    />
  );
}

type CatalogExplorerResultsProps = {
  categories: CatalogData["categories"];
  initialCategory: string;
  products: Extract<CatalogData, { mode: "sample" | "database" }>["products"];
  sampleMode: boolean;
};

function CatalogExplorerResults({
  categories,
  initialCategory,
  products,
  sampleMode,
}: CatalogExplorerResultsProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(() =>
    categories.some((item) => item.slug === initialCategory) ? initialCategory : "",
  );
  const [brand, setBrand] = useState("");
  const [color, setColor] = useState("");
  const currencies = useMemo(
    () => [...new Set(products.map((product) => product.currencyCode))].sort(),
    [products],
  );
  const [currencyCode, setCurrencyCode] = useState(currencies[0] ?? "USD");
  const activeCurrency = currencies.includes(currencyCode)
    ? currencyCode
    : currencies[0] ?? "USD";
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [sort, setSort] = useState("featured");
  const [page, setPage] = useState(1);
  const priceLimit = useMemo(() => {
    const highestPrice = Math.max(
      300,
      ...products
        .filter((product) => product.currencyCode === activeCurrency)
        .map((product) => Math.ceil(product.priceCents / 100)),
    );
    return Math.ceil(highestPrice / 50) * 50;
  }, [products, activeCurrency]);
  const selectedMaxPrice = maxPrice ?? priceLimit;

  const brands = useMemo(
    () => [...new Set(products.map((product) => product.brand))].sort(),
    [products],
  );
  const colors = useMemo(
    () => [...new Set(products.flatMap((product) => product.colors))].sort(),
    [products],
  );
  const filteredProducts = useMemo(
    () =>
      filterCatalog(products, {
        query,
        category,
        brand,
        color,
        currencyCode: activeCurrency,
        maxPrice: selectedMaxPrice,
        sort,
      }),
    [products, query, category, brand, color, activeCurrency, selectedMaxPrice, sort],
  );
  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const visibleProducts = filteredProducts.slice((page - 1) * pageSize, page * pageSize);

  function resetPage(action: () => void) {
    action();
    setPage(1);
  }

  function clearFilters() {
    setQuery("");
    setCategory("");
    setBrand("");
    setColor("");
    setMaxPrice(null);
    setSort("featured");
    setPage(1);
  }

  return (
    <div className="catalog-layout">
      <aside className="filter-panel" aria-label="Product filters">
        <div className="filter-heading">
          <span><SlidersHorizontal size={16} /> Refine the edit</span>
          <button className="text-button" onClick={clearFilters} type="button">Clear</button>
        </div>
        <label className="filter-label" htmlFor="category-filter">Category</label>
        <select
          id="category-filter"
          onChange={(event) => resetPage(() => setCategory(event.target.value))}
          value={category}
        >
          <option value="">All categories</option>
          {categories.map((item) => (
            <option key={item.slug} value={item.slug}>{item.name}</option>
          ))}
        </select>

        <label className="filter-label" htmlFor="brand-filter">Designer</label>
        <select
          id="brand-filter"
          onChange={(event) => resetPage(() => setBrand(event.target.value))}
          value={brand}
        >
          <option value="">All designers</option>
          {brands.map((name) => <option key={name}>{name}</option>)}
        </select>

        <label className="filter-label" htmlFor="color-filter">Colour</label>
        <select
          id="color-filter"
          onChange={(event) => resetPage(() => setColor(event.target.value))}
          value={color}
        >
          <option value="">Every colour</option>
          {colors.map((name) => <option key={name}>{name}</option>)}
        </select>

        <div className="price-filter">
          <label className="filter-label" htmlFor="price-filter">
            Price, up to <span>{formatPrice(selectedMaxPrice * 100, activeCurrency)}</span>
          </label>
          {currencies.length > 1 && (
            <label className="filter-label" htmlFor="currency-filter">
              Currency
              <select
                id="currency-filter"
                onChange={(event) => resetPage(() => {
                  setCurrencyCode(event.target.value);
                  setMaxPrice(null);
                })}
                value={activeCurrency}
              >
                {currencies.map((currency) => <option key={currency}>{currency}</option>)}
              </select>
            </label>
          )}
          <input
            id="price-filter"
            max={priceLimit}
            min="0"
            onChange={(event) => resetPage(() => setMaxPrice(Number(event.target.value)))}
            step="10"
            type="range"
            value={Math.min(selectedMaxPrice, priceLimit)}
          />
          <div className="range-labels">
            <span>{formatPrice(0, activeCurrency)}</span>
            <span>{formatPrice(priceLimit * 100, activeCurrency)}+</span>
          </div>
        </div>
        <p className="filter-note">
          {sampleMode
            ? "Illustrative sample listings are clearly marked."
            : "Only published pieces are shown in the public catalogue."}
        </p>
      </aside>

      <section className="catalog-results" aria-label="Fashion catalogue">
        <div className="catalog-toolbar">
          <label className="search-field" htmlFor="catalog-search">
            <Search aria-hidden="true" size={18} />
            <input
              id="catalog-search"
              aria-label="Search pieces, designers, and tags"
              onChange={(event) => resetPage(() => setQuery(event.target.value))}
              placeholder="Search pieces, designers..."
              type="search"
              value={query}
            />
          </label>
          <label className="sort-field" htmlFor="sort-filter">
            <span>Sort by</span>
            <select onChange={(event) => resetPage(() => setSort(event.target.value))} value={sort} id="sort-filter">
              <option value="featured">Featured</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
              <option value="name">Name</option>
            </select>
          </label>
        </div>
        <div className="results-count" aria-live="polite">
          {filteredProducts.length} {filteredProducts.length === 1 ? "piece" : "pieces"} in this edit
        </div>
        {visibleProducts.length ? (
          <div className="product-grid">
            {visibleProducts.map((product, index) => (
              <ProductCard key={product.slug} priority={page === 1 && index < 3} product={product} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span className="eyebrow">Nothing here, for now</span>
            <h2>Try a different search.</h2>
            <p>Adjust your filters to find another piece in the edit.</p>
            <button className="button button-outline" onClick={clearFilters} type="button">Reset filters</button>
          </div>
        )}
        {filteredProducts.length > pageSize && (
          <nav className="pagination" aria-label="Catalogue pages">
            <button disabled={page === 1} onClick={() => setPage((current) => current - 1)} type="button">Previous</button>
            <span>{String(page).padStart(2, "0")} <span aria-hidden="true">/</span> {String(pageCount).padStart(2, "0")}</span>
            <button disabled={page === pageCount} onClick={() => setPage((current) => current + 1)} type="button">Next</button>
          </nav>
        )}
      </section>
    </div>
  );
}
