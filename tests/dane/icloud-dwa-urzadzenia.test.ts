// Dwie bazy A i B, sztuczny serwer przekazuje skrzynkę A do `odbieraj` B (moduly.md „Kontrakt partii 7”, testy oczekujące
// „dane/icloud-dwa-urzadzenia”, „dane/icloud-konto”, „dane/icloud-pliki”; plan 07 partii 7; BR-DAN-002 S1–S3, NFR-DAN-003, ADR-0005).
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import fc from 'fast-check';
import type { PartiaIcloud, PortBazy, RekordIcloud } from '../../src/domena/porty';
import { TABELE_ICLOUD } from '../../src/domena/icloud/kontrakt';
import { nowszaWersjaWPoczekalni } from '../../src/dane/repozytoria/icloud';
import { dodajRzad, utworzSzybkiLicznik } from '../../src/przypadki-uzycia/licznik';
import { kandydaciKonfliktu, rozstrzygnijKonflikt, sterownikSynchronizacji, type Sterownik } from '../../src/przypadki-uzycia/synchronizacja';
import { usunWszystkieDane } from '../../src/przypadki-uzycia/projekt';
import { przygotuj, sha256, MIN, sierotyPrzyStarcie, type Srodowisko, zArchiwum } from './pomocnicze/srodowisko';
import { serwerIcloud, type SerwerTestowy, type UrzadzenieTestowe } from './pomocnicze/serwer-icloud';

type Urz = { s: Srodowisko; u: UrzadzenieTestowe; st: Sterownik };
async function urzadzenie(serwer: SerwerTestowy, nazwa: string, prefiks: string): Promise<Urz> {
  const s = await przygotuj({ urzadzenie: nazwa, prefiksId: prefiks });
  const u = serwer.urzadzenie();
  const st = sterownikSynchronizacji({ ...s.z, synchronizacja: u, magazyn: s.magazyn });
  await st.start();
  return { s, u, st };
}
const n = async (b: PortBazy, sql: string, p: unknown[] = []) => (await b.all<{ n: number }>(sql, p))[0].n;
const skrzynka = (b: PortBazy) => n(b, 'SELECT count(*) AS n FROM zmiana_icloud');
const licznik = (b: PortBazy, id: string) => b.all<{ wartosc: number; konflikt: number }>('SELECT wartosc, konflikt FROM licznik WHERE id = ?', [id]);
/** Stan danych synchronizowanych (bez tabel lokalnych), do porównań „ten sam stan”. */
async function zrzut(b: PortBazy): Promise<Record<string, unknown[]>> {
  const out: Record<string, unknown[]> = {};
  for (const t of TABELE_ICLOUD) out[t.tabela] = await b.all(`SELECT * FROM ${t.tabela} ORDER BY ${t.klucz.join(', ')}`);
  return out;
}
async function szybki(z: Srodowisko['z']): Promise<string> {
  const w = await utworzSzybkiLicznik(z);
  if (!w.ok) throw new Error(w.powod);
  return w.wartosc.licznikId;
}

describe('BR-DAN-002/S3: wyłączona = pusta skrzynka, nic nie wychodzi', () => {
  test('domyślnie wyłączona: zapis i +1 bez wpisów w skrzynce i bez wysyłki', async () => {
    const serwer = serwerIcloud();
    const a = await urzadzenie(serwer, 'iphone', 'a');
    const l = await szybki(a.s.z);
    await dodajRzad(a.s.z, { licznikId: l });
    await a.st.wyslijZaleglosci();
    expect(await skrzynka(a.s.baza)).toBe(0);
    expect(a.u.wyslano).toEqual([]);
    expect(a.st.widok().stan).toBe('wylaczona');
  });
  test('włączenie wpisuje wszystko i wysyła; potwierdzenie opróżnia skrzynkę; wyłączenie czyści skrzynkę, dane zostają', async () => {
    const serwer = serwerIcloud();
    const a = await urzadzenie(serwer, 'iphone', 'a');
    const l = await szybki(a.s.z);
    await dodajRzad(a.s.z, { licznikId: l });
    expect((await a.st.wlacz()).stan).toBe('aktywna');
    expect(await skrzynka(a.s.baza)).toBe(0);
    expect(serwer.rekordy.get(`licznik:${l}`)?.pola.wartosc).toBeUndefined(); // pomin: wartość liczy odbiorca
    expect([...serwer.rekordy.keys()].filter((k) => k.startsWith('zdarzenie:'))).toHaveLength(1);
    expect((await a.s.baza.all<{ stan_silnika: Uint8Array }>('SELECT stan_silnika FROM synchronizacja'))[0].stan_silnika).toEqual(new Uint8Array([7]));
    a.u.bladWysylki = { kod: 'siec' };
    await dodajRzad(a.s.z, { licznikId: l });
    await a.st.wyslijZaleglosci();
    expect(await skrzynka(a.s.baza)).toBeGreaterThan(0); // zdarzenie i licznik (pamięć podręczna też uruchamia wyzwalacz UPDATE)
    await a.st.wylacz();
    expect(await skrzynka(a.s.baza)).toBe(0);
    expect(await licznik(a.s.baza, l)).toEqual([{ wartosc: 2, konflikt: 0 }]);
  });
});

describe('BR-DAN-002/S1 i S2: drugie urządzenie, konflikt', () => {
  test('S1: +1 na A → B po odbiorze ma ten sam licznik i wartość; echo nie wraca do skrzynki B', async () => {
    const serwer = serwerIcloud();
    const a = await urzadzenie(serwer, 'iphone', 'a');
    const b = await urzadzenie(serwer, 'ipad', 'b');
    const l = await szybki(a.s.z);
    for (let i = 0; i < 3; i += 1) await dodajRzad(a.s.z, { licznikId: l });
    await a.st.wlacz();
    await b.st.wlacz();
    await b.u.dostarcz();
    expect(await licznik(b.s.baza, l)).toEqual([{ wartosc: 3, konflikt: 0 }]);
    expect(await skrzynka(b.s.baza)).toBe(0);
    expect(await n(b.s.baza, 'SELECT count(*) AS n FROM poczekalnia')).toBe(0);
    expect(await zrzut(b.s.baza)).toEqual(await zrzut(a.s.baza));
  });
  test('S2: rozbieżne +1 na A i B → konflikt na obu po wymianie, wartość bez zgadywania; kolejne +1 w konflikcie działa (N5)', async () => {
    const serwer = serwerIcloud();
    const a = await urzadzenie(serwer, 'iphone', 'a');
    const b = await urzadzenie(serwer, 'ipad', 'b');
    const l = await szybki(a.s.z);
    await dodajRzad(a.s.z, { licznikId: l });
    await a.st.wlacz(); await b.st.wlacz(); await b.u.dostarcz();
    await dodajRzad(a.s.z, { licznikId: l }); // A: 2
    for (let i = 0; i < 5; i += 1) await dodajRzad(b.s.z, { licznikId: l }); // B: 6
    await a.st.wyslijZaleglosci(); await b.st.wyslijZaleglosci();
    await a.u.dostarcz(); await b.u.dostarcz();
    expect(await licznik(a.s.baza, l)).toEqual([{ wartosc: 2, konflikt: 1 }]);
    expect(await licznik(b.s.baza, l)).toEqual([{ wartosc: 6, konflikt: 1 }]);
    const plus = await dodajRzad(a.s.z, { licznikId: l });
    expect(plus.ok).toBe(true);
  });
  test('wybór wersji (P-220 I1a): kandydaci z urządzeniem i godziną, rozstrzygnięcie łączy gałęzie, konflikt znika na obu po wymianie', async () => {
    const serwer = serwerIcloud();
    const a = await urzadzenie(serwer, 'iphone', 'a');
    const b = await urzadzenie(serwer, 'ipad', 'b');
    const l = await szybki(a.s.z);
    await dodajRzad(a.s.z, { licznikId: l });
    await a.st.wlacz(); await b.st.wlacz(); await b.u.dostarcz();
    await dodajRzad(a.s.z, { licznikId: l });
    b.s.zegar.przesun(MIN);
    for (let i = 0; i < 5; i += 1) await dodajRzad(b.s.z, { licznikId: l });
    await b.st.wyslijZaleglosci(); await a.u.dostarcz();
    const k = await kandydaciKonfliktu(a.s.z, l);
    expect(k?.map((x) => [x.wartosc, x.urzadzenie, x.tutaj])).toEqual([[6, 'ipad', false], [2, 'iphone', true]]);
    expect(await kandydaciKonfliktu(b.s.z, l)).toBeNull(); // B jeszcze nie zna gałęzi A
    expect(await rozstrzygnijKonflikt(a.s.z, { licznikId: l, glowa: 'zła' })).toEqual({ ok: false, powod: 'bledne_dane' });
    expect(await rozstrzygnijKonflikt(a.s.z, { licznikId: l, glowa: k![0].glowa })).toEqual({ ok: true, wartosc: { wartosc: 6 } });
    expect(await licznik(a.s.baza, l)).toEqual([{ wartosc: 6, konflikt: 0 }]);
    expect(await kandydaciKonfliktu(a.s.z, l)).toBeNull();
    await a.st.wyslijZaleglosci(); await b.u.dostarcz();
    expect(await licznik(b.s.baza, l)).toEqual([{ wartosc: 6, konflikt: 0 }]);
  });
  test('usunięcie projektu na A → kaskada na B (nagrobki), bez wpisów w skrzynce B', async () => {
    const serwer = serwerIcloud();
    const a = await urzadzenie(serwer, 'iphone', 'a');
    const b = await urzadzenie(serwer, 'ipad', 'b');
    const l = await szybki(a.s.z);
    await dodajRzad(a.s.z, { licznikId: l });
    await a.st.wlacz(); await b.st.wlacz(); await b.u.dostarcz();
    const [p] = await a.s.baza.all<{ id: string }>('SELECT id FROM projekt');
    await a.s.baza.run('DELETE FROM projekt WHERE id = ?', [p.id]);
    await a.st.wyslijZaleglosci();
    await b.u.dostarcz({ rekordy: [] });
    expect(await n(b.s.baza, 'SELECT count(*) AS n FROM licznik')).toBe(0);
    expect(await n(b.s.baza, 'SELECT count(*) AS n FROM zdarzenie')).toBe(0);
    expect(await skrzynka(b.s.baza)).toBe(0);
  });
  test('starsza wersja encji z iCloud nie nadpisuje nowszej lokalnej (zmieniono_ms; jak scalZKopia)', async () => {
    const serwer = serwerIcloud();
    const a = await urzadzenie(serwer, 'iphone', 'a');
    const b = await urzadzenie(serwer, 'ipad', 'b');
    const l = await szybki(a.s.z);
    await a.st.wlacz(); await b.st.wlacz(); await b.u.dostarcz();
    await b.s.baza.run("UPDATE licznik SET nazwa = 'Nowsza', zmieniono_ms = zmieniono_ms + 10 WHERE id = ?", [l]);
    await a.s.baza.run("UPDATE licznik SET nazwa = 'Starsza', zmieniono_ms = zmieniono_ms + 5 WHERE id = ?", [l]);
    await a.st.wyslijZaleglosci();
    await b.u.dostarcz();
    expect(await b.s.baza.all('SELECT nazwa FROM licznik WHERE id = ?', [l])).toEqual([{ nazwa: 'Nowsza' }]);
    await b.st.wyslijZaleglosci(); await a.u.dostarcz();
    expect(await a.s.baza.all('SELECT nazwa FROM licznik WHERE id = ?', [l])).toEqual([{ nazwa: 'Nowsza' }]);
  });
  test('wyczyszczenie pola na A (cel, przywrócenie z kosza) → NULL na B; CloudKit nie trzyma pól nil, więc brak pola = null (08 partia 7)', async () => {
    const serwer = serwerIcloud();
    const a = await urzadzenie(serwer, 'iphone', 'a');
    const b = await urzadzenie(serwer, 'ipad', 'b');
    await szybki(a.s.z);
    const [c] = await a.s.baza.all<{ id: string }>('SELECT id FROM czesc');
    await a.s.baza.run('UPDATE czesc SET cel_rzedow = 40, usunieto_ms = zmieniono_ms + 1, zmieniono_ms = zmieniono_ms + 1 WHERE id = ?', [c.id]);
    await a.st.wlacz(); await b.st.wlacz(); await b.u.dostarcz();
    expect(await b.s.baza.all('SELECT cel_rzedow, usunieto_ms IS NOT NULL AS w_koszu FROM czesc WHERE id = ?', [c.id])).toEqual([{ cel_rzedow: 40, w_koszu: 1 }]);
    await a.s.baza.run('UPDATE czesc SET cel_rzedow = NULL, usunieto_ms = NULL, zmieniono_ms = zmieniono_ms + 1 WHERE id = ?', [c.id]);
    await a.st.wyslijZaleglosci();
    expect(Object.keys(serwer.rekordy.get(`czesc:${c.id}`)?.pola ?? {})).not.toContain('usunieto_ms');
    await b.u.dostarcz();
    expect(await b.s.baza.all('SELECT cel_rzedow, usunieto_ms FROM czesc WHERE id = ?', [c.id])).toEqual([{ cel_rzedow: null, usunieto_ms: null }]);
    expect(await zrzut(b.s.baza)).toEqual(await zrzut(a.s.baza));
  });
  test('zmiana po wysłaniu, przed potwierdzeniem, nie ginie (numer zmiany)', async () => {
    const serwer = serwerIcloud();
    const a = await urzadzenie(serwer, 'iphone', 'a');
    const l = await szybki(a.s.z);
    await a.st.wlacz();
    a.u.przedPotwierdzeniem = async () => { a.u.przedPotwierdzeniem = null; await a.s.baza.run("UPDATE licznik SET nazwa = 'Rękaw', zmieniono_ms = zmieniono_ms + 1 WHERE id = ?", [l]); };
    await a.s.baza.run("UPDATE licznik SET nazwa = 'Przód', zmieniono_ms = zmieniono_ms + 1 WHERE id = ?", [l]);
    await a.st.wyslijZaleglosci();
    expect(serwer.rekordy.get(`licznik:${l}`)?.pola.nazwa).toBe('Rękaw'); // druga wysyłka po potwierdzeniu pierwszej
    expect(await skrzynka(a.s.baza)).toBe(0);
  });
  test('„Syncing…” (design-spec I1a–I3): widok.synchronizuje = true w trakcie wysyłki, potem false; obserwator dostaje oba stany', async () => {
    const serwer = serwerIcloud();
    const a = await urzadzenie(serwer, 'iphone', 'a');
    await szybki(a.s.z);
    const widziane: boolean[] = [];
    a.st.obserwuj((w) => widziane.push(w.synchronizuje === true));
    const wyslij = a.u.wyslij.bind(a.u);
    let wTrakcie: boolean | undefined;
    a.u.wyslij = async (z) => { wTrakcie = a.st.widok().synchronizuje; return wyslij(z); };
    await a.st.wlacz();
    expect([wTrakcie, a.st.widok().synchronizuje]).toEqual([true, false]);
    expect(widziane).toContain(true);
  });
  test('brak miejsca: stan blad z przyczyną, zmiany zostają; po ustąpieniu przyczyny aktywna i pusta skrzynka', async () => {
    const serwer = serwerIcloud();
    const a = await urzadzenie(serwer, 'iphone', 'a');
    await szybki(a.s.z);
    a.u.bladWysylki = { kod: 'brak_miejsca' };
    expect(await a.st.wlacz()).toMatchObject({ stan: 'blad', przyczyna: 'brak_miejsca' });
    expect(await skrzynka(a.s.baza)).toBeGreaterThan(0);
    a.u.bladWysylki = null;
    await a.st.wyslijZaleglosci();
    expect(a.st.widok()).toMatchObject({ stan: 'aktywna', przyczyna: null });
    expect(await skrzynka(a.s.baza)).toBe(0);
  });
});

describe('ADR-0005 własność: dowolna kolejność, podział na partie i powtórzenia → ten sam stan', () => {
  test('permutacje dostarczeń do B (dzieci przed rodzicami → poczekalnia, potem opróżniona)', async () => {
    const serwer = serwerIcloud();
    const a = await urzadzenie(serwer, 'iphone', 'a');
    const l = await szybki(a.s.z);
    for (let i = 0; i < 4; i += 1) await dodajRzad(a.s.z, { licznikId: l });
    await a.st.wlacz();
    const wzor = await zrzut(a.s.baza);
    const wszystkie = serwer.wszystko().rekordy;
    await fc.assert(fc.asyncProperty(fc.shuffledSubarray([...wszystkie], { minLength: wszystkie.length, maxLength: wszystkie.length }), fc.integer({ min: 1, max: 4 }), fc.boolean(), async (kolejnosc, rozmiar, powtorz) => {
      const b = await urzadzenie(serwer, 'ipad', 'b');
      await b.st.wlacz();
      const lista: RekordIcloud[] = powtorz ? [...kolejnosc, ...kolejnosc.slice(0, 2)] : kolejnosc;
      for (let i = 0; i < lista.length; i += rozmiar) await b.u.dostarcz({ rekordy: lista.slice(i, i + rozmiar), usuniete: [] });
      expect(await n(b.s.baza, 'SELECT count(*) AS n FROM poczekalnia')).toBe(0);
      expect(await zrzut(b.s.baza)).toEqual(wzor);
      expect(await skrzynka(b.s.baza)).toBe(0); // nic z odbioru nie wraca jako zmiana do wysłania
    }), { numRuns: 12 });
  });
});

describe('rekordy z sieci: błędne, kolizja, zasoby', () => {
  test('błędny rekord i kolizja treści zdarzenia (M-14) → wpis w `blad`, reszta partii zapisana', async () => {
    const serwer = serwerIcloud();
    const a = await urzadzenie(serwer, 'iphone', 'a');
    const l = await szybki(a.s.z);
    await dodajRzad(a.s.z, { licznikId: l });
    await a.st.wlacz();
    const b = await urzadzenie(serwer, 'ipad', 'b');
    await b.st.wlacz();
    const p = serwer.wszystko();
    const zd = p.rekordy.find((r) => r.encja === 'zdarzenie')!;
    const zle: RekordIcloud[] = [{ encja: 'poczekalnia', klucz: 'x', pola: { id: 'x' }, plik: null }, { ...zd, pola: { ...zd.pola, rodzaj: 'minus' } }];
    await b.u.dostarcz({ rekordy: [...p.rekordy, ...zle] });
    expect(await licznik(b.s.baza, l)).toEqual([{ wartosc: 1, konflikt: 0 }]);
    const kody = (await b.s.baza.all<{ kod: string }>('SELECT kod FROM blad ORDER BY id')).map((r) => r.kod);
    expect(kody).toEqual(expect.arrayContaining(['icloud_bledny_rekord', 'icloud_kolizja_id']));
  });
  test('rekord nowszej wersji (dane.md:125, M-15): nieznany rodzaj zdarzenia i encja spoza kontraktu → poczekalnia `nowsza_wersja`, nie `blad`; reszta zapisana', async () => {
    const serwer = serwerIcloud();
    const a = await urzadzenie(serwer, 'iphone', 'a');
    const l = await szybki(a.s.z);
    await dodajRzad(a.s.z, { licznikId: l });
    await a.st.wlacz();
    const b = await urzadzenie(serwer, 'ipad', 'b');
    await b.st.wlacz();
    const p = serwer.wszystko();
    const zd = p.rekordy.find((r) => r.encja === 'zdarzenie')!;
    const nowsze: RekordIcloud[] = [
      { ...zd, klucz: 'z-nowy', pola: { ...zd.pola, id: 'z-nowy', rodzaj: 'potrojny_plus', rodzice: JSON.stringify([zd.klucz]) } },
      { encja: 'wykres', klucz: 'w1', pola: { id: 'w1', nazwa: 'Chart' }, plik: null },
    ];
    await b.u.dostarcz({ rekordy: [...p.rekordy, ...nowsze] });
    expect(await licznik(b.s.baza, l)).toEqual([{ wartosc: 1, konflikt: 0 }]);
    expect(await b.s.baza.all('SELECT id, powod FROM poczekalnia ORDER BY id')).toEqual([{ id: 'wykres:w1', powod: 'nowsza_wersja' }, { id: 'zdarzenie:z-nowy', powod: 'nowsza_wersja' }]);
    expect(await n(b.s.baza, "SELECT count(*) AS n FROM blad WHERE kod = 'icloud_bledny_rekord'")).toBe(0);
    const teraz = b.s.zegar.teraz().ms; // „Data and sync”: nowsza wersja dopiero po POCZEKALNIA_DNI (P-110 Q1a)
    expect(await nowszaWersjaWPoczekalni(b.s.baza, teraz - 1)).toBe(false);
    expect(await nowszaWersjaWPoczekalni(b.s.baza, teraz + 1)).toBe(true);
  });
  test('zasób pliku: zgodny SHA-256 trafia do magazynu; inny SHA-256 bez wiersza `plik` (plik usuwa krok startu), rekord czeka, wpis `blad`', async () => {
    const serwer = serwerIcloud();
    const b = await urzadzenie(serwer, 'ipad', 'b');
    await b.st.wlacz();
    const dobry = join(b.s.katalog, 'dobry.pdf'); writeFileSync(dobry, 'wzor-pdf');
    const zly = join(b.s.katalog, 'zly.pdf'); writeFileSync(zly, 'podmieniony');
    const rek = (sha: string, plik: string): RekordIcloud => ({ encja: 'plik', klucz: sha, pola: { sha256: sha, rozszerzenie: 'pdf', bajty: 8, utworzono_ms: 1 }, plik });
    const shaDobry = sha256('wzor-pdf');
    const shaObcy = 'f'.repeat(64);
    await b.u.dostarcz({ rekordy: [rek(shaDobry, dobry), rek(shaObcy, zly)], usuniete: [] } as Partial<PartiaIcloud>);
    expect((await b.s.baza.all<{ sha256: string }>('SELECT sha256 FROM plik')).map((r) => r.sha256)).toEqual([shaDobry]);
    expect(b.s.magazyn.usuniete).toEqual([]); // plik bez wiersza usuwa krok startu (ADR-0001, 05-architekt-513)
    await sierotyPrzyStarcie(b.s);
    expect(b.s.magazyn.usuniete).toEqual([sha256('podmieniony')]);
    expect(await n(b.s.baza, "SELECT count(*) AS n FROM blad WHERE kod = 'icloud_zly_zasob'")).toBe(1);
    expect(await n(b.s.baza, 'SELECT count(*) AS n FROM poczekalnia')).toBe(1);
  });
});

describe('konto (dane/icloud-konto): zmiana konta, polacz, nie_synchronizuj', () => {
  test('zmiana konta zatrzymuje wysyłkę; polacz wpisuje wszystko od nowa i wysyła; nie_synchronizuj wyłącza, dane zostają', async () => {
    const serwer = serwerIcloud();
    const a = await urzadzenie(serwer, 'iphone', 'a');
    const l = await szybki(a.s.z);
    await a.st.wlacz();
    a.u.konto('zmiana_konta');
    expect(a.st.widok().stan).toBe('konto_zmienione');
    await dodajRzad(a.s.z, { licznikId: l });
    const ile = a.u.wyslano.length;
    await a.st.wyslijZaleglosci();
    expect(a.u.wyslano.length).toBe(ile);
    expect(await a.st.polacz()).toMatchObject({ stan: 'aktywna' });
    expect(a.u.wyslano.at(-1)!.length).toBeGreaterThanOrEqual(4); // projekt, część, licznik, zdarzenie
    expect(await skrzynka(a.s.baza)).toBe(0);
    a.u.konto('zmiana_konta');
    await a.st.nieSynchronizuj();
    expect(a.st.widok().stan).toBe('wylaczona');
    expect(await licznik(a.s.baza, l)).toEqual([{ wartosc: 1, konflikt: 0 }]);
  });
  test('brak konta przy włączaniu: stan brak_konta, wlaczona = 0, nic nie wysłane; wylogowanie przy aktywnej → brak_konta', async () => {
    const serwer = serwerIcloud();
    const a = await urzadzenie(serwer, 'iphone', 'a');
    a.u.status = 'ograniczone';
    expect(await a.st.wlacz()).toMatchObject({ stan: 'brak_konta', status: 'ograniczone' });
    expect(await n(a.s.baza, 'SELECT wlaczona AS n FROM synchronizacja')).toBe(0);
    a.u.status = 'dostepne';
    await a.st.wlacz();
    a.u.konto('wylogowano');
    expect(a.st.widok().stan).toBe('brak_konta');
  });
  test('„Usuń wszystkie dane” + „Usuń też z iCloud”: skrzynka pusta, usunięcia nie idą jako zmiany, strefa usunięta', async () => {
    const serwer = serwerIcloud();
    const a = await urzadzenie(serwer, 'iphone', 'a');
    await szybki(a.s.z);
    await a.st.wlacz();
    const wyslan = a.u.wyslano.length;
    expect((await usunWszystkieDane(zArchiwum({ ...a.s.z, synchronizacja: a.u }))).ok).toBe(true);
    expect((await a.st.usunZIcloud()).ok).toBe(true);
    expect(a.u.usunietoStrefe).toBe(1);
    expect(a.u.wyslano.length).toBe(wyslan);
    expect(await skrzynka(a.s.baza)).toBe(0);
    expect(MIN).toBeGreaterThan(0);
  });
});

// ADR-0005 „Nagrobki” (uzupełnienie 2026-10-25): rekord dziecka po nagrobku rodzica nie wskrzesza projektu w „W toku”, tylko wraca
// jako projekt w „Ostatnio usuniętych”; niewysłane +1 z drugiego urządzenia nie ginie po cichu (zasada 10; M1-audytor-generalny-005).
const TABELE_LICZNOSCI = ['projekt', 'czesc', 'licznik', 'zdarzenie', 'zmiana_icloud', 'poczekalnia', 'blad'] as const;
async function licznosci(b: PortBazy): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  for (const t of TABELE_LICZNOSCI) out[t] = await n(b, `SELECT count(*) AS n FROM ${t}`);
  out.projekt_w_koszu = await n(b, 'SELECT count(*) AS n FROM projekt WHERE usunieto_ms IS NOT NULL');
  // M1-audytor-generalny-126 (07-jakosc-518): do kosza trafia tylko szczyt (projekt); część i licznik mają własne `usunieto_ms`, a ustawione
  // pokazałyby się w „Ostatnio usuniętych” osobno od przywróconego projektu (kosz.ts).
  out.czesc_w_koszu = await n(b, 'SELECT count(*) AS n FROM czesc WHERE usunieto_ms IS NOT NULL');
  out.licznik_w_koszu = await n(b, 'SELECT count(*) AS n FROM licznik WHERE usunieto_ms IS NOT NULL');
  return out;
}

describe('ADR-0005 nagrobki: niewysłane dane na B po trwałym usunięciu projektu na A', () => {
  test('nagrobek po +1 offline na B: projekt na B w koszu z niewysłanym zdarzeniem; po wysłaniu zdarzenie na serwerze, A ma projekt w koszu, nie w toku', async () => {
    const serwer = serwerIcloud();
    const a = await urzadzenie(serwer, 'iphone', 'a');
    const b = await urzadzenie(serwer, 'ipad', 'b');
    const l = await szybki(a.s.z);
    await dodajRzad(a.s.z, { licznikId: l });
    await a.st.wlacz(); await b.st.wlacz(); await b.u.dostarcz();
    const przed = await licznosci(b.s.baza);
    expect(przed).toEqual({ projekt: 1, czesc: 1, licznik: 1, zdarzenie: 1, zmiana_icloud: 0, poczekalnia: 0, blad: 0, projekt_w_koszu: 0, czesc_w_koszu: 0, licznik_w_koszu: 0 });
    const [e1] = await b.s.baza.all<{ id: string }>('SELECT id FROM zdarzenie');
    b.u.bladWysylki = { kod: 'siec' }; // B bez sieci
    expect((await dodajRzad(b.s.z, { licznikId: l })).ok).toBe(true);
    const [e2] = await b.s.baza.all<{ id: string }>('SELECT id FROM zdarzenie WHERE id <> ?', [e1.id]);
    const [p] = await a.s.baza.all<{ id: string }>('SELECT id FROM projekt');
    await a.s.baza.run('DELETE FROM projekt WHERE id = ?', [p.id]); // trwałe usunięcie na A (jak sprzatnijKosz)
    await a.st.wyslijZaleglosci();
    await b.u.dostarcz({ rekordy: [] }); // B dostaje nagrobki
    const poNagrobku = await licznosci(b.s.baza);
    // Projekt z całą historią licznika zostaje na B w koszu (bez E1 `scal` czekałby na brakującego rodzica E2); nic nie trafia do poczekalni.
    expect({ przed, poNagrobku }).toEqual({ przed, poNagrobku: { ...przed, zdarzenie: 2, projekt_w_koszu: 1, zmiana_icloud: poNagrobku.zmiana_icloud } });
    expect(await b.s.baza.all('SELECT id FROM zdarzenie WHERE id = ?', [e2.id])).toHaveLength(1);
    expect(await b.s.baza.all("SELECT encja FROM zmiana_icloud WHERE usuniete = 0 AND encja IN ('projekt', 'czesc', 'licznik', 'zdarzenie') ORDER BY encja"))
      .toEqual(['czesc', 'licznik', 'projekt', 'zdarzenie', 'zdarzenie'].map((encja) => ({ encja }))); // odtworzenie trafia do skrzynki (serwer je usunął)
    expect(await licznik(b.s.baza, l)).toEqual([{ wartosc: 2, konflikt: 0 }]);
    // Powtórne dostarczenie tych samych nagrobków nic nie zmienia.
    await b.u.dostarcz({ rekordy: [] });
    expect(await licznosci(b.s.baza)).toEqual(poNagrobku);
    // Po powrocie sieci: zdarzenie na serwerze, skrzynka B pusta; A dostaje projekt w koszu z historią, nie w „W toku”.
    b.u.bladWysylki = null;
    await b.st.wyslijZaleglosci();
    expect(serwer.rekordy.has(`zdarzenie:${e2.id}`)).toBe(true);
    expect(serwer.rekordy.get(`projekt:${p.id}`)?.pola.usunieto_ms).toEqual(expect.any(Number));
    expect(await skrzynka(b.s.baza)).toBe(0);
    await a.u.dostarcz();
    const poOdbiorzeA = await licznosci(a.s.baza);
    expect(poOdbiorzeA).toEqual({ projekt: 1, czesc: 1, licznik: 1, zdarzenie: 2, zmiana_icloud: 0, poczekalnia: 0, blad: 0, projekt_w_koszu: 1, czesc_w_koszu: 0, licznik_w_koszu: 0 });
    expect(await licznik(a.s.baza, l)).toEqual([{ wartosc: 2, konflikt: 0 }]);
    expect(await zrzut(a.s.baza)).toEqual(await zrzut(b.s.baza));
  });
  test('niewysłane dane w innym projekcie nie blokują nagrobków usuniętego projektu (kaskada jak dotąd)', async () => {
    const serwer = serwerIcloud();
    const a = await urzadzenie(serwer, 'iphone', 'a');
    const b = await urzadzenie(serwer, 'ipad', 'b');
    const l1 = await szybki(a.s.z);
    const l2 = await szybki(a.s.z);
    await a.st.wlacz(); await b.st.wlacz(); await b.u.dostarcz();
    expect(await n(b.s.baza, 'SELECT count(*) AS n FROM projekt')).toBe(2);
    b.u.bladWysylki = { kod: 'siec' };
    await dodajRzad(b.s.z, { licznikId: l2 }); // niewysłane +1 w drugim projekcie
    const [p1] = await a.s.baza.all<{ id: string }>('SELECT c.projekt_id AS id FROM czesc c JOIN licznik l ON l.czesc_id = c.id WHERE l.id = ?', [l1]);
    await a.s.baza.run('DELETE FROM projekt WHERE id = ?', [p1.id]);
    await a.st.wyslijZaleglosci();
    await b.u.dostarcz({ rekordy: [] });
    expect(await b.s.baza.all('SELECT id FROM licznik ORDER BY id')).toEqual([{ id: l2 }]);
    expect(await n(b.s.baza, 'SELECT count(*) AS n FROM projekt WHERE usunieto_ms IS NOT NULL')).toBe(0);
    expect(await licznik(b.s.baza, l2)).toEqual([{ wartosc: 1, konflikt: 0 }]);
  });

  // Przegląd ścieżki wrażliwej M2 p2 (P1): niewysłana zmiana na samym wierszu z nagrobkiem (projekt przywrócony z kosza offline) też zatrzymuje nagrobek.
  test('przywrócenie projektu z kosza offline na B, potem trwałe usunięcie na A → projekt z historią zostaje na B w koszu i wraca na serwer', async () => {
    const serwer = serwerIcloud();
    const a = await urzadzenie(serwer, 'iphone', 'a');
    const b = await urzadzenie(serwer, 'ipad', 'b');
    const l = await szybki(a.s.z);
    for (let i = 0; i < 5; i += 1) await dodajRzad(a.s.z, { licznikId: l });
    const [p] = await a.s.baza.all<{ id: string }>('SELECT id FROM projekt');
    await a.s.baza.run('UPDATE projekt SET usunieto_ms = 1000, zmieniono_ms = zmieniono_ms + 1 WHERE id = ?', [p.id]); // do kosza na A
    await a.st.wlacz(); await b.st.wlacz(); await b.u.dostarcz();
    expect(await licznosci(b.s.baza)).toMatchObject({ projekt: 1, projekt_w_koszu: 1, zdarzenie: 5, zmiana_icloud: 0 });
    b.u.bladWysylki = { kod: 'siec' }; // B bez sieci
    await b.s.baza.run('UPDATE projekt SET usunieto_ms = NULL, zmieniono_ms = zmieniono_ms + 10 WHERE id = ?', [p.id]); // przywrócenie z kosza na B
    expect(await licznosci(b.s.baza)).toMatchObject({ projekt: 1, projekt_w_koszu: 0, zmiana_icloud: 1 });
    await a.s.baza.run('DELETE FROM projekt WHERE id = ?', [p.id]); // trwałe usunięcie (sprzątanie kosza) na A
    await a.st.wyslijZaleglosci();
    await b.u.dostarcz({ rekordy: [] });
    expect(await licznosci(b.s.baza)).toMatchObject({ projekt: 1, projekt_w_koszu: 1, czesc: 1, licznik: 1, zdarzenie: 5, blad: 0, czesc_w_koszu: 0, licznik_w_koszu: 0 });
    b.u.bladWysylki = null; await b.st.wyslijZaleglosci();
    expect(await n(b.s.baza, 'SELECT count(*) AS n FROM zmiana_icloud')).toBe(0);
    expect(serwer.rekordy.has(`projekt:${p.id}`)).toBe(true);
  });

  // M1-audytor-generalny-116 (05-architekt-511, regresja od M1-005): CloudKit dostarcza nagrobki w kilku partiach; nagrobek zdarzenia w partii
  // bez nagrobka licznika (albo po odtworzeniu projektu w koszu w poprzedniej partii) kasował zdarzenie — dziura w historii na B, licznik 0 na A.
  test.each(['zdarzenie_najpierw', 'kolejnosc_skrzynki_A', 'jedna_partia'] as const)('nagrobki w partiach (%s): na B projekt w koszu z 4 zdarzeniami, licznik 4 na A i B, zrzut(A) = zrzut(B)', async (podzial) => {
    const serwer = serwerIcloud();
    const a = await urzadzenie(serwer, 'iphone', 'a');
    const b = await urzadzenie(serwer, 'ipad', 'b');
    const l = await szybki(a.s.z);
    for (let i = 0; i < 3; i += 1) await dodajRzad(a.s.z, { licznikId: l }); // E1–E3 zsynchronizowane
    await a.st.wlacz(); await b.st.wlacz(); await b.u.dostarcz();
    b.u.bladWysylki = { kod: 'siec' };
    expect((await dodajRzad(b.s.z, { licznikId: l })).ok).toBe(true); // E4 niewysłane na B
    const przed = await licznosci(b.s.baza);
    expect(przed).toMatchObject({ projekt: 1, czesc: 1, licznik: 1, zdarzenie: 4, poczekalnia: 0, blad: 0, projekt_w_koszu: 0 });
    const [p] = await a.s.baza.all<{ id: string }>('SELECT id FROM projekt');
    await a.s.baza.run('DELETE FROM projekt WHERE id = ?', [p.id]); // trwałe usunięcie na A
    await a.st.wyslijZaleglosci();
    const wszystkie = [...serwer.usuniete.values()];
    const zd = wszystkie.filter((u) => u.encja === 'zdarzenie').sort((x, y) => x.klucz.localeCompare(y.klucz));
    const wgSkrzynki = [...wszystkie].sort((x, y) => x.encja.localeCompare(y.encja) || x.klucz.localeCompare(y.klucz));
    const partie = podzial === 'zdarzenie_najpierw' ? [[zd[0]], wszystkie.filter((u) => u !== zd[0])]
      : podzial === 'kolejnosc_skrzynki_A' ? [wgSkrzynki.slice(0, 4), wgSkrzynki.slice(4)] : [wszystkie];
    for (const usuniete of partie) await b.u.dostarcz({ rekordy: [], usuniete });
    const poNagrobkach = await licznosci(b.s.baza);
    expect({ ...poNagrobkach, zmiana_icloud: 0 }).toEqual({ ...przed, zmiana_icloud: 0, projekt_w_koszu: 1 });
    expect(await licznik(b.s.baza, l)).toEqual([{ wartosc: 4, konflikt: 0 }]);
    b.u.bladWysylki = null; await b.st.wyslijZaleglosci();
    await a.u.dostarcz();
    expect(await licznosci(a.s.baza)).toEqual({ projekt: 1, czesc: 1, licznik: 1, zdarzenie: 4, zmiana_icloud: 0, poczekalnia: 0, blad: 0, projekt_w_koszu: 1 });
    expect(await licznik(a.s.baza, l)).toEqual([{ wartosc: 4, konflikt: 0 }]);
    expect(await zrzut(a.s.baza)).toEqual(await zrzut(b.s.baza));
    for (const baza of [a.s.baza, b.s.baza]) expect([await baza.all('PRAGMA integrity_check'), await baza.all('PRAGMA foreign_key_check')]).toEqual([[{ integrity_check: 'ok' }], []]);
  });
});
