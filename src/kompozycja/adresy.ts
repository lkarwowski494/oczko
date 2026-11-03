// Adresy zewnętrzne ekranów (KP-04, BR-ZAK-004, BR-DAN-012/S3). Polityka prywatności według analogii z Treningiem (P-087: Trening
// `https://apps4brew.com/trening/privacy.html`); strona Oczka opublikowana pod apps4brew.com/oczko/ (P-239). Terms of Use = standardowa EULA Apple.
// Recenzja: strona App Store z action=write-review — [DO USTALENIA: identyfikator aplikacji w App Store Connect (OP-24)].
export const ADRESY = {
  polityka: 'https://apps4brew.com/oczko/privacy.html', // P-239; baza w docs/wydanie/adres-strony.json
  warunki: 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/',
  recenzja: 'https://apps.apple.com/app/id0000000000?action=write-review',
} as const;
/** Adres kontaktu na ekranie „Report a problem” (M1-audytor-generalny-057): ten sam co mailto na stronie wsparcia i w polityce (site/support.html, site/privacy.html; test zglos-kontakt-057). */
export const ADRES_WSPARCIA = 'support@apps4brew.com';
/** Family Sharing (P-038): kierunek „włączamy”, włączenie w App Store Connect przy konfiguracji — do tego czasu zdanie o rodzinie się nie pokazuje (P-089 (2)). */
export const FAMILY_SHARING = false;
