// datda PWA 아이콘 생성 스크립트
// SVG → PNG 변환 (sharp 사용)
// 실행: npm install sharp --save-dev && node scripts/generate-icons.mjs

import sharp from "sharp";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, "../public");

// datda 아이콘 SVG - 미니멀한 "닫" 글자 + 보라색 악센트
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="108" fill="#1a1a1f"/>
  <circle cx="256" cy="220" r="8" fill="#a78bfa"/>
  <text x="256" y="320" text-anchor="middle" font-family="sans-serif" font-weight="600" font-size="200" fill="#e8e8f0">닫</text>
</svg>`;

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function main() {
  console.log("아이콘 생성 중...");

  const svgBuffer = Buffer.from(iconSvg);

  for (const size of sizes) {
    const outputPath = resolve(publicDir, `icon-${size}x${size}.png`);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`  ✓ icon-${size}x${size}.png`);
  }

  // Apple touch icon (180x180)
  const applePath = resolve(publicDir, "apple-touch-icon.png");
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(applePath);
  console.log("  ✓ apple-touch-icon.png");

  // Favicon 16x16 and 32x32
  for (const size of [16, 32]) {
    const faviconPath = resolve(publicDir, `favicon-${size}x${size}.png`);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(faviconPath);
    console.log(`  ✓ favicon-${size}x${size}.png`);
  }

  console.log("\n완료.");
}

main().catch(console.error);
