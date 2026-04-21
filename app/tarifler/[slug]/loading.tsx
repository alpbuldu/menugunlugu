export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 animate-pulse">
      <div className="h-4 w-24 bg-warm-100 rounded mb-4" />
      <div className="bg-white rounded-2xl border border-warm-100 overflow-hidden">
        {/* Hero */}
        <div className="h-72 bg-warm-100" />
        <div className="p-8 space-y-4">
          <div className="flex gap-2">
            <div className="h-6 w-16 bg-warm-100 rounded-full" />
            <div className="h-6 w-20 bg-warm-100 rounded-full" />
          </div>
          <div className="h-8 w-2/3 bg-warm-100 rounded" />
          <div className="h-4 w-full bg-warm-100 rounded" />
          <div className="h-4 w-4/5 bg-warm-100 rounded" />
          {/* Malzemeler */}
          <div className="mt-6 h-5 w-32 bg-warm-100 rounded" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-4 w-2/3 bg-warm-100 rounded" />
            ))}
          </div>
          {/* Yapılış */}
          <div className="mt-6 h-5 w-24 bg-warm-100 rounded" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 bg-warm-100 rounded" style={{ width: `${75 + (i % 2) * 15}%` }} />
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 h-20 bg-white rounded-2xl border border-warm-100" />
      <div className="mt-4 h-16 bg-white rounded-2xl border border-warm-100" />
      <div className="mt-4 h-40 bg-white rounded-2xl border border-warm-100" />
    </div>
  );
}
