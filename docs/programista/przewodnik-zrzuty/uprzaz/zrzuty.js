// Zrzuty ekranów przewodnika z uprzęży react-native-web (wyjątek nazwany: projekt nie ma Expo web, m3-p7-stan.md:26).
const { chromium } = require('playwright');
const H = __dirname;
const OUT = '/home/user/oczko/docs/programista/przewodnik-zrzuty';
(async () => {
  const b = await chromium.launch();
  const bledy = [];
  for (const szer of [390, 320]) for (const motyw of ['jasny', 'ciemny']) {
    const ctx = await b.newContext({ viewport: { width: szer, height: 844 }, colorScheme: motyw === 'jasny' ? 'light' : 'dark', deviceScaleFactor: 2 });
    const p = await ctx.newPage();
    p.on('pageerror', (e) => bledy.push(String(e)));
    const ujecia = [['dzis', 'dzis', null], ['ustawienia', 'ustawienia', 'ustawienia-przewodnik'], ['przewodnik', 'przewodnik-kroki', null], ['przewodnik', 'przewodnik-biblioteka', 'przewodnik-grupa-licznik']];
    for (const [ekran, nazwa, doEl] of ujecia) {
      await p.goto(`file://${H}/index.html?ekran=${ekran}&jezyk=pl`);
      await p.waitForFunction(() => window.gotowe === true);
      await p.waitForTimeout(300);
      if (doEl) await p.evaluate((id) => { const e = document.querySelector(`[data-testid="${id}"]`); if (e) e.scrollIntoView({ block: 'center' }); }, doEl);
      const w = await p.evaluate(() => Math.max(...[...document.querySelectorAll('[data-testid]')].map((e) => e.getBoundingClientRect().right)));
      if (w > szer + 0.5) bledy.push(`${nazwa} ${szer}: element poza ekranem do x=${w}`);
      await p.screenshot({ path: `${OUT}/${nazwa}-${szer}-${motyw}.png` });
    }
    await ctx.close();
  }
  await b.close();
  console.log(JSON.stringify(bledy));
})();
