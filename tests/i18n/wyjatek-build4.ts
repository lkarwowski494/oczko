// Tymczasowy wyjątek nazwany (KO-027, P-692; wzór P-661, zdjęty w P-673): 61 kluczy przewodnika po funkcjach (`przewodnik.*`, en i pl) czeka w oczekujace.json
// na falę 09 buildu 4 (33 języki). Testy „stanu po fali” (lista pusta) akceptują niepustą listę wyłącznie z tych kluczy, a bramka `--wydanie` ma przy niepustej
// liście dalej padać (kontrola-ipa.sh i scripts/sprawdz-i18n.mjs bez zmian: wyjątek nie zmniejsza zestawu kontroli wydania, P-357). Po fali 09: lista pusta, ten plik i jego użycia usunięte.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Klucze wyjątku: wszystkie klucze en z przedrostkiem `przewodnik.` (lista z tresc.json roli 04, sprawdza tests/domena/przewodnik-tresc.test.ts). */
export function kluczeBuildu4(korzen: string): string[] {
  const en = JSON.parse(readFileSync(join(korzen, 'src/i18n/slowniki/en.json'), 'utf8')) as { przewodnik?: Record<string, string> };
  return Object.keys(en.przewodnik ?? {}).map((k) => `przewodnik.${k}`);
}

/** Lista oczekujących kluczy z repo i czy zawiera wyłącznie klucze wyjątku (i jest niepusta). */
export function stanListyOczekujacych(korzen: string): { klucze: string[]; tylkoWyjatekBuildu4: boolean } {
  const klucze = (JSON.parse(readFileSync(join(korzen, 'docs/lokalizacja/oczekujace.json'), 'utf8')) as { klucze: string[] }).klucze;
  const wyjatek = kluczeBuildu4(korzen);
  return { klucze, tylkoWyjatekBuildu4: klucze.length > 0 && wyjatek.length === 61 && klucze.every((k) => wyjatek.includes(k)) };
}
