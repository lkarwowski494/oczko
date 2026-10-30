// Import archiwum i rozstrzygnięcie konfliktu (F-31–F-34, F-27; R-050, R-068). Ekrany nienarysowane (Z07-05), teksty robocze 08.
// Sygnatury: propozycja 07 (E3), granice 05 (Z07-22). Konflikt: wybór użytkownika, nigdy po cichu (M-04, M-05).
import React from 'react';
import { Text, View } from 'react-native';
import { Arkusz, Przycisk, Tresc } from './Arkusz';
import { odstep, typografia, useKolory } from './motyw';
import type { Tlumacz } from './wspolne';

export type PropsImportu = {
  stan: { rodzaj: 'wybor'; plik: string; licznosci?: string } | { rodzaj: 'zastapiono'; kopia: { nazwa: string; miejsce: string } }; // kopia przed „Zastąp” (P-047, dane.md:69)
  t: Tlumacz;
  naZastap(): void;
  naScal(): void;
  naAnuluj(): void;
  /** Wewnątrz Ustawień (bez arkusza): wynik zostaje na ekranie razem z resztą listy. */
  wbudowany?: boolean;
  /** Wynik „scal” sformatowany przez kompozycję (`import-wynik`). */
  wynik?: string;
};
/** Arkusz albo blok w treści ekranu (ten sam układ: nagłówek, treść, przyciski). */
function Ramka(p: { wbudowany?: boolean; tytul: string; testID?: string; przyciski: React.ReactNode; children: React.ReactNode }): React.ReactElement {
  const k = useKolory();
  if (!p.wbudowany) return <Arkusz tytul={p.tytul} testID={p.testID} przyciski={p.przyciski}>{p.children}</Arkusz>;
  return (
    <View testID={p.testID} style={{ gap: odstep.s }}>
      <Text style={{ ...typografia.instrukcja, color: k.grafit }} accessibilityRole="header">{p.tytul}</Text>
      {p.children}
      {p.przyciski}
    </View>
  );
}
export function Import({ stan, t, naZastap, naScal, naAnuluj, wbudowany, wynik }: PropsImportu): React.ReactElement {
  if (wynik !== undefined) {
    return (
      <Ramka wbudowany={wbudowany} tytul={t('dane.import_tytul')} przyciski={<Przycisk tekst={t('wspolne.zamknij')} onPress={naAnuluj} rodzaj="tekstowy" />}>
        <Tresc testID="import-wynik">{wynik}</Tresc>
      </Ramka>
    );
  }
  if (stan.rodzaj === 'zastapiono') {
    return (
      <Ramka wbudowany={wbudowany} tytul={t('dane.import_tytul')} przyciski={<Przycisk tekst={t('wspolne.zamknij')} onPress={naAnuluj} rodzaj="tekstowy" testID="arkusz-zamknij" />}>
        <Tresc testID="import-wynik">{t('dane.zastapiono', { nazwa: stan.kopia.nazwa, miejsce: stan.kopia.miejsce })}</Tresc>
      </Ramka>
    );
  }
  return (
    <Ramka wbudowany={wbudowany} tytul={t('dane.import_tytul')} testID="import-gotowy" przyciski={
      <>
        <Przycisk tekst={t('dane.scal')} onPress={naScal} rodzaj="glowny" testID="import-scal" />
        <Przycisk tekst={t('dane.zastap')} onPress={naZastap} />
        <Przycisk tekst={t('wspolne.anuluj')} onPress={naAnuluj} rodzaj="tekstowy" testID="arkusz-zamknij" />
      </>
    }>
      <Tresc>{t('dane.import_plik', { plik: stan.plik })}</Tresc>
      {stan.licznosci && <Tresc podpis testID="import-licznosci">{stan.licznosci}</Tresc>}
    </Ramka>
  );
}

export type KandydatKonfliktu = { id: string; wartosc: number; urzadzenie: string; godzina: string };
export type PropsKonfliktu = {
  stan: { licznik: string; kandydaci: KandydatKonfliktu[] };   // M-04, M-05: wybór użytkownika, nigdy po cichu
  t: Tlumacz;
  naWybierz(id: string): void;
};
export function Konflikt({ stan, t, naWybierz }: PropsKonfliktu): React.ReactElement {
  return (
    <Arkusz tytul={t('dane.konflikt_tytul', { licznik: stan.licznik })} przyciski={null}>
      {stan.kandydaci.map((k) => (
        <Przycisk key={k.id} tekst={t('dane.konflikt_wybor', { count: k.wartosc, urzadzenie: k.urzadzenie, godzina: k.godzina })}
          etykieta={t('dane.konflikt_a11y', { count: k.wartosc, urzadzenie: k.urzadzenie, godzina: k.godzina })} onPress={() => naWybierz(k.id)} />
      ))}
    </Arkusz>
  );
}
