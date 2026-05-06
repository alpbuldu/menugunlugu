"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import Badge, { type Category } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/client";
import type { MenuWithRecipes } from "@/lib/types";

/* ─── Constants ────────────────────────────────────────────── */

const WEEKDAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

const MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

const COURSE_FIELDS: { field: "soup" | "main" | "side" | "dessert"; category: Category }[] = [
  { field: "soup",    category: "soup" },
  { field: "main",    category: "main" },
  { field: "side",    category: "side" },
  { field: "dessert", category: "dessert" },
];

/* ─── Helpers ───────────────────────────────────────────────── */

function localToday(): string {
  return new Date().toLocaleDateString("en-CA");
}

function buildCells(year: number, month: number): (number | null)[] {
  const firstDow = new Date(year, month - 1, 1).getDay();
  const offset   = (firstDow + 6) % 7; // Mon = 0
  const days     = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("tr-TR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

/* ─── Calendar ──────────────────────────────────────────────── */

export default function Calendar() {
  const now   = new Date();
  const today = localToday();

  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [datesLoading,   setDatesLoading]   = useState(true);

  const [selectedDate,    setSelectedDate]    = useState<string | null>(null);
  const [selectedMenu,    setSelectedMenu]    = useState<MenuWithRecipes | null>(null);
  const [menuLoading,     setMenuLoading]     = useState(false);
  const [adminProfile,    setAdminProfile]    = useState<{ username: string; avatar_url: string | null } | null>(null);
  const [memberProfiles,  setMemberProfiles]  = useState<Record<string, { username: string; avatar_url: string | null }>>({});

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Kullanıcı oturumunu al
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) { setCurrentUserId(user.id); }
    });
  }, []);

  useEffect(() => {
    setDatesLoading(true);
    setAvailableDates([]);
    setSelectedDate(null);
    setSelectedMenu(null);

    fetch(`/api/menu/dates?year=${year}&month=${month}`)
      .then((r) => r.json())
      .then((d) => {
        const dates: string[] = d.dates ?? [];
        setAvailableDates(dates);
        // Auto-select most recent past date on initial load (current month only)
        if (dates.length > 0 && year === now.getFullYear() && month === now.getMonth() + 1) {
          const pastDates = dates.filter((dt) => dt <= today);
          if (pastDates.length > 0) {
            handleDayClick(pastDates[pastDates.length - 1]);
          }
        }
      })
      .catch(() => {})
      .finally(() => setDatesLoading(false));
  }, [year, month]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDayClick = useCallback(async (dateStr: string) => {
    setSelectedDate(dateStr);
    setMenuLoading(true);
    setSelectedMenu(null);
    try {
      const res  = await fetch(`/api/menu/by-date?date=${dateStr}`);
      const data = await res.json();
      setSelectedMenu(data.menu ?? null);
      if (data.adminProfile)   setAdminProfile(data.adminProfile);
      if (data.memberProfiles) setMemberProfiles(data.memberProfiles);
    } catch {
      setSelectedMenu(null);
    } finally {
      setMenuLoading(false);
    }
  }, [currentUserId]);

  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth() + 1;

  function prevMonth() {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
  }

  function nextMonth() {
    if (isCurrentMonth) return;
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
  }

  const cells = buildCells(year, month);

  /* ── Render ────────────────────────────────────────────────── */
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8">

      {/* ── Left: calendar ──────────────────────────────────── */}
      <div className="h-full bg-white rounded-2xl border border-warm-100 shadow-sm p-5 flex flex-col">

        {/* Month header */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={prevMonth}
            aria-label="Önceki ay"
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-warm-100 text-warm-500 hover:text-warm-800 transition-colors text-xl leading-none"
          >
            ‹
          </button>
          <h2 className="text-base font-bold text-warm-900 tracking-tight">
            {MONTHS[month - 1]} {year}
          </h2>
          <button
            onClick={nextMonth}
            disabled={isCurrentMonth}
            aria-label="Sonraki ay"
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-warm-100 text-warm-500 hover:text-warm-800 transition-colors text-xl leading-none disabled:opacity-25 disabled:cursor-not-allowed"
          >
            ›
          </button>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-[11px] font-semibold text-warm-400 py-1 tracking-wide">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        {datesLoading ? (
          <div className="grid grid-cols-7 gap-1">
            {Array(35).fill(null).map((_, i) => (
              <div key={i} className="aspect-square rounded-lg bg-warm-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((day, i) => {
              if (!day) return <div key={`pad-${i}`} />;

              const dateStr    = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const hasMenu    = availableDates.includes(dateStr);
              const isToday    = dateStr === today;
              const isFuture   = dateStr > today;
              const isSelected = dateStr === selectedDate;

              return (
                <button
                  key={day}
                  onClick={() => hasMenu && !isFuture && handleDayClick(dateStr)}
                  disabled={!hasMenu || isFuture}
                  aria-pressed={isSelected}
                  aria-label={`${day} ${MONTHS[month - 1]}${hasMenu ? " — menü var" : ""}`}
                  className={[
                    "relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm font-medium transition-all duration-150 select-none",
                    isSelected
                      ? "bg-brand-600 text-white shadow-md scale-110 z-10"
                      : hasMenu && !isFuture
                      ? "bg-brand-50 text-brand-700 hover:bg-brand-200 hover:scale-105 cursor-pointer"
                      : isToday
                      ? "text-warm-500 font-semibold"
                      : "text-warm-300 cursor-default",
                    isToday && !isSelected
                      ? "ring-2 ring-brand-300 ring-offset-1"
                      : "",
                  ].join(" ")}
                >
                  {day}
                  {hasMenu && !isSelected && !isFuture && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-brand-400" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Desktop-only menu summary ─────────────────────── */}
        <div className="hidden lg:block mt-5 pt-5 border-t border-warm-100">
          {!selectedDate ? (
            !datesLoading && availableDates.length > 0 ? (
              <p className="text-xs text-warm-400 py-1">
                Menüsünü görmek istediğiniz güne tıklayın.
              </p>
            ) : null
          ) : menuLoading ? (
            <div className="space-y-3 pt-1">
              <div className="h-4 bg-warm-100 rounded w-3/4 animate-pulse" />
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-3 bg-warm-100 rounded w-2/3 animate-pulse" />
              ))}
            </div>
          ) : selectedMenu ? (
            <>
              <p className="text-sm font-bold text-warm-800 mb-4 leading-snug">
                {new Date(selectedDate + "T12:00:00").toLocaleDateString("tr-TR", {
                  day: "numeric", month: "long", weekday: "long",
                })}{" "}Günün Menüsü
              </p>
              <ul className="space-y-2.5">
                {COURSE_FIELDS.map(({ field }) => {
                  const recipe = selectedMenu[field];
                  return (
                    <li key={field} className="flex items-center gap-2">
                      <span className="text-brand-400 leading-5 text-base select-none">•</span>
                      <Link
                        href={`/recipes/${recipe.slug}`}
                        className="text-sm text-warm-600 leading-5 hover:text-brand-600 transition-colors line-clamp-1 flex-1"
                      >
                        {recipe.title}
                      </Link>
                      {(recipe as any).kcal_per_person && (
                        <span className="text-[10px] text-orange-500 font-semibold flex-shrink-0">{(recipe as any).kcal_per_person} kcal</span>
                      )}
                    </li>
                  );
                })}
              </ul>
              {(() => {
                const kcal = COURSE_FIELDS.reduce((s, { field }) => s + (((selectedMenu[field]) as any)?.kcal_per_person ?? 0), 0);
                return kcal > 0 ? (
                  <div className="mt-3 pt-3 border-t border-warm-100 flex items-center gap-1.5">
                    <span className="text-warm-300 font-bold text-sm">+</span>
                    <span className="text-xs font-semibold text-warm-700">
                      Toplam: <span className="text-brand-600">{kcal} kcal</span>
                    </span>
                  </div>
                ) : null;
              })()}
            </>
          ) : (
            <p className="text-xs text-warm-400 py-1">
              Bu gün için menü yok
            </p>
          )}
        </div>
        <p className="hidden lg:block mt-4 text-xs text-warm-400 leading-relaxed">
          Geçmiş günlerin menülerini takvimden seçerek inceleyin.
        </p>
      </div>

      {/* ── Right: menu panel ───────────────────────────────── */}
      <div className="flex flex-col min-h-[440px]">
        {selectedDate ? (
          <>
            {menuLoading ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="rounded-xl sm:rounded-2xl h-36 sm:h-48 bg-warm-100 animate-pulse" />
                ))}
              </div>
            ) : selectedMenu ? (
              <>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {COURSE_FIELDS.map(({ field, category }) => {
                  const recipe = selectedMenu[field];
                  const ap = adminProfile ?? { username: "Menü Günlüğü", avatar_url: null };
                  const authorRaw = recipe.submitted_by
                    ? (memberProfiles[recipe.submitted_by] ?? ap)
                    : ap;
                  const isAdmin = !recipe.submitted_by;
                  const author = { name: authorRaw.username, avatar: authorRaw.avatar_url ?? "", username: isAdmin ? "__admin__" : authorRaw.username };
                  return (
                    <Link key={field} href={`/recipes/${recipe.slug}`} className="relative block rounded-xl sm:rounded-2xl overflow-hidden h-36 sm:h-48 group hover:shadow-lg transition-all">
                      {recipe.image_url ? (
                        <Image src={recipe.image_url} alt={recipe.title} fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="absolute inset-0 bg-warm-100 flex items-center justify-center text-4xl text-warm-300">🍳</div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                      <div className="absolute top-2 left-2">
                        <Badge category={category} compact className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5" />
                      </div>
                      {(recipe as any).kcal_per_person && (
                        <span className="absolute top-2 right-2 text-[9px] sm:text-[10px] font-bold text-white drop-shadow">
                          {(recipe as any).kcal_per_person} kcal
                        </span>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-3">
                        <h4 className="text-xs sm:text-sm font-bold text-white leading-snug mb-1.5 line-clamp-2">{recipe.title}</h4>
                        <div className="flex items-center gap-1.5">
                          {author.avatar ? (
                            <img src={author.avatar} alt={author.name} className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover flex-shrink-0" />
                          ) : (
                            <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white/25 text-white text-[8px] font-bold flex items-center justify-center flex-shrink-0">
                              {author.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                          <span className="text-[9px] sm:text-[10px] text-white/80 truncate">{author.name}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl border border-warm-100 shadow-sm p-10 text-center text-warm-400">
                <p className="text-3xl mb-3">🔍</p>
                <p>Bu gün için menü bulunamadı.</p>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl border border-warm-100 shadow-sm p-10 text-center text-warm-400">
            <p className="text-4xl mb-3">📅</p>
            <p className="text-warm-500 font-medium">
              {datesLoading
                ? "Yükleniyor…"
                : availableDates.length > 0
                ? "Menüsünü görmek istediğiniz güne tıklayın."
                : "Bu ay için yayınlanmış menü bulunamadı."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
