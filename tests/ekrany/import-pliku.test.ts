// Otwarcie pliku `.oczko` z Plików (ADR-0004): adres pliku → /ustawienia?import=<ścieżka>; inne adresy bez przekierowania (null).
import { sciezkaImportu } from '../../src/kompozycja/import-pliku';

test('file:// z .oczko (także wielkie litery i spacje zakodowane) → Ustawienia z importem; inne → null', () => {
  expect(sciezkaImportu('file:///private/var/mobile/Inbox/Kopia%2026-10.oczko'))
    .toBe(`/ustawienia?import=${encodeURIComponent('/private/var/mobile/Inbox/Kopia 26-10.oczko')}`);
  expect(sciezkaImportu('file:///tmp/A.OCZKO')).toBe(`/ustawienia?import=${encodeURIComponent('/tmp/A.OCZKO')}`);
  expect(sciezkaImportu('oczko://projekty')).toBeNull();
  expect(sciezkaImportu('/projekty')).toBeNull();
  expect(sciezkaImportu('file:///tmp/zdjecie.jpg')).toBeNull();
  expect(sciezkaImportu('file:///tmp/zly%E0.oczko')).toBeNull(); // niepoprawne kodowanie: bez wyjątku (crash przy starcie)
});
