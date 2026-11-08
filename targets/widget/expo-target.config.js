// Cel widget (@bacons/apple-targets 5.0.0, ADR-0007): Live Activity sesji z +1/−1 z ekranu blokady (F-11, F-21; ADR-0008).
// Barwy = tokeny Dzianiny (kolory.jasny / kolory.ciemny / kolory.systemCzarny z docs/design/tokeny.json; zasada 15: wygląd tylko z systemu 04), czytane z pliku,
// nie przepisane. Nazwa barwy w katalogu zasobów = nazwa tokenu (mapa: docs/design/dzianina/mapa-tokenow.md). Test: tests/wydanie/barwy-celow-tokeny.test.ts.
const tokeny = require('../../docs/design/tokeny.json');
const kolor = (n) => ({ light: tokeny.kolory.jasny[n], dark: tokeny.kolory.ciemny[n] });
const ciemna = (n) => ({ light: tokeny.kolory.ciemny[n], dark: tokeny.kolory.ciemny[n] }); // rozwinięta Dynamic Island: tło zawsze czarne
const czarny = (n) => ({ light: tokeny.kolory.systemCzarny[n], dark: tokeny.kolory.systemCzarny[n] });

/** @type {import('@bacons/apple-targets/app.plugin').Config} */
module.exports = {
  type: 'widget',
  name: 'OczkoWidget',
  displayName: 'Oczko',
  bundleIdentifier: '.widget',
  deploymentTarget: '18.0', // ADR-0006
  frameworks: ['SwiftUI', 'WidgetKit', 'ActivityKit', 'AppIntents'],
  colors: {
    $accent: kolor('tekst'),
    tlo: kolor('tlo'),
    tekst: kolor('tekst'),
    tekst2: kolor('tekst2'),
    przycisk: kolor('przycisk'),
    przyciskTekst: kolor('przyciskTekst'),
    // pas przypomnienia (RD-13, P-158): znacznik `akcent` na `powierzchnia`, tekst `tekst` (mapa-tokenow: zakreslacz → akcent)
    powierzchnia: kolor('powierzchnia'),
    akcent: kolor('akcent'),
    // rozwinięta Dynamic Island: systemCzarny nie ma tła pasa, więc ciemna powierzchnia (zgłoszenie do 04)
    wyspaPowierzchnia: ciemna('powierzchnia'),
    wyspaTekst: czarny('tekst'),
    wyspaAkcent: czarny('akcent'),
  },
};
