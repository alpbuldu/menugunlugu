import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "İletişim",
  description: "Menü Günlüğü ile iletişime geçin.",
};

export default function IletisimPage() {
  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-12 sm:py-16">

      <h1 className="text-3xl sm:text-4xl font-bold text-warm-900 mb-2">İletişim</h1>
      <p className="text-warm-500 mb-10">Sorularınız, önerileriniz veya iş birliği talepleriniz için bize ulaşabilirsiniz.</p>

      <div className="space-y-6">

        {/* Email */}
        <div className="flex items-start gap-4 p-5 bg-warm-50 rounded-2xl border border-warm-200">
          <span className="text-2xl">✉️</span>
          <div>
            <p className="font-semibold text-warm-900 mb-1">E-posta</p>
            <a href="mailto:hikayeliyemekler@hotmail.com"
              className="text-brand-600 hover:text-brand-700 font-medium transition-colors">
              hikayeliyemekler@hotmail.com
            </a>
          </div>
        </div>

        {/* Instagram */}
        <div className="flex items-start gap-4 p-5 bg-warm-50 rounded-2xl border border-warm-200">
          <span className="text-2xl">📸</span>
          <div>
            <p className="font-semibold text-warm-900 mb-1">Instagram</p>
            <a href="https://www.instagram.com/menugunlugu/"
              target="_blank" rel="noopener noreferrer"
              className="text-brand-600 hover:text-brand-700 font-medium transition-colors">
              @menugunlugu
            </a>
          </div>
        </div>

        {/* İş Birliği */}
        <div className="flex items-start gap-4 p-5 bg-brand-50 rounded-2xl border border-brand-200">
          <span className="text-2xl">🤝</span>
          <div>
            <p className="font-semibold text-warm-900 mb-1">İş Birliği & Reklam</p>
            <p className="text-warm-600 text-sm">
              Marka iş birlikleri, reklam ve sponsorluk talepleri için e-posta yoluyla iletişime geçebilirsiniz.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
