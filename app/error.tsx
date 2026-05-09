"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl mb-4">⚠️</p>
      <h1 className="text-2xl font-extrabold text-warm-900 mb-2">Bir şeyler ters gitti</h1>
      <p className="text-sm text-warm-400 mb-8 max-w-sm">
        Beklenmedik bir hata oluştu. Lütfen tekrar dene.
      </p>
      <div className="flex gap-3">
        <button onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-xl font-semibold text-sm hover:bg-brand-600 transition-colors">
          Tekrar Dene
        </button>
        <a href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-warm-200 text-warm-700 rounded-xl font-semibold text-sm hover:bg-warm-50 transition-colors">
          Ana Sayfaya Dön
        </a>
      </div>
    </div>
  );
}
