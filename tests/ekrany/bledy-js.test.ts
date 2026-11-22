// ADR-0018 „Potwierdzenie” (uzupełnienie fix-6, P-194 Q4a): handler zapisuje wpis `blad` bez `message` (kod `js_<nazwa>`, ramki plik:linia:kolumna),
// woła poprzedni handler (awaria zostaje awarią), najwyżej jeden wpis na przyczynę; w trybie awaryjnym (bez zapisu) niczego nie zapisuje.
import { zainstalujObslugeBledow, type ObslugaBledowRN, type WpisBledu } from '../../src/kompozycja/bledy-js';

function rn() {
  let h: (e: unknown, fatal?: boolean) => void = () => undefined;
  const poprzedni = jest.fn();
  h = poprzedni;
  const r: ObslugaBledowRN = { getGlobalHandler: () => h, setGlobalHandler: (x) => { h = x; } };
  return { r, poprzedni, rzuc: (e: unknown, fatal?: boolean) => h(e, fatal) };
}
const blad = () => {
  const e = new TypeError('Cannot read „Sweter dla Ani” of undefined');
  e.stack = 'TypeError: Cannot read „Sweter dla Ani” of undefined\n    at zapisz (http://localhost/index.bundle:1234:56)\n    at anonymous (main.jsbundle:10:2)\n    at native';
  return e;
};

test('zapis bez treści komunikatu: kod js_TypeError, ramki plik:linia:kolumna; poprzedni handler wywołany', async () => {
  const { r, poprzedni, rzuc } = rn();
  const zapis: WpisBledu[] = [];
  zainstalujObslugeBledow(r).ustawZapis(async (w) => { zapis.push(w); });
  const e = blad();
  rzuc(e, true);
  await Promise.resolve();
  expect(zapis).toEqual([{ kod: 'js_TypeError', szczegoly: { ramki: ['index.bundle:1234:56', 'main.jsbundle:10:2'], fatal: true } }]);
  expect(JSON.stringify(zapis)).not.toMatch(/Sweter|Cannot read/);
  expect(poprzedni).toHaveBeenCalledWith(e, true);
});

test('najwyżej jeden wpis na przyczynę: drugi niefatalny po pierwszym — bez zapisu; fatalny zawsze', async () => {
  const { r, rzuc } = rn();
  const zapis: WpisBledu[] = [];
  zainstalujObslugeBledow(r).ustawZapis(async (w) => { zapis.push(w); });
  rzuc(blad(), false);
  rzuc(blad(), false);
  rzuc(blad(), true);
  expect(zapis.map((w) => w.szczegoly.fatal)).toEqual([false, true]);
});

test('tryb awaryjny (zapis = null): nic nie zapisuje, błąd idzie dalej; wyjątek w zapisie nie gubi błędu', async () => {
  const { r, poprzedni, rzuc } = rn();
  const o = zainstalujObslugeBledow(r);
  o.ustawZapis(null);
  rzuc('tekst', true);
  expect(poprzedni).toHaveBeenCalledWith('tekst', true);
  o.ustawZapis(() => Promise.reject(new Error('baza')));
  rzuc(blad(), true);
  await Promise.resolve();
  expect(poprzedni).toHaveBeenCalledTimes(2);
});
