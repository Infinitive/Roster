import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Clean, geometric, architectural T9 SVG
// Dimensions 512x512 with a dark graphite foundation (#0c0e12) and warm amber signature (#f59e0b)
const createSvg = (maskable = false) => {
  const padding = maskable ? 96 : 48;
  const size = 512 - (padding * 2);
  const cornerRadius = maskable ? 0 : 72;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#14171f"/>
      <stop offset="100%" stop-color="#08090c"/>
    </linearGradient>
    <linearGradient id="amberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
    <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2a2e3d"/>
      <stop offset="100%" stop-color="#161820"/>
    </linearGradient>
    <filter id="subtleGlow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="#f59e0b" flood-opacity="0.25"/>
    </filter>
  </defs>

  ${maskable ? `
    <rect width="512" height="512" fill="url(#bgGrad)"/>
  ` : `
    <!-- Squircle container -->
    <rect x="20" y="20" width="472" height="472" rx="92" fill="url(#bgGrad)" stroke="url(#borderGrad)" stroke-width="4"/>
    <rect x="24" y="24" width="464" height="464" rx="88" fill="none" stroke="#ffffff" stroke-opacity="0.04" stroke-width="2"/>
  `}

  <!-- Architectural Geometric T9 Mark -->
  <g transform="translate(${maskable ? 32 : 0}, ${maskable ? 24 : 0})">
    <!-- The "T" in structured titanium -->
    <!-- Top bar of T -->
    <path d="M 108 152 L 244 152 C 248 152 252 156 252 160 L 252 188 C 252 192 248 196 244 196 L 198 196 L 198 348 C 198 354 194 358 188 358 L 154 358 C 148 358 144 354 144 348 L 144 196 L 108 196 C 104 196 100 192 100 188 L 100 160 C 100 156 104 152 108 152 Z" 
          fill="#f4f4f5"/>
    
    <!-- Accent slash on T crossbar -->
    <polygon points="100,160 120,152 100,188" fill="#a1a1aa" opacity="0.3"/>

    <!-- The "9" - interlocked, featuring the signature warm amber energy -->
    <!-- 9 upper loop outer -->
    <path d="M 276 152 L 388 152 C 404 152 416 164 416 180 L 416 264 C 416 280 404 292 388 292 L 332 292 L 332 346 C 332 354 326 360 318 360 L 284 360 C 276 360 270 354 270 346 L 270 236 C 270 220 282 208 298 208 L 362 208 L 362 196 L 276 196 C 270 196 266 192 266 186 L 266 162 C 266 156 270 152 276 152 Z"
          fill="url(#amberGrad)"
          filter="url(#subtleGlow)"/>

    <!-- 9 inner loop cutout (negative space) -->
    <rect x="320" y="244" width="42" height="14" rx="4" fill="#0c0e12" opacity="0.9"/>
    
    <!-- Small geometric signature pip -->
    <rect x="372" y="336" width="24" height="24" rx="6" fill="url(#amberGrad)" opacity="0.9"/>
  </g>
</svg>`;
};

async function run() {
  const publicDir = path.resolve('public');

  const standardSvg = createSvg(false);
  const maskableSvg = createSvg(true);

  // Write favicon.svg
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), standardSvg);

  // Generate PNGs
  await sharp(Buffer.from(standardSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  await sharp(Buffer.from(standardSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'icon-192.png'));

  await sharp(Buffer.from(standardSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'));

  await sharp(Buffer.from(standardSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'icon.png'));

  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-512-maskable.png'));

  console.log('Icon package generated successfully!');
}

run().catch(console.error);
