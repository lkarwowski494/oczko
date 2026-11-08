// M3 p8 (P-563 5a, wiersz p8 tabeli „Partie”): barwy celów natywnych (ekran blokady/Dynamic Island, zegarek, arkusz udostępniania) pochodzą z tokenów
// Dzianiny (`docs/design/tokeny.json`, mapa: `docs/design/dzianina/mapa-tokenow.md`), a nie z wartości wpisanych ręcznie. Swift nie kompiluje się na Linuksie,
// więc spójność sprawdza tańsza kontrola tekstowa (zasada 7; wzór: tests/narzedzia/haptyka-zegarka-spojnosc.test.ts): config celu → tokeny → nazwy w Swifcie.
// Wygląd na urządzeniu (kontrast pasa przypomnienia, katalog barw w actool) sprawdza dopiero „Jakość · iOS”.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const K = join(__dirname, '../..');
const tokeny = JSON.parse(readFileSync(join(K, 'docs/design/tokeny.json'), 'utf8')) as {
  kolory: Record<'jasny' | 'ciemny' | 'systemCzarny', Record<string, string>>;
};
const { jasny, ciemny, systemCzarny } = tokeny.kolory;

type Barwa = { light: string; dark: string };
type Cel = 'widget' | 'watch' | 'share';

const wczytaj = (cel: Cel): { barwy?: Record<string, Barwa>; blad?: string } => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require(join(K, 'targets', cel, 'expo-target.config.js')) as { colors: Record<string, Barwa> };
    return { barwy: config.colors };
  } catch (e) {
    return { blad: String(e) };
  }
};

const dwa = (v: string): Barwa => ({ light: v, dark: v });
const zMotywow = (n: string): Barwa => ({ light: jasny[n] as string, dark: ciemny[n] as string });

// Tabela wymagań: nazwa barwy w katalogu zasobów → wartość z tokenu. Nazwa barwy = nazwa tokenu (wyspa* = barwy rozwiniętej Dynamic Island, tło zawsze czarne).
// Pas przypomnienia (wiersz „co dalej”, mapa-tokenow.md: zakreslacz → akcent jako znacznik, tekstNaZakreslaczu → tekst na powierzchnia).
const OCZEKIWANE: Record<Cel, Record<string, Barwa>> = {
  widget: {
    $accent: zMotywow('tekst'),
    tlo: zMotywow('tlo'),
    tekst: zMotywow('tekst'),
    tekst2: zMotywow('tekst2'),
    przycisk: zMotywow('przycisk'),
    przyciskTekst: zMotywow('przyciskTekst'),
    powierzchnia: zMotywow('powierzchnia'),
    akcent: zMotywow('akcent'),
    wyspaPowierzchnia: dwa(systemCzarny.pasPrzypomnienia as string), // P-579, M3-MAK-04: tło pasa na ekranie blokady = systemCzarny.pasPrzypomnienia
    wyspaTekst: dwa(systemCzarny.tekst as string),
    wyspaAkcent: dwa(systemCzarny.akcent as string),
  },
  watch: {
    // zegarek: zawsze ciemne tło systemu (design-spec: systemCzarny dla zegarka)
    $accent: dwa(systemCzarny.tekst as string),
    tekst: dwa(systemCzarny.tekst as string),
    tekst2: dwa(systemCzarny.tekst2 as string),
    przycisk: dwa(systemCzarny.przycisk as string),
    akcent: dwa(systemCzarny.akcent as string),
    powierzchnia: dwa(systemCzarny.pasPrzypomnienia as string), // P-579: tło pasa na zegarku
  },
  share: {
    $accent: zMotywow('tekst'),
    tekst: zMotywow('tekst'),
    tekst2: zMotywow('tekst2'),
  },
};

const swift = (cel: Cel): { plik: string; tresc: string }[] => {
  const wszystkie = (d: string): string[] =>
    readdirSync(join(K, d), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? wszystkie(join(d, e.name)) : e.name.endsWith('.swift') ? [join(d, e.name)] : []));
  return wszystkie(join('targets', cel)).map((plik) => ({ plik, tresc: readFileSync(join(K, plik), 'utf8') }));
};

describe.each(Object.keys(OCZEKIWANE) as Cel[])('cel %s: barwy z tokenów Dzianiny', (cel) => {
  const w = wczytaj(cel);

  test('expo-target.config.js buduje się z tokenów (kolory.<motyw>), bez wyjątku', () => {
    expect(w.blad).toBeUndefined();
  });

  test('katalog barw = tabela wymagań: nazwa barwy, wartość jasna i ciemna z tokenu', () => {
    expect(w.barwy).toEqual(OCZEKIWANE[cel]);
  });

  test('config nie zawiera heksów wpisanych ręcznie (wartości tylko przez tokeny)', () => {
    const zrodlo = readFileSync(join(K, 'targets', cel, 'expo-target.config.js'), 'utf8').replace(/^\s*\/\/.*$/gm, '');
    expect(zrodlo.match(/#[0-9A-Fa-f]{6,8}\b/g)).toBeNull();
    expect(zrodlo).toContain('tokeny.kolory');
    expect(zrodlo).not.toMatch(/tokeny\.kolor\./); // stary kształt tokenów (kolor.jasny.grafit)
  });

  test('Swift używa wyłącznie barw z katalogu (Color("nazwa")), a każda barwa katalogu jest użyta (brak martwych wartości)', () => {
    const pliki = swift(cel);
    const uzyte = new Set<string>();
    const obce: string[] = [];
    for (const { plik, tresc } of pliki) {
      for (const m of tresc.matchAll(/\bColor\(([^)]*)\)/g)) {
        const arg = (m[1] ?? '').trim();
        if (/^"[^"]+"$/.test(arg)) uzyte.add(arg.slice(1, -1));
        else if (!/^[a-z][A-Za-z]*$/.test(arg) && !/^[a-z][A-Za-z]* \? "[^"]+" : "[^"]+"$/.test(arg)) obce.push(`${plik}: Color(${arg})`); // dozwolone: nazwa zmiennej z literału albo warunek na dwóch literałach (wyspa ? "wyspaTekst" : "tekst")
      }
      // nazwy wybierane warunkowo (wyspa ? "wyspaTekst" : "tekst") też są literałami nazw z katalogu
      for (const m of tresc.matchAll(/"([A-Za-z]+)"/g)) if (Object.keys(OCZEKIWANE[cel]).includes(m[1] as string)) uzyte.add(m[1] as string);
    }
    expect(obce).toEqual([]);
    const katalog = Object.keys(OCZEKIWANE[cel]).filter((n) => n !== '$accent');
    expect(katalog.filter((n) => !uzyte.has(n))).toEqual([]);
    const nieznane = [...uzyte].filter((n) => /^[a-z][A-Za-z]*$/.test(n) && !katalog.includes(n) && pliki.some((p) => new RegExp(`Color\\(["']${n}["']\\)`).test(p.tresc)));
    expect(nieznane).toEqual([]);
  });

  test('Swift nie ma barw wpisanych ręcznie (UIColor, Color(red:), heks, Color.white/.black)', () => {
    for (const { plik, tresc } of swift(cel)) {
      const kod = tresc.replace(/\/\/.*$/gm, '');
      expect({ plik, trafienia: kod.match(/UIColor|NSColor|Color\((?:red|white|hue|\.sRGB|\.display)|Color\.(?:white|black|red|blue|yellow|orange|green|gray)|0x[0-9A-Fa-f]{6}|"#[0-9A-Fa-f]{6}"/g) }).toEqual({ plik, trafienia: null });
    }
  });
});

describe('ikona zegarka z projektu Dzianina', () => {
  test('cel zegarka wskazuje assets/watch.png, a plik ma te same bajty co docs/design/ikona/watch.png (jak ikona-konfiguracja.test.ts)', () => {
    const config = readFileSync(join(K, 'targets/watch/expo-target.config.js'), 'utf8');
    expect(config).toMatch(/icon:\s*'\.\.\/\.\.\/assets\/watch\.png'/);
    expect(readFileSync(join(K, 'assets/watch.png')).equals(readFileSync(join(K, 'docs/design/ikona/watch.png')))).toBe(true);
  });
});
