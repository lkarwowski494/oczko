// FX1 P2-3 (KO-246, recenzja niezależna FA2; NFR-WYD-001): ścieżka +1 w kompozycji licznika czyta ustawienie „Podpowiedz, gdy zapomnę +1” raz, także gdy podpowiedź
// jest wyłączona (null) — `??=` czytało je przy każdym `stan()`. Prawdziwy SQLite; zliczamy odczyty klucza `podpowiedz_min` przez opakowanie `baza.transakcja`.
import { podpowiedzPlusMin } from '../../src/przypadki-uzycia/podpowiedz';
import { kompozycjaTestowa } from './pomocnicze/kompozycja-licznika';
import { czesc, licznik, projekt } from './pomocnicze/dane-wejsciowe';
import { wykonaj } from './pomocnicze/srodowisko';

test('FX1 P2-3: podpowiedź wyłączona (brak klucza) → dwa kolejne „+1” czytają ustawienie raz', async () => {
  const { s, k } = await kompozycjaTestowa();
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 3)]);
  expect((await k.przygotuj()).ok).toBe(true);
  await k.otworz('l1');
  let odczyty = 0;
  const oryginal = s.baza.transakcja.bind(s.baza);
  s.baza.transakcja = (fn) => oryginal((tx) => fn({
    ...tx,
    all: (sql, p) => { if (sql.includes('FROM ustawienie') && p?.[0] === 'podpowiedz_min') odczyty += 1; return tx.all(sql, p); },
  }));
  expect((await k.uslugi.dodajRzad()).ok).toBe(true);
  expect((await k.uslugi.dodajRzad()).ok).toBe(true);
  expect(odczyty).toBeLessThanOrEqual(1);
  expect(await podpowiedzPlusMin(s.z)).toBeNull(); // założenie testu: podpowiedź rzeczywiście wyłączona
});
