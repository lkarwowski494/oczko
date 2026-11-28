// Czyste składanie stanu ekranu licznika z modelu odczytu (wydzielone z `licznik.ts` bez zmiany zachowania: limit 20 KB na plik, `jakosc:kontrole`);
// `licznik.ts` re-eksportuje `Jezyk`, `miesiac`, `etykietaRobocza` i `stanEkranu`, więc importy w aplikacji i testach się nie zmieniają.
import { czescNaLiczniku } from '../domena/nazwa-czesci';
import { formatujGodzine } from '../i18n/format';
import { ZNACZENIE_NOWEGO_LICZNIKA } from '../konfiguracja';
import type { BanerLicznika, StanEkranuLicznika } from '../ekrany/Licznik';
import type { Tlumacz } from '../ekrany/wspolne';
import type { WidokLicznika } from '../przypadki-uzycia/widok-licznika';

export type Jezyk = { t: Tlumacz; jezyk(): string; zegar24h(): boolean };

export const miesiac = (dzien: string, j: string, dzienMiesiaca = false) =>
  new Intl.DateTimeFormat(j, { month: 'long', ...(dzienMiesiaca ? { day: 'numeric' } : {}), timeZone: 'UTC' })
    .format(new Date(Date.UTC(Number(dzien.slice(0, 4)), Number(dzien.slice(5, 7)) - 1, Number(dzien.slice(8, 10)) || 1)));

/** Etykieta projektu roboczego (design-spec „Projekt roboczy”, P-126 (1b)): data i godzina startu w formacie regionu, rok tylko gdy inny niż bieżący. */
export function etykietaRobocza(utworzonoMs: number, terazMs: number, j: Jezyk, strefa: string): string {
  const rok = (ms: number) => new Intl.DateTimeFormat('en-CA', { year: 'numeric', timeZone: strefa }).format(new Date(ms));
  const data = new Intl.DateTimeFormat(j.jezyk(), {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: !j.zegar24h(), timeZone: strefa,
    ...(rok(utworzonoMs) !== rok(terazMs) ? { year: 'numeric' } : {}),
  }).format(new Date(utworzonoMs));
  return j.t('projekty.nazwa_robocza', { data });
}

/** Źródło serii w banerze: ekran blokady i zegarek mają własne zdania (S5); pozostałe źródła (aplikacja, synchronizacja, import) — zdanie z czasem trwania. */
const zrodloBanera = (z: string): 'aplikacja' | 'ekran_blokady' | 'zegarek' | 'inne' => (z === 'ekran_blokady' || z === 'zegarek' ? z : z === 'aplikacja' ? 'aplikacja' : 'inne');

/** Stan ekranu z modelu odczytu; `null` = przed pierwszym +1 (licznik bez projektu z 0, NFR-PIE-001). */
export function stanEkranu(w: WidokLicznika | null, o: { j: Jezyk; dzis: string; terazMs: number; strefa: string; baner: BanerLicznika; wibracje: boolean; podpowiedzProg?: number | null }): StanEkranuLicznika {
  const { j } = o;
  const mies = { nazwa: miesiac(o.dzis, j.jezyk()), wznowienie: miesiac(w ? w.wznowienie : o.dzis, j.jezyk(), true), rzedyDanych: w ? w.wartosc : 0 };
  if (!w) {
    return {
      rodzaj: 'rzedy', projekt: null, czesc: null, skonczone: 0, dziergany: 1, znaczenie: ZNACZENIE_NOWEGO_LICZNIKA, cel: null, celDnia: null, przypomnienie: null, powtorzenie: null,
      notatka: null, sesja: null, zablokowany: false, limit: { rodzaj: 'brak' }, miesiac: mies, baner: null, blizniak: null, wibracje: o.wibracje,
    };
  }
  const oczka = w.rodzaj === 'oczka'; // licznik oczek nie ma celu (cel części jest w rzędach), celu dnia, przypomnień, powtórzeń, banera strażnika ani rzędu w robocie
  return {
    rodzaj: w.rodzaj,
    projekt: w.projekt.nienazwany ? etykietaRobocza(w.projekt.utworzonoMs, o.terazMs, j, o.strefa) : w.projekt.nazwa,
    czesc: czescNaLiczniku(w.czesc.nazwa), // nazwa zapasowa części (data startu) nie jest pokazywana, także po nazwaniu projektu (BY-002; design-spec „Projekt roboczy”); nazwa wpisana — zawsze
    skonczone: w.wartosc, dziergany: w.wartosc + 1, znaczenie: oczka ? 'skonczone' : w.znaczenie, cel: oczka ? null : w.czesc.cel,
    celDnia: oczka || w.celDnia === null ? null : { rzedy: w.celDnia },
    calosc: oczka || w.calosc === null ? null : { czesc: czescNaLiczniku(w.czesc.nazwa), rzedy: w.calosc }, // BR-LIC-018/S1; nazwa zapasowa (data) nie jest pokazywana (F-46, BY-002)
    przypomnienie: oczka ? null : w.przypomnienie,
    powtorzenie: oczka ? null : w.powtorzenie && { nazwa: w.nazwa || czescNaLiczniku(w.czesc.nazwa) || (w.projekt.nienazwany ? etykietaRobocza(w.projekt.utworzonoMs, o.terazMs, j, o.strefa) : w.projekt.nazwa), ...w.powtorzenie },
    notatka: w.projekt.notatka || null,
    sesja: w.sesja && { rzedy: w.sesja.rzedy, od: formatujGodzine(new Date(w.sesja.odMs), j.jezyk(), { uses24h: j.zegar24h(), strefa: o.strefa }) },
    zablokowany: w.zablokowany, limit: { rodzaj: w.limit }, miesiac: mies, krok: w.krok,
    podpowiedzProg: o.podpowiedzProg ?? null, ostatniaZmianaMs: w.ostatniaZmianaMs, stoperWstrzymany: w.stoperWstrzymany,
    baner: o.baner ?? (!oczka && w.seria ? { rodzaj: 'seria', n: w.seria.ile, sekundy: w.seria.sekundy, zrodlo: zrodloBanera(w.seria.zrodlo), godzina: formatujGodzine(new Date(w.seria.odMs), j.jezyk(), { uses24h: j.zegar24h(), strefa: o.strefa }) } : null),
    blizniak: oczka ? null : w.blizniak, wibracje: o.wibracje,
  };
}
