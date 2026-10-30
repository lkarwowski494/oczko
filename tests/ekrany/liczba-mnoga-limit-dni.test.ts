/* P-307: liczba dni limitu przy rzeczowniku „days” (limit.arkusz_dni, projekty.dni, oferty.bez_pro) w kluczach liczby mnogiej — forma wg count, by pl/ru/cs
 * mogły odmienić „dni”. Limit to dziś 5 (LIMIT_DNI_W_MIESIACU), więc w en widać formę _other; _one jest dla tłumaczy i dla innego limitu. */
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });

test('limit.arkusz_dni: 5 → „Your 5 free crafting days … are used”; 1 → liczba pojedyncza', () => {
  const p = { limit: 5, miesiac: 'November', data: 'December 1' };
  expect(t('limit.arkusz_dni', { ...p, count: 5 })).toBe('Your 5 free crafting days for November are used. A crafting day starts with your first row that day; they come back on December 1.');
  expect(t('limit.arkusz_dni', { ...p, limit: 1, count: 1 })).toBe('Your 1 free crafting day for November is used. A crafting day starts with your first row that day; it comes back on December 1.');
});

test('projekty.dni: „3 of 5 free crafting days left in November” (count = ile zostało; forma wg niego)', () => {
  expect(t('projekty.dni', { zostalo: 3, limit: 5, miesiac: 'November', count: 3 })).toBe('3 of 5 free crafting days left in November');
  expect(t('projekty.dni', { zostalo: 1, limit: 5, miesiac: 'November', count: 1 })).toBe('1 of 5 free crafting days left in November');
});

test('oferty.bez_pro: 5 → „5 crafting days every month”; 1 → „1 crafting day every month”', () => {
  expect(t('oferty.bez_pro', { limit: 5, count: 5 })).toBe('Without Pro: 5 crafting days every month, and all your projects and data, always.');
  expect(t('oferty.bez_pro', { limit: 1, count: 1 })).toBe('Without Pro: 1 crafting day every month, and all your projects and data, always.');
});
