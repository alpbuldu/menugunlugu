"use client";

const PROSE_STYLES = `
  .prose-content h2 {
    font-size: 1.4rem !important;
    font-weight: 700 !important;
    margin: 2rem 0 0.65rem !important;
    color: #b86515 !important;
    padding-bottom: 0.35rem !important;
    border-bottom: 2px solid #faefd8 !important;
  }
  .prose-content h3 {
    font-size: 1.15rem !important;
    font-weight: 700 !important;
    margin: 1.6rem 0 0.5rem !important;
    color: #b86515 !important;
  }
  .prose-content h4 {
    font-size: 1rem !important;
    font-weight: 700 !important;
    margin: 1.2rem 0 0.4rem !important;
    color: #924c12 !important;
  }
  .prose-content h2 a,
  .prose-content h3 a,
  .prose-content h4 a {
    color: inherit !important;
    text-decoration: none !important;
  }
  .prose-content p  { margin: 0.85rem 0; line-height: 1.9; font-size: 1rem; }
  .prose-content p:first-of-type { font-size: 1.05rem; }
  .prose-content ul { list-style: disc;    padding-left: 1.6rem; margin: 0.85rem 0; }
  .prose-content ol { list-style: decimal; padding-left: 1.6rem; margin: 0.85rem 0; }
  .prose-content li { margin: 0.4rem 0; line-height: 1.85; }
  .prose-content blockquote {
    border-left: 4px solid #ecc070;
    padding: 0.6rem 1.2rem;
    color: #a85e30;
    background: #fdf8f0;
    border-radius: 0 0.5rem 0.5rem 0;
    margin: 1.25rem 0;
    font-style: italic;
  }
  .prose-content hr  { border: none; border-top: 2px solid #f7ede0; margin: 2rem 0; }
  .prose-content strong { font-weight: 700; }
  .prose-content em     { font-style: italic; }
  .prose-content s      { text-decoration: line-through; }
  .prose-content a  { color: #b86515; text-decoration: underline; text-underline-offset: 3px; }
  .prose-content a:hover { color: #924c12; }
  .prose-content img { border-radius: 0.75rem; max-width: 100%; margin: 1rem 0; }
  .prose-content [style*="text-align: center"] { text-align: center; }
  .prose-content [style*="text-align: right"]  { text-align: right; }
`;

interface Props {
  html: string;
}

export default function ProseContent({ html }: Props) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PROSE_STYLES }} />
      <div
        className="prose-content text-warm-700 text-[15px] leading-relaxed"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </>
  );
}
