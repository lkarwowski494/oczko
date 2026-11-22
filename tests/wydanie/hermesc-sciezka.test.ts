// TF-B3-01: paczka hermes-compiler zawiera binarki wszystkich platform naraz (linux64-bin, osx-bin, win64-bin), więc wybór
// „pierwszy istniejący” brał na macOS binarkę linuksową (testflight.yml, run 42836695619: kod null). Wybór według platformy, brak = jawny błąd.
import { join } from 'node:path';
import { sciezkaHermesc } from './hermesc-sciezka';

const KORZEN = join(__dirname, '../..');
const BIN = (d: string) => join(KORZEN, 'node_modules/hermes-compiler/hermesc', d, 'hermesc');
const wszystkie = () => true;

test('darwin dostaje osx-bin, choć linux64-bin też jest w paczce', () => {
  expect(sciezkaHermesc(KORZEN, 'darwin', wszystkie)).toBe(BIN('osx-bin'));
});

test('linux dostaje linux64-bin, choć osx-bin też jest w paczce', () => {
  expect(sciezkaHermesc(KORZEN, 'linux', wszystkie)).toBe(BIN('linux64-bin'));
});

test('brak binarki dla platformy to jawny błąd, nie binarka innej platformy', () => {
  expect(() => sciezkaHermesc(KORZEN, 'darwin', (p) => p !== BIN('osx-bin'))).toThrow(`brak hermesc dla darwin: ${BIN('osx-bin')}`);
});

test('platforma bez obsługi (win32) to jawny błąd', () => {
  expect(() => sciezkaHermesc(KORZEN, 'win32', wszystkie)).toThrow('hermesc: platforma win32 bez obsługi w testach (darwin, linux)');
});

test('prawdziwa paczka ma binarkę dla tej platformy', () => {
  expect(sciezkaHermesc(KORZEN, process.platform)).toBe(BIN(process.platform === 'darwin' ? 'osx-bin' : 'linux64-bin'));
});
