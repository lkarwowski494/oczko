// Adapter wyboru zdjęcia (F-16, BR-PRJ-003; P-191 P9a: arkusz „Take photo / Choose from library”) na expo-image-picker 57.0.20 (ADR-0016).
// Tylko obrazy, bez EXIF w wyniku (`exif: false`). Biblioteka bez prośby o zgodę: wybór systemowy wymaga jej tylko na iOS 10
// (ImagePicker.d.ts, launchImageLibraryAsync; minimum iOS 18, P-070) — plugin ma `photosPermission: false`. Aparat po zgodzie
// (NSCameraUsageDescription z locales). Wynik adaptera własny: Powod jest kontraktem 05 dla domeny.
import * as ImagePicker from 'expo-image-picker';
import { ZDJECIA_WZORU_MAKS } from '../konfiguracja';

export type WynikWyboru = { rodzaj: 'zdjecie'; sciezka: string; rozszerzenie: string } | { rodzaj: 'anulowano' } | { rodzaj: 'brak_zgody' } | { rodzaj: 'blad' };
type WynikModulu = { canceled: true; assets: null } | { canceled: false; assets: { uri: string }[] };
type Opcje = { mediaTypes: ['images']; exif: false; allowsMultipleSelection?: boolean; selectionLimit?: number };
export interface ModulWyboru {
  requestCameraPermissionsAsync(): Promise<{ granted: boolean }>;
  launchCameraAsync(opcje: Opcje): Promise<WynikModulu>;
  launchImageLibraryAsync(opcje: Opcje): Promise<WynikModulu>;
}
const OPCJE: Opcje = { mediaTypes: ['images'], exif: false };

function zUri(uri: string): WynikWyboru {
  const sciezka = decodeURIComponent(uri.replace(/^file:\/\//, ''));
  const kropka = sciezka.lastIndexOf('.');
  return kropka < 0 ? { rodzaj: 'blad' } : { rodzaj: 'zdjecie', sciezka, rozszerzenie: sciezka.slice(kropka + 1).toLowerCase() };
}

/** Zdjęcia stron wzoru (W7a „Choose photos”): kilka naraz (do ZDJECIA_WZORU_MAKS, jak rozszerzenie) = jeden wzór (P-218 (1)). */
export type WynikWyboruStron = { rodzaj: 'zdjecia'; sciezki: string[] } | { rodzaj: 'anulowano' } | { rodzaj: 'blad' };
export function wybieraczZdjec(m: ModulWyboru = ImagePicker): { wybierz(z: 'aparat' | 'biblioteka'): Promise<WynikWyboru>; wybierzStrony(): Promise<WynikWyboruStron> } {
  return {
    async wybierzStrony() {
      try {
        const w = await m.launchImageLibraryAsync({ ...OPCJE, allowsMultipleSelection: true, selectionLimit: ZDJECIA_WZORU_MAKS });
        if (w.canceled || w.assets.length === 0) return { rodzaj: 'anulowano' };
        return { rodzaj: 'zdjecia', sciezki: w.assets.map((a) => decodeURIComponent(a.uri.replace(/^file:\/\//, ''))) };
      } catch {
        return { rodzaj: 'blad' };
      }
    },
    async wybierz(zrodlo) {
      try {
        if (zrodlo === 'aparat' && !(await m.requestCameraPermissionsAsync()).granted) return { rodzaj: 'brak_zgody' };
        const w = await (zrodlo === 'aparat' ? m.launchCameraAsync(OPCJE) : m.launchImageLibraryAsync(OPCJE));
        if (w.canceled) return { rodzaj: 'anulowano' };
        const [a] = w.assets;
        return a ? zUri(a.uri) : { rodzaj: 'anulowano' };
      } catch {
        return { rodzaj: 'blad' };
      }
    },
  };
}
