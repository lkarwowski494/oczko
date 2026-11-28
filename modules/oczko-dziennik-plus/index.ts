// Most do modułu Swift OczkoDziennikPlus (ADR-0007, ADR-0008, P-130); jedyne miejsce `requireNativeModule` dla tego modułu.
// Adaptery portów: src/platforma/dziennik-plus.ts, src/platforma/live-activity.ts.
import { requireNativeModule } from 'expo-modules-core';

export interface OczkoDziennikPlusNatywny {
  odczytajTekst(): Promise<string>;
  skroc(doId: string): Promise<void>;
  liveStart(stanJson: string, urzadzenie: string, jezyk: string | null, staleDateMs?: number | null): Promise<string>; // jezyk: język aplikacji (P-139), null = angielski; staleDateMs: ADR-0037 reguła 4 (brak/null = bez staleDate)
  liveAktualizuj(stanJson: string, jezyk: string | null, staleDateMs?: number | null): Promise<void>;
  liveZakoncz(): Promise<void>;
  liveAktywna(): boolean; // ADR-0037 reguła 2: czy istnieje Live Activity Oczka (active albo stale) — zamiast flagi w pamięci procesu
  liveDostepne(): boolean;
  sha256Pliku(sciezka: string): Promise<string>;
  zegarekWyslij(stanJson: string, potwierdzone: string[], jezyk: string | null): Promise<void>; // updateApplicationContext({ stan, potwierdzone, jezyk }), ADR-0009 (2026-10-26) pkt 3, P-139
  addListener(nazwa: 'zegarekZdarzenia', fn: (e: { linie: string[] }) => void): { remove(): void };
}

export const natywny = (): OczkoDziennikPlusNatywny => requireNativeModule<OczkoDziennikPlusNatywny>('OczkoDziennikPlus');
