"use client";

import { useEffect, useState } from "react";

export default function WatermarkV() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
          if (totalScroll > 0) {
            const progress = Math.min(1, Math.max(0, window.scrollY / totalScroll));
            setScrollProgress(progress);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Interpolate horizontal position (translateX) from 15% (right side) to -35% (left side)
  const translateX = 15 - scrollProgress * 50;
  // Interpolate vertical position (translateY) from -6% to +6%
  const translateY = -6 + scrollProgress * 12;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* Giant V SVG Watermark sliding smoothly across the screen on scroll */}
      <svg
        className="absolute top-0 right-0 h-[125%] w-[90vw] max-w-[1300px] text-slate-900/[0.055] dark:text-amber-200/[0.04] transition-colors duration-500 pointer-events-none"
        style={{
          transform: `translate3d(${translateX}%, ${translateY}%, 0)`,
          willChange: "transform",
          transition: "transform 0.15s ease-out",
        }}
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMaxYMin meet"
      >
        <text
          x="650"
          y="840"
          textAnchor="middle"
          fill="currentColor"
          className="font-serif"
          style={{
            fontFamily: "var(--font-serif), 'Cinzel', Georgia, serif",
            fontSize: "960px",
            fontWeight: 700,
          }}
        >
          V
        </text>
      </svg>

      {/* Subtle Warm Ambient Gold Glow Effect tracking the scroll */}
      <div
        className="absolute top-10 w-[700px] h-[700px] bg-amber-500/[0.03] dark:bg-amber-400/[0.03] rounded-full blur-3xl pointer-events-none"
        style={{
          right: `${25 + scrollProgress * 40}%`,
          transition: "right 0.2s ease-out",
        }}
      />
    </div>
  );
}
