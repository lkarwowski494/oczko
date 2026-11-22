// Przekazanie 04 → 08 (M1-audytor-generalny-136, DEC-35 b; design-spec „Aneks M2 partia 3c1”): nazwa kopii z „Make another like this”.
// Miejsce docelowe: tests/dane/projekt-kopia-nazwa.test.ts. Wyrocznia: docs/design/fix15-2026-11-03/klucze.json → kopia_nazwa_przypadki.
// 08: przypadek użycia jest bez i18n, więc szablon `projekt.kopia_nazwa` podaje kompozycja (trasa: t('projekt.kopia_nazwa')); tu en ze słownika źródłowego.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { usunProjekt, utworzProjekt, zrobPonownie } from '../../src/przypadki-uzycia/projekt';
import { jeden, przygotuj } from './pomocnicze/srodowisko';

type Przypadek = { oryginal: string; istniejace: string[]; kopia: string };
const WYR = JSON.parse(readFileSync(join(__dirname, '../../docs/design/fix15-2026-11-03/klucze.json'), 'utf8')) as { kopia_nazwa_przypadki: { przypadki: Przypadek[] } };
const EN = JSON.parse(readFileSync(join(__dirname, '../../src/i18n/slowniki/en.json'), 'utf8')) as { projekt: { kopia_nazwa: string } };
const szablonNazwy = EN.projekt.kopia_nazwa;

describe('DEC-35 b: kopia projektu dostaje kolejny wolny numer', () => {
  for (const c of WYR.kopia_nazwa_przypadki.przypadki) {
    test(`${c.oryginal} przy [${c.istniejace.join(', ')}] → ${c.kopia}`, async () => {
      const s = await przygotuj();
      let id = '';
      for (const nazwa of c.istniejace) {
        const p = await utworzProjekt(s.z, { nazwa: nazwa.trim(), czesci: [] });
        if (!p.ok) throw new Error(p.powod);
        if (nazwa === c.oryginal) id = p.wartosc.projektId;
      }
      const k = await zrobPonownie(s.z, { projektId: id, szablonNazwy });
      if (!k.ok) throw new Error(k.powod);
      expect(await jeden<{ nazwa: string }>(s.baza, 'SELECT nazwa FROM projekt WHERE id = ?', [k.wartosc.projektId])).toEqual({ nazwa: c.kopia });
    });
  }
  test('nazwa w „Recently deleted” też zajmuje numer (po przywróceniu nie ma dubla)', async () => {
    const s = await przygotuj();
    const a = await utworzProjekt(s.z, { nazwa: 'Harbor', czesci: [] });
    const b = await utworzProjekt(s.z, { nazwa: 'Harbor 2', czesci: [] });
    if (!a.ok || !b.ok) throw new Error('utworz');
    await usunProjekt(s.z, { projektId: b.wartosc.projektId });
    const k = await zrobPonownie(s.z, { projektId: a.wartosc.projektId, szablonNazwy });
    if (!k.ok) throw new Error(k.powod);
    expect(await jeden<{ nazwa: string }>(s.baza, 'SELECT nazwa FROM projekt WHERE id = ?', [k.wartosc.projektId])).toEqual({ nazwa: 'Harbor 3' });
  });
});
