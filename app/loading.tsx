export default function Loading() {
  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-pulse">
      {/* Hero skeleton */}
      <div className="h-64 bg-warm-100 rounded-3xl mb-12" />
      {/* Cards row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl overflow-hidden bg-warm-100">
            <div className="h-36" />
            <div className="p-3 space-y-2">
              <div className="h-3 w-12 bg-warm-200 rounded" />
              <div className="h-4 w-3/4 bg-warm-200 rounded" />
            </div>
          </div>
        ))}
      </div>
      {/* Featured row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl overflow-hidden bg-warm-100">
            <div className="h-48" />
            <div className="p-5 space-y-2">
              <div className="h-3 w-16 bg-warm-200 rounded" />
              <div className="h-5 w-2/3 bg-warm-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
