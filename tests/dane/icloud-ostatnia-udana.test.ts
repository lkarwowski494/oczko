// 07-jakosc-015 (BR-DAN-011/S1, P-335 wariant A): „Data and sync” pokazuje czas ostatniej udanej synchronizacji — klucz stanu urządzenia
// `icloud_ostatnia_udana_ms` zapisany po udanej wysyłce (jak `zegarek_ostatnia_partia_ms`); nieudana wysyłka go nie rusza; nie jest synchronizowany ani importowany.
import { icloudOstatniaUdanaMs } from '../../src/dane/repozytoria/ustawienia';
import { atrapaIcloud } from '../../src/platforma/icloud-atrapa';
import { sterownikSynchronizacji } from '../../src/przypadki-uzycia/synchronizacja';
import { MIN, przygotuj } from './pomocnicze/srodowisko';

const plik = { czytaj: () => null, zapisz: () => undefined };
async function sterownik(tryb: string) {
  const s = await przygotuj();
  const st = sterownikSynchronizacji({ ...s.z, synchronizacja: atrapaIcloud({ tryb, baza: s.baza, zegar: s.zegar, plik }), magazyn: s.magazyn });
  await st.start();
  return { s, st };
}

test('015: przed pierwszą synchronizacją brak czasu; po udanej wysyłce czas = chwila wysyłki', async () => {
  const { s, st } = await sterownik('wlaczony');
  expect(await icloudOstatniaUdanaMs(s.baza)).toBeNull();
  s.zegar.przesun(5 * MIN);
  const t = s.zegar.teraz().ms;
  await st.wlacz();
  expect(await icloudOstatniaUdanaMs(s.baza)).toBe(t);
});
test('015: nieudana wysyłka (brak miejsca w iCloud) nie ustawia czasu ostatniej udanej synchronizacji', async () => {
  const { s, st } = await sterownik('brak-miejsca');
  await st.wlacz();
  expect(st.widok().stan).toBe('blad');
  expect(await icloudOstatniaUdanaMs(s.baza)).toBeNull();
});
test('015: kolejna udana wysyłka przesuwa czas do przodu', async () => {
  const { s, st } = await sterownik('wlaczony');
  await st.wlacz();
  s.zegar.przesun(10 * MIN);
  await st.wyslijZaleglosci({ zawsze: true });
  expect(await icloudOstatniaUdanaMs(s.baza)).toBe(s.zegar.teraz().ms);
});
