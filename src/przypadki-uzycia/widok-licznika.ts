// Model odczytu ekranu licznika (design-spec „Licznik”, F-49, BR-LIC-001, P-065, RD-13, RD-15, RD-17, BR-PRJ-014): same dane, bez tekstów.
// Formatowanie (miesiąc, godzina, etykieta projektu roboczego przez t(), P-126 (1b)) robi kompozycja ekranu. Odczyt w kolejce: widzi zapisy zlecone wcześniej.
import type { Wynik } from '../domena/bledy';
import { celCofnieciaIndeks, cofnieteId } from '../domena/cofniecie';
import { powtorzenieLicznika } from '../domena/licznik';
import { mozeZaczacDzien, wznowienieLimitu } from '../domena/limit';
import { planPrzypomnien, przypomnienieChwili, type PlanPrzypomnienia } from '../domena/przypomnienia';
import { posiedzenie } from '../domena/posiedzenie';
import { serieDoSprawdzenia } from '../domena/straznik-tempa';
import type { PortBazy } from '../domena/porty';
import type { ZrodloZdarzenia } from '../domena/stany';
import { STRAZNIK_OKNO_S, STRAZNIK_SERIA_ZDARZEN } from '../konfiguracja';
import { dzienProjektu } from '../dane/repozytoria/kalendarz';
import { caloscCzesci, celCzesci, dniLimituMiesiaca, ostatniPlus } from '../dane/repozytoria/liczniki';
import { odczytajUstawienie, zapiszUstawienie } from '../dane/repozytoria/ustawienia';
import { liczba, liczbaLubNull, listaTekstow, tekst, tekstLubNull, wiersze } from '../dane/repozytoria/wiersze';
import { dodajDni } from './daty';
import { blad, operacjaZapisu, OK } from './zapis';
import type { Zaleznosci } from './zaleznosci';

export type WidokLicznika = {
  licznikId: string;
  projektId: string;
  czescId: string;
  projekt: { nazwa: string; nienazwany: boolean; utworzonoMs: number; notatka: string };
  czesc: { nazwa: string; cel: number | null };
  nazwa: string;                        // nazwa licznika (powtórzenie, RD-12)
  /** Rodzaj licznika (BR-LIC-006): licznik oczek ma inny ekran niż licznik rzędów (07-jakosc-025). */
  rodzaj: 'rzedy' | 'oczka';
  wartosc: number;
  glowa: string | null;
  znaczenie: 'skonczone' | 'w_trakcie';
  zablokowany: boolean;
  /** Pas rzędu w robocie (RD-13, P-161: skończone + 1 w obu trybach) z `przypomnienieChwili`; `nastepny` = kolejny rząd tego planu. */
  przypomnienie: { tekst: string; ktory: number; razy: number; nastepny: number | null } | null;
  /** Plany przypomnień licznika — do sygnału przy zmianie (`sygnalZmiany`, RD-13-W20–W25) w kompozycji. */
  plany: (PlanPrzypomnienia & { id: string; tekst: string })[];
  powtorzenie: { numer: number; rzadW: number; dlugosc: number } | null;
  /** Kreski posiedzenia (domena/posiedzenie.ts): od startu stopera albo +1 bez przerwy ≥ PRZERWA_NOWEGO_DNIA_MS; zostają do następnego +1. */
  sesja: { rzedy: number; odMs: number } | null;
  limit: 'zawczasu' | 'ostatni-darmowy' | 'brak';
  dzis: string;
  wznowienie: string;
  /** Seria RD-17 na końcu historii (pytanie „Undo n rows”): od pierwszego zdarzenia serii, `ile` dodań w `sekundy` s. */
  seria: { ile: number; sekundy: number; odZdarzeniaId: string } | null;
  blizniak: { rzad: number; notatka: string | null; przypomnienie: string | null } | null;
  celDnia: number | null;
  /** Rzędy zrobione dziś na częściach z celem (Z_teraz − Z_przed, RD-15); null bez terminu projektu. Punkt odniesienia sygnału „cel dnia osiągnięty” (F-48). */
  zrobioneDzis: number | null;
  /** Całość części dla licznika sekcji (BR-LIC-018/S1, `caloscCzesci`); null bez sekcji. */
  calosc: number | null;
};

const OKNO_SESJI = 200; // ostatnie zdarzenia czytane dla kresek i strażnika (posiedzenie dłuższe niż 200 rzędów pokazuje 200)

type Plus = { id: string; czasMs: number; zrodlo: ZrodloZdarzenia };
/** Dodania +1 nieobjęte cofnięciem, od najnowszego. */
async function ostatnieDodania(tx: PortBazy, licznikId: string): Promise<Plus[]> {
  const r = await wiersze(tx.all('SELECT id, rodzaj, cofa, czas_ms, zrodlo FROM zdarzenie WHERE licznik_id = ? ORDER BY czas_ms DESC, rowid DESC LIMIT ?', [licznikId, OKNO_SESJI]), 'widokLicznika');
  const cofniete = new Set(r.flatMap((w) => listaTekstow(w, 'cofa')));
  return r.filter((w) => tekst(w, 'rodzaj') === 'plus' && !cofniete.has(tekst(w, 'id')))
    .map((w) => ({ id: tekst(w, 'id'), czasMs: liczba(w, 'czas_ms'), zrodlo: tekst(w, 'zrodlo') as ZrodloZdarzenia }));
}
/** Ostatnia sesja stopera projektu (granica posiedzenia, design-spec:242); null bez sesji. */
async function ostatniStoper(tx: PortBazy, projektId: string): Promise<{ startMs: number; koniecMs: number | null } | null> {
  const [r] = await wiersze(tx.all('SELECT start_ms, koniec_ms FROM sesja WHERE projekt_id = ? ORDER BY start_ms DESC LIMIT 1', [projektId]), 'widokLicznika');
  return r ? { startMs: liczba(r, 'start_ms'), koniecMs: liczbaLubNull(r, 'koniec_ms') } : null;
}
/** Pytanie o serię tylko, gdy seria kończy się ostatnim dodaniem i nic po nim nie zmieniło licznika (cofnięcie serii na końcu historii, F-47). */
function seria(dodania: readonly Plus[], glowa: string | null): WidokLicznika['seria'] {
  if (dodania.length === 0 || dodania[0].id !== glowa) return null;
  const s = serieDoSprawdzenia([...dodania].reverse(), { seria: STRAZNIK_SERIA_ZDARZEN, oknoS: STRAZNIK_OKNO_S });
  if (!s.ok) return null;
  const ostatnia = s.wartosc.find((x) => x.ids[x.ids.length - 1] === glowa);
  return ostatnia ? { ile: ostatnia.ids.length, sekundy: Math.max(1, Math.round((ostatnia.doMs - ostatnia.odMs) / 1000)), odZdarzeniaId: ostatnia.ids[0] } : null;
}
async function plany(tx: PortBazy, licznikId: string): Promise<WidokLicznika['plany']> {
  return (await wiersze(tx.all('SELECT id, od_rzedu, co_n, razy, tekst FROM przypomnienie WHERE licznik_id = ? ORDER BY od_rzedu, id', [licznikId]), 'widokLicznika'))
    .map((p) => ({ id: tekst(p, 'id'), od: liczba(p, 'od_rzedu'), co: liczba(p, 'co_n'), razy: liczba(p, 'razy'), tekst: tekst(p, 'tekst') }));
}
/** Pierwszy plan z pasem na rzędzie w robocie (skończone + 1); stan bez sygnału (P-161 Q2a, Q3). */
function pas(lista: WidokLicznika['plany'], skonczone: number, tryb: 'skonczone' | 'w_trakcie'): WidokLicznika['przypomnienie'] {
  for (const p of lista) {
    const c = przypomnienieChwili(skonczone, tryb, p);
    if (!c.ok || c.wartosc.k === null) continue;
    const rzedy = planPrzypomnien(p);
    return { tekst: p.tekst, ktory: c.wartosc.k, razy: p.razy, nastepny: rzedy.ok ? rzedy.wartosc[c.wartosc.k] ?? null : null };
  }
  return null;
}
async function blizniak(tx: PortBazy, paraZ: string | null, rzad: number): Promise<WidokLicznika['blizniak']> {
  if (!paraZ) return null;
  const [l] = await wiersze(tx.all("SELECT l.id FROM licznik l JOIN czesc c ON c.id = l.czesc_id WHERE l.czesc_id = ? AND l.rodzaj = 'rzedy' AND l.usunieto_ms IS NULL AND c.usunieto_ms IS NULL ORDER BY l.kolejnosc LIMIT 1", [paraZ]), 'widokLicznika');
  if (!l) return null;
  const id = tekst(l, 'id');
  const [n] = await wiersze(tx.all('SELECT tekst FROM notatka_rzedu WHERE licznik_id = ? AND rzad = ? ORDER BY zmieniono_ms DESC LIMIT 1', [id, rzad]), 'widokLicznika');
  const p = pas(await plany(tx, id), rzad - 1, 'skonczone');
  return n || p ? { rzad, notatka: n ? tekst(n, 'tekst') : null, przypomnienie: p ? p.tekst : null } : null;
}

/** RD-12 przez funkcję domeny (r = liczba pokazana na liczniku, BR-LIC-012); brak długości albo błąd danych → bez powtórzenia. */
function powtorzenieWidoku(skonczone: number, znaczenie: 'skonczone' | 'w_trakcie', dlugosc: number | null): WidokLicznika['powtorzenie'] {
  if (dlugosc === null) return null;
  const p = powtorzenieLicznika(skonczone, znaczenie, dlugosc);
  return p.ok ? { numer: p.wartosc.powtorzenie, rzadW: p.wartosc.rzadW, dlugosc } : null;
}

/** Stan ekranu licznika `licznikId`; licznik w koszu albo nieistniejący → `bledne_dane` (kompozycja otwiera wtedy listę projektów, F-49). */
export function widokLicznika(z: Zaleznosci, w: { licznikId: string }): Promise<Wynik<WidokLicznika>> {
  return operacjaZapisu(z, 'widokLicznika', async (tx, teraz, chwila) => {
    const [r] = await wiersze(tx.all(
      `SELECT l.id, l.nazwa, l.rodzaj, l.wartosc, l.glowa, l.znaczenie, l.zablokowany, l.dlugosc_powtorzenia, c.id AS czesc_id, c.nazwa AS czesc, c.cel_rzedow, c.para_z,
              p.id AS projekt_id, p.nazwa AS projekt, p.nienazwany, p.utworzono_ms, p.notatka, p.termin_dzien
         FROM licznik l JOIN czesc c ON c.id = l.czesc_id JOIN projekt p ON p.id = c.projekt_id
        WHERE l.id = ? AND l.usunieto_ms IS NULL AND c.usunieto_ms IS NULL AND p.usunieto_ms IS NULL`, [w.licznikId]), 'widokLicznika');
    if (!r) return blad('bledne_dane');
    const wartosc = liczba(r, 'wartosc'), glowa = tekstLubNull(r, 'glowa'), dzis = chwila.dzien;
    const dodania = await ostatnieDodania(tx, w.licznikId);
    const zaw = mozeZaczacDzien({ dni: await dniLimituMiesiaca(tx, dzis.slice(0, 7)), dzis, teraz, ostatniPlus: await ostatniPlus(tx, dodajDni(dzis, -2)), pro: z.pro() });
    const dl = liczbaLubNull(r, 'dlugosc_powtorzenia');
    const znaczenie = tekst(r, 'znaczenie') === 'w_trakcie' ? 'w_trakcie' : 'skonczone';
    const lista = await plany(tx, w.licznikId);
    const termin = tekstLubNull(r, 'termin_dzien');
    const dzien = termin ? await dzienProjektu(tx, tekst(r, 'projekt_id'), termin, dzis) : null;
    const cel = dzien ? dzien.cel : null;
    return {
      ok: true,
      wartosc: {
        licznikId: w.licznikId, projektId: tekst(r, 'projekt_id'), czescId: tekst(r, 'czesc_id'),
        projekt: { nazwa: tekst(r, 'projekt'), nienazwany: liczba(r, 'nienazwany') === 1, utworzonoMs: liczba(r, 'utworzono_ms'), notatka: tekst(r, 'notatka') },
        czesc: { nazwa: tekst(r, 'czesc'), cel: await celCzesci(tx, { cel: liczbaLubNull(r, 'cel_rzedow'), paraZ: tekstLubNull(r, 'para_z') }) }, // BR-PRJ-014 S1, S3
        nazwa: tekst(r, 'nazwa'), rodzaj: tekst(r, 'rodzaj') === 'oczka' ? 'oczka' : 'rzedy', wartosc, glowa,
        znaczenie,
        zablokowany: liczba(r, 'zablokowany') === 1,
        przypomnienie: pas(lista, wartosc, znaczenie),
        plany: lista,
        powtorzenie: powtorzenieWidoku(wartosc, znaczenie, dl), // RD-12 z wyborem r w domenie (07-jakosc-020)
        sesja: posiedzenie({ dodaniaMs: dodania.map((d) => d.czasMs), stoper: await ostatniStoper(tx, tekst(r, 'projekt_id')) }),
        limit: zaw.limitZawczasu ? 'zawczasu' : zaw.ostatniDarmowy ? 'ostatni-darmowy' : 'brak',
        dzis, wznowienie: wznowienieLimitu({ dzis }),
        seria: seria(dodania, glowa),
        blizniak: await blizniak(tx, tekstLubNull(r, 'para_z'), wartosc + 1),
        celDnia: cel && cel.rodzaj === 'cel' ? cel.rzedy : null,
        zrobioneDzis: dzien ? dzien.zrobioneDzis : null,
        calosc: await caloscCzesci(tx, tekst(r, 'czesc_id')),
      },
    };
  });
}

export type MiejsceLicznika = { ekran: 'licznik'; id: string; wzor?: string }; // wzor: ostatni wzór (partia 6, P-246)
/** F-49: ostatni licznik z `ostatnie_miejsce`; brak klucza → null; wskazanie na licznik w koszu → klucz usunięty, null (moduly.md:238). */
export function biezacyLicznik(z: Zaleznosci): Promise<Wynik<string | null>> {
  return operacjaZapisu(z, 'biezacyLicznik', async (tx) => {
    const m = await odczytajUstawienie(tx, 'ostatnie_miejsce');
    if (!m || typeof m !== 'object' || !('ekran' in m) || m.ekran !== 'licznik' || !('id' in m) || typeof m.id !== 'string') return { ok: true, wartosc: null };
    const [l] = await wiersze(tx.all(
      `SELECT l.id FROM licznik l JOIN czesc c ON c.id = l.czesc_id JOIN projekt p ON p.id = c.projekt_id
        WHERE l.id = ? AND l.usunieto_ms IS NULL AND c.usunieto_ms IS NULL AND p.usunieto_ms IS NULL`, [m.id]), 'biezacyLicznik');
    if (!l) {
      await tx.run("DELETE FROM ustawienie WHERE klucz = 'ostatnie_miejsce'");
      return { ok: true, wartosc: null };
    }
    return { ok: true, wartosc: m.id };
  });
}
export function zapamietajLicznik(z: Zaleznosci, w: { licznikId: string }): Promise<Wynik<void>> {
  return operacjaZapisu(z, 'ostatnieMiejsce', async (tx, teraz) => {
    const m = await odczytajUstawienie(tx, 'ostatnie_miejsce'); // partia 6: ostatni wzór zostaje (wzorDoOtwarcia sprawdza projekt)
    const wzor = m && typeof m === 'object' && 'wzor' in m && typeof m.wzor === 'string' ? m.wzor : undefined;
    await zapiszUstawienie(tx, 'ostatnie_miejsce', { ekran: 'licznik', id: w.licznikId, ...(wzor ? { wzor } : {}) }, teraz);
    return OK;
  });
}

export type WpisHistoriiLicznika = {
  id: string; czasMs: number; z: number; na: number; rodzaj: 'plus' | 'minus' | 'wpisanie' | 'zerowanie' | 'cofniecie' | 'rozstrzygniecie';
  /** Zmiana cofnięta późniejszym cofnięciem (znacznik „Undone”, BR-LIC-003/S3). */
  cofniety: boolean;
  /** Dokładnie jeden wpis ma „Undo”: ostatnia zmiana, która nie jest cofnięta (07-jakosc-021). */
  mozeCofnac: boolean;
  /** Seria RD-17 na końcu historii jako jeden wpis (BR-LIC-003/S2): `z` = wartość przed serią, `na` = po niej; cofa ją `cofnijSerie`. */
  seria: { ile: number; sekundy: number; odZdarzeniaId: string } | null;
};
/** Historia licznika (F-02, BR-LIC-003): od najnowszej zmiany; `z` = wartość po zdarzeniu-rodzicu (brak rodzica = 0, historia liniowa w aplikacji). */
export function historiaLicznika(z: Zaleznosci, w: { licznikId: string; limit?: number }): Promise<Wynik<WpisHistoriiLicznika[]>> {
  const limit = w.limit ?? 50;
  return operacjaZapisu(z, 'historiaLicznika', async (tx) => {
    const r = await wiersze(tx.all(
      `SELECT z.id, z.rodzaj, z.wartosc_po, z.czas_ms, z.cofa, (SELECT p.wartosc_po FROM zdarzenie p WHERE p.id = json_extract(z.rodzice, '$[0]')) AS przed
         FROM zdarzenie z WHERE z.licznik_id = ? ORDER BY z.czas_ms DESC, z.rowid DESC LIMIT ?`, [w.licznikId, Math.max(limit, OKNO_SESJI)]), 'historiaLicznika');
    const zdarzenia = r.map((x) => ({ id: tekst(x, 'id'), rodzaj: tekst(x, 'rodzaj'), cofa: listaTekstow(x, 'cofa') }));
    const cofniete = cofnieteId(zdarzenia), cel = celCofnieciaIndeks(zdarzenia);
    const wpisy: WpisHistoriiLicznika[] = r.map((x, i) => ({
      id: tekst(x, 'id'), czasMs: liczba(x, 'czas_ms'), z: liczbaLubNull(x, 'przed') ?? 0, na: liczba(x, 'wartosc_po'), rodzaj: tekst(x, 'rodzaj') as WpisHistoriiLicznika['rodzaj'],
      cofniety: cofniete.has(tekst(x, 'id')), mozeCofnac: i === cel, seria: null,
    }));
    // Seria na końcu historii (nic po niej nie zmieniło licznika) to jeden wpis z „Undo n rows” (BR-LIC-003/S2, design-spec 021).
    const [l] = cel === 0 ? await wiersze(tx.all('SELECT glowa FROM licznik WHERE id = ?', [w.licznikId]), 'historiaLicznika') : [];
    const ser = l ? seria(await ostatnieDodania(tx, w.licznikId), tekstLubNull(l, 'glowa')) : null;
    const k = ser ? wpisy.findIndex((x) => x.id === ser.odZdarzeniaId) : -1;
    const wynik = ser && k > 0 ? [{ ...wpisy[0], z: wpisy[k].z, seria: ser }, ...wpisy.slice(k + 1)] : wpisy;
    return { ok: true, wartosc: wynik.slice(0, limit) };
  });
}
