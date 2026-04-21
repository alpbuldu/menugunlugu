export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 animate-pulse">
      <div className="h-4 w-16 bg-warm-100 rounded mb-4" />
      <div className="bg-white rounded-2xl border border-warm-100 overflow-hidden">
        {/* Hero */}
        <div className="h-72 bg-warm-100" />
        <div className="p-8 space-y-4">
          <div className="h-3 w-20 bg-warm-100 rounded-full" />
          <div className="h-8 w-3/4 bg-warm-100 rounded" />
          <div className="h-3 w-24 bg-warm-100 rounded" />
          <div className="space-y-2 pt-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 bg-warm-100 rounded" style={{ width: `${70 + (i % 3) * 10}%` }} />
            ))}
          </div>
        </div>
      </div>
      {/* Yazar kartı */}
      <div className="mt-4 h-20 bg-white rounded-2xl border border-warm-100" />
      {/* Puan */}
      <div className="mt-4 h-16 bg-white rounded-2xl border border-warm-100" />
      {/* Yorumlar */}
      <div className="mt-4 h-40 bg-white rounded-2xl border border-warm-100" />
    </div>
  );
}
