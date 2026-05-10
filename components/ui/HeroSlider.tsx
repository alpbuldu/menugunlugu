"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";

export interface HeroSlide {
  id: string;
  imageUrl?: string | null;
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

export default function HeroSlider({ slides }: Props) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent(c => (c + 1) % slides.length);
  }, [slides.length]);

  const prev = () => setCurrent(c => (c - 1 + slides.length) % slides.length);
  const goTo = (i: number) => setCurrent(i);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, INTERVAL);
    return () => clearInterval(id);
  }, [next, paused]);

  if (!slides.length) return null;
  const slide = slides[current];

  return (
    <div
      className="relative w-full h-[52vw] min-h-[220px] max-h-[540px] overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
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
              className="object-cover"
              sizes="100vw"
              priority={i === 0}
            />
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient}`} />
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/5" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-20 h-full flex flex-col justify-end pb-10 sm:pb-14 px-5 sm:px-10 lg:px-16 max-w-[1100px]">
        <div
          key={current}
          className="animate-fade-in-up"
        >
          <span className="inline-block bg-brand-500 text-white text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider mb-2 sm:mb-3">
            {slide.badge}
          </span>
          <h2 className="text-white font-extrabold text-xl sm:text-4xl lg:text-5xl leading-tight mb-1 sm:mb-2 max-w-xl whitespace-pre-line drop-shadow-lg">
            {slide.title}
          </h2>
          {slide.subtitle && (
            <p className="text-white/75 text-xs sm:text-base mb-3 sm:mb-4 max-w-sm leading-relaxed">
              {slide.subtitle}
            </p>
          )}
          <Link
            href={slide.ctaHref}
            className="inline-flex items-center gap-2 bg-white text-brand-700 font-semibold text-xs sm:text-sm px-4 sm:px-5 py-2 sm:py-2.5 rounded-full hover:bg-brand-50 transition-colors"
          >
            {slide.ctaLabel}
            <span>→</span>
          </Link>
        </div>
      </div>

      {/* Prev / Next arrows — desktop only */}
      <button
        onClick={prev}
        className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 items-center justify-center text-white transition-colors"
        aria-label="Önceki"
      >
        ‹
      </button>
      <button
        onClick={next}
        className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 items-center justify-center text-white transition-colors"
        aria-label="Sonraki"
      >
        ›
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-3 left-0 right-0 z-30 flex justify-center gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === current ? "bg-white w-5" : "bg-white/45 w-1.5"
            }`}
            aria-label={`Slayt ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
