import Link from "next/link";
import Navigation from "./Navigation";

export default function Header() {
  return (
    <header className="relative bg-brand-50 border-b border-warm-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-xl">🍽️</span>
            <span className="text-base font-bold text-warm-800 tracking-tight whitespace-nowrap">
              Menü Günlüğü
            </span>
          </Link>
          <Navigation />
        </div>
      </div>
    </header>
  );
}
