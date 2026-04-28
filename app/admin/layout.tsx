import { headers } from "next/headers";
import type { Metadata } from "next";
import AdminSidebar from "@/components/admin/AdminSidebar";

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
  { href: "/admin/blog",           label: "📝  Blog" },
  { href: "/admin/blog/posts/new", label: "🖊️  Yeni Yazı" },
  { href: "/admin/onay",           label: "✅  İçerik Onayı" },
  { href: "/admin/yorumlar",       label: "💬  Yorumlar" },
  { href: "/admin/yazarlar",       label: "👥  Yazarlar" },
  { href: "/admin/post-olustur",    label: "🖼️  Post Oluştur" },
  { href: "/admin/reklamlar",      label: "📢  Reklamlar" },
  { href: "/admin/profil",         label: "👤  Admin Profili" },
  { href: "/admin/site-ayarlari",  label: "⚙️  Site Ayarları" },
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
    <div className="h-screen flex overflow-hidden">
      <AdminSidebar links={adminLinks} pathname={pathname} />

      {/* ── Main content ──────────────────────────────────── */}
      <div className="flex-1 bg-warm-50 overflow-y-auto">
        {/* Mobil'de hamburger için boşluk */}
        <div className="md:hidden h-12" />
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-10">{children}</div>
      </div>
    </div>
  );
}
