// Build E2E (e2e/README.md `e2e-zdjecie-testowe`): zdjęcie testowe 48 × 36 JPEG z EXIF GPS celowo (51°28′40″N 0°0′5″W — punkt syntetyczny,
// nie dane osobowe), żeby scenariusze 17 i 42 dodawały zdjęcie bez selektora systemowego, a kontrola EXIF miała co usuwać. Kod tylko dla E2E.
import { otworzDoZapisu, polacz } from '../dane/pliki/system';

const JPEG_B64 = '/9j/4AAQSkZJRgABAQAAAQABAAD/4QCIRXhpZgAATU0AKgAAAAgAAYglAAQAAAABAAAAGgAAAAAABAABAAIAAAACTgAAAAACAAUAAAADAAAAUAADAAIAAAACVwAAAAAEAAUAAAADAAAAaAAAAAAAAAAzAAAAAQAAABwAAAABAAAAKAAAAAEAAAAAAAAAAQAAAAAAAAABAAAABQAAAAH/2wBDAAoHBwgHBgoICAgLCgoLDhgQDg0NDh0VFhEYIx8lJCIfIiEmKzcvJik0KSEiMEExNDk7Pj4+JS5ESUM8SDc9Pjv/2wBDAQoLCw4NDhwQEBw7KCIoOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozv/wAARCAAkADADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwCzRWJ/wkf/AE6f+RP/AK1H/CR/9On/AJE/+tXH9Tr/AMv4o9b63R/m/M26KxP+Ej/6dP8AyJ/9aj/hI/8Ap0/8if8A1qPqdf8Al/FB9bo/zfmbdFYn/CR/9On/AJE/+tR/wkf/AE6f+RP/AK1H1Ov/AC/ig+t0f5vzMSiu2orq/tD+7+P/AADm/s/+9+H/AATiaK7aij+0P7v4/wDAD+z/AO9+H/BOJortqKP7Q/u/j/wA/s/+9+H/AAQoooryz0wooooAKKKKAP/Z';
const ALFABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function zBase64(s: string): Uint8Array {
  const czyste = s.replace(/=+$/, '');
  const wynik = new Uint8Array(Math.floor((czyste.length * 3) / 4));
  let bity = 0, bufor = 0, i = 0;
  for (const z of czyste) {
    bufor = (bufor << 6) | ALFABET.indexOf(z);
    bity += 6;
    if (bity >= 8) { bity -= 8; wynik[i++] = (bufor >> bity) & 0xff; }
  }
  return wynik;
}
/** Zapisuje zdjęcie testowe w katalogu tymczasowym i zwraca ścieżkę (do `dodajZdjecie`). */
export function zdjecieTestowe(katalog: string): string {
  const sciezka = polacz(katalog, 'e2e-zdjecie-testowe.jpg');
  const p = otworzDoZapisu(sciezka);
  try { p.zapisz(zBase64(JPEG_B64)); } finally { p.zamknij(); }
  return sciezka;
}
