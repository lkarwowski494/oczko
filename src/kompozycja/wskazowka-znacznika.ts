// M1-131 (design-spec „Aneks M2 partia 3c1” pkt 3, P-447): trasa wzoru a wskazówka `wzor.wskazowka_znacznika`. Przy otwarciu wzoru PDF albo zdjęcia bez
// znacznika, bez VoiceOver (`AccessibilityInfo.isScreenReaderEnabled`), raz na dane (`pierwszaWskazowkaZnacznika`); widoczna dla tego wzoru do wyjścia z ekranu.
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { wskazowkaZnacznikaMozliwa } from '../domena/znacznik-wzoru';
import { pierwszaWskazowkaZnacznika } from '../przypadki-uzycia/wskazowka-znacznika';
import type { Zaleznosci } from '../przypadki-uzycia/zaleznosci';

export function useWskazowkaZnacznika(z: Pick<Zaleznosci, 'baza' | 'zegar'>, widok: { wzorId: string; plikPdf: string | null; znacznik: unknown } | null): boolean {
  const [dla, ustawDla] = useState<string | null>(null);
  const sprawdzono = useRef(false); // raz na ekran: pierwszy wzór, który mógł ją pokazać
  const wzorId = widok?.wzorId;
  useEffect(() => {
    if (!widok || sprawdzono.current || !wskazowkaZnacznikaMozliwa({ word: widok.plikPdf === null, jestZnacznik: widok.znacznik !== null, czytnik: false })) return;
    sprawdzono.current = true;
    const id = widok.wzorId;
    void AccessibilityInfo.isScreenReaderEnabled().catch(() => false).then(async (czytnik) => {
      if (czytnik) return; // flaga się nie zapisuje
      const r = await pierwszaWskazowkaZnacznika(z);
      if (r.ok && r.wartosc) ustawDla(id);
    });
  }, [wzorId]); // eslint-disable-line react-hooks/exhaustive-deps -- otwarcie wzoru
  return widok !== null && dla === widok.wzorId;
}
