// PU-292 (CE-03, `docs/jakosc/ce-recenzja-bx7-bx8.md`): „notatki rzędów były cały czas przy liczniku” — `notatka_rzedu` należy do licznika (nie do wzoru), więc usunięcie wzoru do kosza
// i przywrócenie go nie zmienia ani nie kasuje notatek rzędów (utrata danych użytkownika, zasada 10). Prawdziwa baza (node:sqlite), prawdziwe przypadki użycia `dodajNotatkeWzoru`,
// `usunWzor`, `przywrocWzor`; scenariusz Maestro 102 sprawdza to samo od strony ekranu (chip „Row n: …” po ponownym otwarciu wzoru) — tego, co w koszu, Maestro nie widzi.
import { readFileSync } from 'node:fs';
import { przywrocWzor, usunWzor, wzorDoOtwarcia } from '../../src/przypadki-uzycia/wzor';
import { widokWzoru } from '../../src/przypadki-uzycia/wzor-widok';
import { dodajNotatkeWzoru } from '../../src/przypadki-uzycia/wzor-notatki';
import { czesc, licznik, plik, projekt, rysunek, wzor } from './pomocnicze/dane-wejsciowe';
import { ile, przygotuj, wlozPlik, wykonaj } from './pomocnicze/srodowisko';

const PDF = Buffer.from('%PDF-1.4\n%%EOF\n');
const RYS = Buffer.from('pkdrawing-1');

test('PU-292: notatki rzędów (notatka_rzedu licznika) są nietknięte po usunięciu wzoru do kosza i po jego przywróceniu, razem z 1 rysunkiem', async () => {
  const s = await przygotuj();
  const h = wlozPlik(s.magazyn, PDF, 'pdf'), r = wlozPlik(s.magazyn, RYS, 'pkdrawing');
  const znacznik = JSON.stringify({ licznik_id: 'l1', strona: 0, y: 0.2, wysokosc_rzedu: 0.02, rzad_bazowy: 1, wartosc_przy_ustawieniu: 0, kierunek: 1 });
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 3), plik(h, 'pdf', PDF.length), plik(r, 'pkdrawing', RYS.length), wzor('w1', 'p1', h, znacznik), rysunek('w1', 0, r)]);
  expect(await dodajNotatkeWzoru(s.z, { wzorId: 'w1', rzad: 1, tekst: 'k2tog here' })).toEqual({ ok: true, wartosc: undefined });
  expect(await dodajNotatkeWzoru(s.z, { wzorId: 'w1', rzad: 4, tekst: 'zbieraj oczka' })).toEqual({ ok: true, wartosc: undefined });
  const notatki = () => s.baza.all<{ id: string; licznik_id: string; rzad: number; tekst: string; zmieniono_ms: number }>('SELECT id, licznik_id, rzad, tekst, zmieniono_ms FROM notatka_rzedu ORDER BY rzad');
  const przed = await notatki();
  expect(przed.map((n) => [n.licznik_id, n.rzad, n.tekst])).toEqual([['l1', 1, 'k2tog here'], ['l1', 4, 'zbieraj oczka']]);

  expect(await usunWzor(s.z, { wzorId: 'w1' })).toEqual({ ok: true, wartosc: undefined });
  expect(await notatki()).toEqual(przed); // w koszu: te same wiersze, te same id i czasy
  expect(await ile(s.baza, 'rysunek', "wzor_id = 'w1'")).toBe(1);

  expect(await przywrocWzor(s.z, { wzorId: 'w1' })).toEqual({ ok: true, wartosc: undefined });
  expect(await notatki()).toEqual(przed); // po przywróceniu: bez zmian
});

// PU-292, część „Wzór wraca do projektu, widok jak przed usunięciem, »2 zakreślenia«”: po „Delete pattern” wzór znika z widoku i z wyboru wzoru projektu (jest w koszu), a „Restore” przywraca
// go z OBOMA rysunkami (strony 0 i 1, ta sama treść plików) i znacznikiem — widok danych identyczny jak przed usunięciem (z niego ekran liczy „2 highlights”).
test('PU-292: wzór z 2 rysunkami → usunięcie (znika z widoku i z projektu) → przywrócenie: widok danych taki sam jak przed usunięciem, oba rysunki, wzór znów wybierany w projekcie', async () => {
  const s = await przygotuj();
  const h = wlozPlik(s.magazyn, PDF, 'pdf'), r0 = wlozPlik(s.magazyn, Buffer.from('pas-na-stronie-0'), 'pkdrawing'), r1 = wlozPlik(s.magazyn, Buffer.from('pas-na-stronie-1'), 'pkdrawing');
  const znacznik = JSON.stringify({ licznik_id: 'l1', strona: 0, y: 0.2, wysokosc_rzedu: 0.02, rzad_bazowy: 1, wartosc_przy_ustawieniu: 0, kierunek: 1 });
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 3), plik(h, 'pdf', PDF.length), plik(r0, 'pkdrawing', 16), plik(r1, 'pkdrawing', 16),
    wzor('w1', 'p1', h, znacznik), rysunek('w1', 0, r0), rysunek('w1', 1, r1)]);
  const widok = async () => {
    const w = await widokWzoru(s.z, { wzorId: 'w1' });
    if (!w.ok) return w.powod;
    return { rysunki: w.wartosc.rysunki.map((x) => [x.strona, readFileSync(x.plik, 'utf8')]), znacznik: w.wartosc.znacznik, nazwa: w.wartosc.nazwa };
  };
  const przed = await widok();
  expect(przed).toMatchObject({ rysunki: [[0, 'pas-na-stronie-0'], [1, 'pas-na-stronie-1']] });
  expect(await wzorDoOtwarcia(s.z, { projektId: 'p1' })).toEqual({ ok: true, wartosc: 'w1' });

  expect(await usunWzor(s.z, { wzorId: 'w1' })).toEqual({ ok: true, wartosc: undefined });
  expect(await widok()).toBe('niedozwolone_przejscie'); // w koszu: nie do otwarcia
  expect(await wzorDoOtwarcia(s.z, { projektId: 'p1' })).toEqual({ ok: true, wartosc: null }); // projekt nie ma już wzoru

  expect(await przywrocWzor(s.z, { wzorId: 'w1' })).toEqual({ ok: true, wartosc: undefined });
  expect(await widok()).toEqual(przed); // „jak przed usunięciem”: te same 2 rysunki, ten sam znacznik i nazwa
  expect(await wzorDoOtwarcia(s.z, { projektId: 'p1' })).toEqual({ ok: true, wartosc: 'w1' });
});
