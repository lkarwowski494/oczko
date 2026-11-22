// F-36 (design-spec „Ustawienia › Język”): wybór działa od razu, bez ponownego uruchomienia — zmiana języka i18n przerenderowuje ekrany,
// które czytają kontekst aplikacji (stos ekranów zostaje, więc wraca się do Ustawień).
import React from 'react';
import { Text } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { DostawcaAplikacji, useAplikacja, type Aplikacja } from '../../src/kompozycja/Kontekst';

function Ekran(): React.ReactElement {
  const { kontener } = useAplikacja();
  return <Text>{kontener.j.jezyk()}</Text>;
}

test('zmiana języka → konsument kontekstu pokazuje nowy język', () => {
  let biezacy = 'en';
  const sluchacze = new Set<(j: string) => void>();
  const kontener = { j: { jezyk: () => biezacy, naZmiane: (f: (j: string) => void) => (sluchacze.add(f), () => void sluchacze.delete(f)) } };
  const wartosc = { kontener, licznik: {}, preferencje: {} } as unknown as Aplikacja; // atrapa: test czyta tylko j
  render(<DostawcaAplikacji wartosc={wartosc}><Ekran /></DostawcaAplikacji>);
  expect(screen.getByText('en')).toBeTruthy();
  act(() => { biezacy = 'pl'; sluchacze.forEach((f) => f('pl')); });
  expect(screen.getByText('pl')).toBeTruthy();
});
