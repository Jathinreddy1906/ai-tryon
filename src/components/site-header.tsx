"use client";

import { Menu, SunMoon, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/explore", label: "Discover" },
  { href: "/about", label: "Our approach" },
  { href: "/contact", label: "Contact" },
  { href: "/login", label: "Sign in" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("tryvora-theme");
    const isDark = savedTheme === "dark";
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  function toggleTheme() {
    const nextMode = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", nextMode);
    window.localStorage.setItem("tryvora-theme", nextMode ? "dark" : "light");
  }

  return (
    <header className="site-header">
      <div className="announcement">
        <span>THE FUTURE OF FITTING, FOUND IN YOUR OWN FRAME</span>
        <Link href="/about">Get to know TRYVORA <span aria-hidden="true">↗</span></Link>
      </div>
      <div className="nav-wrap">
        <Link className="wordmark" href="/" aria-label="TRYVORA home">
          <span className="wordmark-mark" aria-hidden="true">T</span>
          <span>TRYVORA</span>
        </Link>

        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map((link) => (
            <Link
              aria-current={pathname === link.href ? "page" : undefined}
              className={pathname === link.href ? "nav-link active" : "nav-link"}
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="nav-actions">
          <button
            aria-label="Toggle color theme"
            className="icon-button theme-toggle"
            onClick={toggleTheme}
            type="button"
          >
            <SunMoon size={18} />
          </button>
          <Link className="nav-cta" href="/explore">
            Find your fit <span aria-hidden="true">↗</span>
          </Link>
          <button
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="icon-button menu-toggle"
            onClick={() => setMenuOpen((open) => !open)}
            type="button"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {menuOpen && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {links.map((link) => (
            <Link href={link.href} key={link.href} onClick={() => setMenuOpen(false)}>
              {link.label}
            </Link>
          ))}
          <Link href="/explore" onClick={() => setMenuOpen(false)}>Explore the edit <span aria-hidden="true">↗</span></Link>
        </nav>
      )}
    </header>
  );
}
