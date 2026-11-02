// Historia licznika (F-02, BR-LIC-003, BR-LIC-017/S6; prototyp.html:128). Arkusz systemowy; „Undo” tylko przy ostatniej zmianie (P-091 (3a)).
// Sygnatura: propozycja 07 (E3), granice zatwierdzone przez 05 (Z07-22). Wpisy przychodzą od najnowszego, godzina sformatowana (format.ts).
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Arkusz, Przycisk, Tresc } from './Arkusz';
import { odstep } from './motyw';
import type { Tlumacz } from './wspolne';

export type WpisHistorii = {
  id: string; godzina: string; z: number; na: number; opis: string | null; // godzina sformatowana (format.ts)
  cofniety: boolean;                                  // znacznik „Undone” + przekreślenie (BR-LIC-003/S3, design-spec 021)
  mozeCofnac: boolean;                                // „Undo” jest tylko przy jednym wpisie: ostatniej zmianie, która nie jest cofnięta
  seria: { ile: number; czas: string; odZdarzeniaId: string } | null; // czas sformatowany (np. „1 s”); seria na końcu historii jako jeden wpis (BR-LIC-003/S2)
};
export type PropsHistorii = {
  stan: { wpisy: WpisHistorii[] };          // od najnowszego; „Undo” tylko przy ostatniej niecofniętej zmianie (P-091 (3a), 07-jakosc-021)
  t: Tlumacz;
  naCofnij(id: string): void;
  naCofnijSerie(odZdarzeniaId: string): void;
  naWpisz(): void;                          // starsza pomyłka: wpisanie właściwej wartości (BR-LIC-003/S4, BR-LIC-017)
  naZamknij(): void;
};
export function Historia({ stan, t, naCofnij, naCofnijSerie, naWpisz, naZamknij }: PropsHistorii): React.ReactElement {
  const [rozwiniety, ustawRozwiniety] = useState<string | null>(null); // starszy wpis rozwija się po stuknięciu (P-330, wariant A)
  const wpisyWidoczne = stan.wpisy.slice(0, 50);
  return (
    <Arkusz tytul={t('licznik.historia')} przyciski={<Przycisk tekst={t('wspolne.zamknij')} onPress={naZamknij} rodzaj="tekstowy" testID="arkusz-zamknij" />}>
      <View testID="historia-lista" style={{ gap: odstep.s }}>
        {wpisyWidoczne.length === 0 && <Tresc>{t('historia.pusto')}</Tresc>}
        {wpisyWidoczne.map((w) => {
          const tekst = w.seria
            ? `${w.godzina} · ${t('historia.seria', { count: w.seria.ile, czas: w.seria.czas })} · ${w.z} → ${w.na}`
            : w.opis ? t('historia.wpis_opis', { czas: w.godzina, z: w.z, na: w.na, opis: w.opis }) : t('historia.wpis', { czas: w.godzina, z: w.z, na: w.na });
          const starszy = !w.mozeCofnac && !w.cofniety; // starszy, niecofnięty wpis: rozwija się i prowadzi do wpisania wartości
          return (
            <View key={w.id} testID={w.mozeCofnac ? 'historia-ostatni' : w.cofniety ? 'historia-cofniety' : 'historia-starszy'} style={{ gap: odstep.s }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: odstep.s }}>
                <View style={{ flex: 1 }}>
                  <Tresc>
                    {w.cofniety ? <Text style={{ textDecorationLine: 'line-through' }}>{tekst}</Text> : tekst}
                    {w.cofniety ? ` · ${t('historia.cofnieto')}` : ''}
                  </Tresc>
                </View>
                {w.mozeCofnac && (w.seria
                  ? <Przycisk tekst={t('historia.cofnij_serie', { count: w.seria.ile })} onPress={() => naCofnijSerie(w.seria!.odZdarzeniaId)} testID="historia-cofnij-serie" />
                  : <Przycisk tekst={t('wspolne.cofnij')} onPress={() => naCofnij(w.id)} testID="historia-cofnij-ostatnia" />)}
                {starszy && <Przycisk tekst={rozwiniety === w.id ? '–' : '+'} etykieta={tekst} rodzaj="tekstowy" onPress={() => ustawRozwiniety(rozwiniety === w.id ? null : w.id)} testID={`historia-rozwin-${w.id}`} />}
              </View>
              {starszy && rozwiniety === w.id && (
                <View style={{ gap: odstep.s }} testID="historia-starszy-info">
                  <Tresc podpis>{t('historia.starszy_info')}</Tresc>
                  <Przycisk tekst={t('historia.wpisz')} onPress={naWpisz} testID="historia-wpisz" />
                </View>
              )}
            </View>
          );
        })}
      </View>
    </Arkusz>
  );
}
