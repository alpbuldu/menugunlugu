import Link from "next/link";
import { headers } from "next/headers";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s | Admin — Menü Günlüğü",
  },
};

const adminLinks = [
  { href: "/admin",             label: "📊  Genel Bakış" },
  { href: "/admin/menus",          label: "📅  Menüler" },
  { href: "/admin/menus/new",      label: "➕  Yeni Menü" },
  { href: "/admin/menus/import",   label: "📥  Toplu Menü Aktar" },
  { href: "/admin/menus/delete",   label: "🗑️  Toplu Menü Sil" },
  { href: "/admin/recipes",        label: "📋  Tarifler" },
  { href: "/admin/recipes/list",   label: "📄  Tarif Listesi" },
  { href: "/admin/recipes/new",    label: "✏️  Yeni Tarif" },
  { href: "/admin/recipes/import", label: "📥  Toplu İçe Aktar" },
  { href: "/admin/recipes/delete", label: "🗑️  Toplu Sil" },
  { href: "/admin/blog",        label: "📝  Blog" },
  { href: "/admin/blog/posts/new", label: "🖊️  Yeni Yazı" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read the pathname injected by middleware — lets us skip the sidebar
  // on the login page without needing a client-side hook.
  const headerStore = await headers();
  const pathname    = headerStore.get("x-pathname") ?? "";
  const isLoginPage = pathname === "/admin/login";

  // Login page: render without the admin chrome
  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Sidebar ───────────────────────────────────────── */}
      <aside className="w-56 bg-warm-900 text-warm-100 flex flex-col shrink-0 sticky top-0 h-screen">
        <div className="px-5 py-5 border-b border-warm-700">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-xl">🍽️</span>
            <span className="font-bold text-white text-sm group-hover:text-brand-200 transition-colors">
              Menü Günlüğü
            </span>
          </Link>
          <p className="text-xs text-warm-400 mt-1">Admin Paneli</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {adminLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
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

        <div className="px-5 py-4 border-t border-warm-700 space-y-2">
          <Link
            href="/"
            className="block text-xs text-warm-400 hover:text-warm-200 transition-colors"
          >
            ← Siteye dön
          </Link>
          <form action="/api/admin/logout" method="POST">
            <button
              type="submit"
              className="text-xs text-warm-400 hover:text-red-300 transition-colors"
            >
              Çıkış yap
            </button>
          </form>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────── */}
      <div className="flex-1 bg-warm-50 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-10">{children}</div>
      </div>
    </div>
  );
}
