import sharp from "sharp";
import fs from "fs";
import path from "path";

async function generateIcons() {
  const iconsDir = path.join(process.cwd(), "public", "icons");
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  // Beautiful SVG Shield Icon with Emerald Gradients
  const svgIcon = `
  <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0b1324" />
        <stop offset="100%" stop-color="#050811" />
      </linearGradient>
      <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#34d399" />
        <stop offset="50%" stop-color="#10b981" />
        <stop offset="100%" stop-color="#059669" />
      </linearGradient>
      <linearGradient id="sparkleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="100%" stop-color="#a7f3d0" />
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="16" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    
    <!-- Background circle -->
    <rect width="512" height="512" rx="128" fill="url(#bgGrad)" />
    <rect width="504" height="504" x="4" y="4" rx="124" fill="none" stroke="#1e293b" stroke-width="8" />

    <!-- Glow & Shield Base -->
    <g filter="url(#glow)">
      <path d="M256 72 C330 72 380 96 380 96 C380 260 256 390 256 420 C256 390 132 260 132 96 C132 96 182 72 256 72 Z" fill="url(#shieldGrad)" />
    </g>

    <!-- Inner Shield Detail -->
    <path d="M256 96 C314 96 354 116 354 116 C354 250 256 360 256 385 C256 360 158 250 158 116 C158 116 198 96 256 96 Z" fill="#090d16" />

    <!-- Checkmark inside Shield -->
    <path d="M208 240 L242 274 L308 198" fill="none" stroke="url(#sparkleGrad)" stroke-width="26" stroke-linecap="round" stroke-linejoin="round" />

    <!-- Sparkle Stars -->
    <path d="M370 140 Q380 155 395 165 Q380 175 370 190 Q360 175 345 165 Q360 155 370 140 Z" fill="#34d399" />
    <path d="M140 280 Q148 292 160 300 Q148 308 140 320 Q132 308 120 300 Q132 292 140 280 Z" fill="#10b981" />
  </svg>
  `;

  const svgBuffer = Buffer.from(svgIcon);

  // Generate 512x512
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, "icon-512x512.png"));

  // Generate 192x192
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(iconsDir, "icon-192x192.png"));

  // Generate apple-touch-icon 180x180
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(iconsDir, "apple-touch-icon.png"));

  // Generate favicon.ico
  await sharp(svgBuffer)
    .resize(48, 48)
    .png()
    .toFile(path.join(process.cwd(), "public", "favicon.png"));

  console.log("PWA Icons generated successfully!");
}

generateIcons().catch(console.error);
