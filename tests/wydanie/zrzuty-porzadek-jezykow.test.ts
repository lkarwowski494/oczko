/* ZR6 (rola 10 fix, KO-191, P-1011): stan aplikacji między językami w jednym zadaniu zrzutów.
 * Fakt: przebieg 45007913254, zadanie iphone 2 (da, hu, pt, vi; wszystkie z danymi `en`, bo bez własnego dane/<kod>.json). Pierwszy język (da) zrobił 7 scen; hu, pt i vi — tylko 01, 05, 07;
 * 02, 03, 04 i 06 padały po dwie próby. Przyczyna z dziennika (zrzut hu 02-licznik próba 1): „Kontynuuj ›” po 00-jezyk otworzyło WIDOK WZORU (pasek licznika u dołu), nie licznik, a pasek stanu wzoru
 * mówił „2 kiemelés” (2 zakreślenia). Skrypt robi 00-przygotuj tylko przy zmianie KLUCZA danych (en → en: bez), więc po scenie 04 poprzedniego języka zostawały: (1) ostatnie miejsce pracy = wzór
 * (scena 04 kończy na wzorze) i (2) drugie zakreślenie (zrzut sceny 04 robi skrypt PO scenie, więc scena nie może sama go cofnąć). Dla en i pl (osobne klucze danych) fikstura powstaje od nowa przed
 * każdym językiem, dlatego tam przechodziło.
 * Poprawka: scena 04a-porzadek.yaml zaraz po scenie 04 i jej zrzucie, W TEJ SAMEJ SESJI aplikacji — cofnięcie kreski działa tylko w sesji, w której kreska powstała
 * (historia w pamięci widoku, modules/oczko-wzor/ios/WidokWzoru.swift:228), więc scena nie może zaczynać od restartu. Bez zmian w aplikacji.
 * Test nie uruchamia Maestro ani symulatora; pilnuje kształtu sceny i miejsca jej wywołania w skrypcie. Wykonanie: przebieg macOS koordynatora. */
import * as fs from 'fs';
import * as path from 'path';
import { YAML } from '../jakosc/maestro-runner';

const KORZEN = path.join(__dirname, '..', '..');
const SCENA = path.join(KORZEN, 'e2e/zrzuty-sklepu/04a-porzadek.yaml');
const SKRYPT = path.join(KORZEN, 'scripts/ci/zrzuty-sklepu.sh');
const czytaj = (p: string): string => fs.readFileSync(p, 'utf8');
const bezKomentarzy = (t: string): string => t.split('\n').filter((l) => !l.trimStart().startsWith('#')).join('\n');

describe('ZR6 (P-1011): porządek stanu po scenie 04 (przed kolejnym językiem)', () => {
  test('scena 04a-porzadek.yaml istnieje i parsuje się (wszystkie dokumenty bez błędów)', () => {
    expect(fs.existsSync(SCENA)).toBe(true);
    const dok = YAML.parseAllDocuments(czytaj(SCENA));
    expect(dok.map((d: { errors: unknown[] }) => d.errors.length)).toEqual(dok.map(() => 0));
    expect(dok.length).toBe(2); // nagłówek (appId, name) + komendy
  });

  test('scena: bez restartu aplikacji (historia cofania jest w pamięci), cofa drugie zakreślenie, wyłącza zakreślacz i wraca do licznika; tylko id i dosłowne liczby', () => {
    const t = bezKomentarzy(czytaj(SCENA));
    expect(t).not.toMatch(/stopApp|launchApp|clearState|restart/); // cofnięcie po restarcie byłoby po cichu puste
    expect(t).toMatch(/tapOn: \{ id: "wzor-cofnij-rysunek" \}/);
    expect(t).toMatch(/when: \{ visible: \{ id: "wzor-zakreslenia", text: '\^\\D\*2\\D\*\$' \} \}/); // cofa tylko, gdy są 2 zakreślenia
    expect(t).toMatch(/assertVisible: \{ id: "wzor-zakreslenia", text: '\^\\D\*1\\D\*\$' \}/); // po cofnięciu dokładnie 1 (jak asercja sceny 04)
    expect(t).toMatch(/tapOn: \{ id: "nav-wstecz" \}/);
    expect(t).toMatch(/assertVisible: \{ id: "licznik-wartosc", text: "20" \}/); // ostatnie miejsce pracy = licznik projektu głównego
    expect(t).not.toMatch(/swipe/); // żadnych współrzędnych (ZR4)
    expect(t).not.toMatch(/tapOn: "/); // żadnych napisów interfejsu (scena działa w każdym z 27 języków)
  });

  test('skrypt: zaraz po scenie 04 (po zrzucie) biegnie 04a-porzadek z jednym ponowieniem, a porażka trafia do listy nieudanych', () => {
    const s = czytaj(SKRYPT);
    const iScen = s.indexOf('for scena in $TE_SCENY');
    const iZrzut = s.indexOf('zrob_zrzut "$scena"', iScen);
    const iPorz = s.indexOf('maestro_run 04a-porzadek', iScen);
    const iZakup = s.indexOf('# zadanie „tylko zakup”');
    expect(iScen).toBeGreaterThan(-1);
    expect(iPorz).toBeGreaterThan(iZrzut); // po zrzucie sceny 04 (zrzut musi pokazywać 2 zakreślenia)
    expect(iPorz).toBeLessThan(iZakup); // jeszcze w pętli języków
    expect(s).toMatch(/\[ "\$scena" = 04-zakreslenie \]/); // tylko po scenie 04
    expect(s).toMatch(/\$JEZ\/04a-porzadek/);
    expect(s).toMatch(/for proba in 1 2; do\s*\n\s*if maestro_run 04a-porzadek "\$proba"/);
  });
});
