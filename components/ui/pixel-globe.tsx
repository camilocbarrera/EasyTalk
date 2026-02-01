"use client";

import { useEffect, useRef } from "react";

interface PixelGlobeProps {
  className?: string;
  density?: number;
  animated?: boolean;
}

export function PixelGlobe({
  className = "",
  density = 40,
  animated = true,
}: PixelGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = 500;

    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.4;
    const pixelSize = size / density;

    interface Pixel {
      x: number;
      y: number;
      baseOpacity: number;
      offset: number;
      dispersed: boolean;
      dispersionX: number;
      dispersionY: number;
    }

    const pixels: Pixel[] = [];

    // Generate globe pixels
    for (let i = 0; i < density; i++) {
      for (let j = 0; j < density; j++) {
        const x = (i / density) * size;
        const y = (j / density) * size;

        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < radius) {
          // Inside the globe - higher density
          const normalizedDist = distance / radius;
          const opacity = 0.3 + (1 - normalizedDist) * 0.7;

          // Add some texture variation (continents-like)
          const noise =
            Math.sin(x * 0.05) * Math.cos(y * 0.05) * 0.3 +
            Math.sin(x * 0.02 + y * 0.02) * 0.2;

          if (Math.random() < opacity + noise) {
            pixels.push({
              x,
              y,
              baseOpacity: Math.min(1, opacity + noise * 0.5),
              offset: Math.random() * Math.PI * 2,
              dispersed: false,
              dispersionX: 0,
              dispersionY: 0,
            });
          }
        } else if (distance < radius * 1.8) {
          // Dispersing particles outside
          const disperseChance = 1 - (distance - radius) / (radius * 0.8);
          if (Math.random() < disperseChance * 0.3) {
            const angle = Math.atan2(dy, dx);
            const dispersion = (distance - radius) / radius;

            pixels.push({
              x,
              y,
              baseOpacity: disperseChance * 0.6,
              offset: Math.random() * Math.PI * 2,
              dispersed: true,
              dispersionX: Math.cos(angle) * dispersion * 20,
              dispersionY: Math.sin(angle) * dispersion * 20,
            });
          }
        }
      }
    }

    let time = 0;

    const draw = () => {
      ctx.clearRect(0, 0, size, size);

      // Get computed color from CSS
      const computedStyle = getComputedStyle(canvas);
      const color = computedStyle.color || "#000000";

      pixels.forEach((pixel) => {
        let opacity = pixel.baseOpacity;
        let x = pixel.x;
        let y = pixel.y;

        if (animated) {
          // Subtle pulsing
          opacity *= 0.8 + Math.sin(time * 0.02 + pixel.offset) * 0.2;

          // Dispersed particles drift slightly
          if (pixel.dispersed) {
            x += Math.sin(time * 0.01 + pixel.offset) * 3;
            y += Math.cos(time * 0.01 + pixel.offset) * 3;
          }
        }

        ctx.fillStyle = color;
        ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
        ctx.fillRect(
          x - pixelSize / 2,
          y - pixelSize / 2,
          pixelSize * 0.8,
          pixelSize * 0.8
        );
      });

      ctx.globalAlpha = 1;
      time++;

      if (animated) {
        animationRef.current = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [density, animated]);

  return (
    <canvas
      ref={canvasRef}
      className={`text-foreground ${className}`}
      aria-hidden="true"
    />
  );
}
