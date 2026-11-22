// Globalna obsługa błędów JS (ADR-0018 uzupełnienie fix-6, P-194 Q4a): jeden punkt w kompozycji. Wpis `blad` `{ kod: 'js_<nazwa>',
// szczegoly: { ramki, fatal } }` BEZ treści komunikatu (może nieść dane użytkowniczki) i bez nazw funkcji z danymi — tylko plik:linia:kolumna;
// najwyżej jeden wpis na przyczynę (fatalny albo pierwszy po starcie). Na końcu poprzedni handler: awaria zostaje awarią.
// Tryb awaryjny: zapis = null (ADR-0019: nic do bazy), błąd tylko idzie dalej.
export type ObslugaBledowRN = { getGlobalHandler(): (e: unknown, fatal?: boolean) => void; setGlobalHandler(h: (e: unknown, fatal?: boolean) => void): void };
export type WpisBledu = { kod: string; szczegoly: { ramki: string[]; fatal: boolean } };

const MAKS_RAMEK = 20;
const nazwa = (e: unknown): string => (e instanceof Error && /^[A-Za-z0-9_]{1,40}$/.test(e.name) ? e.name : 'nieznany');
/** Ramki stosu jako „plik:linia:kolumna” (nazwa pliku bez ścieżki i adresu), bez treści komunikatu z pierwszej linii stosu. */
function ramki(e: unknown): string[] {
  const stos = e instanceof Error && typeof e.stack === 'string' ? e.stack : '';
  // Tylko linie stosu („at …”, Hermes): dalsze linie wieloliniowego komunikatu mogą nieść dane osoby (przegląd p3a, M1-058).
  return stos.split('\n').slice(1).filter((l) => /^\s*at\s/.test(l)).flatMap((l) => {
    const m = /([^\s/()]+):(\d+):(\d+)\)?\s*$/.exec(l);
    return m ? [`${m[1]}:${m[2]}:${m[3]}`] : [];
  }).slice(0, MAKS_RAMEK);
}

export function zainstalujObslugeBledow(rn: ObslugaBledowRN): { ustawZapis(z: ((w: WpisBledu) => Promise<void>) | null): void } {
  const poprzedni = rn.getGlobalHandler();
  let zapis: ((w: WpisBledu) => Promise<void>) | null = null;
  let zapisanoNiefatalny = false;
  rn.setGlobalHandler((e, fatal) => {
    try {
      const f = fatal === true;
      if (zapis && (f || !zapisanoNiefatalny)) {
        if (!f) zapisanoNiefatalny = true;
        void zapis({ kod: `js_${nazwa(e)}`, szczegoly: { ramki: ramki(e), fatal: f } }).catch(() => undefined); // przy awarii zapis może nie zdążyć (ryzyko nazwane, ADR-0018)
      }
    } finally {
      poprzedni(e, fatal);
    }
  });
  return { ustawZapis: (z) => { zapis = z; } };
}
