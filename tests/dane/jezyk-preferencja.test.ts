// Trwała preferencja języka (F-36, BR-ZAK-004 S5, ADR-0017, P-190): klucz `jezyk` w `ustawienie` przeżywa ponowne uruchomienie;
// uszkodzony zapis = „Same as phone”; klucz to stan urządzenia — import „zastąp” go nie nadpisuje i nie bierze z kopii.
import { join } from 'node:path';
import { utworzI18n } from '../../src/i18n/i18n';
import { magazynJezyka } from '../../src/przypadki-uzycia/jezyk';
import { odczytajUstawienie, zapiszUstawienie } from '../../src/dane/repozytoria/ustawienia';
import { zastapZKopii } from '../../src/dane/baza/przeniesienie';
import { przyTle } from '../../src/przypadki-uzycia/start';
import { przygotuj } from './pomocnicze/srodowisko';

const zasoby = { en: { translation: { a: 'A' } }, pl: { translation: { a: 'Ą' } } };
const i18n = (m: ReturnType<typeof magazynJezyka>, systemowe = ['en-US']) => utworzI18n({ magazyn: m, systemowe: () => systemowe, zasoby });

describe('magazynJezyka (P-190)', () => {
  test('wybór „Polski” przeżywa ponowne uruchomienie: nowy i18n na tej samej bazie startuje po polsku', async () => {
    const s = await przygotuj();
    const pierwszy = await i18n(magazynJezyka(s.z));
    expect(pierwszy.jezyk()).toBe('en');
    await pierwszy.ustawJezyk('pl');
    expect(await odczytajUstawienie(s.baza, 'jezyk')).toBe('pl');
    const poRestarcie = await i18n(magazynJezyka(s.z));
    expect(poRestarcie.jezyk()).toBe('pl');
    expect(poRestarcie.t('a')).toBe('Ą');
  });

  test('„Same as phone” zapisuje auto i wraca do języka systemu', async () => {
    const s = await przygotuj();
    await zapiszUstawienie(s.baza, 'jezyk', 'pl', 1);
    const a = await i18n(magazynJezyka(s.z), ['de-DE', 'en-US']);
    await a.ustawJezyk('auto');
    expect(await odczytajUstawienie(s.baza, 'jezyk')).toBe('auto');
    expect((await i18n(magazynJezyka(s.z), ['de-DE', 'en-US'])).jezyk()).toBe('de');
  });

  test('BR-ZAK-004 S5: uszkodzony zapis (nie napis, nieznany tag) = za systemem', async () => {
    for (const zly of [5, { tag: 'pl' }, 'xx-YY']) {
      const s = await przygotuj();
      await zapiszUstawienie(s.baza, 'jezyk', zly, 1);
      expect((await i18n(magazynJezyka(s.z), ['pl-PL'])).jezyk()).toBe('pl');
      expect((await i18n(magazynJezyka(s.z), ['en-GB'])).jezyk()).toBe('en');
    }
  });

  test('klucz urządzenia: import „zastąp” zostawia bieżący wybór i nie bierze języka z kopii', async () => {
    const zrodlo = await przygotuj();
    await zapiszUstawienie(zrodlo.baza, 'jezyk', 'ja', 1);
    await przyTle(zrodlo.z);
    const s = await przygotuj();
    await zapiszUstawienie(s.baza, 'jezyk', 'pl', 1);
    await zastapZKopii(s.baza, join(zrodlo.katalog, 'oczko.db'));
    expect(await odczytajUstawienie(s.baza, 'jezyk')).toBe('pl');
  });
});
