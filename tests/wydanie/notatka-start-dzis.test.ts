// M1-audytor-generalny-302 (10-wydanie-002, 01-odkrywanie-001; WYD-11, WYD-05; DEC-02 a, P-087/P-633; App Review Guidelines 2.3.1(a)):
// po M3 aplikacja zawsze startuje na „Dziś” (app/(zakladki)/index.tsx, P-563), a Ustawienia otwiera tylko zębatka (P-571). Notatka dla App Review
// prowadzi więc od „Dziś” i wskazuje zębatkę, a plan zrzutów zaczyna od ekranu widocznego po starcie. Nazwy ekranów i przycisków idą z en.json.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const czytaj = (p: string) => readFileSync(join(__dirname, '../..', p), 'utf8');
const en = JSON.parse(czytaj('src/i18n/slowniki/en.json')) as {
  zakladki: { dzis: string; projekty: string };
  dzis: { kontynuuj: string; otworz_licznik: string; pierwszy_tytul: string };
  licznik: { minus: string; akcja_historia: string };
  ustawienia: { tytul: string; oczko_pro: string };
};
const notatka = czytaj('docs/wydanie/metadane/notatka-recenzja.txt');
const linie = notatka.split('\n');
const plan = czytaj('docs/wydanie/metadane/zrzuty-plan.md');
const dzisKod = czytaj('src/ekrany/Dzis.tsx');
const start = czytaj('app/(zakladki)/index.tsx');
const zakladkiKod = czytaj('app/(zakladki)/_layout.tsx');

describe('kod: po starcie jest „Dziś”, Ustawienia otwiera zębatka (podstawa tekstów wydania)', () => {
  test('„Dziś” jest trasą startową, ma zębatkę „Settings”, a Ustawień nie ma w pasku zakładek', () => {
    expect(en.zakladki.dzis).toBe('Today');
    expect(en.ustawienia.tytul).toBe('Settings');
    expect(start).toMatch(/pierwszy ekran po każdym zimnym starcie/);
    expect(dzisKod).toMatch(/symbol="gearshape" etykieta=\{t\('ustawienia\.tytul'\)\}/);
    expect(zakladkiKod).not.toMatch(/ustawienia/);
  });
});

describe('notatka dla App Review prowadzi od „Dziś”', () => {
  const krok1 = linie.find((l) => /^1\. /.test(l)) ?? '';

  test('krok 1 głównego przepływu zaczyna od ekranu „Dziś” i karty projektu, potem „Continue” / „Open counter” (teksty z en.json)', () => {
    expect(krok1).not.toBe('');
    expect(krok1).toContain(en.zakladki.dzis);
    expect(krok1).toContain(`"${en.dzis.kontynuuj}"`);
    expect(krok1).toContain(`"${en.dzis.otworz_licznik}"`);
    expect(krok1).toContain(`"${en.dzis.pierwszy_tytul}"`);
    expect(krok1.indexOf(en.zakladki.dzis)).toBeLessThan(krok1.indexOf('"+1'));
    expect(krok1).toContain(`"${en.licznik.minus}"`);
    expect(krok1).toContain(`"${en.licznik.akcja_historia}"`);
  });

  test('„+1 row” z licznika nie jest pierwszą czynnością po otwarciu aplikacji (karta „Dziś” ma przycisk „+1”)', () => {
    expect(/^1\. Open the app\. Tap "\+1 row"/.test(krok1)).toBe(false);
    expect(krok1).toMatch(/"\+1" on the (project )?card/);
  });

  test('każda wzmianka o Ustawieniach wskazuje zębatkę na „Dziś” (krok 5 i akapit In-App Purchases)', () => {
    const z = linie.filter((l) => new RegExp(en.ustawienia.tytul).test(l));
    expect(z.length).toBeGreaterThanOrEqual(2);
    for (const l of z) {
      expect(l).toMatch(/gear/);
      expect(l).toContain(en.zakladki.dzis);
    }
    expect(linie.find((l) => /^In-App Purchases/.test(l)) ?? '').toContain(`"${en.ustawienia.oczko_pro}"`);
    expect(linie.find((l) => /^In-App Purchases/.test(l)) ?? '').toMatch(/gear/);
  });

  test('notatka ≤ 4000 bajtów', () => {
    expect(Buffer.byteLength(notatka)).toBeLessThanOrEqual(4000);
  });
});

describe('plan zrzutów zaczyna od ekranu widocznego po starcie', () => {
  const wiersze = plan.split('\n').filter((l) => /^\| [0-9]+ \|/.test(l));

  test('zrzut 1 = „Dziś” z kartą projektu; licznik z notatką jest dalej', () => {
    expect(wiersze[0]).toMatch(/^\| 1 \| [^|]*(Dziś|Today)[^|]*kart[aąę]/i);
    expect(wiersze[0]).not.toMatch(/^\| 1 \| Licznik w trakcie/);
    expect(wiersze.slice(1).some((l) => /Licznik w trakcie/.test(l))).toBe(true);
  });

  test('nagłówek planu liczy ekrany tak jak tabela', () => {
    expect(plan).toContain(`(${wiersze.length} na klasę;`);
  });
});
