/* PU-191 (docs/jakosc/przypadki-uzycia.md, T-136): „aplikacja bez reklam, śledzenia, kont i awarii” — część zależnościowa (BX9, P-892).
 * Zależności (package.json) i konfiguracja (app.json) nie zawierają SDK reklam, analityki/śledzenia, zgłaszania awarii do usługi zewnętrznej ani logowania do kont
 * i nie deklarują prośby o śledzenie (ATT: NSUserTrackingUsageDescription, expo-tracking-transparency). Część widoczna (brak prośby o konto i ekranu awarii na głównych ekranach):
 * e2e/scenariusze/106-…yaml (oczekujący). Pułapka: ta sama kontrola czerwienieje na zależnościach z SDK reklam i ATT. */
import * as fs from 'fs';
import * as path from 'path';

const root = path.join(__dirname, '..', '..');
// Druga bariera (BX11, P-913): nazwy znanych SDK, błędne także wtedy, gdy ktoś dopisze je do listy dozwolonych. `segment` zawężone do SDK Segment (kontrolka „segmented-control” nie jest fałszywym alarmem).
const ZAKAZANE = /(admob|google-mobile-ads|applovin|ironsource|unity-ads|react-native-ads|facebook|fbsdk|appsflyer|adjust|branch|amplitude|mixpanel|@segment\/|analytics-next|firebase|sentry|bugsnag|crashlytics|datadog|posthog|onesignal|tracking-transparency|apple-authentication|google-signin|auth0|expo-auth-session)/i;
const ID_DECYZJI = /\b(?:P|D|KO)-\d{3,4}\b|\bADR-\d{4}\b/;

/**
 * Naruszenia PU-191 (BX11 / P-913). `dozwolone` = lista bezpośrednich zależności z ID decyzji (bez niej kontrola listy jest pominięta — stare wywołania), `plisty` = treść plików `Info.plist` z katalogów celów (targets/<cel>/Info.plist).
 */
export function naruszenia(
  pkg: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> },
  app: { expo?: { plugins?: unknown[]; ios?: { infoPlist?: Record<string, unknown>; privacyManifests?: { NSPrivacyTracking?: unknown; NSPrivacyTrackingDomains?: unknown } } } },
  plisty: Record<string, string> = {},
  dozwolone?: Record<string, string>,
): string[] {
  const out: string[] = [];
  for (const nazwa of Object.keys({ ...pkg.dependencies })) {
    if (ZAKAZANE.test(nazwa)) out.push(`zależność „${nazwa}” (SDK reklam, śledzenia, awarii albo kont)`);
    if (dozwolone === undefined) continue;
    const powod = dozwolone[nazwa];
    if (powod === undefined) out.push(`zależność „${nazwa}” spoza listy dozwolonych (tests/jakosc/pu-191-dozwolone-zaleznosci.json; wpis wymaga ID decyzji)`);
    else if (!ID_DECYZJI.test(powod)) out.push(`wpis „${nazwa}” na liście dozwolonych bez ID decyzji (P-nnn, D-nnn, KO-nnn albo ADR-nnnn)`);
  }
  for (const p of app.expo?.plugins ?? []) { const n = Array.isArray(p) ? String(p[0]) : String(p); if (ZAKAZANE.test(n)) out.push(`plugin „${n}” w app.json`); }
  if (app.expo?.ios?.infoPlist && 'NSUserTrackingUsageDescription' in app.expo.ios.infoPlist) out.push('NSUserTrackingUsageDescription w app.json (prośba o śledzenie)');
  for (const [plik, tresc] of Object.entries(plisty)) if (tresc.includes('NSUserTrackingUsageDescription')) out.push(`NSUserTrackingUsageDescription w ${plik} (prośba o śledzenie)`);
  const pm = app.expo?.ios?.privacyManifests;
  if (pm?.NSPrivacyTracking !== false) out.push('app.json: ios.privacyManifests.NSPrivacyTracking ma być jawnie false');
  if (Array.isArray(pm?.NSPrivacyTrackingDomains) ? pm.NSPrivacyTrackingDomains.length > 0 : pm?.NSPrivacyTrackingDomains !== undefined) out.push('app.json: ios.privacyManifests.NSPrivacyTrackingDomains ma być pustą listą');
  return out;
}

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const app = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));

// --- BX11 zad. 2 / CH-03 (P-913): lista dozwolonych zależności i kontrola deklaracji śledzenia (czerwień przed kodem: dowód w docs/jakosc/bx11-dowod-czerwony.txt) ---
const dozwolone: Record<string, string> = Object.fromEntries(Object.entries(JSON.parse(fs.readFileSync(path.join(__dirname, 'pu-191-dozwolone-zaleznosci.json'), 'utf8')) as Record<string, string>).filter(([k]) => !k.startsWith('_')));
const plistyRepo = (): Record<string, string> => {
  const out: Record<string, string> = {};
  const cele = path.join(root, 'targets');
  for (const d of fs.readdirSync(cele)) { const f = path.join(cele, d, 'Info.plist'); if (fs.existsSync(f)) out[`targets/${d}/Info.plist`] = fs.readFileSync(f, 'utf8'); }
  return out;
};
const czyste = { dependencies: { expo: '1', 'expo-sqlite': '1' } };
const appCzysta = { expo: { ios: { privacyManifests: { NSPrivacyTracking: false, NSPrivacyTrackingDomains: [] as string[] } } } };
const ZNANE = { expo: 'P-913 test', 'expo-sqlite': 'P-913 test', 'zgodna-z-lista': 'D-001 test' };

describe('CH-03 · lista dozwolonych zależności i deklaracje śledzenia', () => {
  test('repo: każda bezpośrednia zależność jest na liście z ID decyzji, brak deklaracji śledzenia w app.json i Info.plist celów', () => {
    const plisty = plistyRepo();
    expect(Object.keys(plisty).length).toBeGreaterThan(0); // brak plików to błąd testu, nie sukces
    expect(Object.keys(dozwolone).length).toBeGreaterThan(10);
    expect(naruszenia(pkg, app, plisty, dozwolone)).toEqual([]);
  });
  test.each([
    ['react-native-fbads (Meta Audience Network)', { dependencies: { ...czyste.dependencies, 'react-native-fbads': '1' } }, appCzysta, {}],
    ['expo-insights (analityka użycia EAS)', { dependencies: { ...czyste.dependencies, 'expo-insights': '1' } }, appCzysta, {}],
    ['@microsoft/react-native-clarity (nagrywanie sesji)', { dependencies: { ...czyste.dependencies, '@microsoft/react-native-clarity': '1' } }, appCzysta, {}],
    ['NSPrivacyTracking: true w app.json', czyste, { expo: { ios: { privacyManifests: { NSPrivacyTracking: true, NSPrivacyTrackingDomains: [] } } } }, {}],
    ['domeny śledzenia w privacyManifests', czyste, { expo: { ios: { privacyManifests: { NSPrivacyTracking: false, NSPrivacyTrackingDomains: ['track.example.com'] } } } }, {}],
    ['NSUserTrackingUsageDescription w Info.plist rozszerzenia', czyste, appCzysta, { 'targets/share/Info.plist': '<plist><dict><key>NSUserTrackingUsageDescription</key><string>x</string></dict></plist>' }],
  ])('wykrywa: %s', (_nazwa, p, a, plisty) => {
    expect(naruszenia(p, a, plisty, ZNANE).length).toBeGreaterThan(0);
  });
  test('brak NSPrivacyTracking w app.json też jest naruszeniem (deklaracja ma być jawna: false)', () => {
    expect(naruszenia(czyste, { expo: { ios: {} } }, {}, ZNANE).length).toBeGreaterThan(0);
  });
  test('zależność na liście bez ID decyzji w uzasadnieniu jest naruszeniem', () => {
    expect(naruszenia(czyste, appCzysta, {}, { ...ZNANE, 'expo-sqlite': 'bez numeru' }).length).toBeGreaterThan(0);
  });
  test('zależność znana z listą i ID przechodzi; nazwa z „segment” w środku (kontrolka interfejsu) nie jest fałszywym alarmem', () => {
    const p = { dependencies: { ...czyste.dependencies, '@react-native-segmented-control/segmented-control': '1', 'zgodna-z-lista': '1' } };
    expect(naruszenia(p, appCzysta, {}, { ...ZNANE, '@react-native-segmented-control/segmented-control': 'D-001 test' })).toEqual([]);
  });
  test('SDK reklam jest naruszeniem także wtedy, gdy ktoś dopisze je do listy (druga bariera: nazwy znanych SDK)', () => {
    expect(naruszenia({ dependencies: { ...czyste.dependencies, 'react-native-google-mobile-ads': '1' } }, appCzysta, {}, { ...ZNANE, 'react-native-google-mobile-ads': 'D-001 test' }).length).toBeGreaterThan(0);
  });
});

describe('PU-191 · zależności bez reklam, śledzenia, awarii do usługi i kont', () => {
  test('package.json i app.json nie zawierają SDK reklam, analityki, awarii, kont ani prośby ATT', () => {
    expect(Object.keys(pkg.dependencies ?? {}).length).toBeGreaterThan(10); // pusta lista zależności to błąd testu, nie sukces
    expect(naruszenia(pkg, app)).toEqual([]);
  });
  test('pułapka: kontrola wykrywa SDK reklam, śledzenie, awarie, konta i prośbę ATT', () => {
    const zle = naruszenia(
      { dependencies: { 'react-native-google-mobile-ads': '1', 'expo-tracking-transparency': '1', '@sentry/react-native': '1', 'expo-apple-authentication': '1', expo: '1' } },
      { expo: { plugins: [['expo-tracking-transparency', {}]], ios: { infoPlist: { NSUserTrackingUsageDescription: 'x' }, privacyManifests: { NSPrivacyTracking: false, NSPrivacyTrackingDomains: [] } } } }, // BX11: jawne privacyManifests (CH-03), żeby liczba naruszeń zostawała 6
    );
    expect(zle.length).toBe(6);
    expect(zle.some((x) => /NSUserTrackingUsageDescription/.test(x))).toBe(true);
  });
});
