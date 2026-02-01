/**
 * Brand Asset Generator for EasyTalk
 *
 * Generates:
 * - /public/og.png (1200x630 Open Graph image)
 * - /public/og-twitter.png (1200x600 Twitter card)
 * - /public/favicon.ico (multi-size ICO)
 * - /public/favicon-32x32.png
 * - /public/favicon-16x16.png
 * - /public/apple-touch-icon.png (180x180)
 *
 * Run: npx tsx scripts/generate-assets.ts
 */

import sharp from "sharp";
import pngToIco from "png-to-ico";
import { writeFileSync } from "fs";
import { join } from "path";

const PUBLIC_DIR = join(process.cwd(), "public");

// Brand colors (from globals.css - light mode)
const COLORS = {
  background: "#ffffff",
  foreground: "#111111",
  muted: "#f5f5f5",
  mutedForeground: "#666666",
  border: "#ebebeb",
  accent: "#22c55e", // green for live indicator
};

/**
 * Generate a pixel globe pattern as SVG
 * Inspired by the PixelGlobe component
 */
function generatePixelGlobeSVG(
  size: number,
  density: number = 20,
  color: string = COLORS.foreground,
  opacity: number = 0.15
): string {
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.4;
  const pixelSize = size / density;

  let pixels = "";

  for (let i = 0; i < density; i++) {
    for (let j = 0; j < density; j++) {
      const x = (i / density) * size;
      const y = (j / density) * size;

      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < radius) {
        const normalizedDist = distance / radius;
        const baseOpacity = 0.3 + (1 - normalizedDist) * 0.7;

        // Add texture variation
        const noise =
          Math.sin(x * 0.05) * Math.cos(y * 0.05) * 0.3 +
          Math.sin(x * 0.02 + y * 0.02) * 0.2;

        if (Math.random() < baseOpacity + noise) {
          const pixelOpacity = Math.min(1, baseOpacity + noise * 0.5) * opacity;
          pixels += `<rect x="${x - pixelSize / 2}" y="${y - pixelSize / 2}" width="${pixelSize * 0.8}" height="${pixelSize * 0.8}" fill="${color}" opacity="${pixelOpacity.toFixed(2)}"/>`;
        }
      } else if (distance < radius * 1.5) {
        // Dispersing particles
        const disperseChance = 1 - (distance - radius) / (radius * 0.5);
        if (Math.random() < disperseChance * 0.2) {
          const pixelOpacity = disperseChance * 0.4 * opacity;
          pixels += `<rect x="${x - pixelSize / 2}" y="${y - pixelSize / 2}" width="${pixelSize * 0.8}" height="${pixelSize * 0.8}" fill="${color}" opacity="${pixelOpacity.toFixed(2)}"/>`;
        }
      }
    }
  }

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">${pixels}</svg>`;
}

/**
 * Generate OG Image (1200x630)
 */
async function generateOGImage(): Promise<void> {
  const width = 1200;
  const height = 630;
  const globeSize = 500;

  // Generate pixel globe
  const globeSVG = generatePixelGlobeSVG(globeSize, 25, COLORS.foreground, 0.12);

  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bgGradient" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stop-color="${COLORS.muted}" stop-opacity="0.5"/>
          <stop offset="100%" stop-color="${COLORS.background}"/>
        </radialGradient>
      </defs>

      <!-- Background -->
      <rect width="${width}" height="${height}" fill="${COLORS.background}"/>
      <rect width="${width}" height="${height}" fill="url(#bgGradient)"/>

      <!-- Pixel Globe (centered, slightly up) -->
      <g transform="translate(${(width - globeSize) / 2}, ${(height - globeSize) / 2 - 40})">
        ${globeSVG.replace(/<svg[^>]*>/, "").replace("</svg>", "")}
      </g>

      <!-- EasyTalk Text -->
      <text x="${width / 2}" y="${height / 2 + 60}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="72" font-weight="700" fill="${COLORS.foreground}">EasyTalk</text>

      <!-- Tagline -->
      <text x="${width / 2}" y="${height / 2 + 110}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="24" fill="${COLORS.mutedForeground}">Speak Your Language. Connect with Everyone.</text>

      <!-- Live indicator badge -->
      <g transform="translate(${width / 2 - 100}, ${height / 2 + 140})">
        <rect x="0" y="0" width="200" height="32" rx="16" fill="${COLORS.muted}"/>
        <circle cx="20" cy="16" r="5" fill="${COLORS.accent}"/>
        <text x="36" y="21" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="${COLORS.mutedForeground}">Real-time AI translation</text>
      </g>
    </svg>
  `;

  await sharp(Buffer.from(svg)).png().toFile(join(PUBLIC_DIR, "og.png"));
  console.log("Generated: /public/og.png");
}

/**
 * Generate Twitter Card (1200x600)
 */
async function generateTwitterImage(): Promise<void> {
  const width = 1200;
  const height = 600;
  const globeSize = 450;

  const globeSVG = generatePixelGlobeSVG(globeSize, 24, COLORS.foreground, 0.1);

  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bgGradient" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stop-color="${COLORS.muted}" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="${COLORS.background}"/>
        </radialGradient>
      </defs>

      <!-- Background -->
      <rect width="${width}" height="${height}" fill="${COLORS.background}"/>
      <rect width="${width}" height="${height}" fill="url(#bgGradient)"/>

      <!-- Pixel Globe -->
      <g transform="translate(${(width - globeSize) / 2}, ${(height - globeSize) / 2 - 30})">
        ${globeSVG.replace(/<svg[^>]*>/, "").replace("</svg>", "")}
      </g>

      <!-- EasyTalk Text -->
      <text x="${width / 2}" y="${height / 2 + 50}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="64" font-weight="700" fill="${COLORS.foreground}">EasyTalk</text>

      <!-- Tagline -->
      <text x="${width / 2}" y="${height / 2 + 95}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="22" fill="${COLORS.mutedForeground}">Speak Your Language. Connect with Everyone.</text>
    </svg>
  `;

  await sharp(Buffer.from(svg)).png().toFile(join(PUBLIC_DIR, "og-twitter.png"));
  console.log("Generated: /public/og-twitter.png");
}

/**
 * Generate Favicon (pixel globe icon)
 */
async function generateFavicon(): Promise<void> {
  const sizes = [16, 32, 48, 180];

  for (const size of sizes) {
    // For favicon, create a more condensed pixel globe
    const density = size <= 32 ? 8 : size <= 48 ? 12 : 16;
    const globeSVG = generatePixelGlobeSVG(size, density, COLORS.foreground, 0.9);

    const svg = `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" fill="${COLORS.background}"/>
        ${globeSVG.replace(/<svg[^>]*>/, "").replace("</svg>", "")}
      </svg>
    `;

    const filename =
      size === 180
        ? "apple-touch-icon.png"
        : `favicon-${size}x${size}.png`;

    await sharp(Buffer.from(svg)).png().toFile(join(PUBLIC_DIR, filename));
    console.log(`Generated: /public/${filename}`);
  }

  // Generate ICO from the PNG files
  const ico16 = join(PUBLIC_DIR, "favicon-16x16.png");
  const ico32 = join(PUBLIC_DIR, "favicon-32x32.png");
  const ico48 = join(PUBLIC_DIR, "favicon-48x48.png");

  const icoBuffer = await pngToIco([ico16, ico32, ico48]);
  writeFileSync(join(PUBLIC_DIR, "favicon.ico"), icoBuffer);
  console.log("Generated: /public/favicon.ico");
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  console.log("Generating EasyTalk brand assets...\n");

  try {
    await generateOGImage();
    await generateTwitterImage();
    await generateFavicon();

    console.log("\nAll assets generated successfully!");
  } catch (error) {
    console.error("Error generating assets:", error);
    process.exit(1);
  }
}

main();
