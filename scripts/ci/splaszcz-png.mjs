#!/usr/bin/env node
// Spłaszczenie kanału alfa w PNG (10-wydanie-017, sesja AH, 2026-11-11): `xcrun simctl io screenshot` zapisuje RGBA (alfa 255), a App Store Connect odrzuca obrazy z alfą
// („Images can’t include alpha channels or transparencies.”). Runner macOS nie ma ImageMagicka, więc bez zależności: dekodowanie 8-bitowego PNG (RGBA lub RGB, bez przeplotu),
// złożenie na białym tle i zapis jako RGB. Wejście RGB jest kopiowane bez zmian pikseli.
// Użycie: node scripts/ci/splaszcz-png.mjs <wejście.png> <wyjście.png>   (kod 0 = zapisano plik RGB; 1 = nieobsługiwany format)
import { readFileSync, writeFileSync } from 'node:fs';
import { crc32, deflateSync, inflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const SYGNATURA = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function kawalki(buf) {
  const wynik = []; let p = 8;
  while (p + 12 <= buf.length) {
    const dl = buf.readUInt32BE(p); const typ = buf.toString('latin1', p + 4, p + 8);
    wynik.push({ typ, dane: buf.subarray(p + 8, p + 8 + dl) }); p += 12 + dl;
  }
  return wynik;
}
const kawalek = (typ, dane) => {
  const t = Buffer.from(typ, 'latin1'); const naglowek = Buffer.alloc(4); naglowek.writeUInt32BE(dane.length);
  const suma = Buffer.alloc(4); suma.writeUInt32BE(crc32(Buffer.concat([t, dane])) >>> 0);
  return Buffer.concat([naglowek, t, dane, suma]);
};

/** Odwraca filtry PNG (0–4) dla `bpp` bajtów na piksel; zwraca surowe wiersze bez bajtów filtru. */
function bezFiltrow(dane, szer, wys, bpp) {
  const wiersz = szer * bpp; const wy = Buffer.alloc(wiersz * wys);
  for (let y = 0; y < wys; y++) {
    const f = dane[y * (wiersz + 1)]; const we = y * (wiersz + 1) + 1; const o = y * wiersz;
    for (let x = 0; x < wiersz; x++) {
      const a = x >= bpp ? wy[o + x - bpp] : 0; const b = y > 0 ? wy[o - wiersz + x] : 0; const c = y > 0 && x >= bpp ? wy[o - wiersz + x - bpp] : 0;
      let v = dane[we + x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const p = a + b - c; const pa = Math.abs(p - a); const pb = Math.abs(p - b); const pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      else if (f !== 0) throw new Error(`nieznany filtr PNG ${f}`);
      wy[o + x] = v & 255;
    }
  }
  return wy;
}

export function splaszcz(buf) {
  if (buf.length < 8 || !buf.subarray(0, 8).equals(SYGNATURA)) throw new Error('to nie jest plik PNG');
  const k = kawalki(buf); const ihdr = k.find((c) => c.typ === 'IHDR').dane;
  const szer = ihdr.readUInt32BE(0); const wys = ihdr.readUInt32BE(4); const glebia = ihdr[8]; const typ = ihdr[9]; const przeplot = ihdr[12];
  if (glebia !== 8 || przeplot !== 0 || (typ !== 6 && typ !== 2)) throw new Error(`nieobsługiwany PNG (głębia ${glebia}, typ koloru ${typ}, przeplot ${przeplot}); oczekiwane 8-bitowe RGB/RGBA bez przeplotu`);
  if (typ === 2 && !k.some((c) => c.typ === 'tRNS')) return buf;
  const bpp = typ === 6 ? 4 : 3;
  const surowe = bezFiltrow(inflateSync(Buffer.concat(k.filter((c) => c.typ === 'IDAT').map((c) => c.dane))), szer, wys, bpp);
  const wiersz = szer * 3; const rgb = Buffer.alloc((wiersz + 1) * wys);
  for (let y = 0; y < wys; y++) {
    rgb[y * (wiersz + 1)] = 0;
    for (let x = 0; x < szer; x++) {
      const i = (y * szer + x) * bpp; const a = typ === 6 ? surowe[i + 3] : 255;
      for (let c = 0; c < 3; c++) rgb[y * (wiersz + 1) + 1 + x * 3 + c] = Math.round((surowe[i + c] * a + 255 * (255 - a)) / 255);
    }
  }
  const nowyIhdr = Buffer.from(ihdr); nowyIhdr[9] = 2;
  return Buffer.concat([SYGNATURA, kawalek('IHDR', nowyIhdr), kawalek('IDAT', deflateSync(rgb, { level: 9 })), kawalek('IEND', Buffer.alloc(0))]);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [we, wy] = process.argv.slice(2);
  if (!we || !wy) { console.error('użycie: node scripts/ci/splaszcz-png.mjs <wejście.png> <wyjście.png>'); process.exit(2); }
  try { writeFileSync(wy, splaszcz(readFileSync(we))); console.log(`spłaszczono: ${wy}`); } catch (e) { console.error(`BŁĄD ${e.message}`); process.exit(1); }
}
