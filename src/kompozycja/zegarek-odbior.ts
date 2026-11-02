// Odbiór +1 z zegarka przy otwartej aplikacji telefonu (07-jakosc-005, F-12, ADR-0030 pkt 1–3): zdarzenie `Zegarek.odbieraj` jest tylko sygnałem
// „w dzienniku leży nowa linia” (źródłem prawdy jest dziennik, ADR-0009 pkt 3) — scalenie robi istniejąca ścieżka `naPierwszyPlan`.
// Poza pierwszym planem nic (ARCH-13: transakcja w tle bez ochrony czasu wykonania kończy się `0xdead10cc`); linie czekają do powrotu na pierwszy plan.
// Jedno scalenie naraz: zdarzenia w trakcie trwającego scalenia dają jedno domknięcie, więc seria N stuknięć to najwyżej 2 przebiegi, a nie N
// (ADR-0008 (2): pozycje kolejki w kolejności wywołań, zapis z ekranu nie czeka na kolejkę scaleń z zegarka).
import type { Wynik } from '../domena/bledy';
import type { PortBazy, Zegar, Zegarek } from '../domena/porty';
import { zapiszBlad } from '../dane/repozytoria/bledy';
import { wKolejce } from '../przypadki-uzycia/kolejka';

export type ZaleznosciOdbioru = {
  /** `AppState === 'active'` w chwili zdarzenia. */
  aktywna(): boolean;
  /** Jeden przebieg: scalenie dziennika → potwierdzenia dla zegarka → odświeżenie ekranu i stanu zegarka. Niepowodzenie to wynik, nie wyjątek. */
  scal(): Promise<Wynik<unknown>>;
  /** Wpis diagnostyczny `zegarek_scalenie` (bez treści projektów, NFR-PRY-001); `powod` = powód wyniku albo `wyjatek`. */
  zglosBlad(powod: string): Promise<void>;
};

export function odbiorZegarka(o: ZaleznosciOdbioru): { naZdarzenie(): void; zamknij(): void } {
  let trwa = false;
  let ponow = false;
  let zamkniety = false;
  async function przebiegi(): Promise<void> {
    try {
      do {
        ponow = false;
        try {
          const w = await o.scal();
          if (!w.ok) await o.zglosBlad(w.powod); // linie zostają w dzienniku; ponowienie: następne zdarzenie, powrót na pierwszy plan albo ponowienie zegarka
        } catch {
          await o.zglosBlad('wyjatek');
        }
      } while (ponow && !zamkniety && o.aktywna()); // domknięcie tylko na pierwszym planie (ARCH-13): schowana aplikacja nie zaczyna transakcji
    } finally {
      trwa = false;
    }
  }
  return {
    naZdarzenie() {
      if (zamkniety || !o.aktywna()) return;
      if (trwa) { ponow = true; return; }
      trwa = true;
      void przebiegi();
    },
    zamknij() { zamkniety = true; },
  };
}

/**
 * Odbiór w kompozycji licznika: `podlacz` po danych startu (linie zapisane wcześniej scala już start), `poScaleniu` = ekran licznika czyta stan od nowa,
 * `zamknij` przy zamknięciu kontenera (ADR-0030 pkt 1). Wpis `zegarek_scalenie` bez treści projektów (NFR-PRY-001).
 */
export function odbiorZZegarka(z: { zegarek: Pick<Zegarek, 'odbieraj'>; baza: PortBazy; zegar: Zegar }, o: { aktywna(): boolean; scal(): Promise<Wynik<unknown>> }) {
  const sluchacze = new Set<() => void>();
  const bieg = odbiorZegarka({
    aktywna: o.aktywna,
    scal: o.scal,
    zglosBlad: async (powod) => { await wKolejce(z.baza, () => zapiszBlad(z.baza, { czasMs: z.zegar.teraz().ms, kod: 'zegarek_scalenie', szczegoly: { powod } })).catch(() => undefined); },
  });
  let odepnij: (() => void) | null = null;
  return {
    podlacz(): void { odepnij ??= z.zegarek.odbieraj(() => bieg.naZdarzenie()); },
    poScaleniu(): void { for (const f of [...sluchacze]) f(); },
    nasluchuj(f: () => void): () => void { sluchacze.add(f); return () => { sluchacze.delete(f); }; },
    zamknij(): void { bieg.zamknij(); odepnij?.(); odepnij = null; },
  };
}
