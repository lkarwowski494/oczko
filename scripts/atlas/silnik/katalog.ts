// Manifest i wczytanie katalogu atlasu (ADR-0025, moduł `pakiety-tresci`): katalog w paczce, tylko do odczytu, osobno od danych
// użytkownika. Czysta funkcja z portami (odczyt bajtów, SHA-256, dekodowanie UTF-8) — w aplikacji adaptery expo-file-system/expo-crypto
// (rola 08), w Node `fs` i `crypto`. Zasady: manifest nowszego formatu → cały katalog odrzucony czytelnym błędem; zła karta (brak pliku,
// rozmiar, SHA-256 liczony z bajtów pliku, JSON, schemat, nowszy format karty) → karta pominięta, reszta katalogu działa.
import { FORMAT_KARTY, walidujKarte, type BladKontraktu } from './kontrakt.ts';
import type { Karta } from './typy.ts';

export const FORMAT_KATALOGU = 1;
export interface WpisManifestu { plik: string; bajty: number; sha256: string }
export interface Manifest { format: number; wersja: string; karty: WpisManifestu[] }
export interface PortyKatalogu {
  czytaj: (plik: string) => Uint8Array | null;
  sha256: (bajty: Uint8Array) => string; // szesnastkowo, małe litery
  dekoduj: (bajty: Uint8Array) => string; // UTF-8
}
export interface WynikKatalogu { karty: Karta[]; bledy: BladKontraktu[]; odrzucony: boolean }

const PLIK = /^[a-z0-9][a-z0-9._-]*\.json$/;

export function wczytajKatalog(manifestTekst: string, porty: PortyKatalogu): WynikKatalogu {
  const bledy: BladKontraktu[] = [];
  const odrzuc = (kod: string, szczegol: string): WynikKatalogu => ({ karty: [], bledy: [{ kod, sciezka: 'atlas.json', szczegol }], odrzucony: true });
  let m: Manifest;
  try { m = JSON.parse(manifestTekst); } catch (e) { return odrzuc('manifest', `manifest nie jest poprawnym JSON: ${(e as Error).message}`); }
  if (typeof m?.format !== 'number' || !Array.isArray(m.karty) || typeof m.wersja !== 'string') return odrzuc('manifest', 'manifest bez pól format (liczba), wersja (tekst), karty (lista)');
  if (m.format > FORMAT_KATALOGU) return odrzuc('format-nowszy', `katalog w formacie ${m.format}, aplikacja obsługuje do ${FORMAT_KATALOGU} — zostaje poprzednia treść`);
  const karty: Karta[] = [];
  const widziane = new Set<string>();
  m.karty.forEach((w, i) => {
    const s = `atlas.json:karty[${i}]`;
    const zgl = (kod: string, szczegol: string) => bledy.push({ kod, sciezka: s, szczegol });
    if (!w || typeof w.plik !== 'string' || !PLIK.test(w.plik)) return zgl('manifest', `niedozwolona nazwa pliku ${JSON.stringify(w?.plik)}`);
    const bajty = porty.czytaj(w.plik);
    if (!bajty) return zgl('brak-pliku', `brak pliku ${w.plik}`);
    if (bajty.length !== w.bajty) return zgl('rozmiar', `${w.plik}: ${bajty.length} B, manifest ${w.bajty} B`);
    const skrot = porty.sha256(bajty);
    if (skrot !== w.sha256) return zgl('skrot', `${w.plik}: SHA-256 ${skrot.slice(0, 12)}…, manifest ${String(w.sha256).slice(0, 12)}…`);
    let k: unknown;
    try { k = JSON.parse(porty.dekoduj(bajty)); } catch (e) { return zgl('json', `${w.plik}: ${(e as Error).message}`); }
    const f = (k as { format?: unknown })?.format;
    if (typeof f === 'number' && f > FORMAT_KARTY) return zgl('format-nowszy', `${w.plik}: karta w formacie ${f}, obsługiwany ${FORMAT_KARTY} — pominięta`);
    // w aplikacji bez rysunku: rysunki sprawdza generator i `verify` przed wydaniem (ADR-0022)
    const b = walidujKarte(k, {});
    if (b.length) return zgl('karta', `${w.plik}: ${b.length} błędów, pierwszy ${b[0].sciezka}: ${b[0].szczegol}`);
    const karta = k as Karta;
    if (widziane.has(karta.id)) return zgl('id', `${w.plik}: powtórzone id ${karta.id}`);
    widziane.add(karta.id);
    karty.push(karta);
  });
  return { karty, bledy, odrzucony: false };
}

/** Manifest z plików (generator i testy). Kolejność kart = kolejność wejścia. */
export function zbudujManifest(pliki: { plik: string; bajty: Uint8Array }[], wersja: string, sha256: (b: Uint8Array) => string): Manifest {
  return { format: FORMAT_KATALOGU, wersja, karty: pliki.map((p) => ({ plik: p.plik, bajty: p.bajty.length, sha256: sha256(p.bajty) })) };
}

/** Język karty do wyświetlenia (ADR-0025, przełącznik Q3 — decyzja właściciela; domyślnie 'angielski'). */
export type PolitykaJezyka = 'angielski' | 'ukryj';
export function jezykKarty(karta: Karta, jezykUzytkownika: string, polityka: PolitykaJezyka): string | null {
  if (karta.jezyki_gotowe.includes(jezykUzytkownika)) return jezykUzytkownika;
  // P-213 (E2-Q1a): szydełko tylko w dokładnym wariancie regionalnym — „dc” znaczy w US i UK co innego (RYZ-03); druty według przełącznika
  if (karta.rzemioslo === 'szydelko') return null;
  if (polityka === 'ukryj') return null;
  return karta.jezyki_gotowe.includes('en-US') ? 'en-US' : null;
}
