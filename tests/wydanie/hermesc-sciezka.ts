// Wybór binarki hermesc z paczki hermes-compiler (TF-B3-01). Platforma jest parametrem, żeby wybór dało się sprawdzić na Linuksie także dla macOS.
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export function sciezkaHermesc(korzen: string, _platforma: NodeJS.Platform, istnieje: (p: string) => boolean = existsSync): string | undefined {
  return ['linux64-bin', 'osx-bin'].map((d) => join(korzen, 'node_modules/hermes-compiler/hermesc', d, 'hermesc')).find((p) => istnieje(p));
}
