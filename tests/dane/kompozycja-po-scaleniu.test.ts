// M3 p2: licznik na własnej trasie nad „Dziś” — korzeń z cyklem życia (Aplikacja na „Dziś”) scala dziennik ekranu blokady raz (R-020, ADR-0008:11),
// a ekran licznika na wierzchu czyta stan dopiero po scaleniu (jak `scalDziennik().then(odswiez)` w Aplikacja przed p2). Wyrocznia: R-020, Z07-11.
import type { KompozycjaLicznika } from '../../src/kompozycja/licznik';
import { kompozycjaTestowa } from './pomocnicze/kompozycja-licznika';

test('R-020 (p2): poScaleniu — słuchacz wołany po zakończeniu scalDziennik, nie przed; odpięcie działa', async () => {
  const { k }: { k: KompozycjaLicznika } = await kompozycjaTestowa();
  await k.przygotuj();
  const kolejnosc: string[] = [];
  const odepnij = k.poScaleniu(() => kolejnosc.push('sluchacz'));
  const scal = k.uslugi.scalDziennik().then(() => kolejnosc.push('scalone'));
  expect(kolejnosc).toEqual([]);
  await scal;
  expect(kolejnosc).toEqual(['sluchacz', 'scalone']);
  odepnij();
  await k.uslugi.scalDziennik();
  expect(kolejnosc).toEqual(['sluchacz', 'scalone']);
});
