/* 10-wydanie-019 (sesja AL, 2026-11-11, KO-041; recenzja AK, przebieg 43035080611): kadr 04 pokazuje jedno zakreślenie (Row 9) przy liczniku „2”.
 * Przyczyna (z kodu, bez urządzenia): zakreślenia to pociągnięcia PKCanvasView w układzie STRONY (modules/oczko-wzor/ios/WidokWzoru.swift: `zglosZakreslenia` liczy pociągnięcia `.marker`,
 * licznik `wzor-zakreslenia` nie mówi nic o widoczności), a pierwsze zakreślenie fikstury powstawało w PIONIE (00-przygotuj nie ustawia orientacji) na wysokości 40% ekranu,
 * kadr 04 jest poziomy (iPad, ORIENT_WZOR) — ta sama wysokość ekranu to inny punkt strony, a poziomy widok pokazuje mniejszy wycinek strony, więc pierwsze pociągnięcie wypada poza kadrem.
 * Poprawka: fikstura zakreśla w tej samej orientacji co scena (ORIENT_WZOR), a swipe sceny 04 jest na innej wysokości niż fikstury (pociągnięcia nie zlewają się).
 * Ograniczenie: widoczność pociągnięcia w kadrze nie jest elementem interfejsu (brak testID per pociągnięcie); licznik i test statyczny nie zastępują obejrzenia zrzutu 04. */
import * as fs from 'fs';
import * as path from 'path';

const korzen = path.join(__dirname, '..', '..');
const czytaj = (p: string) => fs.readFileSync(path.join(korzen, p), 'utf8');
const kod = (p: string) => czytaj(p).split('\n').filter((l) => !l.trimStart().startsWith('#'));
const SWIPE = /swipe:\s*\{\s*start:\s*"(\d+)%,\s*(\d+)%",\s*end:\s*"(\d+)%,\s*(\d+)%"/;
const idx = (linie: string[], re: RegExp, od = 0) => { const i = linie.findIndex((l, n) => n >= od && re.test(l)); expect([re.source, i >= 0]).toEqual([re.source, true]); return i; };

describe('10-wydanie-019: dwa zakreślenia w kadrze 04', () => {
  const przyg = kod('e2e/zrzuty-sklepu/00-przygotuj.yaml');
  const s04 = kod('e2e/zrzuty-sklepu/04-zakreslenie.yaml');

  test('fikstura zakreśla w orientacji sceny (ORIENT_WZOR) i wraca do pionu przed wyjściem z wzoru', () => {
    const zakreslacz = idx(przyg, /tapOn:.*wzor-zakreslacz/);
    const swipe = idx(przyg, SWIPE, zakreslacz);
    const obrot = idx(przyg, /setOrientation:\s*\$\{ORIENT_WZOR\}/);
    expect(obrot).toBeLessThan(swipe);
    const powrot = idx(przyg, /setOrientation:\s*PORTRAIT/, swipe);
    expect(powrot).toBeLessThan(idx(przyg, /tapOn:.*nav-wstecz/, swipe));
  });

  test('scena 04 przed swipe sprawdza, że fikstura zostawiła jedno zakreślenie (licznik z cyfrą 1 w każdym języku), a po nim dwa; asercje ścisłe (P3: `.*1.*` pasowało też do „12”, „21”)', () => {
    const swipe = idx(s04, SWIPE);
    const przed = idx(s04, /assertVisible:.*wzor-zakreslenia.*text:\s*'\^\\D\*1\\D\*\$'/);
    const po = idx(s04, /assertVisible:.*wzor-zakreslenia.*text:\s*'\^\\D\*2\\D\*\$'/, swipe);
    expect(przed).toBeLessThan(swipe); expect(swipe).toBeLessThan(po);
    expect(s04.filter((l) => /wzor-zakreslenia/.test(l) && /\.\*[12]\.\*/.test(l))).toEqual([]);
  });

  // 019 (AO, KO-044; P-749): opcja 1 z P-746 (wyłączenie zakreślacza przed zrzutem) obalona przebiegiem 43090241469 (04=1 pas we wszystkich parach); przyczyna była
  // w aplikacji (P-748, tests/wydanie/widok-wzoru-odswiezenie-plotna.test.ts), więc scena bez obejścia: zakreślacz zostaje włączony do zrzutu (kadr jak w 014),
  // a zrzut Maestro zaraz po swipe zostaje w dziennikach (stan płótna przed zrzutem sklepu; rozróżnia „nie pojawiło się” od „znikło później”).
  test('019 (AO, KO-044): scena 04 bez wyłączania zakreślacza po swipe — zakreślacz włączony do końca sceny, licznik 2, zrzut diagnostyczny zaraz po swipe', () => {
    const swipe = idx(s04, SWIPE);
    const licznik = idx(s04, /assertVisible:.*wzor-zakreslenia.*text:\s*'\^\\D\*2\\D\*\$'/, swipe);
    const zrzut = idx(s04, /takeScreenshot:\s*04-po-swipe/, swipe);
    expect(licznik).toBeLessThan(zrzut);
    const wlaczony = idx(s04, /assertVisible:.*wzor-zakreslacz.*selected:\s*true/, zrzut);
    expect(zrzut).toBeLessThan(wlaczony);
    expect(s04.slice(swipe + 1).filter((l) => /tapOn:.*wzor-zakreslacz|selected:\s*false/.test(l))).toEqual([]); // po swipe nic nie wyłącza narzędzia
  });

  test('swipe fikstury i swipe sceny 04 są na różnych wysokościach (≥ 6 punktów procentowych: pociągnięcia o szerokości 18 pt nie zlewają się), w poziomie', () => {
    const f = SWIPE.exec(przyg.find((l) => SWIPE.test(l)) ?? ''); const s = SWIPE.exec(s04.find((l) => SWIPE.test(l)) ?? '');
    expect(f).not.toBeNull(); expect(s).not.toBeNull();
    const [, fx1, fy1, fx2, fy2] = f ?? []; const [, sx1, sy1, sx2, sy2] = s ?? [];
    expect([fy1, sy1]).toEqual([fy2, sy2]); // pociągnięcia poziome
    expect(Math.abs(Number(fy1) - Number(sy1))).toBeGreaterThanOrEqual(6);
    expect([fx1, fx2]).toEqual([sx1, sx2]);
  });
});
