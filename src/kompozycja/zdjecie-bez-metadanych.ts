// Każde zdjęcie przy zapisie bez metadanych i GPS (P-219 2A; aparat, biblioteka, etykieta, wzorzec E2E): przekodowanie natywne do JPEG,
// potem druga kontrola w JS (segmenty APPn/COM) i zapis do katalogu tymczasowego — dopiero ten plik idzie do `dodajZdjecie` albo do
// udostępnienia. Nie-JPEG po przekodowaniu → null (zdjęcie nie jest zapisywane). Zależności wstrzyknięte: test w Node na prawdziwych plikach.
import { usunMetadaneJpeg } from '../dane/pliki/jpeg';

export type ZaleznosciObrazu = {
  przekoduj(sciezka: string): Promise<string>;
  czytaj(sciezka: string): Uint8Array;
  zapisz(sciezka: string, bajty: Uint8Array): void;
  usun(sciezka: string): void;
  tymczasowy: string;
  nazwa(): string;
};
export async function zdjecieBezMetadanych(sciezka: string, o: ZaleznosciObrazu): Promise<{ sciezka: string; rozszerzenie: 'jpg' } | null> {
  const jpeg = await o.przekoduj(sciezka);
  try {
    const czyste = usunMetadaneJpeg(o.czytaj(jpeg));
    if (!czyste) return null;
    const cel = `${o.tymczasowy}/${o.nazwa()}.jpg`;
    o.zapisz(cel, czyste);
    return { sciezka: cel, rozszerzenie: 'jpg' };
  } finally {
    if (jpeg !== sciezka) o.usun(jpeg); // plik pośredni z cache manipulatora
  }
}
