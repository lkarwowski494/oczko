// Formaty z Intl według języka aplikacji i preferencji urządzenia (ADR-0017). Bez własnego sklejania separatorów.
export type UkladMiar = 'metric' | 'imperial';
export type PreferencjaMiar = 'auto' | UkladMiar;

export function formatujLiczbe(n: number, jezyk: string, opcje: { maks?: number } = {}): string {
  return new Intl.NumberFormat(jezyk, opcje.maks === undefined ? undefined : { maximumFractionDigits: opcje.maks }).format(n);
}

export function formatujGodzine(d: Date, jezyk: string, opcje: { uses24h: boolean; strefa?: string }): string {
  return new Intl.DateTimeFormat(jezyk, { hour: 'numeric', minute: '2-digit', hour12: !opcje.uses24h, timeZone: opcje.strefa }).format(d);
}

/** Data lokalna w strefie urządzenia (RD-16), w formacie języka. */
export function formatujDate(d: Date, jezyk: string, opcje: { strefa?: string } = {}): string {
  return new Intl.DateTimeFormat(jezyk, { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: opcje.strefa }).format(d);
}

/** `systemowy` to `measurementSystem` z expo-localization (null na web). Nieznana preferencja = auto. */
export function ukladMiar(preferencja: PreferencjaMiar, systemowy: 'metric' | 'us' | 'uk' | null): UkladMiar {
  if (preferencja === 'metric' || preferencja === 'imperial') return preferencja;
  return systemowy === 'us' || systemowy === 'uk' ? 'imperial' : 'metric';
}

/**
 * Wpis liczby nieujemnej w polu bez separatora tysięcy (P-097 (5a), DEC-12 a): cyfry ASCII i jeden separator dziesiętny, którym jest „,” albo „.” (też
 * separator języka z CLDR przez Intl.NumberFormat, gdyby był inny). Grupowanie tysięcy jest tu odrzucane, więc oba znaki są jednoznaczne; dzięki temu
 * telefon w języku en z regionem PL przyjmie „3,5”, a w pl „3.5”. Bez znaku i bez dwóch separatorów. Zapis niezgodny albo pusty = null (pole odrzuca
 * wpis). Cyfry regionu: wszystkie 35 lokalizacji (D-026) piszą cyframi ASCII.
 */
export function parsujLiczbe(tekst: string, jezyk: string): number | null {
  // Separator języka z `format(1.5)` (znaki między „1” a „5”), nie z formatToParts — Hermes na iOS go nie ma (P-255 (b); hermes doc/IntlAPIs.md
  // „Supported on Android only”, PlatformIntlApple.mm „formatToParts is unimplemented on Apple platforms”; odczyt 2026-10-27).
  const sep = /1(\D+)5/.exec(new Intl.NumberFormat(jezyk, { useGrouping: false }).format(1.5))?.[1] ?? '.';
  const t = tekst.trim();
  const czesci = t.split(new RegExp(`[.,]|${sep.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
  const [cale, ulamek, ...reszta] = czesci;
  if (reszta.length > 0 || !/^\d*$/.test(cale ?? '') || (ulamek !== undefined && !/^\d*$/.test(ulamek)) || (cale ?? '') + (ulamek ?? '') === '') return null;
  return Number(`${cale || '0'}.${ulamek ?? ''}`.replace(/\.$/, ''));
}

/**
 * Wpis liczby całkowitej ≥ 0 w zapisie regionu (BR-LIC-017, ER-43, S-40): cyfry ASCII albo cyfry regionu (np. ar-EG), opcjonalnie z separatorem tysięcy języka
 * (pl: spacja zwykła, nierozdzielająca albo wąska; de: kropka; en: przecinek). Separator dziesiętny, znak, pusty zapis i grupy w złych miejscach = null
 * (aplikacja nie zgaduje „1000” z „1,000” w pl). Wynik poza zakresem liczb całkowitych bezpiecznych w JS = null.
 */
export function parsujCalkowita(tekst: string, jezyk: string): number | null {
  const cyfry = new Map<string, string>();
  const f = new Intl.NumberFormat(jezyk, { useGrouping: false });
  for (let d = 0; d <= 9; d++) cyfry.set(f.format(d), String(d));
  const doAscii = (x: string) => Array.from(x, (c) => cyfry.get(c) ?? c).join('');
  const t = doAscii(tekst.trim());
  if (/^\d+$/.test(t)) return Number.isSafeInteger(Number(t)) ? Number(t) : null;
  const sep = /^1(\D+)234/.exec(doAscii(new Intl.NumberFormat(jezyk).format(1234567)))?.[1];
  if (sep === undefined) return null;
  const grupa = /^\s$/.test(sep) ? '\\s' : sep.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (!new RegExp(`^\\d{1,3}(?:${grupa}\\d{2,3})+$`).test(t)) return null;
  const n = Number(t.replace(new RegExp(grupa, 'g'), ''));
  return Number.isSafeInteger(n) ? n : null;
}
