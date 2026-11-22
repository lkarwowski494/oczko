// Adres strony wzoru (F-55, BR-WZR-007; design-spec W7a `wzor.link_blad`): tylko http(s) z hostem — inne schematy (file:, javascript:)
// nie trafiają do konwersji ani do bazy. Wspólne dla arkusza linku i `dodajWzor`.
export function adresStrony(adres: string): string | null {
  const a = adres.trim();
  if (!/^https?:\/\/[^\s/?#]+[^\s]*$/i.test(a)) return null;
  return a;
}
