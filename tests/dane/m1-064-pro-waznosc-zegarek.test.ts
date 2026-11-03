// M1-audytor-generalny-064 (02-monetyzacja-003, MON-06, KP-17): stan ekranu blokady i zegarka wysyłany przez kompozycję licznika
// (`odswiezEkranBlokady` po zapisie) niesie koniec okresu subskrypcji Pro w `proWaznoscDo`; dożywotni — `null` (bez końca).
// Prawdziwy `dostepPro` na sztucznym sklepie i prawdziwa baza; atrapy tylko na granicy platformy (Live Activity, zegarek).
import { migruj } from '../../src/dane/migracje/migruj';
import type { LiveActivity, StanEkranuBlokady, Zegarek } from '../../src/domena/porty';
import { utworzI18n } from '../../src/i18n/i18n';
import { ZASOBY } from '../../src/i18n/slowniki';
import { dostepPro } from '../../src/kompozycja/dostep';
import { kompozycjaLicznika } from '../../src/kompozycja/licznik';
import { sklepSztuczny } from '../../src/platforma/sklep-sztuczny';
import { czesc, licznik, projekt } from './pomocnicze/dane-wejsciowe';
import { DOBA, T0, przygotuj, wykonaj } from './pomocnicze/srodowisko';

async function stanPoZakupie(produkt: string) {
  const s = await przygotuj();
  const i = await utworzI18n({ magazyn: { odczytaj: async () => null, zapisz: async () => {} }, systemowe: () => ['en-US'], zasoby: ZASOBY });
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 3)]);
  const sklep = sklepSztuczny(() => T0);
  const plik = { tekst: null as string | null };
  const dostep = dostepPro(sklep, { czytaj: async () => plik.tekst, zapisz: async (t) => { plik.tekst = t; } }, () => T0);
  await sklep.kup(produkt);
  await dostep.odswiez();
  const wyslane: StanEkranuBlokady[] = [];
  const liveActivity: LiveActivity = { start: async () => ({ ok: true, wartosc: undefined }), aktualizuj: async () => undefined, zakoncz: async () => undefined };
  const zegarek: Zegarek = { potwierdz: () => undefined, wyslijStan: async (st) => { wyslane.push(st); }, odbieraj: () => () => undefined };
  const k = kompozycjaLicznika({ ...s.z, pro: () => dostep.stan().pro, migruj: (b) => migruj(b), liveActivity, zegarek }, { t: i.t, jezyk: i.jezyk, zegar24h: () => true }, { wibracje: () => true, dostep });
  expect((await k.przygotuj()).ok).toBe(true);
  await k.otworz('l1');
  await k.poZmianie(); // po zapisie z arkusza: stan ekranu blokady i zegarka
  const ostatni = wyslane.at(-1);
  if (!ostatni) throw new Error('kompozycja nie wysłała stanu do zegarka');
  return ostatni;
}

test('M1-064: subskrypcja roczna (koniec T0 + 30 dni w sztucznym sklepie) → stan zegarka: pro, proWaznoscDo = koniec okresu', async () => {
  const st = await stanPoZakupie('oczko.pro.yearly');
  expect(st.pro).toBe(true);
  expect(st.proWaznoscDo).toBe(T0 + 30 * DOBA);
});

test('M1-064: dożywotni → stan zegarka: pro, proWaznoscDo = null (bez końca, KP-17)', async () => {
  const st = await stanPoZakupie('oczko.pro.lifetime');
  expect(st.pro).toBe(true);
  expect(st.proWaznoscDo).toBeNull();
});
