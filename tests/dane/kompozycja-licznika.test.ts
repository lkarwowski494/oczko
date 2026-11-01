// Kompozycja ekranu licznika (08 partia 4, 3A) na bazie aplikacji (node:sqlite) z prawdziwym t() (en): NFR-PIE-001 / BR-LIC-001 (pierwsze +1
// świeżej instalacji tworzy projekt roboczy z etykietą „Counter from …”), F-49 (powrót do licznika po restarcie), ADR-0009 pkt 3 (potwierdzenia
// zegarka przed stanem), ADR-0008 (7) (stan ekranu blokady po zapisie, Live Activity raz na proces), RD-17 (baner serii i „Removed …”).
import { migruj } from '../../src/dane/migracje/migruj';
import type { LiveActivity, StanEkranuBlokady, Zegarek } from '../../src/domena/porty';
import { utworzI18n } from '../../src/i18n/i18n';
import { ZASOBY } from '../../src/i18n/slowniki';
import { kompozycjaLicznika, type Jezyk } from '../../src/kompozycja/licznik';
import { czasPracy, stanUkonczenia } from '../../src/kompozycja/ukonczenie';
import { licznosciTekst, wynikScalenia } from '../../src/kompozycja/dane';
import { czesc, licznik, projekt } from './pomocnicze/dane-wejsciowe';
import { T0, przygotuj, wykonaj } from './pomocnicze/srodowisko';

async function srodowisko(katalog?: string) {
  const s = await przygotuj({ katalog });
  const i = await utworzI18n({ magazyn: { odczytaj: async () => null, zapisz: async () => {} }, systemowe: () => ['en-US'], zasoby: ZASOBY });
  const j: Jezyk = { t: i.t, jezyk: i.jezyk, zegar24h: () => true };
  const zdarzenia: string[] = [];
  const liveActivity: LiveActivity = {
    start: async (x: StanEkranuBlokady) => { zdarzenia.push(`start:${x.wartosc}`); return { ok: true, wartosc: undefined }; },
    aktualizuj: async (x) => { zdarzenia.push(`aktualizuj:${x.wartosc}`); }, zakoncz: async () => { zdarzenia.push('zakoncz'); },
  };
  const zegarek: Zegarek = { potwierdz: (ids) => { zdarzenia.push(`potwierdz:${ids.join(',')}`); }, wyslijStan: async (x) => { zdarzenia.push(`zegarek:${x.wartosc}`); }, odbieraj: () => () => undefined };
  const k = kompozycjaLicznika({ ...s.z, migruj: (b) => migruj(b), liveActivity, zegarek }, j);
  return { s, k, zdarzenia };
}
const poKolejce = () => new Promise((r) => setTimeout(r, 30)); // odświeżenie ekranu blokady idzie po wyniku (void), bez czekania ekranu

describe('kompozycjaLicznika', () => {
  test('NFR-PIE-001: świeża instalacja → licznik z 0 bez projektu; pierwsze +1 tworzy projekt roboczy „Counter from Oct 22, 12:00”, wartość 1', async () => {
    const { s, k, zdarzenia } = await srodowisko();
    expect(await k.przygotuj()).toEqual({ ok: true, wartosc: { cel: 'licznik' } });
    const start = await k.uslugi.start();
    expect([start.licznik.projekt, start.licznik.skonczone, start.licznik.dziergany]).toEqual([null, 0, 1]);
    const w = await k.uslugi.dodajRzad();
    expect(w.ok && [w.wartosc.skonczone, w.wartosc.dziergany]).toEqual([1, 2]);
    const st = await k.dzialania.odswiez!();
    expect([st.projekt, st.czesc, st.skonczone]).toEqual(['Counter from Oct 22, 12:00', null, 1]);
    await poKolejce();
    expect(zdarzenia).toEqual(['aktualizuj:1', 'zegarek:1', 'start:1']);
    s.zegar.przesun(5_000);
    await k.uslugi.dodajRzad();
    await poKolejce();
    expect(zdarzenia.slice(3)).toEqual(['aktualizuj:2', 'zegarek:2']); // Live Activity startuje raz na proces
  });

  test('F-49: restart (nowa kompozycja na tym samym pliku) → ten sam licznik; licznik w koszu → lista projektów', async () => {
    const a = await srodowisko();
    await a.k.przygotuj();
    await a.k.uslugi.dodajRzad();
    await poKolejce(); // drugie połączenie na tym samym pliku: odświeżenie ekranu blokady pierwszego musi się skończyć (BEGIN IMMEDIATE)
    const b = await srodowisko(a.s.katalog);
    expect(await b.k.przygotuj()).toEqual({ ok: true, wartosc: { cel: 'licznik' } });
    expect((await b.k.uslugi.start()).licznik.skonczone).toBe(1);
    await poKolejce();
    await wykonaj(b.s.baza, [['UPDATE licznik SET usunieto_ms = ?', [T0]]]);
    const c = await srodowisko(a.s.katalog);
    expect(await c.k.przygotuj()).toEqual({ ok: true, wartosc: { cel: 'lista' } });
  });

  test('RD-17: trzy +1 w 1 s → baner serii; „Undo 3 rows” → wartość sprzed serii i baner „Removed”; kolejne +1 gasi baner', async () => {
    const { s, k } = await srodowisko();
    await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 30)]);
    await k.przygotuj();
    await k.otworz('l1');
    s.zegar.ustaw(T0 + 3_600_000);
    for (let i = 0; i < 3; i++) { await k.uslugi.dodajRzad(); s.zegar.przesun(300); }
    expect((await k.dzialania.odswiez!()).baner).toEqual({ rodzaj: 'seria', n: 3, sekundy: 1, zrodlo: 'aplikacja', godzina: '13:00' }); // 07-jakosc-014: źródło i godzina serii (T0 + 1 h = 13:00 Europe/Warsaw)
    await k.dzialania.naCofnijSerie!();
    const po = await k.dzialania.odswiez!();
    expect([po.skonczone, po.baner]).toEqual([30, { rodzaj: 'cofnieto', n: 3, wartosc: 30 }]);
    s.zegar.przesun(5_000);
    await k.uslugi.dodajRzad();
    expect((await k.dzialania.odswiez!()).baner).toBeNull();
  });

  test('RD-13 (P-161): +1 46 → 47 wchodzi w rząd 48 z instrukcją → sygnał raz; −1 48 → 47 → pas wraca bez sygnału (W21, W22)', async () => {
    const { s, k } = await srodowisko();
    await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 46),
      ['INSERT INTO przypomnienie (id, licznik_id, od_rzedu, co_n, razy, tekst, zmieniono_ms) VALUES (?, ?, 6, 6, 10, ?, ?)', ['pr1', 'l1', 'ujmowanie', T0]]]);
    await k.przygotuj();
    await k.otworz('l1');
    s.zegar.ustaw(T0 + 3_600_000);
    const a = await k.uslugi.dodajRzad();
    expect(a.ok && [a.wartosc.wejscieWPrzypomnienie, a.wartosc.zdarzenia]).toEqual([{ rzad: 48, tekst: 'ujmowanie', ktory: 8, razy: 10 }, ['rzad', 'przypomnienie']]);
    expect((await k.dzialania.odswiez!()).przypomnienie).toEqual({ tekst: 'ujmowanie', ktory: 8, razy: 10, nastepny: 54 });
    s.zegar.przesun(5_000);
    const b = await k.uslugi.dodajRzad();
    expect(b.ok && [b.wartosc.wejscieWPrzypomnienie, b.wartosc.zdarzenia]).toEqual([null, ['rzad']]);
    expect((await k.dzialania.odswiez!()).przypomnienie).toBeNull();
    s.zegar.przesun(5_000);
    expect((await k.dzialania.naMinus!()).ok).toBe(true);
    expect((await k.dzialania.odswiez!()).przypomnienie).toMatchObject({ ktory: 8 }); // pas ze stanu, bez sygnału (naMinus nie gra wzorca przypomnienia)
  });

  test('ADR-0009 pkt 3: potwierdzenia zegarka ze startu danych idą przed pierwszym stanem', async () => {
    const { s, k, zdarzenia } = await srodowisko();
    await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 1)]);
    s.dziennik.linie.push({ id: 'w1', licznikId: 'l1', rodzaj: 'plus', rodzice: ['l1-z1'], czasMs: T0 + 60_000, strefa: 'Europe/Warsaw', dzien: '2026-10-22', zrodlo: 'zegarek', urzadzenie: 'zegarek-1', pro: false });
    await k.przygotuj();
    await k.otworz('l1');
    await k.uslugi.start();
    await poKolejce();
    expect(zdarzenia).toEqual(['potwierdz:w1', 'aktualizuj:2', 'zegarek:2', 'start:2']);
  });
});

describe('stanUkonczenia (ekrany.html `ukonczenie`)', () => {
  test('okres „Oct 1 – Oct 21”, czas „18 h 10 min”, bez sesji null; projekt roboczy z etykietą', async () => {
    const i = await utworzI18n({ magazyn: { odczytaj: async () => null, zapisz: async () => {} }, systemowe: () => ['en-US'], zasoby: ZASOBY });
    const j: Jezyk = { t: i.t, jezyk: i.jezyk, zegar24h: () => true };
    const k = { nazwa: '2026-10-01', nienazwany: true, utworzonoMs: Date.UTC(2026, 9, 1, 16, 40), startMs: Date.UTC(2026, 9, 1, 17), ukonczonoMs: Date.UTC(2026, 9, 21, 18),
      dni: 21, rzedy: 640, czasMs: (18 * 60 + 10) * 60_000, czesci: 4, wloczka: [], zdjecieSha: null };
    const s = stanUkonczenia(k, { j, terazMs: Date.UTC(2026, 9, 21, 18), strefa: 'Europe/Warsaw', zdjecie: (x) => `/p/${x}` });
    expect([s.nazwa, s.okres, s.czas]).toEqual(['Counter from Oct 1, 18:40', 'Oct 1 – Oct 21', '18 h 10 min']);
    expect([czasPracy(45 * 60_000, j), czasPracy(2 * 3_600_000, j)]).toEqual(['45 min', '2 h']);
    expect(stanUkonczenia({ ...k, czasMs: null }, { j, terazMs: 0, strefa: 'UTC', zdjecie: String }).czas).toBeNull();
  });
});

describe('licznosciTekst / wynikScalenia (e2e/README.md eksport-licznosci, import-wynik)', () => {
  test('„1 project, 1 counter, 2 changes”; powtórny import „0 new projects”', async () => {
    const i = await utworzI18n({ magazyn: { odczytaj: async () => null, zapisz: async () => {} }, systemowe: () => ['en-US'], zasoby: ZASOBY });
    const l = { projekt: 1, licznik: 1, zdarzenie: 2, czesc: 1 };
    expect(licznosciTekst(l, i.t)).toBe('1 project, 1 counter, 2 changes');
    expect(wynikScalenia({ projekt: 0 }, l, i.t)).toMatch(/1 new project\b.*1 project/);
    expect(wynikScalenia(l, l, i.t)).toMatch(/0 new/);
  });
});
