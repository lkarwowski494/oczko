// Ścieżki danych aplikacji (ADR-0001: Application Support, nie Documents ani Caches; ADR-0015: nowa ścieżka bazy, stary plik nietknięty).
// sygnatura: propozycja 07, zatwierdzona w fix 05 2026-10-25 (Z07-22).

/** Nazwa pliku bazy — jedyne miejsce literału (P-180); także wpis archiwum `.oczko` (ADR-0004) i pliki surowej kopii (ADR-0020). */
export const PLIK_BAZY = 'oczko.db';

export type SciezkiDanych = { baza: string; pliki: string; kopie: string; kopiePrzed: string; dziennik: string; stanStartu: string };
/** `katalogBiblioteki` = katalog `Library` kontenera aplikacji. Baza wersji 0.1.0 nie ma tu ścieżki (P-070, ADR-0015). */
export function sciezkiDanych(katalogBiblioteki: string): SciezkiDanych {
  const biblioteka = katalogBiblioteki.replace(/\/+$/, '');
  const as = `${biblioteka}/Application Support`;
  return {
    baza: `${as}/${PLIK_BAZY}`,
    pliki: `${as}/pliki`,
    kopie: `${as}/kopie`,
    kopiePrzed: `${biblioteka.slice(0, biblioteka.lastIndexOf('/'))}/Documents/Backup`, // ADR-0028: widoczne w Plikach (UIFileSharingEnabled); kopie przed importem i usunięciem
    dziennik: `${as}/dziennik-plus.jsonl`, // ADR-0008
    stanStartu: `${as}/stan-startu.json`, // ADR-0019: poza bazą, zapisywany przed jej otwarciem
  };
}
