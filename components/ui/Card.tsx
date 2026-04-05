import { twMerge } from "tailwind-merge";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={twMerge(
        "bg-white rounded-2xl shadow-sm border border-warm-100 overflow-hidden",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardBody({ children, className }: CardProps) {
  return (
    <div className={twMerge("p-5", className)}>{children}</div>
  );
}
