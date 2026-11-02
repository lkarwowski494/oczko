// Kompozycja licznika na prawdziwej bazie testowej (node:sqlite) z atrapami tylko na granicy platformy (Live Activity, zegarek) — testy partii 8b przez ścieżkę ekranu.
import { migruj } from '../../../src/dane/migracje/migruj';
import type { LiveActivity, Zegarek } from '../../../src/domena/porty';
import { utworzI18n } from '../../../src/i18n/i18n';
import { ZASOBY } from '../../../src/i18n/slowniki';
import { kompozycjaLicznika, type Jezyk } from '../../../src/kompozycja/licznik';
import { przygotuj } from './srodowisko';

export async function kompozycjaTestowa(o: { wibracje?: boolean } = {}) {
  const s = await przygotuj();
  const i = await utworzI18n({ magazyn: { odczytaj: async () => null, zapisz: async () => {} }, systemowe: () => ['en-US'], zasoby: ZASOBY });
  const j: Jezyk = { t: i.t, jezyk: i.jezyk, zegar24h: () => true };
  const liveActivity: LiveActivity = { start: async () => ({ ok: true, wartosc: undefined }), aktualizuj: async () => undefined, zakoncz: async () => undefined };
  const zegarek: Zegarek = { potwierdz: () => undefined, wyslijStan: async () => undefined, odbieraj: () => () => undefined };
  const k = kompozycjaLicznika({ ...s.z, migruj: (b) => migruj(b), liveActivity, zegarek }, j, { wibracje: () => o.wibracje ?? true });
  return { s, k, j };
}
