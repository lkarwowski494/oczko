// Stan dostępu Pro w kompozycji licznika (M1-063, MON-05; M1-064, KP-17): jeden reaktywny stan z kompozycja/dostep.ts. Zmiana Pro poza ekranem
// ofert (zdarzenie sklepu, decyzja po powrocie na pierwszy plan) → `poZmianie` (limit dni, stan ekranu blokady i zegarka), potem słuchacze ekranu.
// `wygasa`: koniec okresu subskrypcji w stanie ekranu blokady i zegarka (`proWaznoscDo`), null = dożywotni.

export type DostepLicznika = { stan(): { pro: boolean; wygasa: number | null }; naZmiane(f: (s: { pro: boolean }) => void): () => void; odswiez(): Promise<unknown> };

export function dostepLicznika(d: DostepLicznika | undefined, pro: () => boolean, poZmianie: () => Promise<void>) {
  const sluchacze = new Set<() => void>();
  let znane = d?.stan().pro;
  const koniec = d?.naZmiane((s) => {
    if (s.pro === znane) return;
    znane = s.pro;
    void poZmianie().then(() => sluchacze.forEach((f) => f())).catch(() => undefined);
  });
  return {
    /** Dostęp do stanu ekranu blokady i zegarka: koniec subskrypcji, nie „bez końca” (M1-064). */
    biezacy: (): { pro: boolean; wygasa: number | null } => { const p = pro(); return { pro: p, wygasa: p ? d?.stan().wygasa ?? null : null }; },
    /** Powrót na pierwszy plan: subskrypcja mogła wygasnąć w tle — nowa decyzja; wynik przez `naZmiane`. */
    odswiez: () => { void d?.odswiez().catch(() => undefined); },
    poDostepie: (f: () => void) => { sluchacze.add(f); return () => { sluchacze.delete(f); }; },
    zamknij: () => koniec?.(),
  };
}
