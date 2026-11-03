// Panele buildu E2E (e2e/README.md; bez t(), jak „Test store” Treningu). Ładowane wyłącznie przez `src/platforma/tryb-e2e.ts` (`paneleE2e`)
// w gałęzi `process.env.EXPO_PUBLIC_E2E === '1'` — w buildzie wydania moduł nie trafia do bundla (P-238; kontrola `slady-testowe.mjs`).
// testID i napisy bez zmian: używają ich scenariusze 07. Moduł nie importuje `tryb-e2e.ts` (bez cyklu).
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { PLIK_BAZY } from '../../dane/baza/sciezki';
import { stanPlikuBazy } from '../../dane/pliki/magazyn';
import { polacz, zapiszTekst } from '../../dane/pliki/system';
import { plikiE2e } from '../e2e-pliki';
import { zdjecieTestowe } from '../e2e-zdjecie';
import { pdfTestowy } from './skrzynka';
import type { ZrodloDodania } from '../../przypadki-uzycia/wzor';
import type { StanZegarka, Zegarek } from '../../domena/porty';
import { ADRES_STRONY_TESTOWEJ, pdfSkanuTestowy, wordTestowy } from './pliki-wzoru';
import { PanelOceny } from './ocena-stan';
import { PanelPomiaruOperacji } from './pomiar-operacji';

// Pomiar czasu operacji (E2-137-A3/A4): aplikacja woła je przez `paneleE2e`, więc poza buildem E2E nie trafiają do bundla (P-238).
export { koniecOperacji, poczatekOperacji, zmierzOperacje } from './pomiar-operacji';
// Hak F-64 (e2e-ocena-stan): system.ts liczy wywołania prośby o ocenę i zapamiętuje ostatnio otwarty adres.
export { zapamietajAdres, zliczajProsby } from './ocena-stan';

/** Oferty: „wygaś dostęp” sztucznego sklepu (app/oferty.tsx). */
export function PanelSklepu({ naWygas }: { naWygas(): void }): React.ReactElement {
  return (
    <Pressable accessibilityRole="button" onPress={naWygas} testID="e2e-sklep-wygas" style={{ padding: 12 }}>
      <Text>Test store: expire access</Text>
    </Pressable>
  );
}

/**
 * Ustawienia: pliki testowe (zachowaj ostatni eksport, importuj ostatni zachowany) i SHA-256 pary `.db` + `-wal` bez checkpointu z rozmiarem
 * `-wal` (ADR-0019, P-203: liczone przy każdym wejściu na ekran, panel ukryty do końca liczenia).
 */
export function PanelUstawien(p: { katalogDanych: string; ostatniEksport: string | null; naImportuj(sciezka: string): void }): React.ReactElement {
  const pliki = plikiE2e(p.katalogDanych);
  const [zapisane, ustawZapisane] = useState(() => pliki.ile());
  const [sha, ustawSha] = useState<{ sha: string; walBajty: number } | null>(null);
  useFocusEffect(useCallback(() => {
    ustawSha(null);
    void stanPlikuBazy(polacz(p.katalogDanych, PLIK_BAZY)).then(ustawSha);
  }, [p.katalogDanych]));
  return (
    <View style={{ gap: 8 }}>
      <Pressable accessibilityRole="button" testID="e2e-pliki-zachowaj-eksport"
        onPress={() => { if (p.ostatniEksport) ustawZapisane(pliki.zachowaj(p.ostatniEksport)); }}>
        <Text>Test files: keep last export</Text>
      </Pressable>
      {sha ? <Text testID="e2e-sha-bazy" selectable>{sha.sha}</Text> : null /* dopiero po policzeniu (copyTextFrom w scenariuszu 09) */}
      {sha ? <Text testID="e2e-wal-bajty" selectable>{String(sha.walBajty)}</Text> : null}
      <Text testID="e2e-pliki-stan">{`Saved: ${zapisane} file${zapisane === 1 ? '' : 's'}`}</Text>
      <Pressable accessibilityRole="button" testID="e2e-pliki-importuj-ostatni" onPress={() => { const s = pliki.ostatni(); if (s) p.naImportuj(s); }}>
        <Text>Test files: import last kept</Text>
      </Pressable>
      <PanelOceny />
      <PanelPomiaruOperacji />
    </View>
  );
}

/** Ekran projektu, wybór źródła zdjęcia: zdjęcie testowe z EXIF GPS (scenariusze 17, 42). */
export function PanelZdjecia({ katalogTymczasowy, naPlik }: { katalogTymczasowy: string; naPlik(sciezka: string): void }): React.ReactElement {
  return (
    <View>
      <Pressable accessibilityRole="button" testID="e2e-zdjecie-testowe" onPress={() => naPlik(zdjecieTestowe(katalogTymczasowy))}>
        <Text>Test photo (EXIF GPS)</Text>
      </Pressable>
      <PanelPomiaruOperacji />
    </View>
  );
}

/** Tryb awaryjny: SHA pary `.db` + `-wal` i rozmiar `-wal` (ADR-0019, P-203); null, dopóki liczenie trwa. */
export function PanelAwaryjny({ sha }: { sha: { sha: string; walBajty: number } | null }): React.ReactElement | null {
  if (!sha) return null;
  return <><Text testID="e2e-sha-bazy" selectable>{sha.sha}</Text><Text testID="e2e-wal-bajty" selectable>{String(sha.walBajty)}</Text></>;
}

/** Wymuszona awaria startu (ADR-0019): znacznik po zapisie „start w toku” (scenariusz 09 czeka na niego, zanim zabije proces). */
export function ZnacznikAwarii({ kolor }: { kolor: string }): React.ReactElement {
  return <View testID="e2e-awaria-startu" style={{ flex: 1, backgroundColor: kolor }} />;
}

/** Data and sync (partia 7, P-230 Q1a): liczba rekordów wysłanych przez atrapę iCloud i usunięcie strefy („tak” / „nie”), bez t(). */
export function PanelIcloud({ wyslane, usuniete }: { wyslane: number; usuniete: boolean }): React.ReactElement {
  return (
    <View style={{ gap: 4 }}>
      <Text testID="e2e-icloud-wyslane">{String(wyslane)}</Text>
      <Text testID="e2e-icloud-usuniete">{usuniete ? 'tak' : 'nie'}</Text>
    </View>
  );
}

/** Dodanie wzoru (partia 6, e2e/README.md `e2e-wzor-pdf`, `e2e-wzor-pdf-skan`, `e2e-wzor-zdjecie`): pliki testowe bez okna Plików i Zdjęć (subflow otworz-wzor-pdf, scenariusze 21, 22, 24, 25). */
export function PanelWzoru(p: { katalogTymczasowy: string; naDodaj(w: { nazwa: string; zrodlo: ZrodloDodania }): void }): React.ReactElement {
  // Źródła testowe składane tutaj (moduł tylko E2E, P-238): napisy i id plików testowych nie trafiają do bundla wydania przez trasę /wzor.
  const plik = (sciezka: string, nazwa: string, typ: string) => ({ id: 'test', nazwa, sciezka, typ });
  const nazwa = 'Test pattern';
  return (
    <View>
      <Pressable accessibilityRole="button" testID="e2e-wzor-pdf" style={{ padding: 12 }}
        onPress={() => p.naDodaj({ nazwa, zrodlo: { rodzaj: 'pdf', plik: plik(pdfTestowyPlik(p.katalogTymczasowy), `${nazwa}.pdf`, 'application/pdf') } })}>
        <Text>Test pattern (PDF)</Text>
      </Pressable>
      {/* P-439 (07-jakosc-002): prawdziwy wycinek skanu z OCR z tests/dane/wzory (scenariusz 21) */}
      <Pressable accessibilityRole="button" testID="e2e-wzor-pdf-skan" style={{ padding: 12 }}
        onPress={() => p.naDodaj({ nazwa, zrodlo: { rodzaj: 'pdf', plik: plik(pdfSkanuTestowy(p.katalogTymczasowy), `${nazwa}.pdf`, 'application/pdf') } })}>
        <Text>Test pattern (PDF, scan)</Text>
      </Pressable>
      <Pressable accessibilityRole="button" testID="e2e-wzor-zdjecie" style={{ padding: 12 }}
        onPress={() => p.naDodaj({ nazwa, zrodlo: { rodzaj: 'obrazy', sciezki: [zdjecieTestowe(p.katalogTymczasowy)] } })}>
        <Text>Test pattern (photo)</Text>
      </Pressable>
      <Pressable accessibilityRole="button" testID="e2e-wzor-www" style={{ padding: 12 }}
        onPress={() => p.naDodaj({ nazwa, zrodlo: { rodzaj: 'adres', adres: ADRES_STRONY_TESTOWEJ } })}>
        <Text>Test pattern (web page)</Text>
      </Pressable>
      <Pressable accessibilityRole="button" testID="e2e-wzor-word" style={{ padding: 12 }}
        onPress={() => p.naDodaj({ nazwa, zrodlo: { rodzaj: 'word', plik: plik(wordTestowy(p.katalogTymczasowy), `${nazwa}.docx`, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') } })}>
        <Text>Test pattern (Word)</Text>
      </Pressable>
      {/* P-282 (W1-A): tabela i obraz z korpusu W1 — Word → PDF w aplikacji (WebKit z gospodarzem), scenariusz informacyjny 07 */}
      {(['tabela', 'obraz'] as const).map((r) => (
        <Pressable key={r} accessibilityRole="button" testID={`e2e-wzor-word-${r}`} style={{ padding: 12 }}
          onPress={() => p.naDodaj({ nazwa, zrodlo: { rodzaj: 'word', plik: plik(wordTestowy(p.katalogTymczasowy, r), `${nazwa}.docx`, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') } })}>
          <Text>{`Test pattern (Word, ${r === 'tabela' ? 'table' : 'image'})`}</Text>
        </Pressable>
      ))}
    </View>
  );
}
function pdfTestowyPlik(katalog: string): string {
  const sciezka = polacz(katalog, `e2e-wzor-${Date.now()}.pdf`);
  zapiszTekst(sciezka, pdfTestowy());
  return sciezka;
}

/** p95 najbliższej rangi (ceil(0,95 · n)-ta wartość rosnąco); brak próbek → null (NFR-WYD-001, scenariusz 31). */
export function p95(probki: readonly number[]): number | null {
  if (!probki.length) return null;
  const s = [...probki].sort((a, b) => a - b);
  return s[Math.ceil(0.95 * s.length) - 1];
}
/** Licznik (P-255 (c)): czas od stuknięcia +1 do klatki po nowej wartości, bez t(). P-456 (M1-062): pierwsze stuknięcie (zimna ścieżka) osobno,
 *  informacyjnie; p95 i n z kolejnych (stan ustalony, budżet NFR-WYD-001): „p95 … ms, n = N · first … ms”. */
export function PanelPomiaru({ probkiMs }: { probkiMs: readonly number[] }): React.ReactElement | null {
  if (!probkiMs.length) return null;
  const [pierwsze, ...ustalone] = probkiMs;
  const p = p95(ustalone);
  const first = `first ${Math.round(pierwsze)} ms`;
  return <Text testID="e2e-pomiar-plus">{p === null ? first : `p95 ${Math.round(p)} ms, n = ${ustalone.length} · ${first}`}</Text>;
}
/** Ekran projektu (E2-137-A1, scenariusz 34): czas od zamontowania ekranu do pierwszych danych, „first data 812 ms”, bez `t()`. Liczba rozstrzyga, czy aplikacja, czy maszyna. */
export function PanelPomiaruLadowania({ ms }: { ms: number }): React.ReactElement {
  return <Text testID="e2e-pomiar-ladowania">{`first data ${Math.round(ms)} ms`}</Text>;
}

/**
 * Udawany zegarek (EXPO_PUBLIC_WATCH_FAKE=1, e2e/README.md:37; transferUserInfo nie działa w symulatorze, ADR-0009): `wyslijStan` zapamiętuje
 * ostatni stan dla panelu `e2e-zegarek-stan` (scen. 15, P-287). Bez zdarzeń z zegarka — te sprawdza urządzenie.
 */
let ostatniStanZegarka: StanZegarka | null = null;
const sluchaczeZegarka = new Set<(s: StanZegarka) => void>();
export const zegarekSztuczny: Zegarek = {
  async wyslijStan(s) { ostatniStanZegarka = s; for (const f of sluchaczeZegarka) f(s); },
  potwierdz: () => undefined,
  odbieraj: () => () => undefined,
};
export function opisStanuZegarka(s: StanZegarka): string {
  const przyp = s.przypomnienia.map((p) => `from ${p.od} every ${p.co} ×${p.razy}: ${p.tekst}`).join('; ');
  return `Watch state: ${s.nazwa} · ${s.wartosc} done · row ${s.wartosc + 1}${przyp ? ` · reminders: ${przyp}` : ''}`;
}
/** Licznik (slot pod kreskami): ostatni stan wysłany do udawanego zegarka. */
export function PanelZegarka(): React.ReactElement {
  const [s, ustaw] = useState<StanZegarka | null>(ostatniStanZegarka);
  useEffect(() => { sluchaczeZegarka.add(ustaw); return () => { sluchaczeZegarka.delete(ustaw); }; }, []);
  return <Text testID="e2e-zegarek-stan">{s ? opisStanuZegarka(s) : 'Watch state: none'}</Text>;
}
