import Link from "next/link";

export default function RecipeNotFound() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
      <p className="text-6xl mb-6">🍽️</p>
      <h1 className="text-2xl font-bold text-warm-900 mb-3">
        Tarif bulunamadı
      </h1>
      <p className="text-warm-500 mb-8">
        Aradığınız tarif mevcut değil ya da kaldırılmış olabilir.
      </p>
      <Link
        href="/recipes"
        className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors"
      >
        ← Tariflere dön
      </Link>
    </div>
  );
}
