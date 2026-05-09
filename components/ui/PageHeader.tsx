interface PageHeaderProps {
  title: string;
  description: string;
  emoji?: string;
}

export default function PageHeader({ title, description, emoji }: PageHeaderProps) {
  return (
    <div className="text-center py-7 sm:py-10 mb-6 sm:mb-8 bg-warm-50 rounded-2xl border border-warm-100">
      {emoji && <p className="text-3xl mb-2">{emoji}</p>}
      <h1 className="text-xl sm:text-2xl font-extrabold text-warm-900 mb-1.5">{title}</h1>
      <p className="text-xs sm:text-sm text-warm-500 max-w-md mx-auto px-4">{description}</p>
    </div>
  );
}
