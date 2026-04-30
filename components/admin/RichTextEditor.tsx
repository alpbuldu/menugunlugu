"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { Extension, Node as TiptapNode } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import Link from "@tiptap/extension-link";
import { useEffect, useRef, useState, useCallback } from "react";

const HeadingBreak = Extension.create({
  name: "headingBreak",
  addKeyboardShortcuts() {
    return {
      Enter: () => {
        const { $from } = this.editor.state.selection;
        if ($from.parent.type.name === "heading") {
          return this.editor.chain().splitBlock().setNode("paragraph").run();
        }
        return false;
      },
    };
  },
});

/* ── RecipeCard — custom atom node for styled recipe cards ─────── */
const RecipeCard = TiptapNode.create({
  name: "recipeCard",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      href:   { default: null },
      title:  { default: null },
      emoji:  { default: "🍽️" },
      catTr:  { default: null },
      author: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-recipe-card]" }];
  },

  renderHTML({ node }) {
    const { href, title, emoji, catTr, author } = node.attrs as Record<string, string>;
    const h = href ?? "#";
    return [
      "div",
      { "data-recipe-card": "", style: "display:flex;align-items:center;gap:12px;border:1.5px solid #edd8bc;border-radius:12px;padding:13px 16px;background:#fdf8f0;margin:14px 0;" },
      ["span", { style: "font-size:1.5rem;flex-shrink:0;line-height:1;" }, emoji ?? "🍽️"],
      ["div", { style: "flex:1;min-width:0;" },
        ["p", { style: "font-size:10px;font-weight:700;color:#b86515;text-transform:uppercase;letter-spacing:.06em;margin:0 0 2px 0;line-height:1.2;" }, catTr ?? ""],
        ["a", { href: h, style: "font-size:.95rem;font-weight:700;color:#3d2b1f;text-decoration:none;display:block;line-height:1.3;margin:0 0 3px 0;" }, title ?? ""],
        ["p", { style: "font-size:11px;color:#7c5c47;margin:0;line-height:1.2;" }, author ? `✍️ ${author}` : ""],
      ],
      ["a", { href: h, style: "font-size:.75rem;color:#b86515;font-weight:600;flex-shrink:0;white-space:nowrap;text-decoration:none;border:1px solid #edd8bc;border-radius:6px;padding:4px 8px;" }, "Tarife Git →"],
    ];
  },

  addNodeView() {
    return ({ node }) => {
      const { href, title, emoji, catTr, author } = node.attrs as Record<string, string>;
      const dom = document.createElement("div");
      dom.setAttribute("data-recipe-card", "");
      dom.setAttribute("contenteditable", "false");
      dom.style.cssText = "display:flex;align-items:center;gap:12px;border:1.5px solid #edd8bc;border-radius:12px;padding:13px 16px;background:#fdf8f0;margin:14px 0;cursor:default;user-select:none;";
      dom.innerHTML = [
        `<span style="font-size:1.5rem;flex-shrink:0;line-height:1;">${emoji ?? "🍽️"}</span>`,
        `<div style="flex:1;min-width:0;">`,
          `<p style="font-size:10px;font-weight:700;color:#b86515;text-transform:uppercase;letter-spacing:.06em;margin:0 0 2px 0;line-height:1.2;">${catTr ?? ""}</p>`,
          `<span style="font-size:.95rem;font-weight:700;color:#3d2b1f;display:block;line-height:1.3;margin:0 0 3px 0;">${title ?? ""}</span>`,
          author ? `<p style="font-size:11px;color:#7c5c47;margin:0;line-height:1.2;">✍️ ${author}</p>` : "",
        `</div>`,
        `<span style="font-size:.75rem;color:#b86515;font-weight:600;flex-shrink:0;white-space:nowrap;border:1px solid #edd8bc;border-radius:6px;padding:4px 8px;">Tarife Git →</span>`,
      ].join("");
      return { dom };
    };
  },
});

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

function ToolBtn({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      disabled={disabled}
      title={title}
      className={[
        "px-2 py-1 rounded text-sm font-medium transition-colors select-none",
        active
          ? "bg-warm-700 text-white"
          : "text-warm-600 hover:bg-warm-100 hover:text-warm-900",
        disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="w-px h-5 bg-warm-200 mx-0.5 shrink-0" />;
}

interface RecipeHit { id: string; title: string; slug: string; category: string; author?: string; }

const RECIPE_EMOJI: Record<string, string> = {
  soup: "🥣", main: "🥘", side: "🥗", dessert: "🍮",
};
const RECIPE_CAT_TR: Record<string, string> = {
  soup: "Çorba", main: "Ana Yemek", side: "Yardımcı Lezzet", dessert: "Tatlı",
};

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "İçerik yazın…",
  minHeight = "280px",
}: Props) {
  // ── Panel states ──
  const [panel, setPanel] = useState<"none" | "link" | "recipe">("none");
  const [linkInput, setLinkInput] = useState("");
  const [recipeQ, setRecipeQ] = useState("");
  const [recipeHits, setRecipeHits] = useState<RecipeHit[]>([]);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [recipeError, setRecipeError] = useState("");
  const linkInputRef = useRef<HTMLInputElement>(null);
  const recipeInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      HeadingBreak,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" },
      }),
      RecipeCard,
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "focus:outline-none",
        "data-placeholder": placeholder,
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html === "<p></p>" ? "" : html);
    },
    immediatelyRender: false,
  });

  // Sync external value
  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== value && value !== undefined) {
      editor.commands.setContent(value || "");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tarif arama
  const searchRecipes = useCallback(async (q: string) => {
    setRecipeLoading(true);
    setRecipeError("");
    try {
      const res = await fetch(`/api/admin/recipes/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) {
        setRecipeError(data?.error ?? "Arama başarısız");
        setRecipeHits([]);
      } else {
        setRecipeHits(Array.isArray(data) ? data : []);
      }
    } catch {
      setRecipeError("Bağlantı hatası");
      setRecipeHits([]);
    }
    finally { setRecipeLoading(false); }
  }, []);

  useEffect(() => {
    if (panel !== "recipe") return;
    const t = setTimeout(() => searchRecipes(recipeQ), 250);
    return () => clearTimeout(t);
  }, [recipeQ, panel, searchRecipes]);

  // Panel açıldığında input'a focus
  useEffect(() => {
    if (panel === "link") {
      // Mevcut linki pre-fill et
      const href = editor?.getAttributes("link").href ?? "";
      setLinkInput(href);
      setTimeout(() => linkInputRef.current?.focus(), 50);
    }
    if (panel === "recipe") {
      setRecipeQ("");
      setRecipeError("");
      setRecipeHits([]);
      searchRecipes("");
      setTimeout(() => recipeInputRef.current?.focus(), 50);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panel]);

  const applyLink = () => {
    if (!editor) return;
    const url = linkInput.trim();
    if (!url) {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().setLink({ href: url }).run();
    }
    setPanel("none");
    setLinkInput("");
  };

  const applyRecipeLink = (recipe: RecipeHit) => {
    if (!editor) return;
    const href = `/tarifler/${recipe.slug}`;
    const { empty } = editor.state.selection;
    if (empty) {
      editor.chain().focus()
        .insertContent(`<a href="${href}">${recipe.title}</a> `)
        .run();
    } else {
      editor.chain().focus().setLink({ href, target: "_self" }).run();
    }
    setPanel("none");
    setRecipeQ("");
  };

  const insertRecipeCard = (recipe: RecipeHit) => {
    if (!editor) return;
    const emoji  = RECIPE_EMOJI[recipe.category] ?? "🍽️";
    const catTr  = RECIPE_CAT_TR[recipe.category] ?? recipe.category;
    const href   = `/tarifler/${recipe.slug}`;
    const author = recipe.author ?? null;
    editor.chain().focus()
      .insertContent({ type: "recipeCard", attrs: { href, title: recipe.title, emoji, catTr, author } })
      .run();
    setPanel("none");
    setRecipeQ("");
  };

  const togglePanel = (p: "link" | "recipe") => {
    setPanel(prev => prev === p ? "none" : p);
  };

  if (!editor) return null;

  const inTable = editor.isActive("table");
  const hasLink = editor.isActive("link");

  return (
    <div className="border border-warm-200 rounded-xl focus-within:border-brand-400 focus-within:ring-1 focus-within:ring-brand-200 transition-shadow">
      {/* ── Toolbar — sticky: sayfa kayarken yerinde kalır ── */}
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 bg-warm-50 border-b border-warm-200 rounded-t-xl sticky top-0 z-10">
        {/* Geri / İleri */}
        <ToolBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Geri al">↩</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="İleri al">↪</ToolBtn>

        <Divider />

        {/* Bold / Italic / Underline / Strike */}
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()}      active={editor.isActive("bold")}      title="Kalın (Ctrl+B)"><strong>B</strong></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()}    active={editor.isActive("italic")}    title="İtalik (Ctrl+I)"><em>İ</em></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Altı çizili (Ctrl+U)"><span className="underline">A</span></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()}    active={editor.isActive("strike")}    title="Üstü çizili"><s>S</s></ToolBtn>

        <Divider />

        {/* Başlıklar */}
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Büyük başlık">H2</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Orta başlık">H3</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} active={editor.isActive("heading", { level: 4 })} title="Küçük başlık">H4</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setParagraph().run()} active={editor.isActive("paragraph")} title="Normal metin">¶</ToolBtn>

        <Divider />

        {/* Listeler */}
        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()}  active={editor.isActive("bulletList")}  title="Madde listesi">• —</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numaralı liste">1.</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()}  active={editor.isActive("blockquote")}  title="Alıntı">&ldquo;&rdquo;</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Yatay çizgi">—</ToolBtn>

        <Divider />

        {/* Hizalama */}
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign("left").run()}   active={editor.isActive({ textAlign: "left" })}   title="Sola hizala">⬅</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Ortala">☰</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign("right").run()}  active={editor.isActive({ textAlign: "right" })}  title="Sağa hizala">➡</ToolBtn>

        <Divider />

        {/* Link */}
        <ToolBtn onClick={() => togglePanel("link")} active={hasLink || panel === "link"} title="Link ekle">🔗</ToolBtn>
        {hasLink && (
          <ToolBtn onClick={() => editor.chain().focus().unsetLink().run()} title="Linki kaldır">🔗✕</ToolBtn>
        )}

        {/* Tarif linki */}
        <ToolBtn onClick={() => togglePanel("recipe")} active={panel === "recipe"} title="Tarif linki ekle">📖</ToolBtn>

        <Divider />

        {/* Tablo */}
        {!inTable ? (
          <ToolBtn onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Tablo ekle (3×3)">⊞ Tablo</ToolBtn>
        ) : (
          <>
            <ToolBtn onClick={() => editor.chain().focus().addColumnBefore().run()} title="Sola sütun ekle">◀+</ToolBtn>
            <ToolBtn onClick={() => editor.chain().focus().addColumnAfter().run()}  title="Sağa sütun ekle">+▶</ToolBtn>
            <ToolBtn onClick={() => editor.chain().focus().deleteColumn().run()}    title="Sütun sil">✕S</ToolBtn>
            <ToolBtn onClick={() => editor.chain().focus().addRowBefore().run()}    title="Üste satır ekle">▲+</ToolBtn>
            <ToolBtn onClick={() => editor.chain().focus().addRowAfter().run()}     title="Alta satır ekle">+▼</ToolBtn>
            <ToolBtn onClick={() => editor.chain().focus().deleteRow().run()}       title="Satır sil">✕R</ToolBtn>
            <ToolBtn onClick={() => editor.chain().focus().deleteTable().run()}     title="Tabloyu sil">🗑</ToolBtn>
          </>
        )}
      </div>

      {/* ── Link paneli ── */}
      {panel === "link" && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border-b border-blue-100">
          <span className="text-xs font-medium text-blue-700 shrink-0">🔗 URL:</span>
          <input
            ref={linkInputRef}
            type="url"
            value={linkInput}
            onChange={e => setLinkInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); applyLink(); } if (e.key === "Escape") setPanel("none"); }}
            placeholder="https://… veya /tarifler/slug"
            className="flex-1 text-sm border border-blue-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400 bg-white"
          />
          <button type="button" onClick={applyLink}
            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors shrink-0">
            Uygula
          </button>
          <button type="button" onClick={() => setPanel("none")}
            className="px-2 py-1 text-xs text-blue-500 hover:text-blue-700 shrink-0">✕</button>
        </div>
      )}

      {/* ── Tarif arama paneli ── */}
      {panel === "recipe" && (
        <div className="px-3 py-2 bg-amber-50 border-b border-amber-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-amber-700 shrink-0">📖 Tarif ara:</span>
            <input
              ref={recipeInputRef}
              type="text"
              value={recipeQ}
              onChange={e => setRecipeQ(e.target.value)}
              onKeyDown={e => { if (e.key === "Escape") setPanel("none"); }}
              placeholder="Tarif adı yaz…"
              className="flex-1 text-sm border border-amber-200 rounded px-2 py-1 focus:outline-none focus:border-amber-400 bg-white"
            />
            <button type="button" onClick={() => setPanel("none")}
              className="px-2 py-1 text-xs text-amber-500 hover:text-amber-700 shrink-0">✕</button>
          </div>
          <div className="max-h-52 overflow-y-auto rounded border border-amber-100 bg-white divide-y divide-amber-50">
            {recipeError ? (
              <p className="text-xs text-center text-red-500 py-3">⚠️ {recipeError}</p>
            ) : recipeLoading ? (
              <p className="text-xs text-center text-warm-400 py-3">Aranıyor…</p>
            ) : recipeHits.length === 0 ? (
              <p className="text-xs text-center text-warm-400 py-3">Sonuç yok</p>
            ) : recipeHits.map(r => (
              <div key={r.id} className="flex items-center gap-1.5 px-3 py-2 hover:bg-amber-50 transition-colors">
                <span className="text-base shrink-0">{RECIPE_EMOJI[r.category] ?? "🍽️"}</span>
                <span className="text-warm-800 font-medium flex-1 truncate text-xs">{r.title}</span>
                <button
                  type="button"
                  onMouseDown={e => { e.preventDefault(); applyRecipeLink(r); }}
                  title="Metin olarak link ekle"
                  className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 hover:bg-amber-200 shrink-0 font-medium"
                >
                  🔗 Link
                </button>
                <button
                  type="button"
                  onMouseDown={e => { e.preventDefault(); insertRecipeCard(r); }}
                  title="Tarif kartı olarak ekle"
                  className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 hover:bg-orange-200 shrink-0 font-medium"
                >
                  🃏 Kart
                </button>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-amber-600 mt-1.5">
            🔗 Link — seçili metne veya satır içine ekler &nbsp;·&nbsp; 🃏 Kart — tarif kutucuğu ekler
          </p>
        </div>
      )}

      {/* ── Editor alanı ── */}
      <style>{`
        .tiptap-editor .ProseMirror.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: #b0a99a;
          pointer-events: none;
          position: absolute;
          float: left;
          height: 0;
        }
        .tiptap-editor h2 {
          font-size: 1.4rem; font-weight: 700;
          margin: 1.4rem 0 0.5rem;
          color: #924c12;
          padding-bottom: 0.3rem;
          border-bottom: 2px solid #faefd8;
        }
        .tiptap-editor h3 { font-size: 1.15rem; font-weight: 700; margin: 1.1rem 0 0.4rem; color: #b86515; }
        .tiptap-editor h4 { font-size: 1rem;    font-weight: 700; margin: 0.9rem 0 0.35rem; color: #b86515; }
        .tiptap-editor p  { margin: 0.65rem 0; line-height: 1.85; }
        .tiptap-editor ul { list-style: disc;    padding-left: 1.5rem; margin: 0.65rem 0; }
        .tiptap-editor ol { list-style: decimal; padding-left: 1.5rem; margin: 0.65rem 0; }
        .tiptap-editor li { margin: 0.25rem 0; line-height: 1.8; }
        .tiptap-editor blockquote {
          border-left: 4px solid #ecc070;
          padding: 0.5rem 1rem;
          background: #fdf8f0;
          border-radius: 0 0.4rem 0.4rem 0;
          color: #a85e30;
          margin: 0.85rem 0;
          font-style: italic;
        }
        .tiptap-editor hr { border: none; border-top: 2px solid #edd8bc; margin: 1.5rem 0; }
        .tiptap-editor strong { font-weight: 700; }
        .tiptap-editor em { font-style: italic; }
        .tiptap-editor s  { text-decoration: line-through; }
        .tiptap-editor a  { color: #b86515; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
        /* Tablo stilleri */
        .tiptap-editor table {
          border-collapse: collapse;
          width: 100%;
          margin: 0.75rem 0;
          font-size: 0.82rem;
        }
        .tiptap-editor th {
          background: #fdf0dc;
          font-weight: 700;
          color: #924c12;
          padding: 0.35rem 0.6rem;
          border: 1px solid #edd8bc;
          text-align: left;
        }
        .tiptap-editor td {
          padding: 0.3rem 0.6rem;
          border: 1px solid #edd8bc;
          vertical-align: top;
        }
        .tiptap-editor tr:nth-child(even) td { background: #fdf8f0; }
        .tiptap-editor .selectedCell { background: #fef3db !important; }
        /* Tarif kartı önizleme (editör içi) */
        .tiptap-editor [data-recipe-card] { border-radius: 12px; display: flex !important; align-items: center; margin: 14px 0; }
        .tiptap-editor [data-recipe-card] p { margin: 0 !important; line-height: 1.2 !important; }
        .tiptap-editor [data-recipe-card] a { text-decoration: none !important; }
      `}</style>
      <EditorContent
        editor={editor}
        className="tiptap-editor px-4 py-3 text-warm-800 text-[15px] leading-relaxed relative rounded-b-xl overflow-hidden"
        style={{ minHeight }}
      />
    </div>
  );
}
