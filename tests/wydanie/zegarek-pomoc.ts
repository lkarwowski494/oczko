/* Pomocnik testów zrzutów zegarka (ZW1, KO-197): składanie małych PNG w pamięci (8-bitowe RGB/RGBA, bez przeplotu, filtr 0) bez ImageMagicka.
 * Dlaczego: testy kontroli kompletu i porównania kadrów nie mogą zależeć od narzędzi macOS ani od plików binarnych w repo. */
import { crc32, deflateSync } from 'zlib';

const SYGNATURA = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const kawalek = (typ: string, dane: Buffer): Buffer => {
  const t = Buffer.from(typ, 'latin1');
  const dl = Buffer.alloc(4); dl.writeUInt32BE(dane.length);
  const suma = Buffer.alloc(4); suma.writeUInt32BE(crc32(Buffer.concat([t, dane])) >>> 0);
  return Buffer.concat([dl, t, dane, suma]);
};

/** PNG `szer × wys`; `piksel(x, y)` → [r, g, b] (domyślnie czarny); `alfa` = RGBA (typ 6) zamiast RGB (typ 2). */
export function png(szer: number, wys: number, opcje: { alfa?: boolean; piksel?: (x: number, y: number) => [number, number, number] } = {}): Buffer {
  const bpp = opcje.alfa ? 4 : 3;
  const wiersz = szer * bpp;
  const surowe = Buffer.alloc((wiersz + 1) * wys);
  for (let y = 0; y < wys; y++) {
    for (let x = 0; x < szer; x++) {
      const [r, g, b] = opcje.piksel ? opcje.piksel(x, y) : [0, 0, 0];
      const o = y * (wiersz + 1) + 1 + x * bpp;
      surowe[o] = r; surowe[o + 1] = g; surowe[o + 2] = b;
      if (opcje.alfa) surowe[o + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(szer, 0); ihdr.writeUInt32BE(wys, 4); ihdr[8] = 8; ihdr[9] = opcje.alfa ? 6 : 2;
  return Buffer.concat([SYGNATURA, kawalek('IHDR', ihdr), kawalek('IDAT', deflateSync(surowe)), kawalek('IEND', Buffer.alloc(0))]);
}

/** Kadr „ekran z treścią o danym numerze”: tło czarne, prostokąt (poniżej górnego pasa z zegarem) w barwie zależnej od `tresc`; `zegar` zmienia tylko górny pas. */
export function kadr(szer: number, wys: number, tresc: number, zegar = 0, alfa = false): Buffer {
  const barwa: [number, number, number] = [40 + ((tresc * 53) % 200), 40 + ((tresc * 97) % 200), 40 + ((tresc * 31) % 200)];
  return png(szer, wys, {
    alfa,
    piksel: (x, y) => {
      if (y < wys * 0.1 && x > szer * 0.6) return [zegar * 40 % 256, 255, 255]; // zegar systemowy, prawy górny róg
      return x > szer * 0.2 && x < szer * 0.8 && y > wys * 0.35 && y < wys * 0.7 ? barwa : [0, 0, 0];
    },
  });
}
