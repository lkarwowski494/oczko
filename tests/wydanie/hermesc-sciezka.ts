// Wybór binarki hermesc z paczki hermes-compiler (TF-B3-01). Paczka zawiera binarki wszystkich platform naraz, więc istnienie pliku
// nie mówi, czy da się go uruchomić: wybór według platformy, a brak binarki to jawny błąd (nie ciche pominięcie ani binarka innej platformy).
// Platforma jest parametrem, żeby wybór dla macOS dało się sprawdzić na Linuksie.
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const KATALOG: Partial<Record<NodeJS.Platform, string>> = { darwin: 'osx-bin', linux: 'linux64-bin' };

export function sciezkaHermesc(korzen: string, platforma: NodeJS.Platform, istnieje: (p: string) => boolean = existsSync): string {
  const katalog = KATALOG[platforma];
  if (katalog === undefined) throw new Error(`hermesc: platforma ${platforma} bez obsługi w testach (${Object.keys(KATALOG).join(', ')})`);
  const sciezka = join(korzen, 'node_modules/hermes-compiler/hermesc', katalog, 'hermesc');
  if (!istnieje(sciezka)) throw new Error(`brak hermesc dla ${platforma}: ${sciezka} (npm ci; paczka hermes-compiler)`);
  return sciezka;
}
