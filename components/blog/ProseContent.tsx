"use client";

const PROSE_STYLES = `
  .prose-content {
    font-size: 1.0625rem;
    line-height: 1.95;
    color: #5a4a38;
  }
  .prose-content h2 {
    font-size: 1.45rem !important;
    font-weight: 700 !important;
    margin: 2.25rem 0 0.7rem !important;
    color: #924c12 !important;
    padding-bottom: 0.4rem !important;
    border-bottom: 2px solid #faefd8 !important;
    line-height: 1.35 !important;
    letter-spacing: -0.01em !important;
  }
  .prose-content h3 {
    font-size: 1.2rem !important;
    font-weight: 700 !important;
    margin: 1.75rem 0 0.55rem !important;
    color: #b86515 !important;
    line-height: 1.4 !important;
  }
  .prose-content h4 {
    font-size: 1.05rem !important;
    font-weight: 700 !important;
    margin: 1.4rem 0 0.45rem !important;
    color: #924c12 !important;
    line-height: 1.45 !important;
  }
  .prose-content h2 a,
  .prose-content h3 a,
  .prose-content h4 a {
    color: inherit !important;
    text-decoration: none !important;
  }
  .prose-content p {
    margin: 1rem 0;
    line-height: 1.95;
    font-size: 1.0625rem;
    color: #5a4a38;
  }
  .prose-content p:first-of-type {
    font-size: 1.125rem;
    color: #4a3a28;
  }
  .prose-content ul { list-style: disc;    padding-left: 1.6rem; margin: 1rem 0; }
  .prose-content ol { list-style: decimal; padding-left: 1.6rem; margin: 1rem 0; }
  .prose-content li { margin: 0.45rem 0; line-height: 1.85; font-size: 1.0625rem; color: #5a4a38; }
  .prose-content blockquote {
    border-left: 4px solid #ecc070;
    padding: 0.75rem 1.25rem;
    color: #a85e30;
    background: #fdf8f0;
    border-radius: 0 0.5rem 0.5rem 0;
    margin: 1.5rem 0;
    font-style: italic;
    font-size: 1.05rem;
    line-height: 1.85;
  }
  .prose-content hr  { border: none; border-top: 2px solid #f7ede0; margin: 2.25rem 0; }
  .prose-content strong { font-weight: 700; color: #4a3a28; }
  .prose-content em     { font-style: italic; }
  .prose-content s      { text-decoration: line-through; }
  .prose-content a  { color: #b86515; text-decoration: underline; text-underline-offset: 3px; }
  .prose-content a:hover { color: #924c12; }
  .prose-content img { border-radius: 0.75rem; max-width: 100%; margin: 1.25rem 0; display: block; }
  .prose-content [style*="text-align: center"] { text-align: center; }
  .prose-content [style*="text-align: right"]  { text-align: right; }
  /* Tablo */
  .prose-content table {
    border-collapse: collapse;
    width: 100%;
    margin: 1.25rem 0;
    font-size: 0.9375rem;
  }
  .prose-content th {
    background: #fdf0dc;
    font-weight: 700;
    color: #924c12;
    padding: 0.55rem 0.85rem;
    border: 1px solid #edd8bc;
    text-align: left;
  }
  .prose-content td {
    padding: 0.5rem 0.85rem;
    border: 1px solid #edd8bc;
    vertical-align: top;
    color: #5a4a38;
  }
  .prose-content tr:nth-child(even) td { background: #fdf8f0; }
`;

interface Props {
  html: string;
}

export default function ProseContent({ html }: Props) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PROSE_STYLES }} />
      <div
        className="prose-content max-w-[70ch]"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </>
  );
}
