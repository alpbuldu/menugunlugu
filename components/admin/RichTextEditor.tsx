"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { Extension } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { useEffect } from "react";

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

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "İçerik yazın…",
  minHeight = "280px",
}: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
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

  // Sync external value (e.g. when editing existing post)
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
        <ToolBtn
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Geri al"
        >↩</ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="İleri al"
        >↪</ToolBtn>

        <Divider />

        {/* Bold / Italic / Underline */}
        <ToolBtn
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Kalın (Ctrl+B)"
        ><strong>B</strong></ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="İtalik (Ctrl+I)"
        ><em>İ</em></ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
          title="Altı çizili (Ctrl+U)"
        ><span className="underline">A</span></ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
          title="Üstü çizili"
        ><s>S</s></ToolBtn>

        <Divider />

        {/* Başlıklar */}
        <ToolBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
          title="Büyük başlık"
        >H2</ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
          title="Orta başlık"
        >H3</ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
          active={editor.isActive("heading", { level: 4 })}
          title="Küçük başlık"
        >H4</ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().setParagraph().run()}
          active={editor.isActive("paragraph")}
          title="Normal metin"
        >¶</ToolBtn>

        <Divider />

        {/* Listeler */}
        <ToolBtn
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Madde listesi"
        >• —</ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="Numaralı liste"
        >1.</ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          title="Alıntı"
        >&ldquo;&rdquo;</ToolBtn>

        <Divider />

        {/* Hizalama */}
        <ToolBtn
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          active={editor.isActive({ textAlign: "left" })}
          title="Sola hizala"
        >⬅</ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          active={editor.isActive({ textAlign: "center" })}
          title="Ortala"
        >☰</ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          active={editor.isActive({ textAlign: "right" })}
          title="Sağa hizala"
        >➡</ToolBtn>

      </div>

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
        .tiptap-editor a  { color: #b86515; text-decoration: underline; text-underline-offset: 3px; }
      `}</style>
      <EditorContent
        editor={editor}
        className="tiptap-editor px-4 py-3 text-warm-800 text-[15px] leading-relaxed relative"
        style={{ minHeight }}
      />
    </div>
  );
}
