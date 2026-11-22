// C2 partii 5 (design-spec „Usuwanie”: usunięty bieżący licznik przełącza ekran na pierwszy dostępny): kompozycja licznika po usunięciu.
import { migruj } from '../../src/dane/migracje/migruj';
import type { LiveActivity, Zegarek } from '../../src/domena/porty';
import { utworzI18n } from '../../src/i18n/i18n';
import { ZASOBY } from '../../src/i18n/slowniki';
import { kompozycjaLicznika, type Jezyk } from '../../src/kompozycja/licznik';
import { usunCzesc, usunLicznik, usunProjekt } from '../../src/przypadki-uzycia/projekt';
import { czesc, licznik, projekt } from './pomocnicze/dane-wejsciowe';
import { przygotuj, wykonaj } from './pomocnicze/srodowisko';

async function srodowisko() {
  const s = await przygotuj();
  const i = await utworzI18n({ magazyn: { odczytaj: async () => null, zapisz: async () => {} }, systemowe: () => ['en-US'], zasoby: ZASOBY });
  const j: Jezyk = { t: i.t, jezyk: i.jezyk, zegar24h: () => true };
  const liveActivity: LiveActivity = { start: async () => ({ ok: true, wartosc: undefined }), aktualizuj: async () => undefined, zakoncz: async () => undefined };
  const zegarek: Zegarek = { potwierdz: () => undefined, wyslijStan: async () => undefined, odbieraj: () => () => undefined };
  const k = kompozycjaLicznika({ ...s.z, migruj: (b) => migruj(b), liveActivity, zegarek }, j);
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Tył'), ...licznik('l1', 'c1', 3), czesc('c2', 'p1', 'Przód', 2), ...licznik('l2', 'c2', 1),
    projekt('p2', 'Szal'), czesc('d1', 'p2', 'X'), ...licznik('m1', 'd1', 0)]);
  await k.przygotuj();
  return { s, k };
}

describe('poUsunieciu', () => {
  test('usunięty bieżący licznik → pierwszy dostępny licznik projektu', async () => {
    const { s, k } = await srodowisko();
    await k.otworz('l1');
    await usunLicznik(s.z, { licznikId: 'l1' });
    await k.poUsunieciu('p1');
    expect(k.biezacy()).toBe('l2');
  });
  test('usunięta część z bieżącym licznikiem → licznik innej części; usunięcie innego licznika nie zmienia bieżącego', async () => {
    const { s, k } = await srodowisko();
    await k.otworz('l2');
    await usunLicznik(s.z, { licznikId: 'l1' });
    await k.poUsunieciu('p1');
    expect(k.biezacy()).toBe('l2');
    await usunCzesc(s.z, { czescId: 'c2' });
    await k.poUsunieciu('p1');
    expect(k.biezacy()).toBeNull(); // c1 bez licznika (l1 w koszu) — brak dostępnego licznika w projekcie
  });
  test('usunięty projekt z bieżącym licznikiem → bez bieżącego licznika (start pokaże listę projektów)', async () => {
    const { s, k } = await srodowisko();
    await k.otworz('m1');
    await usunProjekt(s.z, { projektId: 'p2' });
    await k.poUsunieciu('p2');
    expect(k.biezacy()).toBeNull();
    expect(await k.przygotuj()).toEqual({ ok: true, wartosc: { cel: 'dzis', miejsce: 'lista' } });
  });
});
