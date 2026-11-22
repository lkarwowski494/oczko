// Przekodowanie zdjęcia do JPEG z pikseli (P-219 2A): expo-image-manipulator 57.0.21 — `manipulate(uri).renderAsync()`, potem `saveAsync`
// (iOS: `UIImage.jpegData`, ImageManipulatorUtils.swift:76 — nowe kodowanie, bez EXIF/GPS źródła; plik w cache/ImageManipulator).
// Druga kontrola metadanych w JS (`usunMetadaneJpeg`) robi kompozycja. Jakość 0,9 — kompromis rozmiaru i wyglądu zdjęcia robótki.
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

const JAKOSC = 0.9;
export async function przekodujDoJpeg(sciezka: string): Promise<string> {
  const obraz = await ImageManipulator.manipulate(`file://${sciezka.split('/').map(encodeURIComponent).join('/')}`).renderAsync();
  const w = await obraz.saveAsync({ format: SaveFormat.JPEG, compress: JAKOSC });
  return decodeURIComponent(w.uri.replace(/^file:\/\//, ''));
}
