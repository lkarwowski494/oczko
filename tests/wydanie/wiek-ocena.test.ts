/* Odpowiedź wiekowa w sklep.md §4 (M1-audytor-generalny-009; 10-wydanie-003; DEC-20 a; rola 10, 2026-11-02).
 * Test pilnuje formy dowodu odpowiedzi „Unrestricted Web Access”: wiersz „Wiek” nie stoi na przesłance „import strony WWW jest w 1.1”,
 * odpowiada na pytanie Apple, cytuje definicję ze strony źródła z datą odczytu, wskazuje decyzję (ID P-…) i kod, który ładuje dowolny adres,
 * a pozostałe miejsca w dokumentach (krok 5 §3, uzupełnienie E2, kroki właściciela) mówią to samo.
 * Dlaczego: import dowolnej strony WWW jest w 1.0 (modules/oczko-wzor/ios/KonwersjaNaPdf.swift), a wytyczna 2.3.6 każe odpowiadać zgodnie z prawdą;
 * odpowiedź sprzed zmiany zakresu niosła fałszywą przesłankę (zasada roli 3: formularze mówią prawdę, nie to, co przejdzie recenzję). */
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.join(__dirname, '..', '..');
const czytaj = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const sklep = czytaj('docs/wydanie/sklep.md');
const kroki = czytaj('docs/wydanie/kroki-wlasciciela-testflight.md');
const DATA = '2026-11-02';
const STRONA_WIEKU = 'https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions/';

/** Sekcja od nagłówka `## <prefiks>` do następnego `## `. */
const sekcja = (tekst: string, prefiks: string): string => {
  const i = tekst.search(new RegExp(`^## ${prefiks}`, 'm'));
  if (i < 0) return '';
  const reszta = tekst.slice(i + 3);
  const k = reszta.search(/^## /m);
  return k < 0 ? reszta : reszta.slice(0, k);
};

const wiersz = sekcja(sklep, '4\\.').split('\n').find((l) => /^\|\s*Wiek\s*\|/.test(l)) ?? '';

describe('wiersz „Wiek” w sklep.md §4 (10-wydanie-003)', () => {
  test('istnieje i nie opiera się na przesłance „import strony WWW jest w 1.1” ani na „brak nieograniczonego dostępu do sieci”', () => {
    expect(wiersz).not.toBe('');
    expect(wiersz).not.toMatch(/import strony WWW jest w 1\.1/);
    expect(wiersz).not.toMatch(/1\.1/); // żadnej przesłanki „późniejsza wersja” w wierszu (test akceptacyjny 10-wydanie-003)
    expect(wiersz).not.toMatch(/Brak nieograniczonego dostępu do sieci/);
    expect(sklep).not.toContain('1.1, P-093');
  });

  test('odpowiada na pytanie o Unrestricted Web Access: Yes → 16+', () => {
    expect(wiersz).toMatch(/Unrestricted Web Access/);
    expect(wiersz).toMatch(/Unrestricted Web Access: Yes\*\*/);
    expect(wiersz).toMatch(/16\+/);
  });

  test('cytuje definicję Apple dosłownie, z adresem strony i datą odczytu', () => {
    expect(wiersz).toContain(STRONA_WIEKU);
    expect(wiersz).toContain(DATA);
    expect(wiersz).toContain('Users can navigate to any webpage within the app or freely browse the web');
    expect(wiersz).toContain('embedded browser functionality or browser app');
  });

  test('wskazuje decyzję (ID P-…, DEC-20 a) i odrzucone opcje (b), (c)', () => {
    expect(wiersz).toMatch(/P-393/);
    expect(wiersz).toMatch(/DEC-20/);
    expect(wiersz).toMatch(/\(b\)/);
    expect(wiersz).toMatch(/\(c\)/);
  });

  test('podstawa w kodzie: wiersz wskazuje pliki, a te zawierają ładowanie dowolnego adresu http(s) przez WKWebView', () => {
    expect(wiersz).toContain('modules/oczko-wzor/ios/KonwersjaNaPdf.swift');
    expect(wiersz).toContain('src/domena/adres.ts');
    expect(czytaj('modules/oczko-wzor/ios/KonwersjaNaPdf.swift')).toContain('case let .adres(u): web.load(URLRequest(url: u))');
    expect(czytaj('src/domena/adres.ts')).toContain('https?:');
  });
});

describe('spójność odpowiedzi wiekowej w dokumentach wydania', () => {
  test('krok 5 w §3 oczekuje 16+ (nie 4+) i odsyła do §4', () => {
    const k = sekcja(sklep, '3\\.').split('\n').find((l) => /^\|\s*5\s*\|\s*\*\*Ocena wieku/.test(l)) ?? '';
    expect(k).not.toBe('');
    expect(k).toMatch(/16\+/);
    expect(k).not.toMatch(/4\+/);
  });

  test('uzupełnienie E2 w §4 nie zostawia oczekiwanego wyniku 4+ ani odpowiedzi „nie” na dostęp do sieci', () => {
    const u = sekcja(sklep, '4\\.');
    expect(u).not.toMatch(/oczekiwany wynik 4\+/);
    expect(u).not.toMatch(/Brak nieograniczonego dostępu do sieci/);
    expect(u).toMatch(/\*\*Wiek[^*]*\*\*[^\n]*16\+/);
  });

  test('kroki właściciela: zadanie C2 z adresem Apple, datą odczytu i odpowiedzią Yes → 16+; wiersz w tabeli stanu', () => {
    const s = sekcja(kroki, 'C2');
    expect(s).not.toBe('');
    expect(s).toContain(STRONA_WIEKU);
    expect(s).toContain('https://developer.apple.com/help/app-store-connect/manage-app-information/set-an-app-age-rating/');
    expect(s).toContain(DATA);
    expect(s).toMatch(/Unrestricted Web Access/);
    expect(s).toMatch(/16\+/);
    expect(kroki).toMatch(/^\| C2 \|.*Age Rating/m);
  });
});
