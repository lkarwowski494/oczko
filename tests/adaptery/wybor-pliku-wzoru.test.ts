// P-353 (a), ADR-0031 pkt 5: Word to wyłącznie .docx, więc selektor plików wzoru nie oferuje `application/msword` — typ, który
// `rodzajPliku` zawsze odrzuca (alert `wzor.blad_typ`), byłby drogą bez wyjścia dla użytkownika. PDF i .docx zostają.
const mockPobierz = jest.fn();
jest.mock('expo-document-picker', () => ({ getDocumentAsync: (...a: unknown[]) => mockPobierz(...a) }));
jest.mock('expo-sharing', () => ({}));
jest.mock('expo-store-review', () => ({}));
jest.mock('expo-constants', () => ({ __esModule: true, default: { expoConfig: { version: '0.1.0' } } }));

import { wybierzPlikWzoru } from '../../src/platforma/system-plikow-uzytkownika';

const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

test('selektor oferuje PDF i .docx, nie application/msword', async () => {
  mockPobierz.mockResolvedValue({ canceled: true, assets: null });
  await wybierzPlikWzoru();
  const opcje = mockPobierz.mock.calls[0][0] as { type: string[] };
  expect(opcje.type).toEqual(['application/pdf', DOCX]);
  expect(opcje.type).not.toContain('application/msword');
});

test('wybrany plik: ścieżka bez file://, nazwa i typ z selektora; anulowanie → null', async () => {
  mockPobierz.mockResolvedValueOnce({ canceled: false, assets: [{ uri: 'file:///tmp/Mój%20wzór.docx', name: 'Mój wzór.docx', mimeType: DOCX }] });
  expect(await wybierzPlikWzoru()).toEqual({ sciezka: '/tmp/Mój wzór.docx', nazwa: 'Mój wzór.docx', typ: DOCX });
  mockPobierz.mockResolvedValueOnce({ canceled: true, assets: null });
  expect(await wybierzPlikWzoru()).toBeNull();
});
