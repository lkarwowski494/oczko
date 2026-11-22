// Preferencja języka widziana przez Ustawienia (F-36, BR-ZAK-004 S5): wybrana pozycja listy; uszkodzony zapis = „Same as phone”.
import { utworzI18n } from '../../src/i18n/i18n';

const zasoby = { en: { translation: {} }, pl: { translation: {} } };
const z = (zapis: string | null) => {
  let v = zapis;
  return utworzI18n({ magazyn: { odczytaj: async () => v, zapisz: async (_k, w) => { v = w; } }, systemowe: () => ['en-US'], zasoby });
};

describe('preferencjaJezyka', () => {
  test('brak zapisu → auto; po wyborze → wybrany tag', async () => {
    const i = await z(null);
    expect(i.preferencja()).toBe('auto');
    await i.ustawJezyk('pl');
    expect(i.preferencja()).toBe('pl');
  });
  test('uszkodzony zapis (nieznany tag) → auto', async () => {
    expect((await z('xx-YY')).preferencja()).toBe('auto');
  });
});
