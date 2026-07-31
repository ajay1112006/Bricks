"use client";

import { useEffect, useState } from "react";

interface Sparkle {
  id: number;
  top: string;
  left: string;
  size: number;
  duration: number;
  delay: number;
}

export default function SparkleGoldTitle({ text }: { text: string }) {
  return (
    <div className="relative inline-block select-none">
      {/* Dimmed Shimmering Metallic Gold Text */}
      <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-extrabold tracking-wider gold-shimmer-text">
        {text}
      </h1>
    </div>
  );
}
