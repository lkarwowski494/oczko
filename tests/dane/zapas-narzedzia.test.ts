// Zapas i druty z ekranów „Tools” (F-37, BR-ZAP-001, BR-ZAP-003, BR-ZAP-004; P-191 P8a; 08 partia 5, grupa D): zapis w jednostkach bazowych
// (m, g; ADR-0017) przez UPSERT bez ruszania kolumn spoza formularza (usunieto_ms) i rekordów podrzędnych (zdjęcia etykiety, przypisania do projektów).
import { narzedzia, wloczka, zapasZDetalami, zapiszNarzedzie, zapiszWloczke, type FormularzWloczki } from '../../src/przypadki-uzycia/zapas';
import { czesc, plik, projekt, projektWloczka } from './pomocnicze/dane-wejsciowe';
import { T0, jeden, przygotuj, wykonaj } from './pomocnicze/srodowisko';

const fjord: FormularzWloczki = {
  nazwa: 'Fjord', producent: 'Harbor', sklad: '100% merino', kolor: 'navy', kategoria: 4, motki: 5,
  dlugoscMotkaM: 399.5928, wagaMotkaG: 100, pielegnacja: 'Hand wash, dry flat', notatka: '',
};

describe('włóczka', () => {
  test('nowa włóczka: wszystkie pola formularza zapisane i odczytane; lista z długością i wagą motka', async () => {
    const s = await przygotuj();
    const w = await zapiszWloczke(s.z, { ...fjord });
    expect(w.ok).toBe(true);
    if (!w.ok) return;
    expect(await wloczka(s.z, w.wartosc.id)).toEqual({ ok: true, wartosc: { id: w.wartosc.id, ...fjord, zdjecieSha: null } });
    const lista = await zapasZDetalami(s.z);
    expect(lista).toEqual({ ok: true, wartosc: [{ id: w.wartosc.id, nazwa: 'Fjord', kategoria: 4, motki: 5, dlugoscMotkaM: 399.5928, wagaMotkaG: 100, zdjecieSha: null }] });
  });

  test('edycja: UPSERT zostawia zdjęcia etykiety, przypisania do projektów i usunieto_ms; pola puste zostają brakiem (NULL)', async () => {
    const s = await przygotuj();
    const w = await zapiszWloczke(s.z, { ...fjord });
    if (!w.ok) throw new Error('zapis');
    const id = w.wartosc.id;
    await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), projektWloczka('p1', id), plik('a'.repeat(64), 'jpg', 10),
      ['INSERT INTO zdjecie (id, projekt_id, wloczka_id, plik_sha256, utworzono_ms) VALUES (?, NULL, ?, ?, ?)', ['z1', id, 'a'.repeat(64), T0]]]);
    expect(await zapiszWloczke(s.z, { ...fjord, id, nazwa: 'Fjord 2', dlugoscMotkaM: null, wagaMotkaG: null, kategoria: null })).toEqual({ ok: true, wartosc: { id } });
    expect(await jeden(s.baza, 'SELECT count(*) AS n FROM zdjecie WHERE wloczka_id = ?', [id])).toEqual({ n: 1 });
    expect(await jeden(s.baza, 'SELECT count(*) AS n FROM projekt_wloczka WHERE wloczka_id = ?', [id])).toEqual({ n: 1 });
    expect(await jeden(s.baza, 'SELECT nazwa, dlugosc_motka_m, waga_motka_g, kategoria, usunieto_ms FROM wloczka WHERE id = ?', [id]))
      .toEqual({ nazwa: 'Fjord 2', dlugosc_motka_m: null, waga_motka_g: null, kategoria: null, usunieto_ms: null });
    const l = await zapasZDetalami(s.z);
    expect(l.ok && l.wartosc[0]?.zdjecieSha).toBe('a'.repeat(64));
  });

  test('złe dane nie zapisują nic: pusta nazwa, kategoria 8, długość 0, ujemne motki', async () => {
    const s = await przygotuj();
    for (const zle of [{ nazwa: '  ' }, { kategoria: 8 }, { dlugoscMotkaM: 0 }, { motki: -1 }]) {
      expect(await zapiszWloczke(s.z, { ...fjord, ...zle })).toEqual({ ok: false, powod: 'bledne_dane' });
    }
    expect(await jeden(s.baza, 'SELECT count(*) AS n FROM wloczka')).toEqual({ n: 0 });
  });

  test('lista bez usuniętych, po nazwie bez wielkości liter; brak włóczki → not-found', async () => {
    const s = await przygotuj();
    for (const nazwa of ['zebra', 'Alpaka', 'merino']) await zapiszWloczke(s.z, { ...fjord, nazwa });
    await s.baza.run("UPDATE wloczka SET usunieto_ms = 1 WHERE nazwa = 'merino'");
    const l = await zapasZDetalami(s.z);
    expect(l.ok && l.wartosc.map((x) => x.nazwa)).toEqual(['Alpaka', 'zebra']);
    expect(await wloczka(s.z, 'nie-ma')).toEqual({ ok: false, powod: 'bledne_dane' });
  });
});

describe('druty i szydełka (BR-ZAP-003)', () => {
  test('zapis i lista: druty, szydełka, inne; w grupie od najmniejszego rozmiaru; edycja zostawia usunieto_ms', async () => {
    const s = await przygotuj();
    const a = await zapiszNarzedzie(s.z, { rodzaj: 'szydelko', rozmiarMm: 5, opis: '' });
    await zapiszNarzedzie(s.z, { rodzaj: 'druty', rozmiarMm: 4, opis: '' });
    await zapiszNarzedzie(s.z, { rodzaj: 'druty', rozmiarMm: 3.25, opis: 'circular, 80 cm' });
    await zapiszNarzedzie(s.z, { rodzaj: 'inne', rozmiarMm: null, opis: 'cable needle' });
    const l = await narzedzia(s.z);
    expect(l.ok && l.wartosc.map((n) => [n.rodzaj, n.rozmiarMm, n.opis])).toEqual([
      ['druty', 3.25, 'circular, 80 cm'], ['druty', 4, ''], ['szydelko', 5, ''], ['inne', null, 'cable needle'],
    ]);
    if (!a.ok) throw new Error('zapis');
    expect(await zapiszNarzedzie(s.z, { id: a.wartosc.id, rodzaj: 'szydelko', rozmiarMm: 2.5, opis: '' })).toEqual({ ok: true, wartosc: { id: a.wartosc.id } });
    expect(await jeden(s.baza, 'SELECT rozmiar_mm, usunieto_ms FROM narzedzie WHERE id = ?', [a.wartosc.id])).toEqual({ rozmiar_mm: 2.5, usunieto_ms: null });
  });

  test('rozmiar 0 albo zły rodzaj → bledne_dane, nic nie zapisane', async () => {
    const s = await przygotuj();
    expect(await zapiszNarzedzie(s.z, { rodzaj: 'druty', rozmiarMm: 0, opis: '' })).toEqual({ ok: false, powod: 'bledne_dane' });
    expect(await zapiszNarzedzie(s.z, { rodzaj: 'igla' as never, rozmiarMm: 4, opis: '' })).toEqual({ ok: false, powod: 'bledne_dane' });
    expect(await jeden(s.baza, 'SELECT count(*) AS n FROM narzedzie')).toEqual({ n: 0 });
  });
});
