// Zastępnik `expo-file-system` (nowe API: File, Directory, FileHandle, Paths) w Jest (P-120 Q1a, jak Trening `tests/setup.js`):
// podzbiór używany przez src/dane/pliki/system.ts, na prawdziwym dysku (node:fs). Kod testu, nie aplikacji.
import { closeSync, copyFileSync, existsSync, fstatSync, mkdirSync, openSync, readdirSync, readFileSync, readSync, renameSync, rmSync, statSync, writeFileSync, appendFileSync, writeSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const sciezka = (uri: string): string => (uri.startsWith('file://') ? fileURLToPath(uri) : uri);
const uriZ = (czesci: (string | Plik | Katalog)[]): string => {
  const u = czesci.map((c) => (typeof c === 'string' ? c : c.uri)).join('/');
  return u.startsWith('file://') ? `file://${u.slice(7).replace(/\/{2,}/g, '/')}` : u.replace(/\/{2,}/g, '/');
};

export enum FileMode { ReadWrite = 'rw', ReadOnly = 'r', WriteOnly = 'w', Append = 'wa', Truncate = 'wt' }

export class FileHandle {
  offset: number | null = 0;
  constructor(private fd: number | null) {}
  get size(): number | null { return this.fd === null ? null : fstatSync(this.fd).size; }
  readBytes(dlugosc: number): Uint8Array<ArrayBuffer> {
    if (this.fd === null) throw new Error('FileHandle zamknięty');
    const b = new Uint8Array(new ArrayBuffer(dlugosc));
    const n = readSync(this.fd, b, 0, dlugosc, this.offset ?? 0);
    this.offset = (this.offset ?? 0) + n;
    return n === dlugosc ? b : new Uint8Array(b.buffer.slice(0, n));
  }
  writeBytes(bajty: Uint8Array): void {
    if (this.fd === null) throw new Error('FileHandle zamknięty');
    const n = writeSync(this.fd, bajty, 0, bajty.length, this.offset ?? 0);
    this.offset = (this.offset ?? 0) + n;
  }
  close(): void { if (this.fd !== null) closeSync(this.fd); this.fd = null; }
}

class Plik {
  readonly uri: string;
  constructor(...uris: (string | Plik | Katalog)[]) { this.uri = uriZ(uris); }
  get exists(): boolean { return existsSync(sciezka(this.uri)) && statSync(sciezka(this.uri)).isFile(); }
  get size(): number { return statSync(sciezka(this.uri)).size; }
  info(): { exists: boolean; modificationTime?: number } { return this.exists ? { exists: true, modificationTime: statSync(sciezka(this.uri)).mtimeMs } : { exists: false }; }
  get name(): string { return sciezka(this.uri).split('/').pop() ?? ''; }
  create(o: { overwrite?: boolean } = {}): void {
    if (this.exists && !o.overwrite) throw new Error(`plik istnieje: ${this.uri}`);
    writeFileSync(sciezka(this.uri), '');
  }
  write(tresc: string | Uint8Array, o: { append?: boolean } = {}): void {
    if (o.append) appendFileSync(sciezka(this.uri), tresc);
    else writeFileSync(sciezka(this.uri), tresc);
  }
  async text(): Promise<string> { return readFileSync(sciezka(this.uri), 'utf8'); }
  textSync(): string { return readFileSync(sciezka(this.uri), 'utf8'); }
  async bytes(): Promise<Uint8Array> { return new Uint8Array(readFileSync(sciezka(this.uri))); }
  delete(): void { rmSync(sciezka(this.uri)); }
  async copy(cel: Plik | Katalog): Promise<void> { this.copySync(cel); }
  copySync(cel: Plik | Katalog): void {
    const c = cel instanceof Katalog ? `${sciezka(cel.uri)}/${this.name}` : sciezka(cel.uri);
    if (existsSync(c)) throw new Error(`cel istnieje: ${c}`);
    copyFileSync(sciezka(this.uri), c);
  }
  moveSync(cel: Plik | Katalog): void {
    const c = cel instanceof Katalog ? `${sciezka(cel.uri)}/${this.name}` : sciezka(cel.uri);
    if (existsSync(c)) throw new Error(`cel istnieje: ${c}`);
    renameSync(sciezka(this.uri), c);
  }
  open(tryb: FileMode = FileMode.ReadWrite): FileHandle {
    const flagi = { r: 'r', rw: 'r+', w: 'w', wa: 'a', wt: 'w' }[tryb];
    return new FileHandle(openSync(sciezka(this.uri), flagi));
  }
}
class Katalog {
  readonly uri: string;
  constructor(...uris: (string | Plik | Katalog)[]) { this.uri = uriZ(uris); }
  get exists(): boolean { return existsSync(sciezka(this.uri)) && statSync(sciezka(this.uri)).isDirectory(); }
  create(o: { intermediates?: boolean; idempotent?: boolean } = {}): void {
    if (this.exists) { if (o.idempotent) return; throw new Error(`katalog istnieje: ${this.uri}`); }
    mkdirSync(sciezka(this.uri), { recursive: Boolean(o.intermediates) });
  }
  delete(): void { rmSync(sciezka(this.uri), { recursive: true }); }
  info(): { exists: boolean; modificationTime?: number } { return this.exists ? { exists: true, modificationTime: statSync(sciezka(this.uri)).mtimeMs } : { exists: false }; }
  list(): (Plik | Katalog)[] {
    return readdirSync(sciezka(this.uri), { withFileTypes: true }).map((d) => (d.isDirectory() ? new Katalog(this.uri, encodeURIComponent(d.name)) : new Plik(this.uri, encodeURIComponent(d.name))));
  }
}
export { Plik as File, Katalog as Directory };
export class Paths {
  static get availableDiskSpace(): number { return Number.MAX_SAFE_INTEGER; }
}
