// Miniatury pierwszej strony wzorów (design-spec W8; plan 1.1 pkt 7): plik pochodny PNG w systemowej pamięci podręcznej (`Library/Caches/miniatury/<sha256>.png`,
// poza kopią urządzenia, M1-095), generowany raz na plik PDF przez moduł oczko-wzor (PDFKit). Brak albo błąd = wiersz bez miniatury (nie błąd ekranu);
// katalog usunięty przez system albo „Delete all data” = generacja od nowa.
import type { Wynik } from '../domena/bledy';
import { istniejePlik, polacz, utworzKatalog } from '../dane/pliki/system';
import { plikiPdfWzorow } from '../przypadki-uzycia/wzor';
import type { ZaleznosciPlikow } from '../przypadki-uzycia/zaleznosci';

export async function miniaturyWzorow(z: ZaleznosciPlikow, gen: (pdf: string, cel: string) => Promise<Wynik<void>>, w: { projektId: string }): Promise<Record<string, string>> {
  const p = await plikiPdfWzorow(z, w);
  if (!p.ok) return {};
  const katalog = polacz(z.katalogi.podreczny, 'miniatury');
  utworzKatalog(katalog);
  const gotowe = new Map<string, boolean>();
  const wynik: Record<string, string> = {};
  for (const { wzorId, sha256 } of p.wartosc) {
    const cel = polacz(katalog, `${sha256}.png`);
    if (!gotowe.has(sha256)) gotowe.set(sha256, istniejePlik(cel) || (await gen(z.magazyn.sciezka(sha256), cel)).ok);
    if (gotowe.get(sha256)) wynik[wzorId] = `file://${cel}`;
  }
  return wynik;
}
