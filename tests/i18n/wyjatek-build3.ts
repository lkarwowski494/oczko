// Tymczasowy wyjątek nazwany (KO-020, P-661; wzór P-578): 6 kluczy ekranu „Open source licenses” (M1-245) czeka w oczekujace.json na falę 09 „buildu 3”
// (34 języki). Testy „stanu po fali” (lista pusta) akceptują niepustą listę wyłącznie z tych kluczy, a bramka `--wydanie` ma przy niepustej liście dalej padać
// (kontrola-ipa.sh i scripts/sprawdz-i18n.mjs bez zmian: wyjątek nie zmniejsza zestawu kontroli wydania, P-357). Po fali 09: lista pusta, ten plik i jego użycia usunięte.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const KLUCZE_BUILDU_3: readonly string[] = ['licencje.grupa_kroje', 'licencje.grupa_licencje', 'licencje.grupa_natywne', 'licencje.grupa_pakiety', 'licencje.wstep', 'ustawienia.licencje'];

/** Lista oczekujących kluczy z repo i czy zawiera wyłącznie klucze wyjątku (i jest niepusta). */
export function stanListyOczekujacych(korzen: string): { klucze: string[]; tylkoWyjatekBuildu3: boolean } {
  const klucze = (JSON.parse(readFileSync(join(korzen, 'docs/lokalizacja/oczekujace.json'), 'utf8')) as { klucze: string[] }).klucze;
  return { klucze, tylkoWyjatekBuildu3: klucze.length > 0 && klucze.every((k) => KLUCZE_BUILDU_3.includes(k)) };
}
