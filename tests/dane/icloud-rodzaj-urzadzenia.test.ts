// P-247 (U6a): rodzaj urządzenia w zdarzeniu (`iphone` | `ipad`, z Platform.isPad; UUID zostaje w `urzadzenie`) — arkusz wyboru wersji
// pokazuje „iPad”, nie UUID. Kolumna synchronizowana (zwykła kolumna tabeli `zdarzenie`, icloud-tabele.json bez zmian), lista w stany.json.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { STANY } from '../../src/domena/stany';
import { dodajRzad, utworzSzybkiLicznik } from '../../src/przypadki-uzycia/licznik';
import { kandydaciKonfliktu, sterownikSynchronizacji } from '../../src/przypadki-uzycia/synchronizacja';
import { przygotuj, MIN } from './pomocnicze/srodowisko';
import { serwerIcloud } from './pomocnicze/serwer-icloud';

describe('rodzaj urządzenia w zdarzeniu (P-247 U6a)', () => {
  test('schemat: kolumna urzadzenie_rodzaj (NULL albo iphone/ipad), lista w stany.json i STANY', async () => {
    const s = await przygotuj();
    const kol = (await s.baza.all<{ name: string; notnull: number }>("SELECT name, \"notnull\" FROM pragma_table_info('zdarzenie')")).find((c) => c.name === 'urzadzenie_rodzaj');
    expect(kol).toEqual({ name: 'urzadzenie_rodzaj', notnull: 0 });
    const json = JSON.parse(readFileSync(join(__dirname, '../../docs/architektura/stany.json'), 'utf8'));
    expect(json['zdarzenie.urzadzenie_rodzaj']).toEqual(['iphone', 'ipad']);
    expect(STANY['zdarzenie.urzadzenie_rodzaj']).toEqual(['iphone', 'ipad']);
    await expect(s.baza.run("UPDATE zdarzenie SET urzadzenie_rodzaj = 'mac'")).resolves.toBeDefined(); // pusta tabela: brak wierszy
  });
  test('+1 zapisuje rodzaj urządzenia; kandydaci konfliktu niosą rodzaj (iPad) i UUID osobno', async () => {
    const serwer = serwerIcloud();
    const a = await przygotuj({ urzadzenie: 'uuid-a', prefiksId: 'a' });
    const b = await przygotuj({ urzadzenie: 'uuid-b', prefiksId: 'b' });
    const za = { ...a.z, rodzajUrzadzenia: 'iphone' as const };
    const zb = { ...b.z, rodzajUrzadzenia: 'ipad' as const };
    const sa = sterownikSynchronizacji({ ...za, synchronizacja: serwer.urzadzenie(), magazyn: a.magazyn });
    const ub = serwer.urzadzenie();
    const sb = sterownikSynchronizacji({ ...zb, synchronizacja: ub, magazyn: b.magazyn });
    await sa.start(); await sb.start();
    const l = await utworzSzybkiLicznik(za);
    if (!l.ok) throw new Error(l.powod);
    await dodajRzad(za, { licznikId: l.wartosc.licznikId });
    expect(await a.baza.all('SELECT urzadzenie, urzadzenie_rodzaj FROM zdarzenie')).toEqual([{ urzadzenie: 'uuid-a', urzadzenie_rodzaj: 'iphone' }]);
    await expect(a.baza.run("UPDATE zdarzenie SET urzadzenie_rodzaj = 'mac'")).rejects.toThrow();
    await sa.wlacz(); await sb.wlacz(); await ub.dostarcz();
    await dodajRzad(za, { licznikId: l.wartosc.licznikId });
    b.zegar.przesun(MIN);
    await dodajRzad(zb, { licznikId: l.wartosc.licznikId });
    await sb.wyslijZaleglosci();
    const u = serwer.urzadzenie();
    const sa2 = sterownikSynchronizacji({ ...za, synchronizacja: u, magazyn: a.magazyn });
    await sa2.start();
    await u.dostarcz();
    const k = await kandydaciKonfliktu(za, l.wartosc.licznikId);
    expect(k?.map((x) => [x.wartosc, x.urzadzenie, x.rodzaj, x.tutaj])).toEqual([[2, 'uuid-b', 'ipad', false], [2, 'uuid-a', 'iphone', true]]);
  });
});
