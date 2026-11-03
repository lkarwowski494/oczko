// M1-audytor-generalny-167 (08-programista-523; DEV-01, wzorzec roli „każda ścieżka zapisu i błędu ma test, który potrafi paść”): cztery akcje trasy
// wzoru wydzielone w M1-106 (`src/ekrany/WzorAkcje.ts`, `src/kompozycja/wzor-import-trasy.ts`) — argumenty przypadków użycia i skutek po udanym zapisie.
// Mutanty M106-a (rząd notatki bez znacznika), M106-g (obrót o 180°), M106-d (bez odświeżenia migawki), M106-e (bez arkusza „Open Settings”).
import { Alert, Linking } from 'react-native';
import { akcjeWzoru, type KontekstAkcjiWzoru } from '../../src/ekrany/WzorAkcje';
import { dodajZrodlo, type KontekstDodania } from '../../src/kompozycja/wzor-import-trasy';

const mockDodajNotatke = jest.fn();
const mockUstawObrot = jest.fn();
const mockUsunWzor = jest.fn();
jest.mock('../../src/przypadki-uzycia/wzor-notatki', () => ({
  dodajNotatkeWzoru: (...a: unknown[]) => mockDodajNotatke(...a), zmienNotatkeWzoru: jest.fn(), usunNotatkeWzoru: jest.fn(),
}));
jest.mock('../../src/przypadki-uzycia/wzor-widok', () => ({ ustawObrot: (...a: unknown[]) => mockUstawObrot(...a) }));
jest.mock('../../src/przypadki-uzycia/wzor', () => ({ usunWzor: (...a: unknown[]) => mockUsunWzor(...a), dodajWzor: jest.fn() }));
jest.mock('../../src/platforma/system-plikow-uzytkownika', () => ({ wybierzPlikWzoru: jest.fn() }));
jest.mock('../../src/platforma/zdjecia', () => ({ wybieraczZdjec: jest.fn() }));

const OK = { ok: true, wartosc: undefined };
const t = (k: string) => k;
const zw = { zegar: { teraz: () => ({ dzien: '2026-11-03', ms: 0, strefa: 'UTC' }) } };

function kontekst(o: { znacznik?: { rzad: number } | null; obroty?: number[]; strona?: { n: number; razem: number } | null } = {}) {
  const odswiezMigawke = jest.fn(async () => undefined);
  const wczytaj = jest.fn(async () => undefined);
  const c = {
    aplikacja: { kontener: { j: { t }, porty: { haptyka: { zagraj: jest.fn() } }, wzor: { k: { odswiezMigawke } } }, preferencje: { stan: () => ({ wibracje: false }) } },
    zw,
    widok: { wzorId: 'w1', znacznik: o.znacznik ?? null, obroty: o.obroty ?? [] },
    lw: { wartosc: 12, projektId: 'p1' },
    strona: o.strona === undefined ? { n: 1, razem: 3 } : o.strona,
    wczytaj,
  } as unknown as KontekstAkcjiWzoru;
  return { c, odswiezMigawke, wczytaj };
}
const poObietnicach = () => new Promise((r) => setImmediate(r));

beforeEach(() => {
  for (const m of [mockDodajNotatke, mockUstawObrot, mockUsunWzor]) { m.mockReset(); m.mockResolvedValue(OK); }
});

describe('akcjeWzoru · nowa notatka (BR-WZR: notatka przy rzędzie znacznika)', () => {
  test('ze znacznikiem: rząd znacznika, nie licznika', async () => {
    const { c } = kontekst({ znacznik: { rzad: 5 } });
    akcjeWzoru(c).naNotatka('zmiana ściegu');
    await poObietnicach();
    expect(mockDodajNotatke).toHaveBeenCalledWith(zw, { wzorId: 'w1', rzad: 5, tekst: 'zmiana ściegu' });
  });
  test('bez znacznika: rząd następny po wartości licznika', async () => {
    const { c } = kontekst({ znacznik: null });
    akcjeWzoru(c).naNotatka('x');
    await poObietnicach();
    expect(mockDodajNotatke).toHaveBeenCalledWith(zw, { wzorId: 'w1', rzad: 13, tekst: 'x' });
  });
});

describe('akcjeWzoru · obrót strony o 90°', () => {
  test.each([
    [[], { n: 1, razem: 3 }, 0, 90],
    [[0, 90], { n: 2, razem: 3 }, 1, 180],
    [[0, 0, 270], { n: 3, razem: 3 }, 2, 0],
    [[180], null, 0, 270],
  ] as const)('obroty %j, strona %j → ustawObrot(strona %i, kąt %i), potem odświeżenie widoku', async (obroty, strona, indeks, kat) => {
    const { c, wczytaj } = kontekst({ obroty: [...obroty], strona });
    akcjeWzoru(c).naObroc();
    await poObietnicach();
    expect(mockUstawObrot).toHaveBeenCalledWith(zw, { wzorId: 'w1', strona: indeks, kat });
    expect(wczytaj).toHaveBeenCalledWith('w1');
  });
});

describe('akcjeWzoru · usunięcie wzoru', () => {
  test('po udanym usunWzor: odświeżenie migawki (licznik wzorów), potem widok bez wybranego wzoru', async () => {
    const { c, odswiezMigawke, wczytaj } = kontekst();
    akcjeWzoru(c).naUsun();
    await poObietnicach();
    expect(mockUsunWzor).toHaveBeenCalledWith(zw, { wzorId: 'w1' });
    expect(odswiezMigawke).toHaveBeenCalledTimes(1);
    expect(wczytaj).toHaveBeenCalledWith();
  });
  test('błąd zapisu: bez odświeżenia migawki i widoku (alert z M1-006)', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    mockUsunWzor.mockResolvedValue({ ok: false, powod: 'zapis' });
    const { c, odswiezMigawke, wczytaj } = kontekst();
    akcjeWzoru(c).naUsun();
    await poObietnicach();
    expect(alert).toHaveBeenCalledTimes(1);
    expect(odswiezMigawke).not.toHaveBeenCalled();
    expect(wczytaj).not.toHaveBeenCalled();
    alert.mockRestore();
  });
});

describe('dodajZrodlo · skaner bez zgody na aparat (W11 :664)', () => {
  test('odmowa → arkusz z dwoma przyciskami: „Cancel” i „Open Settings” (otwiera Ustawienia)', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const ustawienia = jest.spyOn(Linking, 'openSettings').mockResolvedValue(undefined);
    const c = {
      kontener: { j: { t, jezyk: () => 'en' }, wzor: { z: zw, platforma: { skanuj: async () => ({ ok: false, powod: 'odmowa' }) } } },
      lw: { projektId: 'p1', wartosc: 0 },
    } as unknown as KontekstDodania;
    await dodajZrodlo(c, 'skan');
    expect(alert).toHaveBeenCalledTimes(1);
    const [tytul, opis, przyciski] = alert.mock.calls[0];
    expect([tytul, opis]).toEqual(['zdjecia.brak_aparatu_tytul', 'wzor.brak_aparatu_opis']);
    expect(przyciski?.map((p) => [p.text, p.style])).toEqual([['wspolne.anuluj', 'cancel'], ['zdjecia.otworz_ustawienia', undefined]]);
    przyciski?.[1].onPress?.();
    expect(ustawienia).toHaveBeenCalledTimes(1);
    alert.mockRestore(); ustawienia.mockRestore();
  });
});
