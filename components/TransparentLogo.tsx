"use client";

import { useEffect, useState } from "react";

interface TransparentLogoProps {
  src: string;
  alt: string;
  className?: string;
}

export default function TransparentLogo({ src, alt, className = "" }: TransparentLogoProps) {
  const [transparentSrc, setTransparentSrc] = useState<string | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setTransparentSrc(src);
          return;
        }
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // Remove white/light background pixels completely
          if (r > 215 && g > 215 && b > 215) {
            data[i + 3] = 0; // Alpha = 0 (100% transparent)
          }
        }

        ctx.putImageData(imgData, 0, 0);
        setTransparentSrc(canvas.toDataURL("image/png"));
      } catch (e) {
        setTransparentSrc(src);
      }
    };
    img.onerror = () => {
      setTransparentSrc(src);
    };
  }, [src]);

  return (
    <img
      src={transparentSrc || src}
      alt={alt}
      className={className}
    />
  );
}
