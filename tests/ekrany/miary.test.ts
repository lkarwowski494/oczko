// 07-jakosc-004 K-04d (BR-KAL-003/S6, ADR-0029): układ miar z preferencji „Units”; „auto” idzie za systemem, wybór ręczny wygrywa z systemem.
import { imperialny } from '../../src/kompozycja/miary';

describe('imperialny(preferencja, system)', () => {
  test.each([
    ['imperial', 'metric', true], ['imperial', null, true], ['metric', 'us', false], ['metric', 'uk', false],
    ['auto', 'us', true], ['auto', 'uk', true], ['auto', 'metric', false], ['auto', null, false],
  ] as const)('preferencja %s na systemie %s → imperialny = %s', (pref, system, oczekiwane) => {
    expect(imperialny(pref, system)).toBe(oczekiwane);
  });
});
