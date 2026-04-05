export default function Loading() {
  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse">
      <div className="h-8 w-32 bg-warm-100 rounded mb-8" />
      {/* Filter pills */}
      <div className="flex gap-2 mb-10">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-9 w-24 bg-warm-100 rounded-full" />
        ))}
      </div>
      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-2xl overflow-hidden bg-warm-100">
            <div className="h-48" />
            <div className="p-5 space-y-2">
              <div className="h-3 w-16 bg-warm-200 rounded" />
              <div className="h-5 w-3/4 bg-warm-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
