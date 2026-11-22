// ikona.mjs — użycie: node ikona.mjs <plik.svg> <wyjście.png> [rozmiar=1024] [--alfa]
// Bez --alfa: PNG RGB bez kanału alfa, kod 1 przy przezroczystym pikselu (ikona iOS). Z --alfa: PNG RGBA (warstwy Androida, ekran startowy).
import { readFileSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const CRC = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = (b) => { let c = 0xffffffff; for (const x of b) c = CRC[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (typ, dane) => {
  const d = Buffer.concat([Buffer.from(typ, 'ascii'), dane]);
  const n = Buffer.alloc(4); n.writeUInt32BE(dane.length);
  const k = Buffer.alloc(4); k.writeUInt32BE(crc32(d));
  return Buffer.concat([n, d, k]);
};

export const nieprzezroczyste = (rgba) => { for (let i = 3; i < rgba.length; i += 4) if (rgba[i] !== 255) return false; return true; };

export function png(rgba, w, h, alfa) {
  const kan = alfa ? 4 : 3;
  const surowe = Buffer.alloc(h * (1 + w * kan)); // bajt filtra 0 na początku każdego wiersza
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) for (let k = 0; k < kan; k++) surowe[y * (1 + w * kan) + 1 + x * kan + k] = rgba[(y * w + x) * 4 + k];
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = alfa ? 6 : 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(surowe)), chunk('IEND', Buffer.alloc(0))]);
}

async function main() {
  const [plik, wyjscie, ...reszta] = process.argv.slice(2);
  if (!plik || !wyjscie) { console.error('Użycie: node ikona.mjs <plik.svg> <wyjście.png> [rozmiar=1024] [--alfa]'); process.exit(2); }
  const alfa = reszta.includes('--alfa');
  const r = Number(reszta.find((x) => /^\d+$/.test(x)) || 1024);
  const { chromium } = await import('playwright');
  const b = await chromium.launch();
  const p = await b.newPage();
  const b64 = await p.evaluate(async ({ svg, r }) => {
    const img = new Image();
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
    await img.decode();
    const c = document.createElement('canvas'); c.width = r; c.height = r;
    const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0, r, r);
    const d = ctx.getImageData(0, 0, r, r).data;
    let s = '';
    for (let i = 0; i < d.length; i += 0x8000) s += String.fromCharCode.apply(null, d.subarray(i, i + 0x8000));
    return btoa(s);
  }, { svg: readFileSync(resolve(plik), 'utf8'), r });
  await b.close();
  const rgba = new Uint8Array(Buffer.from(b64, 'base64'));
  if (!alfa && !nieprzezroczyste(rgba)) { console.log(`BŁĄD ${plik}: przezroczyste piksele; tło ikony iOS musi pokrywać cały kwadrat`); process.exit(1); }
  writeFileSync(wyjscie, png(rgba, r, r, alfa));
  console.log(`OK ${wyjscie}: ${r}×${r}, ${alfa ? 'RGBA' : 'RGB bez kanału alfa'}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
