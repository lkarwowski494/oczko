// Nazwa kopii projektu z „Make another like this” (M1-audytor-generalny-136, 04-studio-projektowe-526, DEC-35 b; design-spec „Aneks M2 partia 3c1”).
// Szablon `projekt.kopia_nazwa` (en „{{nazwa}} {{n}}”) przychodzi z kompozycji — domena bez i18n. Baza = nazwa oryginału bez końcowego numeru kopii
// (liczba całkowita 1–999 w miejscu {{n}}; większa należy do nazwy, np. rok); n = najmniejsza liczba ≥ 2, dla której gotowa nazwa nie jest zajęta
// przez żaden projekt z nazwą (także ukończony i w „Recently deleted”); porównanie bez wielkości liter i spacji na końcach.

const NUMER_MAKS = 999;
const ucieknij = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wypelnij = (szablon: string, nazwa: string, n: number): string => szablon.split('{{nazwa}}').join(nazwa).split('{{n}}').join(String(n));
const klucz = (s: string): string => s.trim().toLowerCase();

/** Szablon bez dokładnie jednego {{nazwa}} i jednego {{n}} (zepsuty przekład) → null: kopia bez numeru, jak przed DEC-35 b. */
function wzorSzablonu(szablon: string): RegExp | null {
  if (szablon.split('{{nazwa}}').length !== 2 || szablon.split('{{n}}').length !== 2) return null;
  const czesci = szablon.split(/(\{\{nazwa\}\}|\{\{n\}\})/).map((c) => (c === '{{nazwa}}' ? '(?<nazwa>.+?)' : c === '{{n}}' ? '(?<n>[1-9]\\d{0,2})' : ucieknij(c)));
  return new RegExp(`^${czesci.join('')}$`, 'u');
}

export function nazwaKopii(oryginal: string, zajete: readonly string[], szablon: string): string {
  const nazwa = oryginal.trim();
  const wzor = wzorSzablonu(szablon);
  if (!wzor) return nazwa;
  const m = wzor.exec(nazwa);
  const n0 = m?.groups?.n === undefined ? NaN : Number(m.groups.n);
  const baza = m?.groups?.nazwa && n0 >= 1 && n0 <= NUMER_MAKS ? m.groups.nazwa.trim() : nazwa;
  const uzyte = new Set(zajete.map(klucz));
  for (let n = 2; ; n++) {
    const kandydat = wypelnij(szablon, baza, n);
    if (!uzyte.has(klucz(kandydat))) return kandydat;
  }
}
