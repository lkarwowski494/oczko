/* Kruche asercje scenariuszy E2E (raport E2, przebieg 135, 2026-11-02: scenariusze 39 i 43 padły na tekście, nie na zachowaniu aplikacji).
 * Reguła: asercja tekstu zależnego od języka aplikacji bierze wzorzec ze słownika aplikacji (wyrocznia = plik słownika, nie zapis w scenariuszu),
 * a asercja arkusza systemowego iOS nie opiera się na nazwach akcji, które system zmienia między wersjami i stanami symulatora.
 * Dlaczego: scenariusz 39 czekał na „Polski, selected”, gdy słownik pl dał „Polski, wybrano” (przebieg 135, job 125016939..., krok 36),
 * a scenariusz 43 na „Save Image”, którego nie było w widocznym rzędzie akcji arkusza iOS 26.6 (krok 49). */
import * as fs from 'fs';
import * as path from 'path';
import { wczytaj, pasuje } from './maestro-runner';

const root = path.join(__dirname, '..', '..');
const KAT = path.join(root, 'e2e/scenariusze');

type Asercja = { id?: string; text?: string };
/** Wszystkie asercje widoczności (assertVisible i extendedWaitUntil.visible) w scenariuszu, także zagnieżdżone w retry/runFlow. */
function asercje(wezel: unknown, wynik: Asercja[] = []): Asercja[] {
  if (Array.isArray(wezel)) { for (const x of wezel) asercje(x, wynik); return wynik; }
  if (wezel && typeof wezel === 'object') {
    for (const [k, v] of Object.entries(wezel as Record<string, unknown>)) {
      const widoczny = k === 'assertVisible' ? v : k === 'extendedWaitUntil' ? (v as { visible?: unknown })?.visible : undefined;
      if (widoczny !== undefined) wynik.push(typeof widoczny === 'string' ? { text: widoczny } : (widoczny as Asercja));
      else asercje(v, wynik);
    }
  }
  return wynik;
}
const scen = (plik: string) => asercje(wczytaj(path.join(KAT, plik)).polecenia);

/** Nazwy akcji arkusza udostępniania iOS, których obecność w widocznym rzędzie zależy od wersji systemu i stanu symulatora. */
export const AKCJE_ARKUSZA_SYSTEMOWEGO = ['Save Image', 'Add to Photos', 'Save to Files', 'Copy', 'Print', 'Assign to Contact'];

/** Czy asercja `a` (tekst scenariusza) akceptuje etykietę `etykieta`. */
const akceptuje = (a: Asercja, etykieta: string) => a.text !== undefined && pasuje(a.text)(etykieta);

describe('kruche asercje scenariuszy E2E (raport E2, przebieg 135)', () => {
  const pl = JSON.parse(fs.readFileSync(path.join(root, 'src/i18n/slowniki/pl.json'), 'utf8'));
  const wybranyPl = (nazwa: string) => (pl.jezyk.wybrany_a11y as string).replace('{{nazwa}}', nazwa);

  test('E2-K1 scenariusz 39: wybrany język Polski po restarcie — wzorzec zgodny z etykietą ze słownika pl („wybrany_a11y”)', () => {
    const etykieta = wybranyPl('Polski');
    expect(etykieta).toBe('Polski, wybrano'); // wyrocznia: src/i18n/slowniki/pl.json (jezyk.wybrany_a11y)
    const naPolski = scen('39-p-190-jezyk-trwaly.yaml').filter(a => a.id === 'jezyk-pl' && a.text !== undefined);
    expect(naPolski.length).toBeGreaterThan(0);
    for (const a of naPolski) expect(akceptuje(a, etykieta)).toBe(true);
  });

  test('E2-K2 scenariusz 43: arkusz udostępniania — dowodem obrazu jest podpis załącznika, nie nazwa akcji systemu', () => {
    const wszystkie = scen('43-br-prj-015-s2-udostepnienie-karty.yaml');
    for (const a of wszystkie) {
      for (const akcja of AKCJE_ARKUSZA_SYSTEMOWEGO) expect(akceptuje(a, akcja) && a.text === akcja).toBe(false);
    }
    // podpis załącznika w arkuszu (LP.CaptionBar.BottomCaption): „PNG Image · 107 KB” (przebieg 135, zrzut kroku 49)
    expect(wszystkie.some(a => akceptuje(a, 'PNG Image · 107 KB'))).toBe(true);
  });
});

describe('pułapki: reguły E2-K1/K2 czerwienieją na dawnych asercjach', () => {
  test('„Polski, selected” nie pasuje do etykiety pl; „Save Image” jest nazwą akcji systemu', () => {
    expect(akceptuje({ text: 'Polski, selected' }, 'Polski, wybrano')).toBe(false);
    expect(AKCJE_ARKUSZA_SYSTEMOWEGO).toContain('Save Image');
  });
});
