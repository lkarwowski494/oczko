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
  'src/ekrany/HistoriaDni.tsx:width:14': 'kreska dnia z robótką — rysunek elementu firmowego „14 × 3 pt” podany wprost w design-spec („Dzień z robótką: kreska ołówkiem pod liczbą”), nie odstęp ani cel dotyku',
  'src/ekrany/HistoriaDni.tsx:height:3': 'jak wyżej: grubość kreski dnia „14 × 3 pt” (design-spec)',
  'src/ekrany/HistoriaDni.tsx:width:34': 'koło wybranego dnia wewnątrz komórki 44 pt (`cel.minimum`); rysunek wyróżnienia, nie cel dotyku — tokenu brak, do nazwania przez 04 przy najbliższej sesji kalendarza (M1-078)',
  'src/ekrany/HistoriaDni.tsx:height:34': 'jak wyżej: koło wybranego dnia',
  // M1-audytor-generalny-140: literały odsłonięte rozszerzeniem kontroli; bez tokenu — wyjątek do uzasadnienia 04 (przekazanie), nie decyzja 08/07.
  'src/ekrany/HistoriaDni.tsx:borderRadius:17': 'do uzasadnienia 04: promień koła wybranego dnia = połowa 34 (wyjątek wyżej)',
  'src/ekrany/HistoriaDni.tsx:borderRadius:1.5': 'do uzasadnienia 04: zaokrąglenie kreski dnia „14 × 3 pt” (design-spec podaje wymiar, nie promień)',
  'src/ekrany/Stoper.tsx:minWidth:240': 'do uzasadnienia 04: minimalna szerokość menu stopera; tokenu ani wartości w design-spec brak',
  'src/ekrany/WzorLicznik.tsx:minWidth:132': 'do uzasadnienia 04: +1 paska pod wzorem „≥ 132 pt szerokości” (design-spec W1a); tokenu brak (propozycja 528: `cel.przyciskPlusPaskaSzerokosc`)',
  'src/ekrany/WzorPrzegladarka.tsx:minWidth:120': 'do uzasadnienia 04: minimalna szerokość tytułu paska wzoru; tokenu ani wartości w design-spec brak',
  'src/ekrany/WzorPrzegladarka.tsx:maxWidth:640': 'do uzasadnienia 04: kolumna strony na iPadzie „maks. 640 pt” (design-spec W4b); tokenu brak',
  'src/ekrany/WzorZnacznik.tsx:minWidth:36': 'do uzasadnienia 04: minimalna szerokość liczby w pasku znacznika; tokenu ani wartości w design-spec brak',
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
