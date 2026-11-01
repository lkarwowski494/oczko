// Most do modułu Swift OczkoWzor (ADR-0007, ADR-0011, ADR-0012; moduly.md „Kontrakt partii 6”); jedyne miejsce require dla tego modułu.
// Moduł opcjonalny: build bez modułu (np. nocny przebieg sprzed partii 6) dostaje null — adapter src/platforma/ zwraca wtedy błąd zamiast awarii.
// Funkcje zwracają JSON `{ ok: true, … }` albo `{ ok: false, powod }` (powody z src/domena/bledy.ts: brak_sieci, odmowa, pusty, anulowano, uszkodzony, …).
import type { ComponentType } from 'react';
import type { NativeSyntheticEvent, StyleProp, ViewStyle } from 'react-native';
import { requireNativeViewManager, requireOptionalNativeModule } from 'expo-modules-core';

export interface OczkoWzorNatywny {
  naPdf(zrodloJson: string): Promise<string>;      // ZrodloWzoru → {ok, sciezka, strony} (plik tymczasowy)
  sprawdzPdf(sciezka: string): Promise<string>;     // PDFKit: {ok, strony} | uszkodzony (w tym zaszyfrowany) | pusty
  skanerDostepny(): boolean;                         // VNDocumentCameraViewController.isSupported
  skanuj(): Promise<string>;                         // {ok, sciezki: JPEG stron} | anulowano | odmowa (aparat)
  wklej(): Promise<string | null>;                   // P-285 (1) B: UIPasteboard (adres albo tekst); pusty schowek = null
  miniatura(pdf: string, cel: string, szerokoscPt: number): Promise<string>; // plan 1.1 pkt 7: PNG pierwszej strony → {ok} | uszkodzony | zapis
  /** Stan ścieżki sieciowej (NWPathMonitor, ADR-0031): 'jest' | 'brak' | 'nieznany' (monitor jeszcze nie odpowiedział). Podpowiedź, nie gwarancja osiągalności serwera. */
  siecStan(): string;
  addListener(nazwa: 'siecZmiana', fn: (e: { stan: string }) => void): { remove(): void }; // zmiana stanu ścieżki (monitor startuje przy pierwszej subskrypcji i przy `siecStan`)
}

export type ZnacznikNatywny = { strona: number; y: number; wysokosc: number; pozaStrona: boolean; przedSchematem: boolean; kierunek: 1 | -1; etykieta: string;
  /** Widoczny napis zakładki („Row 48 ↑”, „Row 61 · page end”) i nazwa akcji VoiceOver „Move to next page” (pusta = brak): teksty z `t()`. */
  napis: string; akcjaNastepnaStrona: string };
/** Chip notatki na stronie wzoru (F-56, P-330 2A): widok rysuje ✎ + `etykieta` przy lewej krawędzi strony na wysokości rzędu (`y`, `wysokosc` — ułamki wysokości strony);
 *  `id` wraca w `onNotatka`; `a11y` = etykieta VoiceOver przycisku. Treść, numery rzędów i arkusz notatki składa JS (teksty z `t()`). */
export type NotatkaNatywna = { id: string; strona: number; y: number; wysokosc: number; etykieta: string; a11y: string };
export type PropsWidokuNatywnego = {
  /** Dokument jednym propsem (kolejność propsów nieokreślona): zmiana wzorId najpierw zapisuje kreski starego wzoru (przegląd 2026-10-26).
   *  rysunki: pliki PKDrawing z magazynu (osobna warstwa, P-218 (2)) — wczytywane tylko przy zmianie wzoru; obroty: P-246 S3a. */
  dokument: { wzorId: string; plikPdf: string; rysunki: { strona: number; plik: string }[]; obroty: { strona: number; kat: number }[];
    /** Pozycja przy otwarciu nowego dokumentu (07-jakosc-006, BR-PRJ-011 S1): strona od 0 i powiększenie jako krotność dopasowania do szerokości (0 = dopasowany); w dokumencie, bo kolejność propsów jest nieokreślona. */
    startStrona: number; startPowiekszenie: number };
  katalogRysunkow: string;                           // katalog plików rysunków czekających na zapis (odzyskiwane przy następnym otwarciu)
  strona: number;                                    // 0 = pierwsza; zmiana z JS przewija do strony
  notatki?: NotatkaNatywna[];                        // chipy notatek tej strony wzoru (testID `wzor-notatka-chip`)
  znacznik: ZnacznikNatywny | null;                  // wynik polozenieZnacznika — widok tylko rysuje (testID `wzor-znacznik`, P-237 (2))
  narzedzie: 'brak' | 'zakreslacz' | 'pioro' | 'gumka';
  polityka: 'wylaczone' | 'dowolne' | 'tylkoRysik'; // politykaPlotna (src/domena/rysik.ts)
  cofnij: number;                                    // licznik: każda zmiana = cofnięcie ostatniej kreski na bieżącej stronie
  style?: StyleProp<ViewStyle>;
  testID?: string;
  onRysunek?: (e: NativeSyntheticEvent<{ wzorId: string; strona: number; plikTymczasowy: string }>) => void; // po RYSUNEK_ZAPIS_MS, zmianie strony, zamknięciu, tle
  onStukniecie?: (e: NativeSyntheticEvent<{ wzorId: string; strona: number; y: number }>) => void;            // przytrzymanie; y = ułamek wysokości strony bez /Rotate
  onNotatka?: (e: NativeSyntheticEvent<{ id: string }>) => void;                               // stuknięcie chipu notatki
  onZnacznik?: (e: NativeSyntheticEvent<{ wzorId: string; strona: number; y: number; wysokosc: number }>) => void; // pas przeciągnięty albo wysokość zmieniona uchwytem
  onZnacznikKrok?: (e: NativeSyntheticEvent<{ wzorId: string; delta: 1 | -1 }>) => void;                       // VoiceOver: zwiększ/zmniejsz o rząd
  onNastepnaStrona?: (e: NativeSyntheticEvent<Record<string, never>>) => void;                                  // VoiceOver: „Move to next page”
  onStrona?: (e: NativeSyntheticEvent<{ strona: number; stron: number }>) => void;
  onPowiekszenie?: (e: NativeSyntheticEvent<{ wzorId: string; powiekszenie: number }>) => void; // po zmianie powiększenia (z opóźnieniem); powiekszenie = scaleFactor / dopasowanie do szerokości, 1 = dopasowany
  onPierwszyRysik?: (e: NativeSyntheticEvent<Record<string, never>>) => void;                  // P-218 Q2a
  onZakreslenia?: (e: NativeSyntheticEvent<{ liczba: number }>) => void;                       // kreski zakreślacza na wszystkich stronach
};

export const natywny = (): OczkoWzorNatywny | null => requireOptionalNativeModule<OczkoWzorNatywny>('OczkoWzor');
export const WidokWzoruNatywny: ComponentType<PropsWidokuNatywnego> | null = natywny() ? requireNativeViewManager<PropsWidokuNatywnego>('OczkoWzor') : null;
