// Rodzaj pliku wzoru z nazwy i typu (UTI albo MIME) — jedna reguła dla skrzynki importu, wyboru pliku w aplikacji i arkusza udostępniania
// (07-jakosc-017, ADR-0031 pkt 5, K-17h). Word to wyłącznie .docx: iOS nie ma systemowego czytnika .doc, a konwersję sprawdzono tylko na .docx.
// Dlaczego jedna funkcja: trzy rozjechane kopie reguły („.doc” przyjęty w skrzynce, a arkusz udostępniania pokazywał Oczko tylko dla .docx) dawały
// zachowanie zależne od drogi dodania pliku.
export type RodzajPliku = 'pdf' | 'word' | 'obraz';
/** Jedyny UTI Worda w `targets/share/Info.plist` (reguła aktywacji arkusza) i w klasyfikacji Swift (`rodzajZalacznika`): .docx. */
export const UTI_WORD = 'org.openxmlformats.wordprocessingml.document';

const OBRAZ = /^image\/|public\.(image|jpeg|png|heic)/i;
const PDF_TYP = /pdf/i;
const PDF_NAZWA = /\.pdf$/i;
const WORD_TYP = /wordprocessingml\.document/i;
const WORD_NAZWA = /\.docx$/i;

/** `null` = typ nieobsługiwany (w tym .doc i application/msword): alert `wzor.blad_typ`. Obraz rozpoznaje tylko typ, PDF i Word typ albo nazwa. */
export function rodzajPliku(nazwa: string, typ: string): RodzajPliku | null {
  if (OBRAZ.test(typ)) return 'obraz';
  if (PDF_TYP.test(typ) || PDF_NAZWA.test(nazwa)) return 'pdf';
  if (WORD_TYP.test(typ) || WORD_NAZWA.test(nazwa)) return 'word';
  return null;
}
