// Dziennik +1 z ekranu blokady (ADR-0008): odczyt pliku .jsonl po stronie TS (złote pliki wspólne z XCTest, Z07-11).
// sygnatura: propozycja 07, zatwierdzona w fix 05 2026-10-25 (Z07-22). Reguły odczytu: tests/wspolne/README.md (1–5), ADR-0008 (3), (4).
// ADR-0008 (8) (fix-3 05, P-124; wdraża 08 w partii 3): odczyt odzyskuje zdarzenie ze sklejonej linii (8R), `skroc` usuwa ucięty ogon za `doId` (8S);
// wektory `sklejenie`, `skrocenie` w tests/wspolne/wzorce.json, test oczekujący tests/akceptacja/dane/dziennik-sklejenie.test.ts.
// `pro` w linii: stan uprawnienia urządzenia w chwili stuknięcia (P-111 (2), ADR-0008 (6)); linia bez `pro` nie spełnia typu.
import type { DziennikPlus, PortBazy, ZdarzenieWejsciowe } from '../domena/porty';
import { DZIENNIK_BLAD_TEKST_MAKS } from '../konfiguracja';
import { przytnijBledy } from './repozytoria/bledy';
import { czytajTekst, istniejePlik, zapiszTekst } from './pliki/system';

const RODZAJE: readonly string[] = ['plus', 'minus'];
const ZRODLA: readonly string[] = ['ekran_blokady', 'zegarek'];
const DZIEN = /^\d{4}-\d{2}-\d{2}$/;

/** Linia → ZdarzenieWejsciowe z samymi polami typu (nieznane pomijane, ADR-0008 (4)); null = linia nie spełnia typu. */
function zdarzenieZLinii(linia: string): ZdarzenieWejsciowe | null {
  let v: unknown;
  try {
    v = JSON.parse(linia);
  } catch {
    return null; // zły JSON (np. ucięta linia) = linia uszkodzona
  }
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return null;
  if (!('id' in v) || typeof v.id !== 'string' || !v.id) return null;
  if (!('licznikId' in v) || typeof v.licznikId !== 'string' || !v.licznikId) return null;
  if (!('rodzaj' in v) || typeof v.rodzaj !== 'string' || !RODZAJE.includes(v.rodzaj)) return null;
  if (!('rodzice' in v) || !Array.isArray(v.rodzice) || !v.rodzice.every((r: unknown) => typeof r === 'string')) return null;
  if (!('czasMs' in v) || typeof v.czasMs !== 'number' || !Number.isInteger(v.czasMs)) return null;
  if (!('strefa' in v) || typeof v.strefa !== 'string' || !v.strefa) return null;
  if (!('dzien' in v) || typeof v.dzien !== 'string' || !DZIEN.test(v.dzien)) return null;
  if (!('zrodlo' in v) || typeof v.zrodlo !== 'string' || !ZRODLA.includes(v.zrodlo)) return null;
  if (!('urzadzenie' in v) || typeof v.urzadzenie !== 'string') return null;
  if (!('pro' in v) || typeof v.pro !== 'boolean') return null;
  const rodzice: string[] = v.rodzice.filter((r: unknown): r is string => typeof r === 'string');
  return {
    id: v.id, licznikId: v.licznikId, rodzaj: v.rodzaj === 'minus' ? 'minus' : 'plus', rodzice, czasMs: v.czasMs, strefa: v.strefa, dzien: v.dzien,
    zrodlo: v.zrodlo === 'zegarek' ? 'zegarek' : 'ekran_blokady', urzadzenie: v.urzadzenie, pro: v.pro,
  };
}

/**
 * Linia → zdarzenie albo null; linia sklejona z uciętym ogonem (pisarz bez reguły (8A)) daje zdarzenie z reszty linii od najmniejszego
 * `{` na pozycji k > 0, przy którym reszta spełnia typ (ADR-0008 (8R)); reszta poprawna jako JSON, ale nie zdarzenie, nic nie daje (S-02).
 */
function odczytajLinie(linia: string): { zdarzenie: ZdarzenieWejsciowe | null; cala: boolean } {
  const z = zdarzenieZLinii(linia);
  if (z) return { zdarzenie: z, cala: true };
  for (let k = linia.indexOf('{', 1); k > 0; k = linia.indexOf('{', k + 1)) {
    const reszta = zdarzenieZLinii(linia.slice(k));
    if (reszta) return { zdarzenie: reszta, cala: false };
  }
  return { zdarzenie: null, cala: false };
}

/** Odczyt pliku: zdarzenia (także odzyskane ze sklejonych linii, 8R) i uszkodzone linie z numerem od 1 i treścią (diagnostyka ADR-0008 (3′)). */
function odczytajTekst(tekst: string): { zdarzenia: ZdarzenieWejsciowe[]; uszkodzone: { linia: number; tekst: string }[] } {
  const zdarzenia: ZdarzenieWejsciowe[] = [];
  const uszkodzone: { linia: number; tekst: string }[] = [];
  tekst.split('\n').forEach((linia, i) => {
    if (!linia.trim()) return; // pusty plik albo `\n` na końcu: brak linii
    const { zdarzenie, cala } = odczytajLinie(linia);
    if (zdarzenie) zdarzenia.push(zdarzenie);
    if (!cala) uszkodzone.push({ linia: i + 1, tekst: linia });
  });
  return { zdarzenia, uszkodzone };
}

/** Uszkodzona linia (ucięta, zły JSON, brak pola) zgłoszona; zdarzenie ze sklejonej linii odzyskane (8R); poprzednie zachowane. `uszkodzone` = numery linii od 1. */
export function parsujDziennik(tekst: string): { zdarzenia: ZdarzenieWejsciowe[]; uszkodzone: number[] } {
  const { zdarzenia, uszkodzone } = odczytajTekst(tekst);
  return { zdarzenia, uszkodzone: uszkodzone.map((u) => u.linia) };
}

/**
 * ADR-0008 (3′): wpis `blad` z całą linią (najwyżej DZIENNIK_BLAD_TEKST_MAKS znaków; linia ma tylko identyfikatory, czas i strefę, NFR-PRY-001);
 * ta sama linia nie dostaje drugiego wpisu przy kolejnych scaleniach (samotny ogon, którego R-024 nie pozwala skrócić).
 */
function zapiszUszkodzonaLinie(baza: PortBazy, czasMs: number, linia: number, tekst: string): Promise<void> {
  const t = tekst.slice(0, DZIENNIK_BLAD_TEKST_MAKS);
  return baza.transakcja(async (tx) => {
    await tx.run(
      `INSERT INTO blad (czas_ms, kod, szczegoly) SELECT ?, 'dziennik_uszkodzona_linia', ?
       WHERE NOT EXISTS (SELECT 1 FROM blad WHERE kod = 'dziennik_uszkodzona_linia' AND json_extract(szczegoly, '$.tekst') = ?)`,
      [czasMs, JSON.stringify({ linia, tekst: t }), t],
    );
    await przytnijBledy(tx);
  }).catch(() => undefined); // diagnostyka nie zmienia wyniku odczytu (jak zapiszBlad)
}

/** Źródło pliku dziennika: surowy tekst i skrócenie (Node: plik; urządzenie: moduł Swift `OczkoDziennikPlus`, jedyny pisarz — ADR-0008 (8A)). */
export interface ZrodloDziennika {
  tekst(): Promise<string>;
  skroc(doId: string): Promise<void>;
}

/**
 * Port DziennikPlus nad źródłem tekstu: odczyt i diagnostyka w TS (uszkodzona linia → `blad`, ADR-0008 (3′)), skrócenie u źródła.
 */
export function utworzDziennik(zrodlo: ZrodloDziennika, baza: PortBazy): DziennikPlus {
  return {
    async odczytaj() {
      const { zdarzenia, uszkodzone } = odczytajTekst(await zrodlo.tekst());
      // Chwila zapisu diagnostyki: zegar systemu w adapterze platformy (przypadki użycia biorą czas z portu Zegar).
      for (const u of uszkodzone) await zapiszUszkodzonaLinie(baza, Date.now(), u.linia, u.tekst);
      return zdarzenia;
    },
    skroc: (doId) => zrodlo.skroc(doId),
  };
}

/** (8S) na tekście pliku: linie do `doId` włącznie (także w linii sklejonej) i ucięty ogon za nim; null = brak `doId` (bez zmian, R-024). */
export function poSkroceniu(tekst: string, doId: string): string | null {
  const linie = tekst.split('\n'); // ostatni element: bajty po ostatnim `\n` (pusty albo ucięty ogon)
  const i = linie.findIndex((l) => odczytajLinie(l).zdarzenie?.id === doId);
  if (i < 0) return null;
  const reszta = linie.slice(i + 1); // pełne linie po `doId` zostają (R-022)
  if (reszta.length > 0) reszta[reszta.length - 1] = '';
  return reszta.join('\n');
}

/** Adapter na pliku (Node, testy; w aplikacji: moduł Swift `oczko-dziennik-plus`, src/platforma/dziennik-plus.ts). */
export function utworzDziennikNode(sciezka: string, baza: PortBazy): DziennikPlus {
  return utworzDziennik({
    tekst: async () => (istniejePlik(sciezka) ? czytajTekst(sciezka) : ''),
    async skroc(doId) {
      if (!istniejePlik(sciezka)) return;
      const nowy = poSkroceniu(await czytajTekst(sciezka), doId);
      if (nowy !== null) zapiszTekst(sciezka, nowy);
    },
  }, baza);
}
