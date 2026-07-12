"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Fades/slides a section in once it enters the viewport. Respects
 * prefers-reduced-motion (CSS handles that — see .reveal in globals.css).
 * No-op after first reveal (doesn't re-hide on scroll away).
 *
 * `index` sets the `--i` CSS var .reveal uses for its transition-delay
 * (`--stagger-step` * `--i`), so mapped lists/grids get a staggered
 * entrance just by passing the map index — no fixed `.reveal-delay-N`
 * classes needed for new call sites.
 */
export function ScrollReveal({
  children,
  className,
  index,
}: {
  children: React.ReactNode;
  className?: string;
  index?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal${visible ? " reveal--visible" : ""}${className ? ` ${className}` : ""}`}
      style={index !== undefined ? ({ "--i": index } as React.CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}
