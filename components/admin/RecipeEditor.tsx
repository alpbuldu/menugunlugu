"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { Extension } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

/** Enter tuşuna basınca başlıktan çıkıp paragraf'a geç */
const HeadingBreak = Extension.create({
  name: "headingBreak",
  addKeyboardShortcuts() {
    return {
      Enter: () => {
        const { state } = this.editor;
        const { $from } = state.selection;
        if ($from.parent.type.name === "heading") {
          return this.editor.chain().splitBlock().setNode("paragraph").run();
        }
        return false;
      },
    };
  },
});

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  /** "ingredients" → bullet list ağırlıklı | "instructions" → numaralı liste ağırlıklı */
  mode?: "ingredients" | "instructions";
}

function ToolBtn({
  onClick, active, disabled, title, children,
}: {
  onClick: () => void; active?: boolean; disabled?: boolean;
  title: string; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      disabled={disabled}
      title={title}
      className={[
        "px-2 py-1 rounded text-sm font-medium transition-colors select-none",
        active   ? "bg-warm-700 text-white" : "text-warm-600 hover:bg-warm-100 hover:text-warm-900",
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

export default function RecipeEditor({
  value,
  onChange,
  placeholder = "Yazın…",
  minHeight = "180px",
  mode = "ingredients",
}: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [3, 4] } }),
      HeadingBreak,
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

  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== value && value !== undefined) {
      editor.commands.setContent(value || "", false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!editor) return null;

  return (
    <div className="border border-warm-200 rounded-xl overflow-hidden focus-within:border-brand-400 focus-within:ring-1 focus-within:ring-brand-200 transition-shadow">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 bg-warm-50 border-b border-warm-200">
        {/* Geri / İleri */}
        <ToolBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Geri al">↩</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="İleri al">↪</ToolBtn>

        <Divider />

        {/* Bold */}
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Kalın">
          <strong>B</strong>
        </ToolBtn>

        <Divider />

        {/* Başlıklar — bölüm ayırıcı olarak */}
        <ToolBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
          title="Bölüm başlığı (örn: Sos için)"
        >
          Başlık
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().setParagraph().run()}
          active={editor.isActive("paragraph")}
          title="Normal metin"
        >
          Metin
        </ToolBtn>

        <Divider />

        {/* Listeler */}
        <ToolBtn
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Madde listesi (malzemeler için)"
        >• —</ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="Numaralı liste (adımlar için)"
        >1.</ToolBtn>
      </div>

      {/* ── Editor ── */}
      <style>{`
        .recipe-editor [data-placeholder]::before {
          content: attr(data-placeholder);
          color: #b0a99a;
          pointer-events: none;
          position: absolute;
          float: left;
          height: 0;
        }
        .recipe-editor h3 {
          font-size: 0.95rem;
          font-weight: 700;
          margin: 0.9rem 0 0.3rem;
          color: #2d2926;
          border-bottom: 1px solid #ede8e3;
          padding-bottom: 0.2rem;
        }
        .recipe-editor h4 {
          font-size: 0.85rem;
          font-weight: 700;
          margin: 0.7rem 0 0.2rem;
          color: #4a3f38;
        }
        .recipe-editor p   { margin: 0.3rem 0; line-height: 1.7; }
        .recipe-editor ul  { list-style: disc;    padding-left: 1.4rem; margin: 0.4rem 0; }
        .recipe-editor ol  { list-style: decimal; padding-left: 1.4rem; margin: 0.4rem 0; }
        .recipe-editor li  { margin: 0.2rem 0; line-height: 1.6; }
        .recipe-editor strong { font-weight: 700; }
      `}</style>
      <EditorContent
        editor={editor}
        className="recipe-editor px-4 py-3 text-warm-800 text-sm leading-relaxed relative"
        style={{ minHeight }}
      />
    </div>
  );
}
