// Cel share (@bacons/apple-targets 5.0.0, ADR-0011 uzupełnienie fix-7; moduly.md „Kontrakt partii 6”, cel targets/share): „Udostępnij do Oczka”
// kopiuje plik albo link do skrzynki importu w App Group; nie otwiera bazy, nie dekoduje pliku. Reguła aktywacji (bez TRUEPREDICATE) w Info.plist
// (biblioteka zapisuje domyślny Info.plist tylko, gdy go nie ma). Barwy = tokeny Dzianiny z docs/design/tokeny.json (zasada 15); nazwa barwy = nazwa tokenu. Test: tests/wydanie/barwy-celow-tokeny.test.ts.
// P-234: klucz `entitlements` z App Group jawnie — testflight.yml podpisuje każdy .appex plikiem uprawnień jego celu (uprawnienia-celow.mjs);
// bez klucza rozszerzenie dostałoby podpis bez grupy i nie zapisałoby do skrzynki.
const tokeny = require('../../docs/design/tokeny.json');
const kolor = (n) => ({ light: tokeny.kolory.jasny[n], dark: tokeny.kolory.ciemny[n] });

/** @type {import('@bacons/apple-targets/app.plugin').Config} */
module.exports = {
  type: 'share',
  name: 'OczkoUdostepnij',
  displayName: 'Oczko',
  bundleIdentifier: '.share',
  deploymentTarget: '18.0', // ADR-0006
  frameworks: ['SwiftUI', 'UniformTypeIdentifiers'],
  entitlements: { 'com.apple.security.application-groups': ['group.com.apps4brew.knitting'] },
  colors: {
    $accent: kolor('tekst'),
    tekst: kolor('tekst'),
    tekst2: kolor('tekst2'),
  },
};
