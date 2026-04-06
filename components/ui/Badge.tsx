import { clsx } from "clsx";

export type Category = "soup" | "main" | "side" | "dessert";

export const categoryLabels: Record<Category, string> = {
  soup:    "Çorba",
  main:    "Ana Yemek",
  side:    "Yardımcı Lezzet",
  dessert: "Tatlı",
};

const categoryColors: Record<Category, string> = {
  soup:    "bg-blue-100 text-blue-700",
  main:    "bg-brand-100 text-brand-700",
  side:    "bg-green-100 text-green-700",
  dessert: "bg-pink-100 text-pink-700",
};

interface BadgeProps {
  category: Category;
  className?: string;
}

export default function Badge({ category, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-block self-start w-fit px-2.5 py-0.5 rounded-full text-xs font-semibold",
        categoryColors[category],
        className
      )}
    >
      {categoryLabels[category]}
    </span>
  );
}
