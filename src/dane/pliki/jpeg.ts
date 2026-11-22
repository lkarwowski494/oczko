// JPEG bez metadanych (P-219 2A; druga kontrola po przekodowaniu natywnym expo-image-manipulator). Przechodzi przez segmenty nagłówka do SOS:
// usuwa APP1 i APP3–APP15 (Exif z GPS, XMP, MPF…) i COM; zostawia APP0 (JFIF), APP2 tylko z „ICC_PROFILE” (profil kolorów, bez danych osobowych)
// i segmenty obrazu. Od SOS do końca bajty bez zmian. Nie-JPEG albo ucięty nagłówek → null (wołający nie zapisuje pliku).
const ICC = [0x49, 0x43, 0x43, 0x5f, 0x50, 0x52, 0x4f, 0x46, 0x49, 0x4c, 0x45, 0x00]; // "ICC_PROFILE\0"

function zostaje(b: Uint8Array, znacznik: number, poczatek: number): boolean {
  if (znacznik === 0xfe) return false;                       // COM
  if (znacznik < 0xe0 || znacznik > 0xef) return true;       // segmenty obrazu (DQT, SOF, DHT, DRI…)
  if (znacznik === 0xe0) return true;                        // APP0 JFIF
  if (znacznik === 0xe2) return ICC.every((x, i) => b[poczatek + 4 + i] === x);
  return false;
}

export function usunMetadaneJpeg(b: Uint8Array): Uint8Array | null {
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return null;
  const czesci: Uint8Array[] = [b.subarray(0, 2)];
  let i = 2;
  for (;;) {
    if (i + 4 > b.length || b[i] !== 0xff) return null;
    const znacznik = b[i + 1] ?? 0;
    if (znacznik === 0xda) { czesci.push(b.subarray(i)); break; } // SOS: dalej dane obrazu
    const dl = ((b[i + 2] ?? 0) << 8) | (b[i + 3] ?? 0);
    if (dl < 2 || i + 2 + dl > b.length) return null;
    if (zostaje(b, znacznik, i)) czesci.push(b.subarray(i, i + 2 + dl));
    i += 2 + dl;
  }
  const wynik = new Uint8Array(czesci.reduce((n, c) => n + c.length, 0));
  let o = 0;
  for (const c of czesci) { wynik.set(c, o); o += c.length; }
  return wynik;
}

/** Czy nagłówek JPEG niesie segment metadanych (APP1, APP3–APP15, COM albo APP2 inny niż ICC); nie-JPEG → true (nie ufamy). */
export function maMetadane(b: Uint8Array): boolean {
  const c = usunMetadaneJpeg(b);
  return c === null || c.length !== b.length;
}
