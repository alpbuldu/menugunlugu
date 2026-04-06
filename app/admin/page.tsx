import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Genel Bakış" };

const quickActions = [
  {
    href: "/admin/menus/new",
    label: "Yeni Menü Oluştur",
    icon: "📅",
    desc: "Bugün için menü belirle",
  },
  {
    href: "/admin/recipes/new",
    label: "Yeni Tarif Ekle",
    icon: "📝",
    desc: "Veritabanına tarif ekle",
  },
  {
    href: "/admin/menus",
    label: "Menüleri Yönet",
    icon: "🗂️",
    desc: "Taslak ve yayınlı menüler",
  },
  {
    href: "/admin/recipes",
    label: "Tarifleri Yönet",
    icon: "🍳",
    desc: "Tüm tarif listesi",
  },
  {
    href: "/admin/menus/import",
    label: "Toplu Menü Aktar",
    icon: "📆",
    desc: "Excel'den birden fazla günün menüsünü ekle",
  },
  {
    href: "/admin/recipes/import",
    label: "Toplu Tarif İçe Aktar",
    icon: "📥",
    desc: "Excel'den yapıştırarak toplu ekle",
  },
  {
    href: "/admin/recipes/delete",
    label: "Toplu Tarif Sil",
    icon: "🗑️",
    desc: "Birden fazla tarifi aynı anda sil",
  },
  {
    href: "/admin/blog",
    label: "Blog Yönetimi",
    icon: "✍️",
    desc: "Yazılar ve kategoriler",
  },
  {
    href: "/admin/blog/posts/new",
    label: "Yeni Blog Yazısı",
    icon: "🖊️",
    desc: "Yeni içerik oluştur",
  },
];

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-warm-900 mb-8">Genel Bakış</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="bg-white rounded-2xl border border-warm-100 shadow-sm p-6 hover:border-brand-300 hover:shadow-md transition-all group"
          >
            <div className="text-3xl mb-3">{action.icon}</div>
            <h2 className="font-semibold text-warm-900 group-hover:text-brand-700 transition-colors">
              {action.label}
            </h2>
            <p className="text-sm text-warm-400 mt-1">{action.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
