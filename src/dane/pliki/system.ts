// System plików warstwy danych (P-120 Q1a, jak Trening): jedyne miejsce importu expo-file-system w src/dane; ścieżki bezwzględne bez `file://`.
// Nowe API (File, Directory, FileHandle; expo-file-system 57.0.7, build/File.types.d.ts:80–84) — czytanie i zapis kawałkami, bez wczytania
// całego pliku do pamięci (archiwum do ok. 415 MB, E0 §3 roli 05). W Jest: tests/narzedzia/expo-file-system-node.ts (prawdziwy dysk).
import { Directory, File, FileMode, Paths } from 'expo-file-system';

const uri = (sciezka: string): string => `file://${sciezka.split('/').map(encodeURIComponent).join('/')}`;

export const nazwaPliku = (sciezka: string): string => sciezka.slice(sciezka.lastIndexOf('/') + 1);
export const katalogPliku = (sciezka: string): string => sciezka.slice(0, Math.max(0, sciezka.lastIndexOf('/')));
export const polacz = (...czesci: string[]): string => czesci.join('/').replace(/\/{2,}/g, '/');

export function istniejePlik(sciezka: string): boolean {
  return new File(uri(sciezka)).exists;
}
export function istniejeKatalog(sciezka: string): boolean {
  return new Directory(uri(sciezka)).exists;
}
export function rozmiar(sciezka: string): number {
  return new File(uri(sciezka)).size;
}
export function utworzKatalog(sciezka: string): void {
  new Directory(uri(sciezka)).create({ intermediates: true, idempotent: true });
}
/** Nazwy wpisów katalogu (bez ścieżki); brak katalogu = []. */
export function lista(sciezka: string): string[] {
  const k = new Directory(uri(sciezka));
  if (!k.exists) return [];
  return k.list().map((w) => decodeURIComponent(w.uri.replace(/\/$/, '').split('/').pop() ?? ''));
}
export function usunPlik(sciezka: string): void {
  const p = new File(uri(sciezka));
  if (p.exists) p.delete();
}
export function usunKatalog(sciezka: string): void {
  const k = new Directory(uri(sciezka));
  if (k.exists) k.delete();
}
/** Kopia bajt w bajt; cel nie może istnieć (kopia nigdy nie nadpisuje po cichu). */
export function kopiuj(zrodlo: string, cel: string): void {
  new File(uri(zrodlo)).copySync(new File(uri(cel)));
}
/** Przeniesienie w obrębie woluminu (zmiana nazwy) — zapis pliku tymczasowego, potem nazwa docelowa (bez pliku w połowie pod nazwą docelową). */
export function przenies(zrodlo: string, cel: string): void {
  new File(uri(zrodlo)).moveSync(new File(uri(cel)));
}
/** Wolne miejsce na woluminie aplikacji w bajtach (required reason E174.1, rejestr Apple 11d). M1-113: wartość platformy (`Int64?` w expo-file-system)
 *  parsowana z `unknown` — brak odczytu albo wartość spoza skończonych liczb ≥ 0 → `null` („nie wiadomo”, nie „brak miejsca”). */
export function wolneMiejsce(): number | null {
  const v: unknown = Paths.availableDiskSpace;
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null;
}
export function czytajTekst(sciezka: string): Promise<string> {
  return new File(uri(sciezka)).text();
}
export function zapiszTekst(sciezka: string, tekst: string): void {
  const p = new File(uri(sciezka));
  if (!p.exists) p.create();
  p.write(tekst);
}
/** Zapis przez plik tymczasowy (ARCH-22, M1-026; wzorzec `src/platforma/migawka.ts`): `<cel>.tmp` → odczyt kontrolny → przeniesienie.
 *  Przerwany zapis zostawia poprzednią treść celu; przeniesienie nie nadpisuje, więc cel jest usuwany tuż przed nim — przerwanie w tym oknie
 *  zostawia tylko `<cel>.tmp` po odczycie kontrolnym, który odzyskuje `czytajAtomowo` (M1-096). Czytaj takie pliki tylko przez `czytajAtomowo`. */
export function zapiszAtomowo(sciezka: string, tekst: string): void {
  const tmp = `${sciezka}.tmp`;
  usunPlik(tmp);
  try {
    zapiszTekst(tmp, tekst);
    if (new File(uri(tmp)).textSync() !== tekst) throw new Error('zapis atomowy: odczyt kontrolny niezgodny');
  } catch (e) {
    usunPlik(tmp); // pozostały plik tymczasowy nie jest czytany; błąd usuwania też idzie do wołającego
    throw e;
  }
  usunPlik(sciezka);
  przenies(tmp, sciezka);
}

/** Odczyt pliku zapisywanego przez `zapiszAtomowo` (ARCH-22: odzyskanie pliku tymczasowego przy starcie, M1-096): brak celu i jest `<cel>.tmp`
 *  → najpierw przeniesienie `.tmp` na cel, potem odczyt; brak obu → null. Cel i `.tmp` naraz → cel (`.tmp` usuwa następny zapis). Treść waliduje
 *  wołający: `.tmp` z przerwanego pierwszego zapisu (przed odczytem kontrolnym) może być niepełny — skutek jak brak pliku. */
export async function czytajAtomowo(sciezka: string): Promise<string | null> {
  if (!istniejePlik(sciezka)) {
    const tmp = `${sciezka}.tmp`;
    if (!istniejePlik(tmp)) return null;
    przenies(tmp, sciezka);
  }
  return czytajTekst(sciezka);
}

export interface Czytnik { czytaj(od: number, dlugosc: number): Uint8Array; readonly rozmiar: number; zamknij(): void }
export interface Pisarz { zapisz(bajty: Uint8Array): void; readonly zapisano: number; zamknij(): void }

export function otworzDoCzytania(sciezka: string): Czytnik {
  const h = new File(uri(sciezka)).open(FileMode.ReadOnly);
  return {
    rozmiar: h.size ?? 0,
    czytaj(od, dlugosc) { h.offset = od; return h.readBytes(dlugosc); },
    zamknij() { h.close(); },
  };
}
/** Nowy plik (cel nie może istnieć); zapis kolejnymi kawałkami. */
export function otworzDoZapisu(sciezka: string): Pisarz {
  const p = new File(uri(sciezka));
  p.create();
  const h = p.open(FileMode.WriteOnly);
  let zapisano = 0;
  return {
    get zapisano() { return zapisano; },
    zapisz(bajty) { h.offset = zapisano; h.writeBytes(bajty); zapisano += bajty.length; },
    zamknij() { h.close(); },
  };
}
/** Katalog `Library` kontenera aplikacji (ADR-0001: dane w `Library/Application Support`) — rodzic katalogu `Documents`. */
export function katalogBiblioteki(): string {
  const d = decodeURIComponent(Paths.document.uri.replace(/^file:\/\//, '').replace(/\/+$/, ''));
  return `${d.slice(0, d.lastIndexOf('/'))}/Library`;
}
/** Czas ostatniej zmiany katalogu (ms; dopisanie pliku go przesuwa) — wiek niepełnego zlecenia skrzynki (fix-7, SKRZYNKA_PORZUCONE_H). */
export function czasZmianyKatalogu(sciezka: string): number | null {
  const i = new Directory(uri(sciezka)).info();
  return i.exists && typeof i.modificationTime === 'number' ? i.modificationTime : null;
}
/** Czas ostatniej zmiany pliku albo katalogu (ms od epoki, expo-file-system 57 `FileInfo`/`DirectoryInfo.modificationTime`); brak → null. */
export function czasZmiany(sciezka: string): number | null {
  if (istniejeKatalog(sciezka)) return czasZmianyKatalogu(sciezka);
  const i = new File(uri(sciezka)).info();
  return i.exists && typeof i.modificationTime === 'number' ? i.modificationTime : null;
}
/** Katalog kontenera App Group (ADR-0011 fix-7; `Paths.appleSharedContainers` czyta grupy z uprawnień aplikacji); null bez grupy w podpisie. */
export function katalogGrupyAplikacji(grupa: string): string | null {
  const k = (Paths as { appleSharedContainers?: Record<string, Directory> }).appleSharedContainers?.[grupa];
  return k ? decodeURIComponent(k.uri.replace(/^file:\/\//, '').replace(/\/$/, '')) : null;
}
