"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Placeholder shown until section enters viewport */
  fallback?: ReactNode;
  /** How far before the section enters the viewport to start loading (default 300px) */
  rootMargin?: string;
  className?: string;
}

/**
 * Defers rendering children until the section scrolls into view.
 * For client components like CommentSection this also defers the data fetch.
 */
export default function LazySection({
  children,
  fallback,
  rootMargin = "300px 0px",
  className,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // If already in view on mount (e.g. very short pages), show immediately
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight + 300) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div ref={ref} className={className}>
      {visible ? children : (fallback ?? <div style={{ minHeight: "120px" }} />)}
    </div>
  );
}
