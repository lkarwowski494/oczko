// Cel watch (@bacons/apple-targets 5.0.0, ADR-0007, ADR-0009, F-12): licznik na zegarku z +1/−1 także bez telefonu (P-039),
// stan z kontekstu telefonu, zdarzenia przez transferUserInfo. Kolory = tokeny docs/design/tokeny.json (zasada 15).
const tokeny = require('../../docs/design/tokeny.json');
const kolor = (n) => ({ light: tokeny.kolor.ciemny[n], dark: tokeny.kolor.ciemny[n] }); // zegarek: zawsze ciemne tło systemu

/** @type {import('@bacons/apple-targets/app.plugin').Config} */
module.exports = {
  type: 'watch',
  name: 'OczkoZegarek',
  displayName: 'Oczko',
  bundleIdentifier: '.watchkitapp',
  deploymentTarget: '11.0', // ADR-0006
  icon: '../../assets/watch.png', // P-407: ikona zegarka z projektu 04 (design-spec „Ikona: wpisy konfiguracji”), 1088 × 1088
  frameworks: ['SwiftUI', 'WatchConnectivity', 'StoreKit', 'WatchKit'],
  colors: {
    $accent: kolor('grafit'), grafit: kolor('grafit'), olowek: kolor('olowek'), przyciskTlo: kolor('przyciskTlo'),
    zakreslacz: kolor('zakreslacz'), tekstNaZakreslaczu: kolor('tekstNaZakreslaczu'), zakreslaczKrawedz: kolor('zakreslaczKrawedz'), // pas przypomnienia (RD-13, P-158)
  },
};
