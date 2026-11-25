// Build E2E (zrzuty sklepu; 10-wydanie-014, sesja AH): wzór PDF z treścią do kadrów 03 i 04 zamiast „Test pattern” (dwa wiersze o jednym słowie na stronie).
// Jedna strona A4/Letter: tytuł i 12 wierszy instrukcji po angielsku albo po polsku (dane fikcyjne; terminy „oczko prawe/lewe”, „warkocz”, „rząd” jak w BRD i atlasie technik).
// Czcionka Helvetica z tablicą /Differences dla polskich liter (kody 128–145), bo kodowanie WinAnsi ich nie ma; plik jest czystym ASCII (znaki specjalne jako ósemkowe sekwencje).
// Moduł bez importów i bez t(): ładowany wyłącznie z panele.tsx (tryb-e2e, P-238), nie trafia do bundla wydania.
// ZR8b (KO-202, P-1038): wiersze od 7. (indeks 0-based; „Row 21”/„Rząd 21” to indeks 7) są obniżone o PRZERWA_ZNACZNIKA_PKT. Domyślny znacznik rzędu to pas 0,02 strony wokół środka strony (396 pkt od góry);
// bez przerwy leżał na tekście wiersza 21 (linia bazowa 390), a odstęp 40 pkt między wierszami jest za wąski na pas 15,84 pkt z marginesem. Wiersze 0–6 (w tym „Row 9”, „Row 13” zakreślane w scenach) stoją jak przed zmianą.
// Pas (388,08–403,92 pkt od góry) leży teraz w pustym pasie między wierszem 20 (dół tekstu ok. 365 pkt) a wierszem 21 (góra tekstu ok. 426 pkt): margines ≈ 22 pkt PDF z każdej strony. Test: tests/wydanie/wzor-sklepu-znacznik-przerwa.test.ts.
export type KluczWzoru = 'en' | 'pl';

export const WZORY_SKLEPU: Record<KluczWzoru, { nazwa: string; wiersze: readonly string[] }> = {
  en: {
    nazwa: 'Cable Hat',
    wiersze: [
      'Gauge: 22 stitches and 30 rows = 10 cm in stockinette.',
      'Cast on 96 stitches and join in the round.',
      'Rows 1-8: knit 2, purl 2 to the end.',
      'Row 9: knit 3, cable over 4 stitches, knit 3, repeat.',
      'Rows 10-12: knit all stitches.',
      'Row 13: knit 3, cable over 4 stitches, knit 3, repeat.',
      'Rows 14-20: knit all stitches.',
      'Row 21: knit 2 together around, 48 stitches left.',
      'Row 22: knit all stitches.',
      'Row 23: knit 2 together around, 24 stitches left.',
      'Cut the yarn and pull it through the remaining stitches.',
      'Pull tight and weave in the ends.',
    ],
  },
  pl: {
    nazwa: 'Czapka z warkoczem',
    wiersze: [
      'Próbka: 22 oczka i 30 rzędów = 10 cm ściegiem pończoszniczym.',
      'Nabierz 96 oczek i połącz w okrąg.',
      'Rzędy 1-8: 2 oczka prawe, 2 oczka lewe do końca.',
      'Rząd 9: 3 oczka prawe, warkocz na 4 oczka, 3 oczka prawe, powtarzaj.',
      'Rzędy 10-12: wszystkie oczka prawe.',
      'Rząd 13: 3 oczka prawe, warkocz na 4 oczka, 3 oczka prawe, powtarzaj.',
      'Rzędy 14-20: wszystkie oczka prawe.',
      'Rząd 21: przerabiaj po 2 oczka razem, zostanie 48 oczek.',
      'Rząd 22: wszystkie oczka prawe.',
      'Rząd 23: przerabiaj po 2 oczka razem, zostanie 24 oczka.',
      'Utnij włóczkę i przeciągnij ją przez pozostałe oczka.',
      'Zaciągnij mocno i schowaj końcówki.',
    ],
  },
};

const LITERY = 'ĄąĆćĘęŁłŃńÓóŚśŹźŻż';
const NAZWY_GLIFOW = ['Aogonek', 'aogonek', 'Cacute', 'cacute', 'Eogonek', 'eogonek', 'Lslash', 'lslash', 'Nacute', 'nacute', 'Oacute', 'oacute', 'Sacute', 'sacute', 'Zacute', 'zacute', 'Zdotaccent', 'zdotaccent'];

/** Tekst do napisu PDF: nawiasy i ukośnik z ucieczką, polskie litery jako kody 128–145 (ósemkowo). */
export function napisPdf(t: string): string {
  let w = '';
  for (const z of t) {
    const i = LITERY.indexOf(z);
    if (i >= 0) w += `\\${(128 + i).toString(8)}`;
    else if (z === '(' || z === ')' || z === '\\') w += `\\${z}`;
    else if (z.charCodeAt(0) > 126) throw new Error(`znak spoza zestawu wzoru sklepu: ${z}`);
    else w += z;
  }
  return w;
}

/** Obniżenie wierszy od indeksu PIERWSZY_WIERSZ_PO_PRZERWIE (pkt PDF): pusty pas na domyślny znacznik rzędu (patrz nagłówek). */
export const PRZERWA_ZNACZNIKA_PKT = 38;
export const PIERWSZY_WIERSZ_PO_PRZERWIE = 7;
/** Linia bazowa (pkt PDF od dołu strony) wiersza o indeksie i (0 = „Gauge”/„Próbka”). */
export const yBazowaWiersza = (i: number): number => 670 - i * 40 - (i >= PIERWSZY_WIERSZ_PO_PRZERWIE ? PRZERWA_ZNACZNIKA_PKT : 0);

export function pdfWzoruSklepu(klucz: KluczWzoru): string {
  const wzor = WZORY_SKLEPU[klucz];
  const linie = [`BT /F2 26 Tf 72 720 Td (${napisPdf(wzor.nazwa)}) Tj ET`];
  wzor.wiersze.forEach((w, i) => linie.push(`BT /F1 15 Tf 72 ${yBazowaWiersza(i)} Td (${napisPdf(w)}) Tj ET`));
  const s = linie.join('\n');
  const obiekty = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>',
    `<< /Length ${s.length} >>\nstream\n${s}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding 7 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding 7 0 R >>',
    `<< /Type /Encoding /BaseEncoding /WinAnsiEncoding /Differences [128 ${NAZWY_GLIFOW.map((g) => `/${g}`).join(' ')}] >>`,
  ];
  let pdf = '%PDF-1.4\n';
  const przesuniecia: number[] = [];
  obiekty.forEach((o, i) => { przesuniecia.push(pdf.length); pdf += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${obiekty.length + 1}\n0000000000 65535 f \n${przesuniecia.map((p) => `${String(p).padStart(10, '0')} 00000 n \n`).join('')}`;
  return `${pdf}trailer\n<< /Size ${obiekty.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
}
