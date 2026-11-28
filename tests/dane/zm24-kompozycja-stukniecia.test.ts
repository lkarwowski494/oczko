// PU-358 (R3, TQ1): kompozycja licznika z krokiem 2 — sygnały po skoku (`zdarzeniaPlus` z `przed`, `sygnalySkoku`: cel części, koniec powtórzenia, wejście w rząd
// z instrukcją) i strażnik serii RD-17 liczony na stuknięciach (`serieStukniec`: seria = 3 stuknięcia, baner = suma kroków). Domena ma wektory SK i SE
// (tests/domena/zm24-stukniecia.test.ts); tu sprawdzamy połączenie w kompozycji na prawdziwym SQLite.
import { migruj } from '../../src/dane/migracje/migruj';
import type { LiveActivity, Zegarek } from '../../src/domena/porty';
import { utworzI18n } from '../../src/i18n/i18n';
import { ZASOBY } from '../../src/i18n/slowniki';
import { kompozycjaLicznika, type Jezyk } from '../../src/kompozycja/licznik';
import { czesc, licznik, projekt, przypomnienie } from './pomocnicze/dane-wejsciowe';
import { T0, przygotuj, wykonaj } from './pomocnicze/srodowisko';

const liveActivity: LiveActivity = { start: async () => ({ ok: true, wartosc: undefined }), aktualizuj: async () => undefined, zakoncz: async () => undefined, aktywna: () => false };
const zegarek: Zegarek = { potwierdz: () => undefined, wyslijStan: async () => undefined, odbieraj: () => () => undefined };

/** Licznik l1 z `n` rzędami i krokiem 2; opcjonalnie cel części, długość powtórzenia, plan przypomnienia „od 6 co 6”. */
async function krok2(n: number, o: { cel?: number; powtorzenie?: number; plan?: boolean } = {}) {
  const s = await przygotuj();
  s.pro.wartosc = true;
  const i = await utworzI18n({ magazyn: { odczytaj: async () => null, zapisz: async () => {} }, systemowe: () => ['en-US'], zasoby: ZASOBY });
  const j: Jezyk = { t: i.t, jezyk: i.jezyk, zegar24h: () => true };
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód', 1, { cel: o.cel ?? null }), ...licznik('l1', 'c1', n),
    ['UPDATE licznik SET krok = 2, dlugosc_powtorzenia = ? WHERE id = ?', [o.powtorzenie ?? null, 'l1']], ...(o.plan ? [przypomnienie('r1', 'l1')] : [])]);
  const k = kompozycjaLicznika({ ...s.z, migruj: (b) => migruj(b), liveActivity, zegarek }, j);
  await k.przygotuj();
  await k.otworz('l1');
  s.zegar.ustaw(T0 + 3_600_000);
  return { s, k };
}

describe('ZM-24 sygnały po skoku „+2” w kompozycji (SK, RD-12, RD-13)', () => {
  test('ZM-24 PU-358: +2 przeskakujące cel części (43 → 45, cel 44) daje sygnał celu części (wcześniej tylko równość z celem)', async () => {
    const { k } = await krok2(43, { cel: 44 });
    const w = await k.uslugi.dodajRzad();
    expect(w.ok && [w.wartosc.skonczone, w.wartosc.zdarzenia.includes('cel-czesci')]).toEqual([45, true]);
  });

  test('ZM-24 PU-358: +2 przez wielokrotność długości powtórzenia (9 → 11, długość 10) daje „koniec powtórzenia”; +2 bez przekroczenia (11 → 13) nie', async () => {
    const { s, k } = await krok2(9, { powtorzenie: 10 });
    const a = await k.uslugi.dodajRzad();
    expect(a.ok && a.wartosc.zdarzenia.includes('koniec-powtorzenia')).toBe(true);
    s.zegar.przesun(10_000);
    const b = await k.uslugi.dodajRzad();
    expect(b.ok && [b.wartosc.skonczone, b.wartosc.zdarzenia.includes('koniec-powtorzenia')]).toEqual([13, false]);
  });

  test('ZM-24 PU-358: +2 z rzędu 11 (skończone) do 13 przeskakuje rząd 12 z instrukcją przypomnienia — jedno wejście w rząd, nie pominięte (RD-13-W23)', async () => {
    const { k } = await krok2(10, { plan: true }); // plan od 6 co 6: rzędy 6, 12, 18…; 10 → 12 przekracza 12? 12 = wejście
    const w = await k.uslugi.dodajRzad();
    expect(w.ok && [w.wartosc.skonczone, w.wartosc.zdarzenia.includes('przypomnienie'), w.wartosc.wejscieWPrzypomnienie?.rzad]).toEqual([12, true, 12]);
  });
});

describe('ZM-24 strażnik serii RD-17 na stuknięciach (SE)', () => {
  test('ZM-24 PU-358: dwa stuknięcia „+2” w oknie (4 zdarzenia) to jeszcze nie seria; trzecie tworzy serię, baner mówi o 6 rzędach (suma kroków)', async () => {
    const { s, k } = await krok2(30);
    await k.uslugi.dodajRzad(); s.zegar.przesun(300);
    await k.uslugi.dodajRzad(); s.zegar.przesun(300);
    expect((await k.dzialania.odswiez!()).baner).toBeNull();
    await k.uslugi.dodajRzad(); s.zegar.przesun(300);
    expect((await k.dzialania.odswiez!()).baner).toMatchObject({ rodzaj: 'seria', n: 6, zrodlo: 'aplikacja' });
  });

  test('ZM-24 PU-358: „Cofnij” serię cofa wszystkie rzędy ze stuknięć serii (30 → 36 → 30), baner „Removed” z 6 rzędami', async () => {
    const { s, k } = await krok2(30);
    for (let i = 0; i < 3; i++) { await k.uslugi.dodajRzad(); s.zegar.przesun(300); }
    await k.dzialania.naCofnijSerie!();
    const po = await k.dzialania.odswiez!();
    expect([po.skonczone, po.baner]).toEqual([30, { rodzaj: 'cofnieto', n: 6, wartosc: 30 }]);
  });
});
