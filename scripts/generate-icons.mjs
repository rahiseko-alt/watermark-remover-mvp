import sharp from "sharp";
import fs from "fs";
import path from "path";

async function generateFuturisticCyberIcon() {
  const iconsDir = path.join(process.cwd(), "public", "icons");
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  // Ultra-Premium Cyberpunk / Security Clean Watermark SVG Design (512x512)
  const svgContent = `
  <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Background Gradients -->
      <radialGradient id="bgRadial" cx="50%" cy="40%" r="65%">
        <stop offset="0%" stop-color="#132338" />
        <stop offset="55%" stop-color="#09101d" />
        <stop offset="100%" stop-color="#04060c" />
      </radialGradient>
      
      <!-- Neon Shield Gradient -->
      <linearGradient id="shieldBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#38bdf8" />
        <stop offset="35%" stop-color="#34d399" />
        <stop offset="70%" stop-color="#10b981" />
        <stop offset="100%" stop-color="#059669" />
      </linearGradient>

      <linearGradient id="coreCleanGrad" x1="20%" y1="0%" x2="80%" y2="100%">
        <stop offset="0%" stop-color="#a7f3d0" />
        <stop offset="40%" stop-color="#34d399" />
        <stop offset="100%" stop-color="#06b6d4" />
      </linearGradient>

      <!-- Glow Filters -->
      <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="blur1" />
        <feGaussianBlur in="SourceGraphic" stdDeviation="28" result="blur2" />
        <feMerge>
          <feMergeNode in="blur2" />
          <feMergeNode in="blur1" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <!-- Glass / Facet Gradients -->
      <linearGradient id="glassFacetLeft" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.25" />
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0.02" />
      </linearGradient>
      
      <linearGradient id="glassFacetRight" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.3" />
        <stop offset="100%" stop-color="#059669" stop-opacity="0.05" />
      </linearGradient>
    </defs>

    <!-- Outer Rounded Base Frame -->
    <rect width="512" height="512" rx="116" fill="url(#bgRadial)" />
    <rect width="504" height="504" x="4" y="4" rx="112" fill="none" stroke="#1e293b" stroke-width="3" stroke-opacity="0.8" />
    <rect width="496" height="496" x="8" y="8" rx="108" fill="none" stroke="url(#shieldBorderGrad)" stroke-width="1.5" stroke-opacity="0.4" />

    <!-- Ambient Circuit / Tech Grid Accents -->
    <circle cx="256" cy="256" r="190" fill="none" stroke="#10b981" stroke-width="1" stroke-opacity="0.15" stroke-dasharray="8 12" />
    <circle cx="256" cy="256" r="145" fill="none" stroke="#38bdf8" stroke-width="1" stroke-opacity="0.2" stroke-dasharray="4 8" />

    <!-- Pulsing Cyber Shield Backdrop Glow -->
    <path d="M256 70 C340 70 395 100 395 100 C395 270 256 405 256 440 C256 405 117 270 117 100 C117 100 172 70 256 70 Z" 
          fill="none" stroke="url(#shieldBorderGrad)" stroke-width="20" opacity="0.35" filter="url(#neonGlow)" />

    <!-- Main Outer Shield Body -->
    <path d="M256 76 C334 76 385 104 385 104 C385 264 256 392 256 426 C256 392 127 264 127 104 C127 104 178 76 256 76 Z" 
          fill="#0a101f" stroke="url(#shieldBorderGrad)" stroke-width="8" stroke-linejoin="round" />

    <!-- Left Facet (Reflective Glass) -->
    <path d="M256 82 C200 82 135 108 135 108 C135 258 256 382 256 418 L256 82 Z" 
          fill="url(#glassFacetLeft)" />

    <!-- Right Facet (Neon Cyan Tint) -->
    <path d="M256 82 C312 82 377 108 377 108 C377 258 256 382 256 418 L256 82 Z" 
          fill="url(#glassFacetRight)" />

    <!-- Center Clean / Watermark Purifier Emblem (Water Drop + Cyber Blade + Shield Check) -->
    <!-- Purified Waterdrop Silhouette -->
    <path d="M256 142 C256 142 320 226 320 280 C320 315 291 344 256 344 C221 344 192 315 192 280 C192 226 256 142 256 142 Z" 
          fill="#061224" stroke="url(#coreCleanGrad)" stroke-width="5" filter="url(#softGlow)" />

    <!-- Digital Clean Scan Beam -->
    <path d="M196 270 Q256 254 316 270" fill="none" stroke="#38bdf8" stroke-width="4" stroke-linecap="round" opacity="0.8" />
    <path d="M208 290 Q256 276 304 290" fill="none" stroke="#34d399" stroke-width="3" stroke-linecap="round" opacity="0.9" />

    <!-- Dynamic Laser Checkmark (100% Cleaned Symbol) -->
    <path d="M220 274 L248 302 L302 232" 
          fill="none" stroke="url(#coreCleanGrad)" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" filter="url(#neonGlow)" />
    <path d="M220 274 L248 302 L302 232" 
          fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />

    <!-- Top Sparkle Lens Flare -->
    <circle cx="256" cy="142" r="5" fill="#ffffff" filter="url(#softGlow)" />
    <polygon points="256,128 260,142 274,142 262,148 266,162 256,152 246,162 250,148 238,142 252,142" fill="#38bdf8" opacity="0.9" />

    <!-- Corner Cybernetic Tech Markings -->
    <path d="M80 140 L80 80 L140 80" fill="none" stroke="#34d399" stroke-width="4" stroke-linecap="round" opacity="0.6" />
    <path d="M432 140 L432 80 L372 80" fill="none" stroke="#38bdf8" stroke-width="4" stroke-linecap="round" opacity="0.6" />
    <path d="M80 372 L80 432 L140 432" fill="none" stroke="#10b981" stroke-width="4" stroke-linecap="round" opacity="0.6" />
    <path d="M432 372 L432 432 L372 432" fill="none" stroke="#34d399" stroke-width="4" stroke-linecap="round" opacity="0.6" />
  </svg>
  `;

  const svgBuffer = Buffer.from(svgContent);

  // 1. Generate 512x512 Master PWA Icon
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, "icon-512x512.png"));

  // 2. Generate 192x192 Standard Android PWA Icon
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(iconsDir, "icon-192x192.png"));

  // 3. Generate 180x180 Apple Touch Icon (iOS Home Screen)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(iconsDir, "apple-touch-icon.png"));

  // 4. Generate 64x64 / 48x48 Favicon
  await sharp(svgBuffer)
    .resize(64, 64)
    .png()
    .toFile(path.join(process.cwd(), "public", "favicon.png"));

  // 5. Generate Maskable Icon (safe zone padded)
  const maskableSvg = `
  <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" fill="#09101d" />
    <g transform="translate(51, 51) scale(0.8)">
      ${svgContent.replace(/<svg[^>]*>/, "").replace(/<\/svg>/, "")}
    </g>
  </svg>
  `;
  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, "maskable-icon.png"));

  console.log("🔥 Futuristic Smartphone PWA Icons generated successfully!");
}

generateFuturisticCyberIcon().catch(console.error);
