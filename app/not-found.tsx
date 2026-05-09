import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl mb-4">🍽️</p>
      <h1 className="text-4xl font-extrabold text-warm-900 mb-2">404</h1>
      <p className="text-lg font-semibold text-warm-700 mb-1">Sayfa bulunamadı</p>
      <p className="text-sm text-warm-400 mb-8 max-w-sm">
        Aradığın içerik kaldırılmış, taşınmış ya da hiç var olmamış olabilir.
      </p>
      <Link href="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-xl font-semibold text-sm hover:bg-brand-600 transition-colors">
        Ana Sayfaya Dön
      </Link>
    </div>
  );
}
