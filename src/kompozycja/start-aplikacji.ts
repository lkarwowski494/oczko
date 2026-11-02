// Start aplikacji ze strażnikiem (ADR-0019): stan startu w pliku JSON przed otwarciem bazy; tryb awaryjny bez migracji i bez zapisów do bazy
// (najpierw surowa kopia trzech plików, ADR-0020); kamień milowy po pierwszym ekranie. Wymuszona awaria buildu E2E (`oczkoE2eAwariaStartu`):
// po zapisie „start w toku” proces nie idzie dalej (pusty ekran), więc następny start liczy go jako nieudany.
import type { Powod } from '../domena/bledy';
import type { Licznosci } from '../domena/porty';
import { sciezkiDanych } from '../dane/baza/sciezki';
import { surowaKopia } from '../dane/kopia-ratunkowa';
import { stanPlikuBazy } from '../dane/pliki/magazyn';
import { czytajTekst, istniejePlik, katalogBiblioteki, kopiuj, nazwaPliku, polacz, usunKatalog, utworzKatalog, zapiszTekst } from '../dane/pliki/system';
import { otworzPortExpo } from '../dane/baza/adapter-expo';
import Constants from 'expo-constants';
import { sprzatnijKopie, sprzatnijKopiePrzed, sprzatnijTymczasowe, zipSurowejKopii } from '../niezawodnosc/kopie';
import { kopiaAwaryjna } from './kopia-awaryjna';
import { kamienMilowy, odczytajStan, poczatekStartu, sprobujNormalnie, wyjscieDoTla, type StanStartu } from '../niezawodnosc/start';
import { odczytajEtap, opisEtapu, type NazwaEtapu } from '../niezawodnosc/etap-startu';
import { awariaStartu, zegarAplikacji } from '../platforma/tryb-e2e';

export type TrybStartu = { tryb: 'normalny' } | { tryb: 'awaryjny'; powod: 'petla-startow' | 'wersja_nowsza' | 'uszkodzony' } | { tryb: 'awaria-e2e' };

function sciezki() {
  const s = sciezkiDanych(katalogBiblioteki());
  const katalogDanych = s.baza.slice(0, s.baza.lastIndexOf('/'));
  utworzKatalog(katalogDanych);
  return { ...s, katalogDanych };
}
async function czytajStan(plik: string): Promise<StanStartu> {
  try { return odczytajStan(istniejePlik(plik) ? await czytajTekst(plik) : null); } catch { return odczytajStan(null); }
}
const zapisz = (plik: string, s: StanStartu) => { try { zapiszTekst(plik, JSON.stringify(s)); } catch { /* brak zapisu stanu nie blokuje startu */ } };
/** P-271: plik etapu obok stanu startu (ta sama nazwa bazowa, jedno źródło ścieżek). */
const plikEtapu = (stanStartu: string) => stanStartu.replace(/\.json$/, '-etap.json');
let poczatekMs = 0; // początek bieżącego startu normalnego w procesie (czas od niego w pliku etapu)
function zapiszEtapStartu(etap: NazwaEtapu): void {
  try { zapiszTekst(plikEtapu(sciezki().stanStartu), JSON.stringify({ etap, ms: Math.max(0, Date.now() - poczatekMs) })); } catch { /* diagnostyka nie blokuje startu */ }
}

/** Początek startu na pierwszym planie (wołający czeka na AppState = active). */
export async function rozpocznijStart(): Promise<TrybStartu> {
  const s = sciezki();
  const p = poczatekStartu(await czytajStan(s.stanStartu));
  zapisz(s.stanStartu, p.stan); // przed otwarciem bazy (ADR-0019)
  if (p.awaryjny) return { tryb: 'awaryjny', powod: 'petla-startow' }; // etap poprzedniego startu zostaje do „Zgłoś problem”
  poczatekMs = Date.now();
  zapiszEtapStartu('poczatek');
  if (awariaStartu()) return { tryb: 'awaria-e2e' };
  return { tryb: 'normalny' };
}
export async function zapiszKamien(): Promise<void> {
  const s = sciezki();
  zapisz(s.stanStartu, kamienMilowy(await czytajStan(s.stanStartu)));
  zapiszEtapStartu('kamien');
  sprzatnijKopie(s.kopie, zegarAplikacji().teraz().ms); // ADR-0020 (6): kopie po KOPIE_RATUNKOWE_DNI, tylko po kamieniu milowym; błąd nie blokuje startu
  sprzatnijKopiePrzed(s.kopiePrzed, zegarAplikacji().teraz().ms); // ADR-0028 pkt 4: kopie przed importem i usunięciem — 2 najnowsze, maks. 30 dni
  sprzatnijTymczasowe(polacz(s.katalogDanych, 'tmp'), poczatekMs); // M1-001: pliki pochodne sprzed bieżącego startu; błąd nie blokuje startu
}
/** P-271 (Trening L-029): wyjście do tła przed kamieniem nie jest nieudanym startem (app/_layout.tsx, AppState „background”, tylko start normalny). */
export async function zapiszWyjscieDoTla(): Promise<void> {
  const s = sciezki();
  const przed = await czytajStan(s.stanStartu);
  const po = wyjscieDoTla(przed);
  if (po !== przed) zapisz(s.stanStartu, po);
}
/** P-271: etap pośredni startu normalnego (kontener gotowy: baza otwarta, migracje zakończone). */
export function zapiszEtap(etap: 'kontener'): void {
  zapiszEtapStartu(etap);
}
export async function sprobujNormalnieTeraz(): Promise<void> {
  const s = sciezki();
  zapisz(s.stanStartu, sprobujNormalnie(await czytajStan(s.stanStartu)));
}
/** Powód błędu startu normalnego → nagłówek ekranu awaryjnego (ten sam ekran, ADR-0019). */
export const powodAwaryjny = (p: Powod): 'wersja_nowsza' | 'uszkodzony' => (p === 'wersja_nowsza' ? 'wersja_nowsza' : 'uszkodzony');

/** Tryb awaryjny: surowa kopia przed czymkolwiek, potem archiwum `.oczko` z bazy w jej obecnej wersji (bez migracji i bez zapisów do bazy). */
export function trybAwaryjny() {
  const s = sciezki();
  const zegar = zegarAplikacji();
  const katalogi = { kopie: s.kopie, kopiePrzed: s.kopiePrzed, tymczasowy: polacz(s.katalogDanych, 'tmp') };
  utworzKatalog(katalogi.kopie);
  utworzKatalog(katalogi.tymczasowy);
  const kopia = surowaKopia(s.katalogDanych, s.kopie, zegar);
  const archiwum = kopiaAwaryjna({ sciezkaBazy: s.baza, pliki: s.pliki, zegar, katalogi }); // P-203: połączenie bez zamknięcia (bez checkpointu)
  return {
    kopia,
    sha: () => stanPlikuBazy(s.baza), // P-203 (kontrakt 07): para .db + -wal bez checkpointu i rozmiar -wal
    async zapiszKopie(): Promise<{ sciezka: string; licznosci: Licznosci } | null> {
      await kopia;
      return archiwum.zapisz();
    },
    /** P-194 Q4a: liczba nieudanych startów ze stanu strażnika (ADR-0019) do „Zgłoś problem”. */
    nieudaneStarty: async (): Promise<number> => (await czytajStan(s.stanStartu)).nieudane,
    /** P-271: etap, do którego doszedł ostatni start normalny (linia techniczna do „Zgłoś problem”). */
    etapPoprzedniegoStartu: async (): Promise<string> => {
      const plik = plikEtapu(s.stanStartu);
      try { return opisEtapu(odczytajEtap(istniejePlik(plik) ? await czytajTekst(plik) : null)); } catch { return opisEtapu(null); }
    },
    /**
     * P-194 Q4a: kody `blad` do „Zgłoś problem” bez otwierania oryginału — z kopii surowej przeniesionej do katalogu tymczasowego (zamknięcie
     * połączenia z oryginałem przeniosłoby WAL do `.db`, P-211). Tylko odczyt; katalog usuwany po odczycie. Błąd → wyjątek (wołający: „not_opened”).
     */
    async bledyZKopii(): Promise<{ czasMs: number; kod: string }[]> {
      const k = await kopia;
      if (!k.ok) throw new Error('brak kopii surowej');
      const kat = polacz(katalogi.tymczasowy, `zgloszenie-${zegar.teraz().ms}`);
      utworzKatalog(kat);
      try {
        for (const n of k.wartosc.pliki) kopiuj(polacz(k.wartosc.katalog, n), polacz(kat, n));
        const port = otworzPortExpo(polacz(kat, nazwaPliku(s.baza)), { tylkoOdczyt: true }); // nazwa z jednego źródła (sciezkiDanych)
        try {
          const w = await port.all<{ czas_ms: unknown; kod: unknown }>('SELECT czas_ms, kod FROM blad ORDER BY id DESC LIMIT 20');
          return w.flatMap((r) => (typeof r.czas_ms === 'number' && typeof r.kod === 'string' ? [{ czasMs: r.czas_ms, kod: r.kod }] : []));
        } finally {
          await port.zamknij();
        }
      } finally {
        usunKatalog(kat);
      }
    },
    /** ADR-0020 (3): baza się nie otwiera albo archiwum zawiodło → jeden ZIP surowej kopii (trzy pliki + manifest) do arkusza udostępniania. */
    async zipSurowej(): Promise<string | null> {
      const k = await kopia;
      if (!k.ok) return null;
      const cel = polacz(katalogi.tymczasowy, `oczko-ratunkowa-${zegar.teraz().ms}.zip`);
      const w = await zipSurowejKopii(k.wartosc.katalog, k.wartosc.pliki, cel, { aplikacja: Constants.expoConfig?.version ?? '?', build: Constants.expoConfig?.ios?.buildNumber ?? '?', terazMs: zegar.teraz().ms });
      return w.ok ? cel : null;
    },
  };
}
