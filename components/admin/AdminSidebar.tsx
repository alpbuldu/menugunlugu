"use client";

import { useState } from "react";
import Link from "next/link";

interface NavLink { href: string; label: string; }

interface Props {
  links: NavLink[];
  pathname: string;
}

export default function AdminSidebar({ links, pathname }: Props) {
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
            className={[
              "flex items-center px-3 py-2 rounded-lg text-sm transition-colors",
              isActive
                ? "bg-brand-600 text-white font-medium"
                : "text-warm-300 hover:bg-warm-700 hover:text-white",
            ].join(" ")}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="px-5 py-4 border-t border-warm-700 space-y-2">
      <Link href="/" className="block text-xs text-warm-400 hover:text-warm-200 transition-colors">
        ← Siteye dön
      </Link>
      <form action="/api/admin/logout" method="POST">
        <button type="submit" className="text-xs text-warm-400 hover:text-red-300 transition-colors">
          Çıkış yap
        </button>
      </form>
    </div>
  );

  const header = (
    <div className="px-5 py-5 border-b border-warm-700 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2 group">
        <span className="text-xl">🍽️</span>
        <span className="font-bold text-white text-sm group-hover:text-brand-200 transition-colors">
          Menü Günlüğü
        </span>
      </Link>
      {/* Mobil kapat */}
      <button
        onClick={() => setOpen(false)}
        className="md:hidden text-warm-400 hover:text-white p-1"
        aria-label="Kapat"
      >
        ✕
      </button>
    </div>
  );

  return (
    <>
      {/* ── Mobil hamburger ── */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 w-9 h-9 rounded-lg bg-warm-900 text-white flex items-center justify-center shadow-lg"
        aria-label="Menü"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      {/* ── Mobil overlay ── */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Sidebar — masaüstü her zaman, mobil drawer ── */}
      <aside className={[
        "bg-warm-900 text-warm-100 flex flex-col shrink-0",
        // Masaüstü: kalıcı sidebar
        "md:w-56 md:sticky md:top-0 md:h-screen",
        // Mobil: fixed drawer, sağdan/soldan sürünme
        "fixed top-0 left-0 h-full w-64 z-50 transition-transform duration-300 md:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full",
      ].join(" ")}>
        {header}
        {nav}
        {footer}
      </aside>
    </>
  );
}
