// 07-jakosc-004 K-04b/c (BR-LIC-013/S2, BR-LIC-020/S3, ADR-0029): kompozycja licznika czyta preferencje urządzenia, nie stałe.
import { migruj } from '../../src/dane/migracje/migruj';
import type { LiveActivity, Zegarek } from '../../src/domena/porty';
import { utworzI18n } from '../../src/i18n/i18n';
import { ZASOBY } from '../../src/i18n/slowniki';
import { kompozycjaLicznika, type Jezyk } from '../../src/kompozycja/licznik';
import { preferencje } from '../../src/kompozycja/preferencje';
import { przygotuj } from './pomocnicze/srodowisko';

async function kompozycja(opcjeZ: (p: ReturnType<typeof preferencje>) => Parameters<typeof kompozycjaLicznika>[2]) {
  const s = await przygotuj();
  const i = await utworzI18n({ magazyn: { odczytaj: async () => null, zapisz: async () => {} }, systemowe: () => ['en-US'], zasoby: ZASOBY });
  const j: Jezyk = { t: i.t, jezyk: i.jezyk, zegar24h: () => true };
  const liveActivity: LiveActivity = { start: async () => ({ ok: true, wartosc: undefined }), aktualizuj: async () => undefined, zakoncz: async () => undefined };
  const zegarek: Zegarek = { potwierdz: () => undefined, wyslijStan: async () => undefined, odbieraj: () => () => undefined };
  const p = preferencje();
  return { s, p, k: kompozycjaLicznika({ ...s.z, migruj: (b) => migruj(b), liveActivity, zegarek }, j, opcjeZ(p)) };
}

test('K-04c: ekran_nie_gasnie = false → start ekranu licznika niesie ekranWlaczony = false; true → true (S1)', async () => {
  const { s, p, k } = await kompozycja((p) => ({ wibracje: () => p.stan().wibracje, ekranWlaczony: () => p.stan().ekranNieGasnie }));
  expect((await k.uslugi.start()).ekranWlaczony).toBe(true);
  await p.zapisz(s.z, { ekranNieGasnie: false });
  expect((await k.uslugi.start()).ekranWlaczony).toBe(false);
  await p.zapisz(s.z, { ekranNieGasnie: true });
  expect((await k.uslugi.start()).ekranWlaczony).toBe(true);
});
test('K-04b: wibracje = false po restarcie (nowa migawka z bazy) → stan ekranu licznika niesie wibracje = false', async () => {
  const { s, p } = await kompozycja((p) => ({ wibracje: () => p.stan().wibracje }));
  await p.zapisz(s.z, { wibracje: false });
  const po = preferencje();
  await po.wczytaj(s.z);
  const { k } = await kompozycja(() => ({ wibracje: () => po.stan().wibracje }));
  expect((await k.dzialania.odswiez!()).wibracje).toBe(false);
});
