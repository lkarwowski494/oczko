// PU-358, PU-359, PU-360 (ZM-24, ZM-25; ścieżka danych ekranów): krok licznika w „Dodaj licznik” i „Ustawieniach licznika” oraz próg „Podpowiedz, gdy zapomnę +1” (preferencja
// urządzenia w tabeli `ustawienie`). Prawdziwy SQLite (node:sqlite); sprawdza zapis, odrzucenie złych wartości bez zapisu i lokalność (poza iCloud).
import { dodajLicznik, dodajRzad, ustawKrok } from '../../src/przypadki-uzycia/licznik';
import { podpowiedzPlusMin, ustawPodpowiedzPlus } from '../../src/przypadki-uzycia/podpowiedz';
import { widokLicznika } from '../../src/przypadki-uzycia/widok-licznika';
import { czesc, licznik, projekt } from './pomocnicze/dane-wejsciowe';
import { ile, jeden, przygotuj, wykonaj } from './pomocnicze/srodowisko';

async function baza() {
  const s = await przygotuj();
  s.pro.wartosc = true;
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 2)]);
  return s;
}
const krok = (s: Awaited<ReturnType<typeof przygotuj>>, id: string) => jeden<{ krok: number }>(s.baza, 'SELECT krok FROM licznik WHERE id = ?', [id]);

describe('ZM-24 krok licznika: zapis z formularzy', () => {
  test('ZM-24 PU-358: „Dodaj licznik” z krokiem 2 zapisuje krok; bez kroku zostaje 1; krok 3 odrzucony bez zapisu', async () => {
    const s = await baza();
    const a = await dodajLicznik(s.z, { czescId: 'c1', rodzaj: 'rzedy', krok: 2 });
    const b = await dodajLicznik(s.z, { czescId: 'c1', rodzaj: 'oczka' });
    expect(a.ok && b.ok).toBe(true);
    if (a.ok && b.ok) { expect(await krok(s, a.wartosc.licznikId)).toEqual({ krok: 2 }); expect(await krok(s, b.wartosc.licznikId)).toEqual({ krok: 1 }); }
    const przed = await ile(s.baza, 'licznik');
    expect(await dodajLicznik(s.z, { czescId: 'c1', rodzaj: 'rzedy', krok: 3 as unknown as 2 })).toEqual({ ok: false, powod: 'bledne_dane' });
    expect(await ile(s.baza, 'licznik')).toBe(przed);
  });

  test('ZM-24 PU-359: ustawKrok zmienia tylko następne stuknięcia (zapisane zdarzenia zostają), widok niesie krok; zły krok i licznik w koszu → bledne_dane', async () => {
    const s = await baza();
    const zdarzeniaPrzed = await ile(s.baza, 'zdarzenie', 'licznik_id = ?', ['l1']);
    expect((await ustawKrok(s.z, { licznikId: 'l1', krok: 2 })).ok).toBe(true);
    expect(await ile(s.baza, 'zdarzenie', 'licznik_id = ?', ['l1'])).toBe(zdarzeniaPrzed);
    const w = await widokLicznika(s.z, { licznikId: 'l1' });
    expect(w.ok && w.wartosc.krok).toBe(2);
    expect((await dodajRzad(s.z, { licznikId: 'l1' })).ok).toBe(true);
    expect(await ile(s.baza, 'zdarzenie', 'licznik_id = ?', ['l1'])).toBe(zdarzeniaPrzed + 2);
    expect(await ustawKrok(s.z, { licznikId: 'l1', krok: 5 as unknown as 1 })).toEqual({ ok: false, powod: 'bledne_dane' });
    expect(await ustawKrok(s.z, { licznikId: 'nie-ma', krok: 1 })).toEqual({ ok: false, powod: 'bledne_dane' });
    expect(await krok(s, 'l1')).toEqual({ krok: 2 });
  });
});

describe('ZM-25 próg podpowiedzi „+1” (preferencja urządzenia)', () => {
  test('ZM-25 PU-360: domyślnie wyłączona (null); zapis 10 → 10; wyłączenie → null; próg spoza listy odrzucony bez zapisu', async () => {
    const s = await baza();
    expect(await podpowiedzPlusMin(s.z)).toBeNull();
    expect((await ustawPodpowiedzPlus(s.z, { minuty: 10 })).ok).toBe(true);
    expect(await podpowiedzPlusMin(s.z)).toBe(10);
    expect(await ustawPodpowiedzPlus(s.z, { minuty: 7 })).toEqual({ ok: false, powod: 'bledne_dane' });
    expect(await podpowiedzPlusMin(s.z)).toBe(10);
    expect((await ustawPodpowiedzPlus(s.z, { minuty: null })).ok).toBe(true);
    expect(await podpowiedzPlusMin(s.z)).toBeNull();
  });

  test('ZM-25 PU-360: zły zapis w bazie (liczba spoza listy, napis) = wyłączona, nie zgadnięty próg; wartość zostaje lokalna (bez zmiany dla iCloud)', async () => {
    const s = await baza();
    await s.baza.run("INSERT INTO ustawienie (klucz, wartosc, zmieniono_ms) VALUES ('podpowiedz_min', '7', 0)");
    expect(await podpowiedzPlusMin(s.z)).toBeNull();
    await s.baza.run("UPDATE ustawienie SET wartosc = '\"10\"' WHERE klucz = 'podpowiedz_min'");
    expect(await podpowiedzPlusMin(s.z)).toBeNull();
    expect((await ustawPodpowiedzPlus(s.z, { minuty: 15 })).ok).toBe(true);
    expect(await ile(s.baza, 'zmiana_icloud', "encja = 'ustawienie' AND klucz = 'podpowiedz_min'")).toBe(0);
  });
});
