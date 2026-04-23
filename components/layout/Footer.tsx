import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-warm-800 text-warm-100 mt-auto">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 text-center">

          {/* Brand — always visible */}
          <div className="flex flex-col items-center gap-2">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <span className="text-xl">🍽️</span>
              <span className="text-lg font-bold text-white">Menü Günlüğü</span>
            </Link>
            <p className="text-xs sm:text-sm text-warm-300 whitespace-nowrap">
              Her gün yeni tarifler, her gün yeni lezzetler.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-4 mt-1">
              {/* Instagram */}
              <a
                href="https://www.instagram.com/menugunlugu/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-warm-400 hover:text-white hover:scale-110 hover:brightness-125 transition-all duration-150"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
                </svg>
              </a>

              {/* YouTube */}
              <a
                href="https://youtube.com/@menugunlugu"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="text-warm-400 hover:text-white hover:scale-110 hover:brightness-125 transition-all duration-150"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
                  <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor" stroke="none" />
                </svg>
              </a>

              {/* TikTok */}
              <a
                href="https://www.tiktok.com/@menugunlugu"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="text-warm-400 hover:text-white hover:scale-110 hover:brightness-125 transition-all duration-150"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.74a4.85 4.85 0 0 1-1.01-.05z" />
                </svg>
              </a>

              {/* X (Twitter) */}
              <a
                href="https://x.com/menugunlugu"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X"
                className="text-warm-400 hover:text-white hover:scale-110 hover:brightness-125 transition-all duration-150"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>

            {/* Mobil e-posta */}
            <a
              href="mailto:info@menugunlugu.com"
              className="md:hidden text-xs text-warm-400 hover:text-white transition-colors mt-1"
            >
              info@menugunlugu.com
            </a>
          </div>

          {/* Pages — desktop only */}
          <div className="hidden md:block">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Sayfalar
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-warm-300">
              <Link href="/tarifler" className="hover:text-white transition-colors">Tarifler</Link>
              <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
              <Link href="/menu-olustur" className="hover:text-white transition-colors">Menü Oluştur</Link>
              <Link href="/iletisim" className="hover:text-white transition-colors">İletişim</Link>
              <Link href="/dunun-menusu" className="hover:text-white transition-colors">Dünün Menüsü</Link>
              <Link href="/uye/panel" className="hover:text-white transition-colors">Hesabım</Link>
              <Link href="/gunun-menusu" className="hover:text-white transition-colors">Günün Menüsü</Link>
              <Link href="/hakkimizda" className="hover:text-white transition-colors">Hakkımızda</Link>
            </div>
          </div>

          {/* Categories — desktop only */}
          <div className="hidden md:block">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Kategoriler
            </h3>
            <ul className="space-y-2 text-sm text-warm-300">
              <li>
                <Link href="/tarifler/kategori/corbalar" className="hover:text-white transition-colors">
                  Çorbalar
                </Link>
              </li>
              <li>
                <Link href="/tarifler/kategori/ana-yemekler" className="hover:text-white transition-colors">
                  Ana Yemekler
                </Link>
              </li>
              <li>
                <Link href="/tarifler/kategori/yardimci-lezzetler" className="hover:text-white transition-colors">
                  Yardımcı Lezzetler
                </Link>
              </li>
              <li>
                <Link href="/tarifler/kategori/tatlilar" className="hover:text-white transition-colors">
                  Tatlılar
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-warm-700 mt-6 md:mt-10 pt-5 text-center text-sm text-warm-400">
          © {new Date().getFullYear()} Menü Günlüğü. Tüm hakları saklıdır.
        </div>
      </div>
    </footer>
  );
}
