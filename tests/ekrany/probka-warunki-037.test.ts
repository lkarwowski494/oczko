// M1-audytor-generalny-037 (06-tresci-002): warunki wyświetlania z kanonu 06 (docs/tresci/README.md, „Warunki wyświetlania”).
// calc.note.four_inches „przy próbce na 4 in albo przeliczonej z 10 cm”; calc.note.category = dwa zdania zastrzeżenia + zalecenie blokowania
// (PRB-002, PRB-005: wzór podaje próbkę po blokowaniu). Zalecenie stoi raz: w bloku wyniku oczek, a bez wyniku oczek — w bloku grubości.
import { stanProbki, type WejscieProbki } from '../../src/kompozycja/probka';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
const licz = (w: Partial<WejscieProbki>) => stanProbki({ oczka: '', na: '10cm', szerokosc: '', jednostka: 'cm', ...w }, { t, jezyk: () => 'en-US' });

describe('037: uwaga 4 in także przy próbce z 10 cm przeliczonej na 4 in', () => {
  test('20 o./10 cm bez szerokości → „20.3 stitches per 4 in.” i uwaga „4 in is exactly 10.16 cm”', () => {
    const s = licz({ oczka: '20' });
    expect(s.grubosc?.dokladnie).toBe('20.3 stitches per 4 in.');
    expect(s.uwaga4in).toBe(t('probka.uwaga_4in'));
    expect(s.uwaga4in).toContain('4 in is exactly 10.16 cm.');
  });
  test('próbka na 4 in — uwaga jak dotąd', () => {
    expect(licz({ oczka: '20', na: '4in' }).uwaga4in).toBe(t('probka.uwaga_4in'));
  });
  test('projekt szydełkowy na 10 cm: nic nie jest przeliczane na 4 in (bez kategorii) → bez uwagi 4 in', () => {
    const s = licz({ oczka: '20', narzedzie: 'szydelko' });
    expect([s.grubosc, s.uwaga4in]).toEqual([null, null]);
  });
});

describe('037: sama kategoria (bez wyniku oczek) pokazuje zalecenie blokowania', () => {
  test('22 o./10 cm bez szerokości → uwagi kategorii kończą się zdaniem o blokowaniu', () => {
    const g = licz({ oczka: '22' }).grubosc;
    expect(g?.uwagi).toEqual([t('probka.uwaga_zaokraglenie'), t('probka.uwaga_kategoria'), t('probka.uwaga_oczka')]);
    expect(g?.uwagi.join(' ')).toContain('Block your swatch, then compare it with your pattern: patterns give gauge after blocking.');
  });
  test('z szerokością: zdanie o blokowaniu raz, w bloku wyniku oczek (bez powtórki w bloku grubości)', () => {
    const s = licz({ oczka: '22', szerokosc: '50' });
    expect(s.wynik?.uwaga).toBe(t('probka.uwaga_oczka'));
    expect(s.grubosc?.uwagi).toEqual([t('probka.uwaga_zaokraglenie'), t('probka.uwaga_kategoria')]);
  });
  test('zła szerokość (bez wyniku oczek) → zalecenie w bloku grubości', () => {
    const s = licz({ oczka: '23', na: '4in', szerokosc: '0' });
    expect(s.wynik).toBeNull();
    expect(s.grubosc?.uwagi).toEqual([t('probka.uwaga_kategoria'), t('probka.uwaga_oczka')]);
  });
});
