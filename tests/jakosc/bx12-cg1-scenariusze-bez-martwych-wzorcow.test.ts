// BX12 / CG-1 (P2, `docs/jakosc/cg-pu-otwarte.md`): komentarze scenariuszy nie wskazują katalogu zrzutów wzorcowych, którego nie ma w repo
// (`docs/design/wzorce-zrzuty/` usunięty w CI-01 razem z porównaniem zrzutów, słowa właściciela 16.11.2026, wariant B). Powód: martwa ścieżka w nagłówku
// kieruje następną osobę do dokumentu, którego nie ma (PU-134, scenariusz 30).
import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = path.resolve(__dirname, '../..');
const KAT = path.join(ROOT, 'e2e/scenariusze');

test('CG-1: scenariusze nie odwołują się do nieistniejącego docs/design/wzorce-zrzuty/', () => {
  expect(fs.existsSync(path.join(ROOT, 'docs/design/wzorce-zrzuty'))).toBe(false); // założenie testu: katalogu nie ma; gdy wróci, test do przeglądu
  const wskazujace = fs.readdirSync(KAT).filter((f) => f.endsWith('.yaml') && fs.readFileSync(path.join(KAT, f), 'utf8').includes('docs/design/wzorce-zrzuty'));
  expect(wskazujace).toEqual([]);
});
