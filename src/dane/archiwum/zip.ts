// ZIP (PKWARE APPNOTE 6.3.x) dla archiwum `.oczko` i kopii ratunkowej (ADR-0004, ADR-0020; P-120 Q2a, wiersz ADR-0016 do zatwierdzenia przez 05):
// zapis metodą 0 (stored, bez kompresji — PDF i JPEG są już skompresowane), bez ZIP64 (limit 4 GB wobec ok. 415 MB, E0 §3 roli 05), strumieniowo
// kawałkami z deskryptorem danych (bit 3); odczyt katalogu centralnego i wypakowanie wpisów metody 0. CRC-32 z tablicy.
import type { Wynik } from '../../domena/bledy';
import { otworzDoCzytania, otworzDoZapisu, rozmiar as rozmiarPliku, usunPlik, type Pisarz } from '../pliki/system';

const KAWALEK = 1 << 20; // 1 MiB na odczyt i zapis
const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
export function crc32(stan: number, b: Uint8Array): number {
  let c = stan ^ 0xffffffff;
  for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
const MAKS = 0xffffffff;
const utf8 = (t: string): Uint8Array => new TextEncoder().encode(t);

export type WpisZip = { nazwa: string } & ({ plik: string } | { dane: Uint8Array });

const MAKS_WPISOW = 0xffff;
/** Rozmiar archiwum z góry (nagłówek 30 B + nazwa + dane + deskryptor 16 B, katalog 46 B + nazwa, koniec 22 B) — granice bez ZIP64 przed zapisem. */
function rozmiarArchiwum(wpisy: readonly WpisZip[]): number {
  let suma = 22;
  for (const w of wpisy) {
    const n = utf8(w.nazwa).length;
    suma += 30 + n + ('dane' in w ? w.dane.length : rozmiarPliku(w.plik)) + 16 + 46 + n;
  }
  return suma;
}
const ZA_DUZE: Wynik<void> = { ok: false, powod: 'za_duze' };

/**
 * Zapisuje nowy plik ZIP. Bez ZIP64 (ADR-0016): więcej niż 65 535 wpisów albo archiwum ≥ 4 GiB → `za_duze` bez tworzenia pliku; plik zmieniony
 * w trakcie (przekroczenie po zapisie) → `za_duze` i niepełny plik usunięty. Rzuca przy błędzie systemu plików (wołający usuwa `cel`).
 */
export function zapiszZip(cel: string, wpisy: readonly WpisZip[]): Wynik<void> {
  if (wpisy.length > MAKS_WPISOW || rozmiarArchiwum(wpisy) > MAKS) return ZA_DUZE;
  const p = otworzDoZapisu(cel);
  let przekroczone = false;
  try {
    const centralny: Uint8Array[] = [];
    for (const w of wpisy) {
      const nazwa = utf8(w.nazwa);
      const przesuniecie = p.zapisano;
      const naglowek = new Uint8Array(30 + nazwa.length);
      const v = new DataView(naglowek.buffer);
      v.setUint32(0, 0x04034b50, true); v.setUint16(4, 20, true); v.setUint16(6, 0x0808, true); // bit 3: deskryptor po danych, bit 11: nazwa UTF-8
      v.setUint16(8, 0, true); v.setUint16(26, nazwa.length, true);
      naglowek.set(nazwa, 30);
      p.zapisz(naglowek);
      let crc = 0, rozmiar = 0;
      const dopisz = (b: Uint8Array) => { crc = crc32(crc, b); rozmiar += b.length; p.zapisz(b); };
      if ('dane' in w) dopisz(w.dane);
      else {
        const c = otworzDoCzytania(w.plik);
        try { for (let od = 0; od < c.rozmiar; od += KAWALEK) dopisz(c.czytaj(od, Math.min(KAWALEK, c.rozmiar - od))); } finally { c.zamknij(); }
      }
      if (rozmiar > MAKS || p.zapisano > MAKS) { przekroczone = true; break; }
      const opis = new Uint8Array(16);
      const vo = new DataView(opis.buffer);
      vo.setUint32(0, 0x08074b50, true); vo.setUint32(4, crc, true); vo.setUint32(8, rozmiar, true); vo.setUint32(12, rozmiar, true);
      p.zapisz(opis);
      const cd = new Uint8Array(46 + nazwa.length);
      const vc = new DataView(cd.buffer);
      vc.setUint32(0, 0x02014b50, true); vc.setUint16(4, 20, true); vc.setUint16(6, 20, true); vc.setUint16(8, 0x0808, true); vc.setUint16(10, 0, true);
      vc.setUint32(16, crc, true); vc.setUint32(20, rozmiar, true); vc.setUint32(24, rozmiar, true); vc.setUint16(28, nazwa.length, true);
      vc.setUint32(42, przesuniecie, true);
      cd.set(nazwa, 46);
      centralny.push(cd);
    }
    if (przekroczone) return ZA_DUZE;
    const poczatekCd = p.zapisano;
    for (const c of centralny) p.zapisz(c);
    const koniec = new Uint8Array(22);
    const ve = new DataView(koniec.buffer);
    ve.setUint32(0, 0x06054b50, true); ve.setUint16(8, wpisy.length, true); ve.setUint16(10, wpisy.length, true);
    ve.setUint32(12, p.zapisano - poczatekCd, true); ve.setUint32(16, poczatekCd, true);
    p.zapisz(koniec);
    return { ok: true, wartosc: undefined };
  } finally {
    p.zamknij();
    if (przekroczone) usunPlik(cel);
  }
}

export type WpisKatalogu = { nazwa: string; metoda: number; crc: number; rozmiar: number; danePrzesuniecie: number };
/** Katalog centralny; null = to nie jest ZIP (brak końca katalogu), katalog niespójny z plikiem, ZIP64 albo wpis szyfrowany. */
export function czytajKatalog(sciezka: string): WpisKatalogu[] | null {
  const c = otworzDoCzytania(sciezka);
  try {
    if (c.rozmiar < 22) return null;
    const odKonca = Math.max(0, c.rozmiar - 22 - 0xffff);
    const ogon = c.czytaj(odKonca, c.rozmiar - odKonca);
    const vt = new DataView(ogon.buffer, ogon.byteOffset, ogon.byteLength);
    let e = ogon.length - 22;
    while (e >= 0 && vt.getUint32(e, true) !== 0x06054b50) e--;
    if (e < 0) return null;
    const ile = vt.getUint16(e + 10, true), dlugoscCd = vt.getUint32(e + 12, true), startCd = vt.getUint32(e + 16, true);
    const zip64 = e >= 20 && vt.getUint32(e - 20, true) === 0x07064b50; // lokalizator końca katalogu ZIP64 tuż przed końcem katalogu
    if (zip64 || vt.getUint16(e + 8, true) !== ile || startCd === MAKS || dlugoscCd === MAKS) return null; // ZIP64 albo wiele dysków: odrzucone
    if (startCd + dlugoscCd > c.rozmiar) return null;
    const cd = c.czytaj(startCd, dlugoscCd);
    const v = new DataView(cd.buffer, cd.byteOffset, cd.byteLength);
    const wpisy: WpisKatalogu[] = [];
    let p = 0;
    for (let i = 0; i < ile; i++) {
      if (p + 46 > cd.length || v.getUint32(p, true) !== 0x02014b50) return null;
      if (v.getUint16(p + 8, true) & 1) return null; // bit 0: wpis szyfrowany — archiwum odrzucone bez zmian w danych (ADR-0016)
      const metoda = v.getUint16(p + 10, true), crc = v.getUint32(p + 16, true), rozmiar = v.getUint32(p + 20, true);
      const nl = v.getUint16(p + 28, true), el = v.getUint16(p + 30, true), kl = v.getUint16(p + 32, true), lok = v.getUint32(p + 42, true);
      const nazwa = new TextDecoder().decode(cd.subarray(p + 46, p + 46 + nl));
      const lokalny = c.czytaj(lok, 30);
      if (lokalny.length < 30) return null;
      const vl = new DataView(lokalny.buffer, lokalny.byteOffset, lokalny.byteLength);
      if (vl.getUint32(0, true) !== 0x04034b50) return null;
      const danePrzesuniecie = lok + 30 + vl.getUint16(26, true) + vl.getUint16(28, true);
      if (danePrzesuniecie + rozmiar > c.rozmiar) return null;
      wpisy.push({ nazwa, metoda, crc, rozmiar, danePrzesuniecie });
      p += 46 + nl + el + kl;
    }
    return wpisy;
  } finally {
    c.zamknij();
  }
}

/** Wypakowuje wpis metody 0 do nowego pliku, liczy CRC-32 i przekazuje kawałki (np. SHA-256). false = zła metoda albo CRC. */
export function wypakuj(zip: string, wpis: WpisKatalogu, cel: string, naKawalek?: (b: Uint8Array) => void): boolean {
  if (wpis.metoda !== 0) return false;
  const c = otworzDoCzytania(zip);
  let p: Pisarz | null = null;
  try {
    p = otworzDoZapisu(cel);
    let crc = 0;
    for (let od = 0; od < wpis.rozmiar; od += KAWALEK) {
      const b = c.czytaj(wpis.danePrzesuniecie + od, Math.min(KAWALEK, wpis.rozmiar - od));
      crc = crc32(crc, b);
      naKawalek?.(b);
      p.zapisz(b);
    }
    return crc === wpis.crc;
  } finally {
    p?.zamknij();
    c.zamknij();
  }
}
/** Treść małego wpisu (manifest) w pamięci; null = zła metoda albo CRC. */
export function czytajWpis(zip: string, wpis: WpisKatalogu): Uint8Array | null {
  if (wpis.metoda !== 0) return null;
  const c = otworzDoCzytania(zip);
  try {
    const b = c.czytaj(wpis.danePrzesuniecie, wpis.rozmiar);
    return crc32(0, b) === wpis.crc ? b : null;
  } finally {
    c.zamknij();
  }
}
