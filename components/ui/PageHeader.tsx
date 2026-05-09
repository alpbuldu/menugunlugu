interface PageHeaderProps {
  title: string;
  description: string;
  emoji?: string;
  className?: string;
}

export default function PageHeader({ title, description, emoji, className }: PageHeaderProps) {
  return (
    <div className={`text-center py-4 sm:py-8 mb-4 sm:mb-6 rounded-2xl border bg-brand-100 border-brand-200 ${className ?? ""}`}>
      <h1 className="text-xl sm:text-2xl font-extrabold text-warm-900 mb-1.5">{title}</h1>
      <p className="text-xs sm:text-sm text-warm-500 sm:whitespace-nowrap overflow-hidden text-ellipsis px-6 line-clamp-2 sm:line-clamp-1">{description}</p>
    </div>
  );
}
