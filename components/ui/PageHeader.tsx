interface PageHeaderProps {
  title: string;
  description: string;
  emoji?: string;
  className?: string;
}

export default function PageHeader({ title, description, emoji, className }: PageHeaderProps) {
  return (
    <div className={`text-center py-7 sm:py-10 mb-6 sm:mb-8 rounded-2xl border bg-warm-50 border-warm-100 ${className ?? ""}`}>
      {emoji && <p className="text-3xl mb-2">{emoji}</p>}
      <h1 className="text-xl sm:text-2xl font-extrabold text-warm-900 mb-1.5">{title}</h1>
      <p className="text-xs sm:text-sm text-warm-500 whitespace-nowrap overflow-hidden text-ellipsis px-6">{description}</p>
    </div>
  );
}
