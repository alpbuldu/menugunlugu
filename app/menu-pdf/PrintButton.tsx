"use client";

export default function PrintButton() {
  return (
    <div className="no-print fixed bottom-6 right-6 z-50">
      <button
        onClick={() => window.print()}
        className="flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-600 text-white text-sm font-semibold shadow-lg hover:bg-brand-700 transition-colors"
      >
        🖨️ Yazdır / PDF Kaydet
      </button>
    </div>
  );
}
