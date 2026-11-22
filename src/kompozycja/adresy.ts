// Adresy zewnętrzne ekranów (KP-04, BR-ZAK-004, BR-DAN-012/S3). Polityka prywatności według analogii z Treningiem (P-087: Trening
// `https://apps4brew.com/trening/privacy.html`); strona Oczka opublikowana pod apps4brew.com/oczko/ (P-239). Terms of Use = standardowa EULA Apple.
// Recenzja: strona App Store z action=write-review — Apple ID 6823678721 (App Store Connect → App Information, właściciel 2026-11-04, P-533).
export const ADRESY = {
  polityka: 'https://apps4brew.com/oczko/privacy.html', // P-239; baza w docs/wydanie/adres-strony.json
  wsparcie: 'https://apps4brew.com/oczko/support.html', // DEC-22 a (M1-audytor-generalny-061): wiersz „Help” w Ustawieniach; baza + wsparcie z docs/wydanie/adres-strony.json
  warunki: 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/',
  recenzja: 'https://apps.apple.com/app/id6823678721?action=write-review', // Apple ID z App Store Connect (właściciel 2026-11-04, P-533)
} as const;
/** Adres kontaktu na ekranie „Report a problem” (M1-audytor-generalny-057): ten sam co mailto na stronie wsparcia i w polityce (site/support.html, site/privacy.html; test zglos-kontakt-057). */
export const ADRES_WSPARCIA = 'support@apps4brew.com';
/** Family Sharing (P-038): włączone w App Store Connect dla trzech produktów (P-495, P-536), więc kafel „Dla rodziny” na ekranie Oczko Pro się pokazuje (P-561, 02-monetyzacja-002). Flaga zostaje na wypadek produktu bez Family Sharing (P-089 (2)). */
export const FAMILY_SHARING = true;
