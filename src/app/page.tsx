import { ArrowDown, ArrowRight, ArrowUpRight, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { MotionReveal } from "@/components/motion-reveal";
import { ProductCard } from "@/components/product-card";
import { getCatalogData } from "@/lib/catalog.server";

const categories = [
  {
    name: "The layers",
    categorySlug: "jackets",
    type: "Jackets",
    image: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=1000&q=85",
    alt: "A considered outerwear look",
    index: "01",
  },
  {
    name: "The everyday",
    categorySlug: "shirts",
    type: "Shirts",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1000&q=85",
    alt: "Friends discovering personal style",
    index: "02",
  },
  {
    name: "The occasion",
    categorySlug: "dresses",
    type: "Dresses",
    image: "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=1000&q=85",
    alt: "A flowing occasion dress",
    index: "03",
  },
];

const looks = [
  {
    name: "The quiet uniform",
    note: "Soft structure · everyday",
    image: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=1200&q=85",
    alt: "An understated neutral outfit idea",
  },
  {
    name: "A little after hours",
    note: "Clean lines · occasion",
    image: "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=1200&q=85",
    alt: "An evening fashion editorial look",
  },
  {
    name: "Off-duty, considered",
    note: "Easy layers · weekend",
    image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=85",
    alt: "A relaxed personal style idea",
  },
];

export const dynamic = "force-dynamic";

export default async function Home() {
  const catalog = await getCatalogData();
  const products = catalog.mode === "error" ? [] : catalog.products;
  const hasSampleListings =
    catalog.mode === "sample" ||
    (catalog.mode === "database" && products.some((product) => product.isSample));

  return (
    <>
      <section className="hero-section">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-line" /> A NEW WAY TO SEE YOUR STYLE</div>
          <h1>Find your fit.<br /><em>Feel the</em> possibility.</h1>
          <p>Discover pieces that speak to you — and explore a more personal way to imagine them in your world.</p>
          <div className="hero-actions">
            <Link className="button button-dark" href="/explore">Explore the edit <ArrowUpRight size={16} /></Link>
            <Link className="text-link" href="/about">How TRYVORA works <ArrowRight size={15} /></Link>
          </div>
          <div className="hero-note">
            <span className="hero-note-icon"><Sparkles size={16} /></span>
            <span>Thoughtful discovery,<br /><strong>made more personal.</strong></span>
          </div>
          <span className="hero-index">01 / 04</span>
        </div>
        <div className="hero-image-wrap">
          <Image
            alt="A fashion editorial portrait in soft afternoon light"
            className="hero-image"
            fill
            priority
            sizes="(max-width: 760px) 100vw, 55vw"
            src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1600&q=90"
          />
          <div className="hero-image-caption">
            <span>THE AUTUMN EDIT</span>
            <span>Quiet forms. Lasting feeling.</span>
          </div>
          <Link className="hero-round-link" href="/try-on" aria-label="Visit the TRYVORA studio">
            <ArrowUpRight size={22} />
          </Link>
        </div>
        <a className="scroll-cue" href="#discover"><ArrowDown size={14} /> SCROLL TO DISCOVER</a>
      </section>

      <section className="intro-band" id="discover">
        <span className="eyebrow">STYLE, IN YOUR OWN FRAME</span>
        <p>Fashion is personal.<br /><em>Discovery should be, too.</em></p>
        <span className="intro-side-note">A more considered way<br />to find what feels like you.</span>
      </section>

      <section className="section-block collection-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">A FEW GOOD THINGS</span>
            <h2>Pieces with <em>presence.</em></h2>
          </div>
          <Link className="text-link" href="/explore">View the full edit <ArrowRight size={15} /></Link>
        </div>
        {hasSampleListings && (
          <p className="sample-note">Sample catalogue listings are clearly marked and are not available for purchase.</p>
        )}
        {catalog.mode === "error" ? (
          <div className="empty-state" role="alert">
            <h2>The edit is taking a moment.</h2>
            <p>{catalog.message}</p>
            <Link className="button button-outline" href="/explore">Open the catalogue</Link>
          </div>
        ) : products.length ? (
          <div className="product-grid featured-grid">
            {products.slice(0, 4).map((product, index) => (
              <ProductCard key={product.slug} priority={index === 0} product={product} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h2>The catalogue is ready for its first pieces.</h2>
            <p>No published products are available yet.</p>
          </div>
        )}
      </section>

      <section className="category-section">
        <div className="section-heading category-heading">
          <div>
            <span className="eyebrow">A STARTING POINT</span>
            <h2>Where will you <em>begin?</em></h2>
          </div>
          <p>Move through a considered selection, shaped around how you like to dress.</p>
        </div>
        <div className="category-grid">
          {categories.map((category) => (
            <MotionReveal delay={Number(category.index) * 0.07} key={category.type}>
              <Link className="category-card" href={`/explore?category=${encodeURIComponent(category.categorySlug)}`}>
                <Image alt={category.alt} fill sizes="(max-width: 680px) 100vw, 33vw" src={category.image} />
                <span className="category-index">{category.index} / 03</span>
                <span className="category-card-copy">
                  <span>{category.type.toUpperCase()}</span>
                  <strong>{category.name}</strong>
                  <span className="category-arrow" aria-hidden="true"><ArrowUpRight size={17} /></span>
                </span>
              </Link>
            </MotionReveal>
          ))}
        </div>
      </section>

      <section className="looks-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">IDEAS TO MAKE YOUR OWN</span>
            <h2>Looks with a little <em>feeling.</em></h2>
          </div>
          <span className="sample-note">Illustrative style concepts · not shoppable outfits</span>
        </div>
        <div className="looks-grid">
          {looks.map((look, index) => (
            <Link className={`look-card look-card-${index + 1}`} href="/explore" key={look.name}>
              <Image alt={look.alt} fill sizes="(max-width: 700px) 100vw, 33vw" src={look.image} />
              <span className="look-card-copy">
                <span>{look.note}</span>
                <strong>{look.name}</strong>
                <span className="look-arrow" aria-hidden="true"><ArrowUpRight size={17} /></span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="how-section">
        <div className="how-image">
          <Image
            alt="A fashion portrait with an understated, natural palette"
            fill
            sizes="(max-width: 800px) 100vw, 48vw"
            src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=85"
          />
          <span className="image-stamp">STYLE, REIMAGINED<br />AT YOUR PACE</span>
        </div>
        <div className="how-copy">
          <span className="eyebrow">A LITTLE MORE YOU</span>
          <h2>See the idea.<br /><em>Then make it yours.</em></h2>
          <p>TRYVORA brings personal style and emerging technology into the same conversation. Browse a thoughtful edit, then explore the possibilities with an AI try-on experience when it becomes available.</p>
          <div className="steps-list">
            <div><span>01</span><p><strong>Find a piece</strong><br />Explore shapes, textures, and ideas.</p></div>
            <div><span>02</span><p><strong>Bring your perspective</strong><br />Your style is the starting point.</p></div>
            <div><span>03</span><p><strong>Imagine what’s next</strong><br />Try-on will be clearly marked when enabled.</p></div>
          </div>
          <Link className="button button-outline" href="/try-on">Visit the AI studio <ArrowUpRight size={16} /></Link>
        </div>
      </section>

      <section className="quote-section">
        <span className="eyebrow">ILLUSTRATIVE SAMPLE TESTIMONIALS · NOT REAL CUSTOMER REVIEWS</span>
        <div className="testimonial-grid">
          <article className="testimonial-card">
            <blockquote>“I like the idea of discovering clothes in a way that feels a little more like <em>me.</em>”</blockquote>
            <span className="quote-credit">ILLUSTRATIVE SAMPLE QUOTE · NOT A CUSTOMER REVIEW</span>
          </article>
          <article className="testimonial-card">
            <blockquote>“A thoughtful edit makes room for curiosity, without telling you what your style should <em>be.</em>”</blockquote>
            <span className="quote-credit">ILLUSTRATIVE SAMPLE QUOTE · NOT A CUSTOMER REVIEW</span>
          </article>
        </div>
      </section>

      <section className="closing-cta">
        <div>
          <span className="eyebrow">YOUR NEXT CHAPTER, WELL DRESSED</span>
          <h2>Good style starts<br />with <em>curiosity.</em></h2>
        </div>
        <Link className="button button-light" href="/explore">Find your next favourite <ArrowRight size={16} /></Link>
      </section>
    </>
  );
}
