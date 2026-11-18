import type { Metadata } from "next";
import { ArrowDownRight, ArrowUpRight, Heart, ScanFace, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Our approach",
  description: "Learn about TRYVORA's personal approach to fashion discovery and virtual try-on.",
};

const principles = [
  {
    icon: Heart,
    title: "Style is personal",
    body: "There is no single right way to wear a piece. The best starting point is always your own point of view.",
  },
  {
    icon: ScanFace,
    title: "Technology, with care",
    body: "When virtual try-on is available, we will be clear about how it works, what it can do, and where its limits are.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy by design",
    body: "Personal photos deserve thoughtful handling. We will explain what is processed and let you decide what to share.",
  },
];

export default function AboutPage() {
  return (
    <div className="page-wrap">
      <section className="page-hero about-hero">
        <span className="eyebrow"><span className="eyebrow-line" /> A DIFFERENT KIND OF FIT</span>
        <h1>Technology should<br />make room for <em>you.</em></h1>
        <p>TRYVORA is a fashion discovery experience exploring a more personal relationship between what you find and how you feel in it.</p>
        <ArrowDownRight className="about-arrow" size={22} />
      </section>
      <section className="about-image">
        <Image
          alt="An editorial fashion portrait that celebrates individual style"
          fill
          priority
          sizes="100vw"
          src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1800&q=85"
        />
        <span>PERSONAL STYLE, WITHOUT A RULEBOOK</span>
      </section>
      <section className="about-story">
        <span className="eyebrow">THE IDEA BEHIND TRYVORA</span>
        <div>
          <h2>Less guessing.<br /><em>More imagining.</em></h2>
          <div className="story-copy">
            <p>Finding clothes online can feel like translating someone else’s idea of fit. TRYVORA is being built to make that experience more thoughtful: discover a considered fashion edit, then—when the real AI service is configured—explore how selected pieces might look on you.</p>
            <p>We are developing this product in phases. The catalogue in this preview is illustrative, and the virtual try-on experience is not yet enabled. We would rather be transparent about what is ready than make promises a demo cannot keep.</p>
            <Link className="text-link" href="/explore">Explore the sample edit <ArrowUpRight size={15} /></Link>
          </div>
        </div>
      </section>
      <section className="principles-section" id="privacy">
        <div className="section-heading">
          <div><span className="eyebrow">WHAT WE BELIEVE</span><h2>Good technology<br /><em>knows its place.</em></h2></div>
          <p>Useful, considered, and always in service of your own expression.</p>
        </div>
        <div className="principle-grid">
          {principles.map(({ icon: Icon, title, body }, index) => (
            <article className="principle-card" key={title}>
              <span className="principle-number">0{index + 1}</span>
              <Icon size={21} strokeWidth={1.4} />
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="about-cta">
        <span className="eyebrow">COME TAKE A LOOK</span>
        <h2>Find the pieces.<br /><em>Bring your perspective.</em></h2>
        <Link className="button button-dark" href="/explore">Explore TRYVORA <ArrowUpRight size={16} /></Link>
      </section>
    </div>
  );
}
