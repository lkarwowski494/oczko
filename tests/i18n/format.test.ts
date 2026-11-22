import { formatujLiczbe, formatujGodzine, formatujDate, ukladMiar } from '../../src/i18n/format';

const spacje = (s: string) => s.replace(/\s/g, ' ');

describe('liczby z Intl.NumberFormat według języka aplikacji', () => {
  it('pl: przecinek i spacja grupująca', () => expect(spacje(formatujLiczbe(12345.6, 'pl'))).toBe('12 345,6'));
  it('de: kropka grupująca, przecinek dziesiętny', () => expect(formatujLiczbe(12345.6, 'de')).toBe('12.345,6'));
  it('en: przecinek grupujący', () => expect(formatujLiczbe(12345.6, 'en')).toBe('12,345.6'));
  it('maksymalnie 1 miejsce po przecinku, jeśli podano', () =>
    expect(formatujLiczbe(2.55, 'en', { maks: 1 })).toBe('2.6'));
});

describe('godzina: 12/24 h z ustawień systemu (uses24hourClock)', () => {
  const t = new Date(Date.UTC(2026, 9, 22, 13, 5));
  it('24 h', () => expect(spacje(formatujGodzine(t, 'en', { uses24h: true, strefa: 'UTC' }))).toBe('13:05'));
  it('12 h', () => expect(spacje(formatujGodzine(t, 'en', { uses24h: false, strefa: 'UTC' }))).toBe('1:05 PM'));
  it('strefa czasowa urządzenia, nie UTC (RD-16: dzień lokalny)', () =>
    expect(spacje(formatujGodzine(t, 'pl', { uses24h: true, strefa: 'Asia/Tokyo' }))).toBe('22:05'));
  it('przez północ: 23:55 UTC to 00:55 następnego dnia w Warszawie (czas letni do 25.10.2026)', () => {
    const p = new Date(Date.UTC(2026, 9, 22, 23, 55));
    expect(formatujDate(p, 'en-GB', { strefa: 'Europe/Warsaw' })).toBe('23/10/2026');
  });
});

describe('ukladMiar: jednostki z preferencji, domyślnie z systemu (P-075, 4a)', () => {
  it('auto + metric → metric', () => expect(ukladMiar('auto', 'metric')).toBe('metric'));
  it('auto + us → imperial', () => expect(ukladMiar('auto', 'us')).toBe('imperial'));
  it('auto + uk → imperial', () => expect(ukladMiar('auto', 'uk')).toBe('imperial'));
  it('auto + null (web) → metric', () => expect(ukladMiar('auto', null)).toBe('metric'));
  it('jawny wybór wygrywa z systemem', () => {
    expect(ukladMiar('metric', 'us')).toBe('metric');
    expect(ukladMiar('imperial', 'metric')).toBe('imperial');
  });
  it('nieznany zapis → jak auto', () => expect(ukladMiar('xx' as never, 'us')).toBe('imperial'));
});
