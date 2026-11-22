// 07-e2e (2026-11-08), test przed kodem p2: `przygotuj()` → zimny start zawsze „Dziś”; miejsce pracy dalej czytane i podawane dla „Kontynuuj ›”.
// Wyrocznia — decyzje i BRD, nie kod: ZM-18 (docs/scope-contract.md, wiersz „08 (p2)”: „`przygotuj()` z celem 'licznik' | 'lista' | 'wzor' → zawsze »Dziś«,
// miejsce pracy … dalej zapisywane i używane przez »Kontynuuj ›«”), P-563 (4a), ER-68 (NFR-PIE-001, BR-LIC-001/S1), ER-69 (BR-PRJ-011/S1),
// P-564/P-565 (karta bez ostatniego miejsca → „Wybierz projekt ›” → Projekty).
// Kształt wyniku (propozycja 07 dla 08): `{ cel: 'dzis', miejsce: 'licznik' | 'wzor' | 'lista' }` — `miejsce` to dotychczasowy `cel` (ta sama logika, P-563 4a).
// Zmiana nazwy pola przez 08 jest dozwolona razem z tym testem (zgłoszenie do 07), byle start nie zależał od miejsca.
import { zapamietajLicznik } from '../../src/przypadki-uzycia/widok-licznika';
import { pozycjaWzoru, zapamietajPozycjeWzoru } from '../../src/przypadki-uzycia/wzor-miejsce';
import { czesc, licznik, plik, projekt, wzor } from './pomocnicze/dane-wejsciowe';
import { migruj } from '../../src/dane/migracje/migruj';
import type { LiveActivity, Zegarek } from '../../src/domena/porty';
import { utworzI18n } from '../../src/i18n/i18n';
import { ZASOBY } from '../../src/i18n/slowniki';
import { kompozycjaLicznika, type Jezyk } from '../../src/kompozycja/licznik';
import { T0, przygotuj, wlozPlik, wykonaj } from './pomocnicze/srodowisko';

/** Jak `tests/dane/pomocnicze/kompozycja-licznika.ts`, z katalogiem bazy (restart = nowa kompozycja na tym samym pliku, jak F-49 w kompozycja-licznika.test.ts). */
async function kompozycjaTestowa(o: { katalog?: string } = {}) {
  const s = await przygotuj({ katalog: o.katalog });
  const i = await utworzI18n({ magazyn: { odczytaj: async () => null, zapisz: async () => {} }, systemowe: () => ['en-US'], zasoby: ZASOBY });
  const j: Jezyk = { t: i.t, jezyk: i.jezyk, zegar24h: () => true };
  const liveActivity: LiveActivity = { start: async () => ({ ok: true, wartosc: undefined }), aktualizuj: async () => undefined, zakoncz: async () => undefined };
  const zegarek: Zegarek = { potwierdz: () => undefined, wyslijStan: async () => undefined, odbieraj: () => () => undefined };
  const k = kompozycjaLicznika({ ...s.z, migruj: (b) => migruj(b), liveActivity, zegarek }, j, { wibracje: () => true });
  return { s, k, j };
}

const PDF = Buffer.from('%PDF-1.4\n%%EOF\n');
const poKolejce = () => new Promise((r) => setTimeout(r, 30));

describe('przygotuj(): zimny start zawsze „Dziś” (ZM-18, P-563 4a)', () => {
  test('NFR-PIE-001 / BR-LIC-001/S1 (ER-68): świeża instalacja → „Dziś”, karta „Pierwszy licznik” otwiera licznik z 0', async () => {
    const { k } = await kompozycjaTestowa();
    expect(await k.przygotuj()).toEqual({ ok: true, wartosc: { cel: 'dzis', miejsce: 'licznik' } });
    const start = await k.uslugi.start();
    expect([start.licznik.projekt, start.licznik.skonczone]).toEqual([null, 0]);
  });

  test('BR-PRJ-011/S1 (ER-69): restart po pracy w liczniku → „Dziś”, „Kontynuuj ›” do tego licznika; „+1” karty liczy ten sam licznik', async () => {
    const a = await kompozycjaTestowa();
    await a.k.przygotuj();
    await a.k.uslugi.dodajRzad();
    const id = a.k.biezacy();
    await poKolejce();
    const b = await kompozycjaTestowa({ katalog: a.s.katalog });
    expect(await b.k.przygotuj()).toEqual({ ok: true, wartosc: { cel: 'dzis', miejsce: 'licznik' } });
    expect(b.k.biezacy()).toBe(id);
    const w = await b.k.uslugi.dodajRzad(); // „+1” karty = ten sam przypadek użycia co +1 licznika (ZM-18, STOP 3 „flagi danych: żadna”)
    expect(w.ok && w.wartosc.skonczone).toBe(2);
  });

  test('BR-PRJ-011/S1 (P-563 4a): praca skończyła się na wzorze → start na „Dziś” (nie na wzorze); „Kontynuuj ›” do wzoru, strona i powiększenie zachowane', async () => {
    const { s, k } = await kompozycjaTestowa();
    const h = wlozPlik(s.magazyn, PDF, 'pdf');
    await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 3), plik(h, 'pdf', PDF.length), wzor('w1', 'p1', h)]);
    await k.otworz('l1');
    await zapamietajPozycjeWzoru(s.z, { licznikId: 'l1', wzorId: 'w1', strona: 3, powiekszenie: 2 });
    expect(await k.przygotuj()).toEqual({ ok: true, wartosc: { cel: 'dzis', miejsce: 'wzor' } });
    expect(await pozycjaWzoru(s.baza, 'w1')).toEqual({ strona: 3, powiekszenie: 2 });
  });

  test('BR-PRJ-011/S1 (P-564, P-565): ostatni licznik w koszu, projekty są → „Dziś” z kartą „Wybierz projekt ›” (miejsce: lista)', async () => {
    const { s, k } = await kompozycjaTestowa();
    await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 3)]);
    await zapamietajLicznik(s.z, { licznikId: 'l1' });
    await wykonaj(s.baza, [['UPDATE licznik SET usunieto_ms = ?', [T0]]]);
    expect(await k.przygotuj()).toEqual({ ok: true, wartosc: { cel: 'dzis', miejsce: 'lista' } });
  });
});
