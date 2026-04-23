import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "İletişim",
  description: "Menü Günlüğü ile iletişime geçin.",
};

export const dynamic = "force-dynamic";

const SOCIAL_DEFAULTS = {
  instagram_url: "https://www.instagram.com/menugunlugu/",
  youtube_url:   "https://youtube.com/@menugunlugu",
  tiktok_url:    "https://www.tiktok.com/@menugunlugu",
  twitter_url:   "https://x.com/menugunlugu",
  contact_email: "info@menugunlugu.com",
};

export default async function IletisimPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("site_settings")
    .select("contact_email, instagram_url, youtube_url, tiktok_url, twitter_url")
    .eq("id", 1)
    .single();

  const s = { ...SOCIAL_DEFAULTS, ...settings };

  const socials = [
    {
      label: "Instagram",
      handle: "@menugunlugu",
      url: s.instagram_url,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
        </svg>
      ),
      color: "text-pink-500",
      bg: "bg-pink-50 border-pink-100",
    },
    {
      label: "YouTube",
      handle: "@menugunlugu",
      url: s.youtube_url,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
          <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor" stroke="none" />
        </svg>
      ),
      color: "text-red-500",
      bg: "bg-red-50 border-red-100",
    },
    {
      label: "TikTok",
      handle: "@menugunlugu",
      url: s.tiktok_url,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.74a4.85 4.85 0 0 1-1.01-.05z" />
        </svg>
      ),
      color: "text-warm-900",
      bg: "bg-warm-50 border-warm-200",
    },
    {
      label: "X",
      handle: "@menugunlugu",
      url: s.twitter_url,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      color: "text-warm-900",
      bg: "bg-warm-50 border-warm-200",
    },
  ];

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
            <a href={`mailto:${s.contact_email}`}
              className="text-brand-600 hover:text-brand-700 font-medium transition-colors">
              {s.contact_email}
            </a>
          </div>
        </div>

        {/* Sosyal Medya — 2x2 grid */}
        <div>
          <p className="font-semibold text-warm-900 mb-3 px-1">Sosyal Medya</p>
          <div className="grid grid-cols-2 gap-3">
            {socials.map((item) => (
              <a
                key={item.label}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-3 p-4 rounded-2xl border ${item.bg} hover:shadow-sm transition-shadow group`}
              >
                <span className={`${item.color} flex-shrink-0`}>{item.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs text-warm-500 font-medium">{item.label}</p>
                  <p className="text-sm font-semibold text-warm-800 group-hover:text-brand-700 transition-colors truncate">{item.handle}</p>
                </div>
              </a>
            ))}
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
