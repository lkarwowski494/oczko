// Build E2E (P-230 Q2a, scenariusz 52): zlecenie testowe w skrzynce App Group, zapisane tak jak robi to rozszerzenie (plik, potem manifest
// przez plik tymczasowy i rename; projekt nieznany → arkusz „1 pattern to add”). Ładowany tylko z tryb-e2e.ts przy EXPO_PUBLIC_E2E=1 (P-238).
import { istniejeKatalog, polacz, przenies, utworzKatalog, zapiszTekst } from '../../dane/pliki/system';

/** Dwustronicowy PDF testowy (tekst na każdej stronie: kontrola `sprawdzPdf` — tekst albo obraz); ten sam co panel `e2e-wzor-pdf`. */
export function pdfTestowy(): string {
  const obiekty = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R 5 0 R] /Count 2 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 7 0 R >> >> >>',
    null, // treść strony 1
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 6 0 R /Resources << /Font << /F1 7 0 R >> >> >>',
    null, // treść strony 2
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  const tresc = (t: string) => { const s = `BT /F1 24 Tf 72 700 Td (${t}) Tj ET`; return `<< /Length ${s.length} >>\nstream\n${s}\nendstream`; };
  obiekty[3] = tresc('Row 1: knit across');
  obiekty[5] = tresc('Row 2: purl across');
  let pdf = '%PDF-1.4\n';
  const przesuniecia: number[] = [];
  obiekty.forEach((o, i) => { przesuniecia.push(pdf.length); pdf += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${obiekty.length + 1}\n0000000000 65535 f \n${przesuniecia.map((p) => `${String(p).padStart(10, '0')} 00000 n \n`).join('')}`;
  return `${pdf}trailer\n<< /Size ${obiekty.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
}

/** Jedno zlecenie bez projektu; drugi start z tym samym argumentem nie dokłada kolejnego (katalog o stałej nazwie). */
export function wlozZlecenieTestowe(grupa: string, terazMs: number): void {
  const id = 'e2e-skrzynka-pdf';
  const k = polacz(grupa, 'skrzynka', id);
  if (istniejeKatalog(k)) return;
  utworzKatalog(k);
  zapiszTekst(polacz(k, 'Harbor test pattern.pdf'), pdfTestowy());
  const m = { id, rodzaj: 'plik', nazwa: 'Harbor test pattern.pdf', sciezki: ['Harbor test pattern.pdf'], adres: null, typ: 'com.adobe.pdf', projektId: null, utworzonoMs: terazMs };
  zapiszTekst(polacz(k, 'zlecenie.json.tmp'), JSON.stringify(m));
  przenies(polacz(k, 'zlecenie.json.tmp'), polacz(k, 'zlecenie.json'));
}
