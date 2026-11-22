#!/usr/bin/env node
// Korpus eksperymentu W1 (moduly.md „Kontrakt partii 6”: render .docx w WKWebView → PDF; P-221 Q2a): cztery minimalne dokumenty Word (tekst, tabela,
// obraz oraz strony.docx: 3 strony z konstrukcji, PU-057/KO-092/P-907) zapisane jako ZIP bez kompresji (OOXML: [Content_Types].xml, _rels/.rels, word/document.xml, word/_rels, media). Treść własna, bez danych.
// Użycie: node modules/oczko-wzor/TestyOknaMaszyn/Testy/korpus/generuj-korpus.mjs  → tekst.docx, tabela.docx, obraz.docx, strony.docx obok skryptu.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { crc32 } from 'node:zlib';

function zip(wpisy) {
  const lokalne = [], centralne = [];
  let off = 0;
  for (const [nazwa, tresc] of wpisy) {
    const n = Buffer.from(nazwa), d = Buffer.isBuffer(tresc) ? tresc : Buffer.from(tresc), c = crc32(d);
    const l = Buffer.alloc(30);
    l.writeUInt32LE(0x04034b50, 0); l.writeUInt16LE(20, 4); l.writeUInt32LE(c, 14); l.writeUInt32LE(d.length, 18); l.writeUInt32LE(d.length, 22); l.writeUInt16LE(n.length, 26);
    const k = Buffer.alloc(46);
    k.writeUInt32LE(0x02014b50, 0); k.writeUInt16LE(20, 4); k.writeUInt16LE(20, 6); k.writeUInt32LE(c, 16); k.writeUInt32LE(d.length, 20); k.writeUInt32LE(d.length, 24); k.writeUInt16LE(n.length, 28); k.writeUInt32LE(off, 42);
    lokalne.push(l, n, d); centralne.push(k, n);
    off += 30 + n.length + d.length;
  }
  const cd = Buffer.concat(centralne), e = Buffer.alloc(22);
  e.writeUInt32LE(0x06054b50, 0); e.writeUInt16LE(wpisy.length, 8); e.writeUInt16LE(wpisy.length, 10); e.writeUInt32LE(cd.length, 12); e.writeUInt32LE(off, 16);
  return Buffer.concat([...lokalne, cd, e]);
}
const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"';
const akapit = (t) => `<w:p><w:r><w:t xml:space="preserve">${t}</w:t></w:r></w:p>`;
const akapitNaNowejStronie = (t) => `<w:p><w:r><w:br w:type="page"/><w:t xml:space="preserve">${t}</w:t></w:r></w:p>`;
const dokument = (cialo) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${W}><w:body>${cialo}</w:body></w:document>`;
const typy = (obraz) => `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>${obraz ? '<Default Extension="png" ContentType="image/png"/>' : ''}<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`;
const rels = '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>';
const relsDok = (obraz) => `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${obraz ? '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/wzor.png"/>' : ''}</Relationships>`;
// PNG 2 × 2 px, szary (obraz bez tekstu: kontrola „tekst albo obraz” w sprawdzPdf).
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAAAAABX3VL4AAAADklEQVR4nGNgYGBgYAAAAAUAAWJVMogAAAAASUVORK5CYII=', 'base64');
const tabela = `<w:tbl><w:tblPr><w:tblBorders><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders></w:tblPr>${
  [['Row', 'Stitches'], ['1', 'knit 20'], ['2', 'purl 20']].map((w) => `<w:tr>${w.map((k) => `<w:tc><w:p><w:r><w:t>${k}</w:t></w:r></w:p></w:tc>`).join('')}</w:tr>`).join('')}</w:tbl>`;
const obraz = `<w:p><w:r><w:drawing><wp:inline><wp:extent cx="1828800" cy="1828800"/><wp:docPr id="1" name="wzor"/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="1" name="wzor.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rId2"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="1828800" cy="1828800"/></a:xfrm><a:prstGeom prst="rect"/></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
const pliki = {
  'tekst.docx': [dokument(akapit('Cast on 20 stitches.') + akapit('Row 1: knit across.') + akapit('Row 2: purl across.')), false],
  'tabela.docx': [dokument(akapit('Chart rows') + tabela), false],
  'obraz.docx': [dokument(obraz), true],
  // PU-057 (KO-092, P-907): 3 strony z konstrukcji — 2 wymuszone podziały strony, każda strona z treścią; oczekiwane „Page 3 of 3” nie zależy od wyniku konwersji.
  'strony.docx': [dokument(akapit('Page one: cast on 20 stitches.') + akapitNaNowejStronie('Page two: knit 10 rows.') + akapitNaNowejStronie('Page three: bind off loosely.')), false],
};
for (const [nazwa, [doc, zObrazem]] of Object.entries(pliki)) {
  const wpisy = [['[Content_Types].xml', typy(zObrazem)], ['_rels/.rels', rels], ['word/document.xml', doc], ['word/_rels/document.xml.rels', relsDok(zObrazem)]];
  if (zObrazem) wpisy.push(['word/media/wzor.png', PNG]);
  writeFileSync(join(import.meta.dirname, nazwa), zip(wpisy));
}
console.log('korpus W1: tekst.docx, tabela.docx, obraz.docx, strony.docx');
