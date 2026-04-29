"use client";

import { useState, useRef, useEffect } from "react";

/* ── Types ─────────────────────────────────────────────────── */
const CATEGORIES = ["soup", "main", "side", "dessert"] as const;
type Category = typeof CATEGORIES[number];

const CAT_TR: Record<Category, string> = {
  soup: "Çorba", main: "Ana Yemek", side: "Yardımcı Lezzet", dessert: "Tatlı",
};
const CAT_EMOJI: Record<Category, string> = {
  soup: "🥣", main: "🥘", side: "🥗", dessert: "🍮",
};

interface Recipe { id: string; title: string; slug: string }
interface SuggestionResult {
  category: Category;
  categoryTr: string;
  recipe: Recipe | null;
  matchedCount: number;
  matchedIngredients: string[];
  userIngCount: number;
  noMatch: boolean;
}
interface Approved { category: Category; categoryTr: string; recipe: Recipe }

type Step = "category-select" | "ingredient-input" | "loading" | "suggestion" | "no-match" | "continue-prompt" | "done";

/* ── Message log ─────────────────────────────────────────── */
interface Msg { id: number; role: "bot" | "user"; text: string }
let _id = 0;
const bot  = (t: string): Msg => ({ id: ++_id, role: "bot",  text: t });
const user = (t: string): Msg => ({ id: ++_id, role: "user", text: t });

/* ── Component ───────────────────────────────────────────── */
export default function Chatbot() {
  const [open, setOpen] = useState(false);

  const [step,          setStep]          = useState<Step>("category-select");
  const [activeCategory, setActiveCat]   = useState<Category | null>(null);
  const [ingredients,   setIngredients]  = useState<string[]>([]);
  const [query,         setQuery]        = useState("");
  const [suggestion,    setSuggestion]   = useState<SuggestionResult | null>(null);
  const [excluded,      setExcluded]     = useState<Record<string, string[]>>({});
  const [approved,      setApproved]     = useState<Approved[]>([]);
  const [msgs,          setMsgs]         = useState<Msg[]>([
    bot("Merhaba! 👋 Hangi kategoride yemek yapmak istiyorsun?"),
  ]);

  const inputRef  = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, step]);
  useEffect(() => {
    if (open && step === "ingredient-input") setTimeout(() => inputRef.current?.focus(), 150);
  }, [open, step]);

  const approvedCats = new Set(approved.map(a => a.category));
  const remaining    = CATEGORIES.filter(c => !approvedCats.has(c));

  /* ── Ingredient input ── */
  function addIngredient() {
    const val = query.replace(/,/g, "").trim();
    if (!val || ingredients.length >= 10) return;
    if (ingredients.map(i => i.toLowerCase()).includes(val.toLowerCase())) { setQuery(""); return; }
    setIngredients(prev => [...prev, val]);
    setQuery("");
  }
  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addIngredient(); }
    if (e.key === "Backspace" && query === "" && ingredients.length > 0)
      setIngredients(prev => prev.slice(0, -1));
  }

  /* ── Pick category ── */
  function pickCategory(cat: Category) {
    setActiveCat(cat);
    setIngredients([]);
    setQuery("");
    setMsgs(prev => [
      ...prev,
      user(`${CAT_EMOJI[cat]} ${CAT_TR[cat]}`),
      bot(`Güzel! ${CAT_TR[cat]} için evindeki malzemeleri yaz. 🍳\n\nHer malzemeyi tek tek yaz → Enter'a bas → sonraki malzemeyi yaz.\n(En fazla 10 malzeme)`),
    ]);
    setStep("ingredient-input");
  }

  /* ── Fetch ── */
  async function fetchSuggestion(excl?: Record<string, string[]>) {
    if (!activeCategory) return;
    setStep("loading");
    const useExcl = excl ?? excluded;
    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients, category: activeCategory, excludeIds: useExcl }),
      });
      const data = await res.json();
      const found: SuggestionResult = data.suggestions?.find((s: SuggestionResult) => s.category === activeCategory);

      if (found?.recipe) {
        setSuggestion(found);
        const ingList = found.matchedIngredients.join(", ");
        const matchMsg = found.matchedCount === found.userIngCount
          ? `Tüm malzemelerine uygun (${ingList}) bir ${found.categoryTr.toLowerCase()} tarifi buldum:`
          : `${found.userIngCount} malzemenden ${found.matchedCount} tanesini (${ingList}) içeren bir tarif buldum:`;
        setMsgs(prev => [...prev, bot(matchMsg)]);
        setStep("suggestion");
      } else {
        setSuggestion(null);
        const ingList = ingredients.join(", ");
        setMsgs(prev => [
          ...prev,
          bot(`"${ingList}" malzemelerine uygun ${found?.categoryTr?.toLowerCase() ?? activeCategory} tarifi bulunamadı 😔`),
        ]);
        setStep("no-match");
      }
    } catch {
      setMsgs(prev => [...prev, bot("Bir hata oluştu, tekrar dener misin?")]);
      setStep("ingredient-input");
    }
  }

  /* ── Approve ── */
  function approveSuggestion() {
    if (!activeCategory || !suggestion?.recipe) return;
    const entry: Approved = { category: activeCategory, categoryTr: CAT_TR[activeCategory], recipe: suggestion.recipe };
    const newApproved = [...approved, entry];
    setApproved(newApproved);
    const newRemaining = CATEGORIES.filter(c => !new Set(newApproved.map(a => a.category)).has(c));
    setMsgs(prev => [
      ...prev,
      user(`✅ ${suggestion.recipe!.title}`),
      bot(newRemaining.length > 0
        ? `Harika! 🎉 Başka bir kategoride tarif bulmak ister misin?\n${newRemaining.map(c => `${CAT_EMOJI[c]} ${CAT_TR[c]}`).join("  ·  ")} kategorileri kaldı.`
        : "Harika! 🎉 4 kategorinin hepsini tamamladın. Afiyet olsun! 😊"),
    ]);
    setStep(newRemaining.length > 0 ? "continue-prompt" : "done");
  }

  /* ── Replace ── */
  async function replaceSuggestion() {
    if (!activeCategory || !suggestion?.recipe) return;
    const newExcl = { ...excluded, [activeCategory]: [...(excluded[activeCategory] ?? []), suggestion.recipe.id] };
    setExcluded(newExcl);
    setMsgs(prev => [...prev, user("🔄 Başka öner")]);
    await fetchSuggestion(newExcl);
  }

  /* ── Skip / finish ── */
  function skipCategory() {
    const newRemaining = remaining.filter(c => c !== activeCategory);
    setMsgs(prev => [
      ...prev,
      user("Bu kategoriyi atla"),
      bot(newRemaining.length > 0
        ? `Tamam! Başka bir kategori seçebilirsin.`
        : "Tamam, tamamladık! Afiyet olsun 😊"),
    ]);
    setActiveCat(null);
    setStep(newRemaining.length > 0 ? "continue-prompt" : "done");
  }

  function finish() {
    setMsgs(prev => [...prev, user("Hayır, bu kadar yeter 😊"), bot("Harika seçimler! Afiyet olsun! 🍽️")]);
    setStep("done");
  }

  /* ── Reset ── */
  function reset() {
    setStep("category-select");
    setActiveCat(null);
    setIngredients([]);
    setQuery("");
    setSuggestion(null);
    setExcluded({});
    setApproved([]);
    setMsgs([bot("Merhaba! 👋 Hangi kategoride yemek yapmak istiyorsun?")]);
  }

  /* ── Render ── */
  return (
    <>
      {/* Bubble */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Ne Pişirsem?"
        className="fixed bottom-5 left-5 z-50 rounded-full shadow-xl flex items-center gap-2.5 transition-all hover:scale-105 active:scale-95"
        style={{
          backgroundColor: "#D2740B",
          padding: open ? "0 14px 0 10px" : "0 14px 0 10px",
          height: 48,
        }}
      >
        <span className="text-xl">🍳</span>
        {!open && <span className="text-white font-semibold text-sm whitespace-nowrap">Ne Pişirsem?</span>}
        {open && (
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="fixed bottom-[72px] left-5 z-50 w-80 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ backgroundColor: "#FFFAF6", border: "1px solid #E8D5B7", maxHeight: "min(560px, calc(100vh - 90px))" }}
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 flex-shrink-0" style={{ backgroundColor: "#D2740B" }}>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-lg flex-shrink-0">🍳</div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-bold text-sm">Ne Pişirsem?</div>
              <div className="text-orange-100 text-xs">Elindeki malzemelerle ne yapabilirsin?</div>
            </div>
            <button onClick={reset} className="text-white/70 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0">
              Yeniden
            </button>
          </div>

          {/* Messages + UI */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">

            {/* Message log */}
            {msgs.map(m => (
              <div key={m.id} className={`flex gap-2 items-start ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                {m.role === "bot" && (
                  <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-sm mt-0.5" style={{ backgroundColor: "#FEE8C8" }}>🍳</div>
                )}
                <div
                  className="rounded-2xl px-3 py-2 text-sm leading-relaxed max-w-[85%] whitespace-pre-line"
                  style={m.role === "bot"
                    ? { backgroundColor: "#FEF0DC", color: "#3D2B1F", borderTopLeftRadius: 4 }
                    : { backgroundColor: "#D2740B", color: "#fff", borderTopRightRadius: 4 }}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {/* Category select */}
            {(step === "category-select") && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                {CATEGORIES.filter(c => !approvedCats.has(c)).map(cat => (
                  <button
                    key={cat}
                    onClick={() => pickCategory(cat)}
                    className="flex flex-col items-center justify-center gap-1 rounded-xl text-sm font-semibold border-2 transition-colors"
                    style={{ borderColor: "#E8D5B7", backgroundColor: "#FFF7EF", color: "#3D2B1F", height: 64 }}
                  >
                    <span className="text-xl">{CAT_EMOJI[cat]}</span>
                    <span className="text-xs">{CAT_TR[cat]}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Ingredient input */}
            {step === "ingredient-input" && (
              <div className="space-y-2 pt-1">
                {/* Kullanım notu */}
                <div className="flex items-start gap-1.5 px-1" style={{ color: "#7C5C47" }}>
                  <span className="text-sm flex-shrink-0">💡</span>
                  <p className="text-xs leading-relaxed">
                    Her malzemeyi <strong>tek tek</strong> yaz.<br/>
                    Yazdıktan sonra <strong>Enter</strong>&apos;a bas ya da alandan çık → sonrakini yaz.
                  </p>
                </div>
                <div
                  className="rounded-xl border-2 p-2.5 cursor-text"
                  style={{ borderColor: "#E8D5B7", backgroundColor: "#FFFCF9" }}
                  onClick={() => inputRef.current?.focus()}
                >
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {ingredients.map((ing, i) => (
                      <span key={i} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: "#FEE8C8", color: "#92400E" }}>
                        {ing}
                        <button onClick={() => setIngredients(p => p.filter((_, j) => j !== i))} className="leading-none ml-0.5 text-orange-400 hover:text-orange-700">×</button>
                      </span>
                    ))}
                  </div>
                  {ingredients.length < 10
                    ? <input ref={inputRef} type="text" value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKey} onBlur={addIngredient}
                        placeholder={ingredients.length === 0 ? "Örn: tavuk, patates, soğan…" : "Malzeme ekle…"}
                        className="w-full text-sm outline-none bg-transparent"
                        style={{ color: "#3D2B1F", fontSize: 16 }} />
                    : <div className="text-xs" style={{ color: "#7C5C47" }}>Maksimum 10 malzeme.</div>
                  }
                </div>
                <button
                  onClick={() => { setMsgs(p => [...p, user(ingredients.join(", "))]); fetchSuggestion(); }}
                  disabled={ingredients.length === 0}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-40"
                  style={{ backgroundColor: "#D2740B" }}
                >
                  {ingredients.length === 0 ? "Malzeme ekleyin" : `Tarif Bul (${ingredients.length} malzeme)`}
                </button>
              </div>
            )}

            {/* Loading */}
            {step === "loading" && (
              <div className="flex items-center gap-2 py-2 pl-9">
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full animate-bounce"
                      style={{ backgroundColor: "#D2740B", animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
                <span className="text-xs" style={{ color: "#7C5C47" }}>Aranıyor…</span>
              </div>
            )}

            {/* Suggestion */}
            {step === "suggestion" && suggestion?.recipe && (
              <div className="space-y-2 pt-1">
                <div className="rounded-xl p-3" style={{ backgroundColor: "#FEF0DC", border: "1px solid #F5D9A8" }}>
                  <div className="text-xs font-bold mb-1" style={{ color: "#D2740B" }}>
                    {CAT_EMOJI[activeCategory!]} {CAT_TR[activeCategory!]}
                  </div>
                  <a href={`/tarifler/${suggestion.recipe.slug}`} target="_blank" rel="noopener noreferrer"
                    className="text-sm font-semibold hover:underline block leading-snug" style={{ color: "#3D2B1F" }}>
                    {suggestion.recipe.title}
                  </a>
                  {suggestion.matchedIngredients.length > 0 && (
                    <div className="text-xs mt-1.5" style={{ color: "#7C5C47" }}>
                      İçerdiği malzemeler: {suggestion.matchedIngredients.join(", ")}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={approveSuggestion}
                    className="flex-1 py-2 rounded-xl text-sm font-semibold text-white transition-colors"
                    style={{ backgroundColor: "#16a34a" }}>
                    ✅ Bunu yapayım!
                  </button>
                  <button onClick={replaceSuggestion}
                    className="flex-1 py-2 rounded-xl text-sm font-medium border-2 transition-colors"
                    style={{ borderColor: "#E8D5B7", color: "#7C5C47", backgroundColor: "#FFF7EF" }}>
                    🔄 Başka öner
                  </button>
                </div>
              </div>
            )}

            {/* No match */}
            {step === "no-match" && (
              <div className="flex gap-2 pt-1">
                <button onClick={() => { setStep("ingredient-input"); setIngredients([]); setQuery(""); }}
                  className="flex-1 py-2 rounded-xl text-sm font-medium border-2 transition-colors"
                  style={{ borderColor: "#E8D5B7", color: "#7C5C47", backgroundColor: "#FFF7EF" }}>
                  ✏️ Değiştir
                </button>
                <button onClick={skipCategory}
                  className="flex-1 py-2 rounded-xl text-sm font-medium border-2 transition-colors"
                  style={{ borderColor: "#E8D5B7", color: "#7C5C47", backgroundColor: "#FFF7EF" }}>
                  ⏭️ Atla
                </button>
              </div>
            )}

            {/* Continue prompt */}
            {step === "continue-prompt" && (
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-2 gap-2">
                  {remaining.map(cat => (
                    <button key={cat} onClick={() => pickCategory(cat)}
                      className="flex flex-col items-center justify-center gap-1 rounded-xl text-sm font-semibold border-2 transition-colors"
                      style={{ borderColor: "#E8D5B7", backgroundColor: "#FFF7EF", color: "#3D2B1F", height: 64 }}>
                      <span className="text-xl">{CAT_EMOJI[cat]}</span>
                      <span className="text-xs">{CAT_TR[cat]}</span>
                    </button>
                  ))}
                </div>
                <button onClick={finish}
                  className="w-full py-2 rounded-xl text-sm font-medium border-2 transition-colors"
                  style={{ borderColor: "#E8D5B7", color: "#7C5C47", backgroundColor: "#FFF7EF" }}>
                  Hayır, bu kadar yeter 😊
                </button>
              </div>
            )}

            {/* Done */}
            {step === "done" && approved.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {approved.map(a => (
                  <a key={a.category} href={`/tarifler/${a.recipe.slug}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors hover:opacity-80"
                    style={{ backgroundColor: "#FEF0DC", color: "#3D2B1F" }}>
                    <span>{CAT_EMOJI[a.category]}</span>
                    <span className="font-medium flex-1">{a.recipe.title}</span>
                    <span className="text-xs flex-shrink-0" style={{ color: "#D2740B" }}>Tarif →</span>
                  </a>
                ))}
                <button onClick={reset}
                  className="w-full py-2 rounded-xl text-xs font-medium border transition-colors mt-1"
                  style={{ borderColor: "#E8D5B7", color: "#7C5C47" }}>
                  Yeni arama yap
                </button>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>
      )}
    </>
  );
}
