export default function Loading() {
  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse">
      <div className="h-8 w-48 bg-warm-100 rounded mb-2" />
      <div className="h-4 w-32 bg-warm-100 rounded mb-10" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl overflow-hidden bg-warm-100">
            <div className="h-52" />
            <div className="p-5 space-y-2">
              <div className="h-3 w-20 bg-warm-200 rounded" />
              <div className="h-6 w-2/3 bg-warm-200 rounded" />
              <div className="h-4 w-20 bg-warm-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
