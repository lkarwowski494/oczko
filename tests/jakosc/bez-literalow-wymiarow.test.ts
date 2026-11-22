/* M1-audytor-generalny-078 (źródło 04-studio-projektowe-010, SP-03; zasada wspólna 15, design-spec „Programista (08) używa wyłącznie tokenów”):
 * w stylach ekranów (`src/ekrany`, `app`) rozmiary tekstu, odstępy i wymiary pochodzą z tokenów (`docs/design/tokeny.json` przez `src/ekrany/motyw.ts`),
 * nie z liczb wpisanych w miejscu. Kontrola: właściwość z listy z wartością będącą samą liczbą (np. `fontSize: 40,`); wyrażenia od tokenów
 * (`odstep.l`, `6 * U`, `4 * ROZSTAW`) i 0 przechodzą. Wyjątki nazwane niżej, każdy z uzasadnieniem; nowy wyjątek = decyzja 04.
 * M1-audytor-generalny-140 (07-jakosc-520, 04-studio-projektowe-528): lista obejmuje też `minWidth`, `maxWidth`, `maxHeight` i promienie, a liczba może stać
 * na końcu linii (ostatnia właściwość obiektu wieloliniowego bez przecinka) albo przed komentarzem. */
import * as fs from 'fs';
import * as path from 'path';

const KORZEN = path.join(__dirname, '..', '..');
const KATALOGI = ['src/ekrany', 'app'];
const WLASCIWOSCI = 'fontSize|lineHeight|padding(?:Horizontal|Vertical|Top|Bottom|Left|Right|Start|End)?|margin(?:Horizontal|Vertical|Top|Bottom|Left|Right|Start|End)?|gap|rowGap|columnGap|minHeight|width|height|minWidth|maxWidth|maxHeight|borderRadius|border(?:TopLeft|TopRight|BottomLeft|BottomRight)Radius';
/** `właściwość: liczba` zakończone przecinkiem, `}`, końcem linii albo komentarzem (sama liczba, nie początek wyrażenia). */
const LITERAL = new RegExp(`\\b(${WLASCIWOSCI})\\s*:\\s*(-?\\d+(?:\\.\\d+)?)\\s*(?=(?:[,}]|$|\\/[*/]))`, 'g');

/** Wyjątki: `plik:właściwość:wartość` → uzasadnienie. */
const WYJATKI: Record<string, string> = {
  'src/ekrany/ObrazKarty.tsx:width:1080': 'rozmiar pliku PNG karty ukończenia w pikselach (obraz trafia poza aplikację, design-spec P10a), nie wymiar ekranu; reszta karty liczona od szerokości obrazu (`U`)',
  'src/ekrany/ObrazKarty.tsx:height:1350': 'jak wyżej: wysokość pliku PNG karty (4:5)',
  // M1-audytor-generalny-140 (04-studio-projektowe-528, decyzja 04 z 2026-11-03): 132 → token `cel.przyciskPlusPaskaSzerokosc`, 640 → stała `KOLUMNA_TRESCI_MAKS`;
  // pięć pozostałych to wyjątki 04 — geometria rysunku albo lokalna podłoga układu, nie wartość systemu (token tylko dla wartości, która wraca w kilku miejscach).
  'src/ekrany/Stoper.tsx:minWidth:240': 'podłoga szerokości menu stopera rysowanego w aplikacji zamiast „menu systemowego” z design-spec.md:530 (makieta `fix6-2026-10-26/sesje-historia.html:133` `.menu-ios`: min(280, szerokość − 24)); wartość 08 przyjęta przez 04 tymczasowo, do decyzji o menu stopera jako widoku (P-215 (3), P-373 — otwarte dla 04); znika z menu systemowym, nie staje się tokenem',
  'src/ekrany/WzorTytul.tsx:minWidth:120': 'tytuł paska wzoru (wydzielony z WzorPrzegladarka.tsx, P-364) (design-spec.md:671 „tytuł = nazwa wzoru”) ma co najmniej 120 pt (ok. 10 znaków Libre Franklin 20 pt, dwa wiersze), zanim ikony narzędzi przejdą do drugiego rzędu (`pasek` z flexWrap); lokalna podłoga układu tego paska, nie wymiar systemu',
  'src/ekrany/WzorZnacznik.tsx:minWidth:36': 'liczba krokowca rzędu znacznika (design-spec.md:182 „krokowiec w pasku”) między − i + ma stałą podłogę szerokości 36 pt (trzy cyfry treści 17 pt pogrubionej), żeby przyciski nie skakały przy 9 → 10 → 100; lokalna podłoga, nie wymiar systemu',
};

const pliki = (k: string): string[] => fs.readdirSync(k, { withFileTypes: true })
  .flatMap((e) => (e.isDirectory() ? pliki(path.join(k, e.name)) : /\.tsx?$/.test(e.name) ? [path.join(k, e.name)] : []));

function literaly(): { klucz: string; miejsce: string }[] {
  const wynik: { klucz: string; miejsce: string }[] = [];
  for (const kat of KATALOGI) {
    for (const p of pliki(path.join(KORZEN, kat))) {
      const rel = path.relative(KORZEN, p).split(path.sep).join('/');
      fs.readFileSync(p, 'utf8').split('\n').forEach((linia, i) => {
        if (/^\s*(\/\/|\*|\/\*)/.test(linia)) return; // komentarze
        for (const m of linia.matchAll(LITERAL)) {
          if (Number(m[2]) === 0) continue;
          wynik.push({ klucz: `${rel}:${m[1]}:${m[2]}`, miejsce: `${rel}:${i + 1} ${m[1]}: ${m[2]}` });
        }
      });
    }
  }
  return wynik;
}

describe('M1-078: ekrany bez wymiarów i rozmiarów tekstu wpisanych liczbami', () => {
  const znalezione = literaly();
  test('poza nazwanymi wyjątkami 0 literałów w src/ekrany i app', () => {
    expect(znalezione.filter((x) => !(x.klucz in WYJATKI)).map((x) => x.miejsce)).toEqual([]);
  });
  test('każdy wyjątek nadal występuje w kodzie (lista nie rośnie po cichu ani nie zostaje martwa)', () => {
    const klucze = new Set(znalezione.map((x) => x.klucz));
    expect(Object.keys(WYJATKI).filter((k) => !klucze.has(k))).toEqual([]);
  });
  test('M1-140 (04-studio-projektowe-528): każdy wyjątek ma uzasadnienie 04, bez „do uzasadnienia”', () => {
    expect(Object.entries(WYJATKI).filter(([, u]) => /do uzasadnienia/i.test(u)).map(([k]) => k)).toEqual([]);
  });
  test('kontrola potrafi paść: wykrywa `fontSize: 40,` i `padding: 16 }`, przepuszcza tokeny, wyrażenia i 0', () => {
    const traf = (s: string) => [...s.matchAll(LITERAL)].map((m) => `${m[1]}:${m[2]}`).filter((x) => !x.endsWith(':0'));
    expect(traf('{ fontSize: 40, lineHeight: 48, color: k.grafit }')).toEqual(['fontSize:40', 'lineHeight:48']);
    expect(traf('{ flex: 1, padding: 16 }')).toEqual(['padding:16']);
    expect(traf('{ padding: odstep.l, width: 4 * ROZSTAW, gap: 2 * U, top: 0, minHeight: cel.minimum, marginTop: 0 }')).toEqual([]);
  });
  test('M1-140: kontrola łapie mutanty B2, B3 (07-jakosc-520) i M2–M5 (04-studio-projektowe-528); wyrażenia nadal przechodzą', () => {
    const traf = (s: string) => [...s.matchAll(LITERAL)].map((m) => `${m[1]}:${m[2]}`).filter((x) => !x.endsWith(':0'));
    expect(traf('    height: 28')).toEqual(['height:28']);              // B2: ostatnia właściwość obiektu wieloliniowego, bez przecinka
    expect(traf('{ minWidth: 28 }')).toEqual(['minWidth:28']);          // B3 / M2
    expect(traf('{ borderRadius: 8, color: k.grafit }')).toEqual(['borderRadius:8']); // M3
    expect(traf('{ width: 28 /* x */, flex: 1 }')).toEqual(['width:28']); // M4: komentarz przed przecinkiem
    expect(traf('    minHeight: 44')).toEqual(['minHeight:44']);        // M5: koniec wiersza przed nową linią
    expect(traf('{ maxWidth: 640, maxHeight: 300 } // x')).toEqual(['maxWidth:640', 'maxHeight:300']);
    expect(traf('{ minWidth: cel.przyciskMinus, maxWidth: 2 * U, borderRadius: promien.pole }')).toEqual([]);
  });
});
