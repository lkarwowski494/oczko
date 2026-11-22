// Dostęp Pro w kompozycji (ADR-0010, KP-06, P-103 (3a), (5a)) na sztucznym sklepie: zakup → Pro, wygaśnięcie → darmowa,
// błąd odczytu sklepu → pamięć z oknem offline (poziom „niepewny” bez Pro); dożywotni → bez planów subskrypcji.
import { dostepPro } from '../../src/kompozycja/dostep';
import { sklepSztuczny } from '../../src/platforma/sklep-sztuczny';
import { OKNO_OFFLINE_PRO_MS } from '../../src/konfiguracja';

function srodowisko() {
  let teraz = Date.UTC(2026, 10, 10);
  const plik = { tekst: null as string | null };
  const sklep = sklepSztuczny(() => teraz);
  const magazyn = { czytaj: async () => plik.tekst, zapisz: async (t: string) => { plik.tekst = t; } };
  return { sklep, plik, d: dostepPro(sklep, magazyn, () => teraz), przesun: (ms: number) => { teraz += ms; } };
}

test('bez zakupu → darmowa (pewna); roczny → Pro subskrypcja; wygaś → darmowa', async () => {
  const s = srodowisko();
  expect(await s.d.odswiez()).toMatchObject({ pro: false, poziom: 'darmowa', aktywne: null });
  await s.sklep.kup('oczko.pro.yearly');
  expect(await s.d.odswiez()).toMatchObject({ pro: true, poziom: 'pro', aktywne: { rodzaj: 'subskrypcja', produkt: 'oczko.pro.yearly' } });
  s.sklep.wygas();
  expect(await s.d.odswiez()).toMatchObject({ pro: false, poziom: 'darmowa' });
});

test('KP-06 / P-103 (3a): błąd sklepu → pamięć do wygaśnięcia + okno offline; bez pamięci → niepewny bez Pro', async () => {
  const s = srodowisko();
  await s.sklep.kup('oczko.pro.monthly');
  await s.d.odswiez();
  s.sklep.transakcje = async () => { throw new Error('offline'); };
  expect(await s.d.odswiez()).toMatchObject({ pro: true, poziom: 'pro' });
  s.przesun(30 * 86_400_000 + OKNO_OFFLINE_PRO_MS);
  expect(await s.d.odswiez()).toMatchObject({ pro: false, poziom: 'niepewny' });
});

test('dożywotni → aktywne dozywotni', async () => {
  const s = srodowisko();
  await s.sklep.kup('oczko.pro.lifetime');
  expect((await s.d.odswiez()).aktywne).toEqual({ rodzaj: 'dozywotni' });
});

test('scenariusz 06: „expire access” → bez Pro; „Restore purchases” → Pro wraca; zakupy przeżywają restart (plik buildu E2E)', async () => {
  let plik: string | null = null;
  const zapis = { czytaj: () => plik, zapisz: (t: string) => { plik = t; } };
  const teraz = () => Date.UTC(2026, 10, 10);
  const a = sklepSztuczny(teraz, zapis);
  const pamiec = { czytaj: async () => null, zapisz: async () => undefined };
  await a.kup('oczko.pro.lifetime');
  a.wygas();
  expect((await dostepPro(a, pamiec, teraz).odswiez()).pro).toBe(false);
  await a.przywroc();
  expect((await dostepPro(a, pamiec, teraz).odswiez()).pro).toBe(true);
  const b = sklepSztuczny(teraz, zapis); // restart procesu
  expect((await dostepPro(b, pamiec, teraz).odswiez()).aktywne).toEqual({ rodzaj: 'dozywotni' });
});
