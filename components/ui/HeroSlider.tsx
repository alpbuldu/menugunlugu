"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

export interface HeroSlide {
  id: string;
  imageUrl?: string | null;
  /** Optional overlay color tint on top of image (e.g. purple for Oyna) */
  tint?: string;
  badge: string;
  title: string;
  subtitle?: string;
  ctaLabel: string;
  ctaHref: string;
  /** Tailwind gradient fallback when no image */
  gradient: string;
}

interface Props {
  slides: HeroSlide[];
}

const INTERVAL = 5000;
const SWIPE_THRESHOLD = 50;

export default function HeroSlider({ slides }: Props) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const next = useCallback(() => setCurrent(c => (c + 1) % slides.length), [slides.length]);
  const prev = useCallback(() => setCurrent(c => (c - 1 + slides.length) % slides.length), [slides.length]);
  const goTo = (i: number) => setCurrent(i);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, INTERVAL);
    return () => clearInterval(id);
  }, [next, paused]);

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;
    if (dx > 0) prev(); else next();
  }

  if (!slides.length) return null;
  const slide = slides[current];

  return (
    <div
      className="relative w-full h-[56vw] min-h-[200px] max-h-[380px] overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Slides */}
      {slides.map((s, i) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-700 ${i === current ? "opacity-100 z-10" : "opacity-0 z-0"}`}
        >
          {s.imageUrl ? (
            <Image
              src={s.imageUrl}
              alt={s.title}
              fill
              className="object-cover object-center"
              sizes="100vw"
              priority={i === 0}
            />
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient}`} />
          )}
          {/* Colour tint for slides that reuse a food image (Oyna, Menü Önerileri) */}
          {s.tint && <div className={`absolute inset-0 ${s.tint}`} />}
          {/* Left-to-right dark gradient for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/30 to-black/5" />
          {/* Bottom dark gradient for dot area */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-20 h-full flex flex-col justify-end pb-8 sm:pb-10 px-5 sm:px-10 lg:px-16 max-w-[1100px]">
        <div key={current} className="animate-fade-in-up">
          <span className="inline-block bg-brand-500 text-white text-[8px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full uppercase tracking-wider mb-1 sm:mb-2">
            {slide.badge}
          </span>
          <h2 className="text-white font-extrabold text-xl sm:text-3xl lg:text-4xl leading-tight mb-3 sm:mb-2 max-w-lg whitespace-pre-line drop-shadow-lg">
            {slide.title}
          </h2>
          {slide.subtitle && (
            <p className="hidden sm:block text-white/75 text-sm mb-3 max-w-sm leading-relaxed">
              {slide.subtitle}
            </p>
          )}
          <Link
            href={slide.ctaHref}
            className="inline-flex items-center gap-1.5 bg-white text-brand-700 font-semibold text-xs sm:text-sm px-3.5 sm:px-5 py-1.5 sm:py-2.5 rounded-full hover:bg-brand-50 transition-colors"
          >
            {slide.ctaLabel}
            <span>→</span>
          </Link>
        </div>
      </div>

      {/* Prev / Next — desktop only */}
      <button onClick={prev}
        className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 items-center justify-center text-white text-xl transition-colors"
        aria-label="Önceki">‹</button>
      <button onClick={next}
        className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 items-center justify-center text-white text-xl transition-colors"
        aria-label="Sonraki">›</button>

      {/* Dot indicators */}
      <div className="absolute bottom-2.5 left-0 right-0 z-30 flex justify-center gap-1.5">
        {slides.map((_, i) => (
          <button key={i} onClick={() => goTo(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? "bg-white w-5" : "bg-white/45 w-1.5"}`}
            aria-label={`Slayt ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
