import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand">
          <Link className="wordmark footer-wordmark" href="/">
            <span className="wordmark-mark" aria-hidden="true">T</span>
            <span>TRYVORA</span>
          </Link>
          <p>Your style. Your fit. Your try-on.</p>
        </div>
        <div className="footer-links">
          <div>
            <span className="footer-label">Explore</span>
            <Link href="/explore">The collection</Link>
            <Link href="/about">Our approach</Link>
            <Link href="/try-on">AI studio</Link>
            <Link href="/login">My account</Link>
          </div>
          <div>
            <span className="footer-label">Say hello</span>
            <Link href="/contact">Contact us</Link>
            <Link href="/about#privacy">Privacy first</Link>
            <Link href="/contact">Partnerships <ArrowUpRight size={13} /></Link>
          </div>
        </div>
        <div className="footer-note">
          <span className="eyebrow">A more considered way to discover.</span>
          <p>Try new perspectives on personal style, at your own pace.</p>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} TRYVORA Studio</span>
        <span>Thoughtful technology. Personal style.</span>
      </div>
    </footer>
  );
}
