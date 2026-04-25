/**
 * Sunucu tarafı basit HTML sanitizer.
 * İzin verilen tagları ve attribute'ları korur, script/onerror gibi tehlikeli şeyleri siler.
 * Yalnızca içerik render için kullanılır (TipTap çıktısı gibi).
 */

// İzin verilen HTML tag'ları
const ALLOWED_TAGS = new Set([
  "p", "br", "strong", "b", "em", "i", "u", "s", "del",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li",
  "blockquote", "pre", "code",
  "a", "img",
  "table", "thead", "tbody", "tr", "th", "td",
  "div", "span",
  "hr",
]);

// İzin verilen attribute'lar (tag bazında değil, global)
const ALLOWED_ATTRS = new Set([
  "href", "src", "alt", "title", "class", "id",
  "target", "rel", "width", "height",
  "colspan", "rowspan",
]);

// Tehlikeli protokoller
const BAD_PROTOCOLS = /^(javascript|vbscript|data):/i;

export function sanitizeHtml(html: string): string {
  // Tag'ları işle
  return html.replace(/<([a-zA-Z][a-zA-Z0-9]*)((?:\s[^>]*)?)\s*\/?>|<\/([a-zA-Z][a-zA-Z0-9]*)>/g, (match, openTag, attrs, closeTag) => {
    if (closeTag) {
      return ALLOWED_TAGS.has(closeTag.toLowerCase()) ? `</${closeTag.toLowerCase()}>` : "";
    }

    const tag = openTag.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return "";

    // Attribute'ları filtrele
    const cleanAttrs = (attrs ?? "").replace(
      /\s([a-zA-Z\-:]+)\s*=\s*(?:"([^"]*?)"|'([^']*?)'|([^\s>]*))/g,
      (_: string, attrName: string, v1: string, v2: string, v3: string) => {
        const name = attrName.toLowerCase();
        const value = v1 ?? v2 ?? v3 ?? "";
        if (!ALLOWED_ATTRS.has(name)) return "";
        if ((name === "href" || name === "src") && BAD_PROTOCOLS.test(value.trim())) return "";
        return ` ${name}="${value.replace(/"/g, "&quot;")}"`;
      }
    );

    // Event handler'ları temizle (on*)
    const noEvents = cleanAttrs.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, "");

    return `<${tag}${noEvents}>`;
  });
}
