// kontrast.mjs — wejście: JSON {"nazwa pary": ["#tekst", "#tło", próg?], ...}; próg domyślnie 4.5
import { readFileSync } from 'node:fs';
const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lum = (hex) => { const n = parseInt(hex.slice(1), 16); return 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255); };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const hex6 = /^#[0-9a-f]{6}$/i;
const pairs = JSON.parse(readFileSync(process.argv[2], 'utf8'));
let fail = 0;
for (const [name, [fg, bg, min = 4.5]] of Object.entries(pairs)) {
  if (!hex6.test(fg) || !hex6.test(bg)) { console.log(`ZŁY FORMAT ${name}: ${fg} / ${bg} (wymagany #RRGGBB)`); fail++; continue; }
  const r = ratio(fg, bg);
  if (r < min) fail++;
  console.log(`${r >= min ? 'OK  ' : 'BRAK'} ${r.toFixed(2)}:1 (min ${min}) ${name} ${fg} na ${bg}`);
}
process.exit(fail ? 1 : 0);
