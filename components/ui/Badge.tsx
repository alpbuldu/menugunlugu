import { clsx } from "clsx";

export type Category = "soup" | "main" | "side" | "dessert";

export const categoryLabels: Record<Category, string> = {
  soup:    "Çorba",
  main:    "Ana Yemek",
  side:    "Yardımcı Lezzet",
  dessert: "Tatlı",
};

const categoryLabelsShort: Record<Category, string> = {
  soup:    "Çorba",
  main:    "Ana Yemek",
  side:    "Yardımcı Lezzet",
  dessert: "Tatlı",
};

const categoryColors: Record<Category, string> = {
  soup:    "bg-brand-100 text-brand-700",
  main:    "bg-brand-100 text-brand-700",
  side:    "bg-brand-100 text-brand-700",
  dessert: "bg-brand-100 text-brand-700",
};

interface BadgeProps {
  category: Category;
  className?: string;
  /** Mobil dar kartlar için kısa etiket (Yardımcı Lezzet → Yardımcı) */
  compact?: boolean;
}

export default function Badge({ category, className, compact }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-block self-start w-fit px-2.5 py-0.5 rounded-full text-xs font-semibold",
        categoryColors[category],
        className
      )}
    >
      {compact ? categoryLabelsShort[category] : categoryLabels[category]}
    </span>
  );
}
