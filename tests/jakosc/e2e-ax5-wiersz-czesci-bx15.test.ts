/* BX15 / zad. 3 (PU-135, przebieg iOS 43851148385, scenariusz 120, AX5): podprzepływ `dodaj-czesc-cel.yaml` kończy się stuknięciem w wiersz części „Back, .*”.
 * Przy AX5 po zapisie arkusza wiersz leży poza ekranem (hierarchia iOS nie zawiera elementów spoza ekranu — jak E2-138-S1), więc stuknięcie bez przewinięcia
 * kończy się „Element not found”. Reguła: tuż przed tym stuknięciem jest `scrollUntilVisible` na ten sam tekst (w dół), a stuknięcie i asercja `licznik-plus` zostają.
 * Podprzepływ woła 120 (AX5) oraz 34, 35, 59, 61, 108 (zwykły rozmiar tekstu: element widoczny → scrollUntilVisible kończy od razu). Scenariusz 121 go nie woła.
 * BX15 / zad. (c), scenariusz 121 (przebieg 43851148385, `subflows/otworz-wzor-pdf.yaml:8`, krok 33): przy AX5 menu „Add pattern” wychodzi poza ekran 874 pt (pozycje od „Choose photos”), więc panel E2E `e2e-wzor-pdf` (ostatnia pozycja menu, `src/ekrany/WzorGrupa.tsx:71`) nie ma w drzewie XCUI; reguła: przed `assertVisible` jest `scrollUntilVisible` w dół na ten sam id. */
import * as path from 'path';
import { kroki, wczytaj } from './maestro-runner';

const KAT = path.join(__dirname, '..', '..', 'e2e/scenariusze');
type Krok = { nazwa: string; arg: any };
const lista = (plik: string): Krok[] => [...kroki(wczytaj(path.join(KAT, plik)).polecenia)].map(({ nazwa, arg }) => ({ nazwa, arg }));
const WIERSZ = 'Back, .*';
const stukaWiersz = (k: Krok) => k.nazwa === 'tapOn' && k.arg === WIERSZ;
const tekstElementu = (k: Krok): string | undefined => (typeof k.arg?.element === 'string' ? k.arg.element : k.arg?.element?.text);

describe('BX15 · AX5: wiersz części „Back, .*” poza ekranem', () => {
  test('podprzepływ dodaj-czesc-cel: przed stuknięciem w „Back, .*” jest scrollUntilVisible w dół na ten sam tekst; potem asercja licznik-plus', () => {
    const l = lista('subflows/dodaj-czesc-cel.yaml');
    const t = l.findIndex(stukaWiersz);
    expect(t).toBeGreaterThan(-1);
    const p = l[t - 1];
    expect(p?.nazwa).toBe('scrollUntilVisible');
    expect(tekstElementu(p as Krok)).toBe(WIERSZ);
    expect(String(p?.arg.direction).toUpperCase()).toBe('DOWN');
    expect(l[t + 1]).toMatchObject({ nazwa: 'assertVisible', arg: { id: 'licznik-plus' } });
  });

  test('podprzepływ otworz-wzor-pdf: przed asercją i stuknięciem w e2e-wzor-pdf jest scrollUntilVisible w dół na ten sam id', () => {
    const l = lista('subflows/otworz-wzor-pdf.yaml');
    const a = l.findIndex((k) => k.nazwa === 'assertVisible' && k.arg?.id === 'e2e-wzor-pdf');
    expect(a).toBeGreaterThan(0);
    const p = l[a - 1];
    expect(p.nazwa).toBe('scrollUntilVisible');
    expect(p.arg.element?.id).toBe('e2e-wzor-pdf');
    expect(String(p.arg.direction).toUpperCase()).toBe('DOWN');
    expect(l[a + 1]).toMatchObject({ nazwa: 'tapOn', arg: { id: 'e2e-wzor-pdf' } });
  });
});
