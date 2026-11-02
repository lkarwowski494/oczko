// Adaptery wyjścia i wejścia plików użytkowniczki (ADR-0016): arkusz udostępniania (expo-sharing 57.0.23, F-32 eksport, F-53, F-57),
// wybór pliku z Plików (expo-document-picker, F-32 import) i prośba o ocenę (expo-store-review 57.0.3, BR-DAN-012). Jedyne miejsce importu tych pakietów.
// Bez sieci w aplikacji: wysyłka tylko przez systemowy arkusz (R-163).
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as StoreReview from 'expo-store-review';
import Constants from 'expo-constants';
import type { PortOceny } from '../przypadki-uzycia/ocena';

const sciezkaZUri = (uri: string): string => decodeURIComponent(uri.replace(/^file:\/\//, ''));

/** Arkusz udostępniania pliku (ścieżka bezwzględna). Anulowanie przez użytkowniczkę nie jest błędem. */
export async function udostepnijPlik(sciezka: string, typ = 'application/octet-stream'): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) return;
  await Sharing.shareAsync(`file://${sciezka}`, { mimeType: typ }).catch(() => undefined);
}
/** Wybór archiwum `.oczko` z Plików; kopia w katalogu tymczasowym aplikacji. `null` = anulowano. */
export async function wybierzArchiwum(): Promise<string | null> {
  const w = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false });
  if (w.canceled || !w.assets?.[0]) return null;
  return sciezkaZUri(w.assets[0].uri);
}
/** Port prośby o ocenę (moduly.md „Prośba o ocenę”): wersja = wersja aplikacji (CFBundleShortVersionString z app.json przy prebuild). */
export const portOcenySklepu: PortOceny = {
  dostepna: () => StoreReview.isAvailableAsync(),
  wersja: () => Constants.expoConfig?.version ?? '',
  popros: () => StoreReview.requestReview(),
};
/** Wybór pliku wzoru z Plików (W7a „Choose file (PDF or Word)”): PDF albo .docx, kopia w katalogu tymczasowym. `null` = anulowano. */
export async function wybierzPlikWzoru(): Promise<{ sciezka: string; nazwa: string; typ: string } | null> {
  const w = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true, multiple: false,
    type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'], // bez msword: Word tylko .docx (ADR-0031 pkt 5, P-353)
  });
  const a = w.canceled ? undefined : w.assets?.[0];
  if (!a) return null;
  return { sciezka: sciezkaZUri(a.uri), nazwa: a.name, typ: a.mimeType ?? '' };
}
