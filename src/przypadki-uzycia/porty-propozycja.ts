// Ponowny eksport typów przeniesionych do src/domena/porty.ts (fix 05 2026-10-25, Z07-22). Plik zostaje, żeby importy
// testów roli 07 działały bez zmian; nowy kod importuje z src/domena/porty.ts.
export type {
  Licznosci, Katalogi, Manifest, TrybImportu, ArchiwumSprawdzone, WynikImportu, Migracja, Migruj, PortArchiwum,
} from '../domena/porty';
