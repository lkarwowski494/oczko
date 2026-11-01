// Kompozycja partii 6 (moduly.md „Kontrakt partii 6”; P-246: krok skrzynki po danych startu, poza kolejką `uruchomDane`, przed silnikiem iCloud):
// zlecenie testowe E2E (oczkoE2eSkrzynka, P-230 Q2a), przetworzenie skrzynki importu, migawka projektów dla rozszerzenia (P-220 R1a, P-243) i stan
// arkusza „N patterns to add” na liście projektów (R2; nie nad licznikiem, P-046). Woła ją start aplikacji i powrót na pierwszy plan.
import type { Powod, Wynik } from '../domena/bledy';
import { SIEC_PONOWIENIE_MS } from '../konfiguracja';
import type { MigawkaProjektow, Siec, ZlecenieImportu } from '../domena/porty';
import { ustawFilm, usunFilm as usunFilmProjektu } from '../przypadki-uzycia/film';
import { odswiezMigawke } from '../przypadki-uzycia/migawka';
import { utworzProjekt } from '../przypadki-uzycia/projekt';
import { PRZEJSCIOWE, odrzucZlecenie, przetworzSkrzynke, przypiszZlecenie, type ZaleznosciSkrzynki } from '../przypadki-uzycia/skrzynka';

/** Planista opóźnienia (domyślnie `setTimeout`); zwraca funkcję anulującą. Wstrzykiwany w testach. */
export type Planista = (fn: () => void, ms: number) => () => void;
const planistaSystemowy: Planista = (fn, ms) => { const t = setTimeout(fn, ms); return () => clearTimeout(t); };
export type StanSkrzynki = { doWyboru: ZlecenieImportu[]; czekaSiec: ZlecenieImportu[]; bledy: { zlecenie: ZlecenieImportu; powod: Powod }[] };
export type ZaleznosciKompozycjiWzoru = ZaleznosciSkrzynki & { migawka: MigawkaProjektow; jezyk(): string };

export function kompozycjaWzoru(z: ZaleznosciKompozycjiWzoru, o: { grupa: string | null; zlecenieE2e: ((grupa: string, terazMs: number) => void) | null }) {
  let stan: StanSkrzynki = { doWyboru: [], czekaSiec: [], bledy: [] };
  let wToku: Promise<void> | null = null;
  let wybieranie = false; // jedno przypisanie naraz: drugie stuknięcie w arkuszu nie importuje drugi raz (przegląd 2026-10-26)
  let e2eWlozone = false; // zlecenie testowe raz na proces, nie przy każdym powrocie na pierwszy plan
  const sluchacze = new Set<() => void>();
  const zmien = (s: StanSkrzynki) => { stan = s; for (const f of sluchacze) f(); };
  /** `zachowajDoWyboru`: ponowienie po sieci nie otwiera na nowo arkusza „N patterns to add” (np. po „Not now”) — odświeża tylko „czeka na sieć” i błędy. */
  async function przetworz(zachowajDoWyboru = false): Promise<void> {
    if (o.zlecenieE2e && o.grupa && !e2eWlozone) { e2eWlozone = true; o.zlecenieE2e(o.grupa, z.zegar.teraz().ms); } // build E2E: tryb-e2e.ts (P-238)
    const w = await przetworzSkrzynke(z);
    if (w.ok) zmien({ doWyboru: zachowajDoWyboru ? stan.doWyboru : w.wartosc.doWyboru, czekaSiec: w.wartosc.czekaSiec, bledy: w.wartosc.bledy });
    await odswiezMigawke(z);
  }
  return {
    /** Start i `AppState → active`: jedno przetworzenie naraz (drugie wywołanie czeka na pierwsze). */
    poStarcie(): Promise<void> {
      wToku ??= przetworz().finally(() => { wToku = null; });
      return wToku;
    },
    stan: () => stan,
    /** Tylko testy: stan arkusza bez przechodzenia przez skrzynkę. */
    ustawStanTestowy(s: StanSkrzynki): void { zmien(s); },
    naZmiane(f: () => void): () => void { sluchacze.add(f); return () => { sluchacze.delete(f); }; },
    odswiezMigawke: () => odswiezMigawke(z),
    /** Film projektu z ekranu projektu (W8, P-276): po zapisie migawka (flaga `film` dla rozszerzenia — linia `udostepnij.film_zastapi`). */
    async zapiszFilm(projektId: string, f: { adres: string; nazwa: string }): Promise<Wynik<void>> {
      const w = await ustawFilm(z, { projektId, adres: f.adres, nazwa: f.nazwa });
      if (w.ok) await odswiezMigawke(z);
      return w;
    },
    async usunFilm(projektId: string): Promise<Wynik<void>> {
      const w = await usunFilmProjektu(z, { projektId });
      if (w.ok) await odswiezMigawke(z);
      return w;
    },
    /** Arkusz skrzynki: wszystkie zlecenia do wybranego projektu (null = nowy projekt z nazwą pierwszego pliku); wynik = liczba dodanych. */
    async wybierzProjekt(projektId: string | null): Promise<Wynik<number>> {
      if (wybieranie || stan.doWyboru.length === 0) return { ok: true, wartosc: 0 };
      wybieranie = true;
      const doWyboru = stan.doWyboru;
      zmien({ ...stan, doWyboru: [] }); // arkusz chowa się od razu (konwersja strony może trwać)
      try { return await this.przypisz(projektId, doWyboru); } finally { wybieranie = false; }
    },
    async przypisz(projektId: string | null, doWyboru: ZlecenieImportu[]): Promise<Wynik<number>> {
      let cel = projektId;
      if (!cel) {
        const nazwa = (doWyboru[0]?.nazwa ?? '').replace(/\.(pdf|docx?|jpe?g|png|heic)$/i, '').trim();
        const p = await utworzProjekt(z, { nazwa, czesci: [] });
        if (!p.ok) return p;
        cel = p.wartosc.projektId;
      }
      let n = 0;
      const zostaje: ZlecenieImportu[] = [];
      const bledy = [...stan.bledy];
      for (const zl of doWyboru) {
        const r = await przypiszZlecenie(z, { zlecenie: zl, projektId: cel });
        if (r.ok) n += 1;
        else if (PRZEJSCIOWE.includes(r.powod)) zostaje.push(zl);
        else bledy.push({ zlecenie: zl, powod: r.powod });
      }
      zmien({ doWyboru: stan.doWyboru, czekaSiec: [...stan.czekaSiec, ...zostaje], bledy });
      await odswiezMigawke(z);
      return { ok: true, wartosc: n };
    },
    /**
     * Strona WWW dodana w aplikacji, gdy konwersja zwróciła `brak_sieci` (BR-WZR-007 S3, ADR-0031 pkt 3): zlecenie trafia do tej samej skrzynki co z rozszerzenia
     * (zostaje po restarcie, ponowienie jak dla strony z Safari) i do stanu „czeka na sieć”. Błąd zapisu (np. brak App Group) → `zapis`, stan bez zmian.
     */
    async czekajNaSiec(w: { projektId: string; adres: string; nazwa: string }): Promise<Wynik<void>> {
      const d = await z.skrzynka.dodaj({ rodzaj: 'adres', adres: w.adres, nazwa: w.nazwa, projektId: w.projektId });
      if (!d.ok) return d;
      const dodane = (await z.skrzynka.pobierz()).find((x) => x.id === d.wartosc.id);
      if (!dodane) return { ok: false, powod: 'zapis' };
      zmien({ ...stan, czekaSiec: [...stan.czekaSiec.filter((x) => x.id !== dodane.id), dodane] });
      return { ok: true, wartosc: undefined };
    },
    /**
     * Zdarzenie portu Siec → „jest” (ADR-0031 pkt 4): po `SIEC_PONOWIENIE_MS` ponowne przetworzenie skrzynki, gdy coś czeka na sieć; kolejne zdarzenie przed upływem
     * odstępu przesuwa termin (migotanie łączności daje jedną próbę). Zwraca funkcję odpinającą (nasłuch + zaplanowane ponowienie).
     */
    obserwujSiec(siec: Siec, planuj: Planista = planistaSystemowy): () => void {
      let anuluj: (() => void) | null = null;
      const odepnij = siec.obserwuj((s) => {
        anuluj?.();
        anuluj = null;
        if (s !== 'jest') return;
        anuluj = planuj(() => { anuluj = null; void this.ponowPoSieci(); }, SIEC_PONOWIENIE_MS);
      });
      return () => { odepnij(); anuluj?.(); anuluj = null; };
    },
    /** Jedno przetworzenie naraz (wspólne z `poStarcie`); bez zleceń czekających na sieć nic nie robi. */
    ponowPoSieci(): Promise<void> {
      if (stan.czekaSiec.length === 0) return wToku ?? Promise.resolve();
      wToku ??= przetworz(true).finally(() => { wToku = null; });
      return wToku;
    },
    /** „Not now”: zlecenia zostają w skrzynce do następnego otwarcia. */
    nieTeraz(): void { zmien({ ...stan, doWyboru: [] }); },
    /** Alert błędu potwierdzony: zlecenie usunięte ze skrzynki (nic nie ginie po cichu — użytkowniczka widziała przyczynę). */
    async potwierdzBlad(id: string): Promise<void> {
      await odrzucZlecenie(z, { id });
      const inne = (x: ZlecenieImportu) => x.id !== id;
      zmien({ doWyboru: stan.doWyboru.filter(inne), czekaSiec: stan.czekaSiec.filter(inne), bledy: stan.bledy.filter((b) => b.zlecenie.id !== id) });
    },
  };
}
export type KompozycjaWzoru = ReturnType<typeof kompozycjaWzoru>;
