/* Termin limitu dni w tekstach wydania = termin aplikacji (P-302: „crafting days”; plan P3C2, 10-wydanie-007, 01-odkrywanie-003, 11-wzrost-002).
 * Dlaczego: strona produktu, polityka, wsparcie i podpisy zrzutów mówiły „knitting days”, a aplikacja i sklep „crafting days”;
 * szydełkujący czyta, że limit liczy „dni dziergania” (wytyczna 2.3: metadane i informacje o prywatności mają odpowiadać aplikacji).
 * Termin jest czytany z `src/i18n/slowniki/en.json` (nie wpisany w test), więc zmiana terminu w aplikacji wymusza zmianę stron.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = join(__dirname, '../..');
const czytaj = (p: string) => readFileSync(join(root, p), 'utf8');
const tekst = (html: string) => html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const sekcjaEn = (html: string) => html.match(/<section lang="en"[\s\S]*?<\/section>/)?.[0] ?? '';

const en = JSON.parse(czytaj('src/i18n/slowniki/en.json'));
/** „{{count}} crafting days” → „crafting days” (liczba mnoga terminu limitu w aplikacji). */
const MNOGA: string = en.dni.dni_robotki_other.replace('{{count}}', '').trim();
const POJEDYNCZA: string = en.dni.dni_robotki_one.replace('{{count}}', '').trim();
const STARE = /\bknitting days?\b|days you knit/i;

describe('termin limitu dni: strony site/ i teksty wydania zgodne z aplikacją', () => {
  test('termin aplikacji czytany z en.json to „crafting day(s)”', () => {
    expect(MNOGA).toBe('crafting days');
    expect(POJEDYNCZA).toBe('crafting day');
  });

  test.each(['index.html', 'privacy.html', 'support.html'])('site/%s: bez „knitting days” i „days you knit”', (n) => {
    expect(tekst(czytaj(`site/${n}`))).not.toMatch(STARE);
  });

  test('strona produktu, wsparcie i polityka (EN) podają limit terminem aplikacji', () => {
    expect(tekst(sekcjaEn(czytaj('site/index.html')))).toContain(`Free for up to 5 ${MNOGA} a month`);
    expect(tekst(sekcjaEn(czytaj('site/support.html')))).toContain(`free for up to 5 ${MNOGA} per calendar month`);
    const polityka = tekst(sekcjaEn(czytaj('site/privacy.html')));
    expect(polityka).toContain(`monthly limit of ${MNOGA}`);
    expect(polityka).toContain(`the dates of ${MNOGA}`);
  });

  test('teksty sklepu (en-US, en-GB) używają tego samego terminu', () => {
    const sklep = JSON.parse(czytaj('docs/wydanie/metadane/en.store.json')).apple.info;
    for (const jezyk of ['en-US', 'en-GB']) {
      expect(sklep[jezyk].promoText).toContain(`5 ${MNOGA} a month`);
      expect(sklep[jezyk].description).toContain(`5 ${MNOGA} every month`);
    }
  });

  test('metadane wydania i notatki dla App Review: bez starego terminu (poza zapisem historycznym w en.md)', () => {
    const katalog = 'docs/wydanie/metadane';
    for (const n of readdirSync(join(root, katalog))) {
      // en.md opisuje zmianę P-302 (cytuje stary termin jako to, co zastąpiono) — zapis historyczny.
      if (n === 'en.md') continue;
      expect({ n, trafienie: czytaj(`${katalog}/${n}`).match(STARE)?.[0] }).toEqual({ n, trafienie: undefined });
    }
    expect(czytaj('docs/wydanie/metadane/zrzuty-plan.md')).toContain(`free 5 ${MNOGA} a month`);
    expect(czytaj('docs/wydanie/metadane/zrzuty-plan.md')).toContain(`your ${MNOGA}`);
  });

  test('notatki dla App Review w sklep.md (wzorzec Review notes) używają terminu aplikacji', () => {
    const wiersz = czytaj('docs/wydanie/sklep.md').split('\n').find((l) => l.startsWith('In-App Purchases:'));
    expect(wiersz).toBeDefined();
    expect(wiersz).toContain(`5 ${MNOGA} per calendar month`);
    expect(wiersz).not.toMatch(STARE);
  });
});

describe('strona produktu: bez obietnic sprzed testu i bez zawężenia platformy (11-wzrost-002)', () => {
  test('EN: „for iPhone and iPad”, nie samo „for iPhone”; PL: „iPhone’a i iPada”', () => {
    const html = czytaj('site/index.html');
    expect(tekst(sekcjaEn(html))).toContain('for iPhone and iPad');
    expect(tekst(sekcjaEn(html))).not.toMatch(/for iPhone\b(?! and iPad)/);
    expect(html).toContain('na iPhone’a i iPada');
  });

  test('zdanie o ekranie blokady nie jest na stronie produktu (wraca po wpisie testu, docs/wydanie/metadane/en.md, P-146)', () => {
    const html = tekst(czytaj('site/index.html'));
    expect(html).not.toMatch(/lock screen|ekranie blokady/i);
  });

  test.each(['privacy.html', 'support.html'])('site/%s: nawigacja nie prowadzi do index.html (pod apps4brew.com/oczko/ zwraca 404)', (n) => {
    expect(czytaj(`site/${n}`)).not.toMatch(/href="index\.html"/);
  });
});
