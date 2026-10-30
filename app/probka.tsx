// Trasa „/probka?projekt=…”: kalkulator „Swatch” (F-38; BR-KAL-001, BR-KAL-003; design-spec „Kalkulator Swatch”). Jednostka szerokości
// i domyślna podstawa próbki z układu miar urządzenia (R-131, P-075 (4a); wiersza „Units” w Ustawieniach jeszcze nie ma — zgłoszenie
// partii 5). Z projektu (U-10): próbka projektu na start i linia `probka.z_projektu`; zmiana próbki zapisuje się w projekcie, szerokość nie.
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Probka } from '../src/ekrany/Narzedzia';
import { useKolory } from '../src/ekrany/motyw';
import { useAplikacja } from '../src/kompozycja/Kontekst';
import { Bezpieczny } from '../src/kompozycja/Bezpieczny';
import { stanProbki, type WejscieProbki } from '../src/kompozycja/probka';
import { imperialny } from '../src/kompozycja/miary';
import { formatujLiczbe, parsujLiczbe } from '../src/i18n/format';
import { ustawProbke } from '../src/przypadki-uzycia/projekt';
import { widokProjektu } from '../src/przypadki-uzycia/widok-projektu';

type Start = { oczka: string; na: WejscieProbki['na']; zProjektu?: string; narzedzie?: WejscieProbki['narzedzie'] };

export default function EkranProbki(): React.ReactElement {
  const { kontener } = useAplikacja();
  const { projekt } = useLocalSearchParams<{ projekt?: string }>();
  const k = useKolory();
  const j = kontener.j;
  const cm = !imperialny();
  const [start, ustawStart] = useState<Start | null>(projekt ? null : { oczka: '', na: cm ? '10cm' : '4in' });
  useEffect(() => {
    if (!projekt) return;
    void widokProjektu(kontener.z, { projektId: projekt }).then((w) => {
      const p = w.ok ? w.wartosc.probka : null;
      ustawStart({
        oczka: p ? formatujLiczbe(p.oczka, j.jezyk(), { maks: 3 }) : '',
        na: p ? (p.naCm === 10 ? '10cm' : '4in') : cm ? '10cm' : '4in',
        zProjektu: w.ok ? j.t('probka.z_projektu', { projekt: w.wartosc.nazwa }) : undefined,
        narzedzie: w.ok ? w.wartosc.narzedzie : undefined,
      });
    });
  }, [kontener, projekt, j, cm]);
  if (!start) return <View style={{ flex: 1, backgroundColor: k.papier }} />;
  const zapisz = projekt ? (p: { oczka: string; na: WejscieProbki['na'] }) => {
    const n = p.oczka.trim() === '' ? null : parsujLiczbe(p.oczka, j.jezyk());
    if (n === null && p.oczka.trim() !== '') return; // zapis niezgodny: bez zmiany w projekcie (komunikat na ekranie)
    if (n !== null && n <= 0) return;
    void ustawProbke(kontener.z, { projektId: projekt, probka: n === null ? null : { oczka: n, naCm: p.na === '10cm' ? 10 : 10.16 } });
  } : undefined;
  return (
    <Bezpieczny>
      <Probka t={j.t} jednostka={cm ? 'cm' : 'in'} poczatek={{ oczka: start.oczka, na: start.na }} zProjektu={start.zProjektu}
        licz={(w) => stanProbki({ ...w, narzedzie: start.narzedzie }, j)} naZmianeProbki={zapisz} />
    </Bezpieczny>
  );
}
