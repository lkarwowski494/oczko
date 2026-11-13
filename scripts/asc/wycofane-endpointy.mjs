// Wycofane zasoby App Store Connect API dla IAP i subskrypcji (KO-056, sesja BG, 2026-11-13). Jedno źródło dla klienta (makeClient odmawia wywołania)
// i kontroli repo (scripts/asc/kontrola-wycofane.mjs w `npm run jakosc:kontrole`).
// Źródło Apple (odczyt 2026-11-13, surowy JSON strony dokumentacji):
//   https://developer.apple.com/tutorials/data/documentation/appstoreconnectapi/migrating-in-app-purchase-metadata-to-v2.json — tabele „Endpoint mapping”
//   („Each deprecated v1 endpoint has a v2 equivalent that targets a version”) i lista odczytów zagnieżdżonych „deprecated in the same window”.
// Wzorce są bez kotwic: pasują zarówno do ścieżki żądania (klient dodaje ^), jak i do tekstu źródła (kontrola repo).
// Tego pliku kontrola repo nie skanuje (zawiera wzorce); lista pochodzi z inwentarza docs/wydanie/asc-v2/inwentarz.md.
export const WYCOFANE = [
  { re: /\/v1\/(subscriptionGroupLocalizations|subscriptionLocalizations|inAppPurchaseLocalizations)(\/|\b)/, zastepstwo: '/v2/<…>Localizations z relacją `version`' },
  { re: /\/v1\/(inAppPurchaseImages|subscriptionImages)(\/|\b)/, zastepstwo: '/v2/<…>Images z relacją `version`' },
  { re: /\/v1\/(inAppPurchaseSubmissions|subscriptionSubmissions|subscriptionGroupSubmissions)(\/|\b)/, zastepstwo: '/v1/reviewSubmissions + /v1/reviewSubmissionItems z wersją' },
  { re: /\/v1\/subscriptionGroups\/[^/]+\/(relationships\/)?subscriptionGroupLocalizations/, zastepstwo: '/v1/subscriptionGroupVersions/{id}/localizations' },
  { re: /\/v1\/subscriptions\/[^/]+\/(relationships\/)?(subscriptionLocalizations|images)/, zastepstwo: '/v1/subscriptionVersions/{id}/localizations (images)' },
  { re: /\/v2\/inAppPurchases\/[^/]+\/(relationships\/)?(inAppPurchaseLocalizations|images)/, zastepstwo: '/v1/inAppPurchaseVersions/{id}/localizations (images)' },
];
/** Zwraca wiersz z WYCOFANE dla ścieżki żądania (bez zapytania) albo null. */
export const wycofany = path => WYCOFANE.find(w => new RegExp('^' + w.re.source).test(path)) ?? null;
