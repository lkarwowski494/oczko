/* PU-191 (docs/jakosc/przypadki-uzycia.md, T-136): „aplikacja bez reklam, śledzenia, kont i awarii” — część zależnościowa (BX9, P-892).
 * Zależności (package.json) i konfiguracja (app.json) nie zawierają SDK reklam, analityki/śledzenia, zgłaszania awarii do usługi zewnętrznej ani logowania do kont
 * i nie deklarują prośby o śledzenie (ATT: NSUserTrackingUsageDescription, expo-tracking-transparency). Część widoczna (brak prośby o konto i ekranu awarii na głównych ekranach):
 * e2e/scenariusze/106-…yaml (oczekujący). Pułapka: ta sama kontrola czerwienieje na zależnościach z SDK reklam i ATT. */
import * as fs from 'fs';
import * as path from 'path';

const root = path.join(__dirname, '..', '..');
const ZAKAZANE = /(admob|google-mobile-ads|applovin|ironsource|unity-ads|react-native-ads|facebook|fbsdk|appsflyer|adjust|branch|amplitude|mixpanel|segment|firebase|sentry|bugsnag|crashlytics|datadog|posthog|onesignal|tracking-transparency|apple-authentication|google-signin|auth0|expo-auth-session)/i;

export function naruszenia(pkg: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> }, app: { expo?: { plugins?: unknown[]; ios?: { infoPlist?: Record<string, unknown> } } }): string[] {
  const out: string[] = [];
  for (const nazwa of Object.keys({ ...pkg.dependencies })) if (ZAKAZANE.test(nazwa)) out.push(`zależność „${nazwa}” (SDK reklam, śledzenia, awarii albo kont)`);
  for (const p of app.expo?.plugins ?? []) { const n = Array.isArray(p) ? String(p[0]) : String(p); if (ZAKAZANE.test(n)) out.push(`plugin „${n}” w app.json`); }
  if (app.expo?.ios?.infoPlist && 'NSUserTrackingUsageDescription' in app.expo.ios.infoPlist) out.push('NSUserTrackingUsageDescription w app.json (prośba o śledzenie)');
  return out;
}

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const app = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));

describe('PU-191 · zależności bez reklam, śledzenia, awarii do usługi i kont', () => {
  test('package.json i app.json nie zawierają SDK reklam, analityki, awarii, kont ani prośby ATT', () => {
    expect(Object.keys(pkg.dependencies ?? {}).length).toBeGreaterThan(10); // pusta lista zależności to błąd testu, nie sukces
    expect(naruszenia(pkg, app)).toEqual([]);
  });
  test('pułapka: kontrola wykrywa SDK reklam, śledzenie, awarie, konta i prośbę ATT', () => {
    const zle = naruszenia(
      { dependencies: { 'react-native-google-mobile-ads': '1', 'expo-tracking-transparency': '1', '@sentry/react-native': '1', 'expo-apple-authentication': '1', expo: '1' } },
      { expo: { plugins: [['expo-tracking-transparency', {}]], ios: { infoPlist: { NSUserTrackingUsageDescription: 'x' } } } },
    );
    expect(zle.length).toBe(6);
    expect(zle.some((x) => /NSUserTrackingUsageDescription/.test(x))).toBe(true);
  });
});
