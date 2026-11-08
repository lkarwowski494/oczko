// Cel watch (@bacons/apple-targets 5.0.0, ADR-0007, ADR-0009, F-12): licznik na zegarku z +1/−1 także bez telefonu (P-039),
// stan z kontekstu telefonu, zdarzenia przez transferUserInfo. Barwy = tokeny Dzianiny z docs/design/tokeny.json (zasada 15);
// nazwa barwy w katalogu zasobów = nazwa tokenu. Test: tests/wydanie/barwy-celow-tokeny.test.ts.
const tokeny = require('../../docs/design/tokeny.json');
const czarny = (n) => ({ light: tokeny.kolory.systemCzarny[n], dark: tokeny.kolory.systemCzarny[n] }); // zegarek: zawsze czarne tło systemu

/** @type {import('@bacons/apple-targets/app.plugin').Config} */
module.exports = {
  type: 'watch',
  name: 'OczkoZegarek',
  displayName: 'Oczko',
  bundleIdentifier: '.watchkitapp',
  deploymentTarget: '11.0', // ADR-0006
  icon: '../../assets/watch.png', // P-407: ikona zegarka z projektu 04 (Dzianina; design-spec „Ikona i ekran startowy”), 1088 × 1088, te same bajty co docs/design/ikona/watch.png
  frameworks: ['SwiftUI', 'WatchConnectivity', 'StoreKit', 'WatchKit'],
  colors: {
    $accent: czarny('tekst'),
    tekst: czarny('tekst'),
    tekst2: czarny('tekst2'),
    przycisk: czarny('przycisk'),
    // pas przypomnienia (RD-13, P-158): znacznik `akcent` na `powierzchnia`, tekst `tekst`; tło pasa = `systemCzarny.pasPrzypomnienia` (P-579, M3-MAK-04)
    akcent: czarny('akcent'),
    powierzchnia: czarny('pasPrzypomnienia'),
  },
};
