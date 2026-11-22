// Linki przy wzorze: film z instrukcją (F-55, BR-WZR-007/S4). Ekran nienarysowany (Z07-05). Sygnatura: propozycja 07 (E3), granice 05 (Z07-22).
// Oczko zapisuje tylko link; bez sieci stuknięcie mówi, że film wymaga połączenia, i niczego nie otwiera.
import React, { useState } from 'react';
import { View } from 'react-native';
import { Komunikat, Przycisk } from './Arkusz';
import type { System, Tlumacz } from './wspolne';

export type PropsLinkuFilmu = {
  stan: { tytul: string; url: string; siec: 'jest' | 'brak' };  // Oczko zapisuje tylko link, nie film
  t: Tlumacz;
  system: System;
};
export function LinkFilmu({ stan, t, system }: PropsLinkuFilmu): React.ReactElement {
  const [bez, ustaw] = useState(false);
  return (
    <View>
      <Przycisk tekst={stan.tytul} rola="link" rodzaj="tekstowy" onPress={() => { if (stan.siec === 'brak') ustaw(true); else { ustaw(false); system.otworzAdres(stan.url); } }} />
      {bez && stan.siec === 'brak' && <Komunikat tekst={t('narzedzia.film_bez_sieci')} />}
    </View>
  );
}
