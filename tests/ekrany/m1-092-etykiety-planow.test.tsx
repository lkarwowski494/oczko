// M1-audytor-generalny-092 (02-monetyzacja-501 MON-10; 04-studio-projektowe-513 SP-18): jawna `accessibilityLabel` przycisku planu zastępuje
// teksty potomków, więc VoiceOver czyta tylko ją. Etykieta każdego planu niesie nazwę, cenę i podpis (warunki odnowienia albo „Pay once”),
// a plan dożywotni przy aktywnej subskrypcji dodatkowo tekst KP-03 — w kolejności wizualnej: nazwa · cena, podpis, ostrzeżenie.
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Oferty, type PropsOfert } from '../../src/ekrany/Oferty';
import type { Produkt } from '../../src/domena/porty';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
const PRODUKTY: Produkt[] = [
  { id: 'p.miesiac', cenaWyswietlana: '4,99 zł', okres: 'miesiac' },
  { id: 'p.rok', cenaWyswietlana: '19,99 zł', okres: 'rok' },
  { id: 'p.dozywotni', cenaWyswietlana: '59,99 zł', okres: 'dozywotni' },
];
function pokaz(aktywne: PropsOfert['stan']['aktywne'] = null) {
  render(<Oferty stan={{ produkty: { rodzaj: 'gotowe', produkty: PRODUKTY }, aktywne, familySharing: false }} t={t} adresy={{ polityka: 'https://example.invalid/p', warunki: 'https://example.invalid/w' }}
    naKup={jest.fn()} naPrzywroc={jest.fn()} naZarzadzaj={jest.fn()} naOtworzAdres={jest.fn()} naZamknij={jest.fn()} />);
}
const etykieta = (id: string): string => screen.getByTestId(id).props.accessibilityLabel;

test('M1-092: etykieta każdego planu = nazwa · cena i podpis (oferty.odnawianie_miesiac / _rok / oferty.raz)', () => {
  pokaz();
  expect(etykieta('oferty-plan-miesieczny')).toBe(`${t('oferty.miesieczny')} · ${t('oferty.cena_miesiac', { cena: '4,99 zł' })}. ${t('oferty.odnawianie_miesiac')}`);
  expect(etykieta('oferty-plan-roczny')).toBe(`${t('oferty.roczny')} · ${t('oferty.cena_rok', { cena: '19,99 zł' })}. ${t('oferty.odnawianie_rok')}`);
  expect(etykieta('oferty-plan-dozywotni')).toBe(`${t('oferty.dozywotni')} · ${t('oferty.cena_raz', { cena: '59,99 zł' })}. ${t('oferty.raz')}`);
});

test('M1-092: plan dożywotni przy aktywnej subskrypcji → nazwa, podpis, ostrzeżenie KP-03 w tej kolejności', () => {
  pokaz({ rodzaj: 'subskrypcja', produkt: 'p.miesiac' });
  const e = etykieta('oferty-plan-dozywotni');
  const [nazwa, podpis, ostrzezenie] = [t('oferty.dozywotni'), t('oferty.raz'), t('oferty.dozywotni_przy_subskrypcji')].map((x) => e.indexOf(x));
  expect([nazwa, podpis, ostrzezenie].every((i) => i >= 0)).toBe(true);
  expect(nazwa).toBeLessThan(podpis);
  expect(podpis).toBeLessThan(ostrzezenie);
  expect(etykieta('oferty-plan-roczny')).toContain(t('oferty.odnawianie_rok'));
});
