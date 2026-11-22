/* BX18 (przebieg iOS 43893320145, 7a738d84): reguły scenariuszy Maestro, które w tym przebiegu padły z przyczyny w scenariuszu, nie w aplikacji.
 *  - 100 (PU-008): w trybie zakreślacza pasek nawigacji iPhone'a to pasek narzędzi z „Done” (src/ekrany/WzorPrzegladarka.tsx:122-127) — `nav-wstecz` nie istnieje.
 *  - 93 (PU-113): wiersz „Lock Screen” leży przy dolnej krawędzi ekranu 874 pt, poza ramką ScrollView (840); `scrollUntilVisible` liczy widoczność względem ekranu,
 *    więc stuknięcie w środek wiersza (y 848) trafia poza listę. Przed stuknięciem potrzebne jest przeciągnięcie, a `centerElement` na końcu listy nie ma sensu (KO-109).
 *  - 95 (PU-168): Centrum sterowania to osobny proces — po jego otwarciu aplikacji nie ma w hierarchii XCUI, więc czekanie na wartość licznika przed zamknięciem nie może się udać.
 *  - 122 (PU-161): licznik na pierwszym ekranie ma 0; asercja „1” bez wcześniejszego „+1” jest błędem scenariusza (31 stuka najpierw). */
import * as path from 'path';
import { kroki, wczytaj } from './maestro-runner';

const KAT = path.join(__dirname, '..', '..', 'e2e/scenariusze');
type Krok = { nazwa: string; arg: any };
const lista = (plik: string): Krok[] => [...kroki(wczytaj(path.join(KAT, plik)).polecenia)].map(({ nazwa, arg }) => ({ nazwa, arg }));
const id = (k: Krok): string | undefined => (k.arg && typeof k.arg === 'object' ? (k.arg.id ?? k.arg.element?.id ?? k.arg.visible?.id) : undefined);
const stuka = (k: Krok, i: string) => k.nazwa === 'tapOn' && id(k) === i;

describe('BX18 · 100: nav-wstecz nie przy włączonym zakreślaczu (pasek narzędzi zamiast nawigacji)', () => {
  test('scenariusz 100: przed tapOn nav-wstecz zakreślacz jest wyłączony (stuknięcie narzędzia, asercja selected: false)', () => {
    const l = lista('100-pu-008-zakreslenie-widac-od-razu-cofnij-ostatnia-kreske.yaml');
    let tryb = false; // iPhone: stuknięcie wzor-zakreslacz przełącza narzędzie (WzorPrzegladarka.tsx:112)
    const blad: string[] = [];
    l.forEach((k, n) => {
      if (stuka(k, 'wzor-zakreslacz')) tryb = !tryb;
      if (stuka(k, 'nav-wstecz') && tryb) blad.push(`krok ${n}: nav-wstecz przy włączonym zakreślaczu`);
    });
    expect(blad).toEqual([]);
    const t = l.findIndex((k) => stuka(k, 'nav-wstecz'));
    expect(t).toBeGreaterThan(1);
    expect(l[t - 1]).toMatchObject({ nazwa: 'assertVisible', arg: { id: 'wzor-zakreslacz', selected: false } });
  });
});

describe('BX18 · 93: „Lock Screen” przy dolnej krawędzi — przeciągnięcie przed stuknięciem, bez centerElement na końcu listy', () => {
  const plik = '93-pu-113-przewodnik-zegarek-i-ekran-blokady.yaml';
  test.each(['przewodnik-f-ekran-blokady', 'przewodnik-f-ekran-blokady-pokaz'])('tuż przed stuknięciem w %s jest swipe w górę i asercja widoczności; scrollUntilVisible bez centerElement', (cel) => {
    const l = lista(plik);
    const t = l.findIndex((k) => stuka(k, cel));
    expect(t).toBeGreaterThan(1);
    expect(l[t - 2].nazwa).toBe('swipe'); // reguła 8: po swipe asercja — że wiersz jest w ramce listy
    expect(l[t - 1]).toMatchObject({ nazwa: 'assertVisible', arg: { id: cel } });
    const przewin = l.slice(0, t).reverse().find((k) => k.nazwa === 'scrollUntilVisible' && id(k) === cel);
    expect(przewin).toBeDefined();
    expect(przewin?.arg.centerElement).toBeUndefined();
  });
});

describe('BX18 · 95: Centrum sterowania zasłania aplikację — bez czekania na licznik przed zamknięciem', () => {
  test('po swipe od prawego rogu (95%, 1%) nie ma czekania na element aplikacji do chwili zamknięcia Centrum', () => {
    const l = lista('95-pu-168-centrum-powiadomien-i-sterowania-bez-rzedu.yaml');
    const o = l.findIndex((k) => k.nazwa === 'swipe' && /^9\d%,\s*[01]%$/.test(String(k.arg.start)));
    expect(o).toBeGreaterThan(-1);
    // reguła 8 wymaga asercji po swipe; przy otwartym Centrum prawdziwa jest tylko taka, która nie wymaga aplikacji w hierarchii: „żadne +1 nie doszło”
    expect(l[o + 1]).toMatchObject({ nazwa: 'assertNotVisible', arg: { id: 'licznik-wartosc', text: '2' } });
    expect(l[o + 2].nazwa).toBe('swipe'); // zamknięcie
    expect(l[o + 3]).toMatchObject({ nazwa: 'extendedWaitUntil', arg: { visible: { id: 'licznik-wartosc', text: '1' } } });
  });
});

describe('BX18 · 31 i 122: wartość licznika w asercjach zgodna z liczbą stuknięć „+1”', () => {
  /** Licznik na pierwszym ekranie ma 0; tapOn licznik-plus +1, licznik-minus −1; runFlow pomiar-pieciu z OD rozwija się do 5 stuknięć z asercjami OD…OD+4. */
  const przebieg = (plik: string): string[] => {
    const blad: string[] = [];
    let wartosc = 0;
    lista(plik).forEach((k, n) => {
      if (stuka(k, 'licznik-plus')) wartosc += 1;
      if (stuka(k, 'licznik-minus')) wartosc -= 1;
      if (k.nazwa === 'runFlow' && k.arg?.file === 'subflows/pomiar-pieciu.yaml') {
        const od = Number(k.arg.env.OD);
        if (od !== wartosc + 1) blad.push(`krok ${n}: pomiar-pieciu od ${od}, a licznik ma ${wartosc}`);
        wartosc += 5;
      }
      if (k.nazwa === 'assertVisible' && k.arg?.id === 'licznik-wartosc' && k.arg.text !== undefined && String(k.arg.text) !== String(wartosc)) {
        blad.push(`krok ${n}: asercja „${k.arg.text}”, a po stuknięciach licznik ma ${wartosc}`);
      }
    });
    return blad;
  };
  test('31: bez rozbieżności', () => expect(przebieg('31-nfr-wyd-001-reakcja-licznika.yaml')).toEqual([]));
  test('122: bez rozbieżności (pierwsze „+1” przed asercją „1”)', () => expect(przebieg('122-nfr-wyd-001-reakcja-licznika-bez-panelu-wejscia.yaml')).toEqual([]));
});
