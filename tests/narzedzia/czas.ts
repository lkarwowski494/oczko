// Narzędzia czasu dla testów (strategia DS-09): przesunięcie strefy i przejścia czasu wyliczane z bazy IANA przez Intl,
// nigdy wpisane datami. Przeniesienie 1:1 wzorca roli 07 (TypeScript); test: tests/narzedzia/czas.test.ts.

export type PrzejscieCzasu = { utc: string; przedMin: number; poMin: number };

const formaty = new Map<string, Intl.DateTimeFormat>();

/** Przesunięcie strefy względem UTC w minutach w chwili `ms` (dodatnie na wschód od Greenwich). */
export function przesuniecieMin(strefa: string, ms: number): number {
  let f = formaty.get(strefa);
  if (!f)
    formaty.set(
      strefa,
      (f = new Intl.DateTimeFormat('en-US', {
        timeZone: strefa,
        hourCycle: 'h23',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
      })),
    );
  const c = Object.fromEntries(f.formatToParts(new Date(ms)).map((p) => [p.type, Number(p.value)])) as Record<string, number>;
  return Math.round((Date.UTC(c.year, c.month - 1, c.day, c.hour, c.minute, c.second) - Math.floor(ms / 1000) * 1000) / 60000);
}

/** Wszystkie przejścia czasu strefy w roku `rok` (UTC): pierwsza minuta z nowym przesunięciem i przesunięcia przed/po. */
export function przejsciaCzasu(strefa: string, rok: number): PrzejscieCzasu[] {
  const H = 3600000;
  const wynik: PrzejscieCzasu[] = [];
  for (let t = Date.UTC(rok, 0, 1); t < Date.UTC(rok + 1, 0, 1); t += H) {
    const a = przesuniecieMin(strefa, t),
      b = przesuniecieMin(strefa, t + H);
    if (a === b) continue;
    let lo = t,
      hi = t + H;
    while (hi - lo > 60000) {
      const m = lo + Math.floor((hi - lo) / 120000) * 60000;
      if (przesuniecieMin(strefa, m) === a) lo = m;
      else hi = m;
    }
    wynik.push({ utc: new Date(hi).toISOString(), przedMin: a, poMin: b });
  }
  return wynik;
}
