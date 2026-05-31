const sharp = require("sharp");
const path = require("path");

const SVG_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#12122a"/>
      <stop offset="100%" stop-color="#1a1040"/>
    </linearGradient>
    <linearGradient id="book" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#a78bfa"/>
      <stop offset="100%" stop-color="#7c5cf0"/>
    </linearGradient>
    <linearGradient id="star" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ff8c42"/>
      <stop offset="100%" stop-color="#f0c05c"/>
    </linearGradient>
  </defs>

  <!-- Background rounded rectangle -->
  <rect x="16" y="16" width="480" height="480" rx="96" ry="96" fill="url(#bg)"/>

  <!-- Subtle border -->
  <rect x="16" y="16" width="480" height="480" rx="96" ry="96" fill="none" stroke="#a78bfa" stroke-width="6" opacity="0.3"/>

  <!-- Open book -->
  <g transform="translate(256, 270)">
    <!-- Left page -->
    <path d="M-10,-80 C-50,-80 -120,-70 -140,-40 L-140,60 C-140,85 -100,95 -60,90 C-30,87 -10,80 -10,65 Z"
          fill="url(#book)" opacity="0.9"/>
    <!-- Right page -->
    <path d="M10,-80 C50,-80 120,-70 140,-40 L140,60 C140,85 100,95 60,90 C30,87 10,80 10,65 Z"
          fill="url(#book)" opacity="0.7"/>
    <!-- Book spine -->
    <rect x="-10" y="-80" width="20" height="150" rx="3" fill="#6a4ae0" opacity="0.8"/>
    <!-- Left page line -->
    <line x1="-10" y1="-70" x2="-130" y2="-35" stroke="#12122a" stroke-width="3" opacity="0.3"/>
    <line x1="-10" y1="-55" x2="-130" y2="-20" stroke="#12122a" stroke-width="3" opacity="0.3"/>
    <line x1="-10" y1="-40" x2="-130" y2="-5" stroke="#12122a" stroke-width="3" opacity="0.3"/>
    <!-- Right page line -->
    <line x1="10" y1="-70" x2="130" y2="-35" stroke="#12122a" stroke-width="3" opacity="0.2"/>
    <line x1="10" y1="-55" x2="130" y2="-20" stroke="#12122a" stroke-width="3" opacity="0.2"/>
    <line x1="10" y1="-40" x2="130" y2="-5" stroke="#12122a" stroke-width="3" opacity="0.2"/>
  </g>

  <!-- Star / sparkle -->
  <g transform="translate(310, 160)">
    <polygon points="0,-45 12,-15 45,-15 18,8 28,40 0,20 -28,40 -18,8 -45,-15 -12,-15"
             fill="url(#star)"/>
    <!-- Sparkle rays -->
    <line x1="0" y1="-65" x2="0" y2="-75" stroke="#ff8c42" stroke-width="4" stroke-linecap="round"/>
    <line x1="0" y1="65" x2="0" y2="75" stroke="#ff8c42" stroke-width="4" stroke-linecap="round"/>
    <line x1="-65" y1="0" x2="-75" y2="0" stroke="#ff8c42" stroke-width="4" stroke-linecap="round"/>
    <line x1="65" y1="0" x2="75" y2="0" stroke="#ff8c42" stroke-width="4" stroke-linecap="round"/>
  </g>

  <!-- Small floating dots -->
  <circle cx="150" cy="140" r="5" fill="#a78bfa" opacity="0.5"/>
  <circle cx="380" cy="370" r="4" fill="#ff8c42" opacity="0.4"/>
  <circle cx="120" cy="380" r="3" fill="#6ddb8e" opacity="0.3"/>
</svg>`;

async function main() {
  const outDir = path.resolve(__dirname, "..", "public");

  await sharp(Buffer.from(SVG_ICON))
    .resize(192, 192)
    .png()
    .toFile(path.join(outDir, "icon-192.png"));

  await sharp(Buffer.from(SVG_ICON))
    .resize(512, 512)
    .png()
    .toFile(path.join(outDir, "icon-512.png"));

  console.log("Icons generated: icon-192.png, icon-512.png");
}

main().catch(console.error);
