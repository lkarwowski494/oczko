// Zaślepka roli 07 (E3, testy przed kodem): ciało każdej funkcji bez implementacji rzuca jawny znacznik z ID kryterium.
// Rola 08 zamienia znacznik na najprostszy wynik zgodny z typem, widzi czerwień na asercji, potem implementuje (docs/jakosc/strategia.md §6).
export function niezaimplementowane(id: string): never {
  throw new Error(`NIEZAIMPLEMENTOWANE: ${id}`);
}
