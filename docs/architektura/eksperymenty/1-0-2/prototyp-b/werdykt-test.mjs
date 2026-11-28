// Test werdykt.mjs na danych syntetycznych (bez symulatora): TAK, NIE (brak znacznika), PROCES-ISTNIEJE, BRAK-ODCZYTU. Użycie: node werdykt-test.mjs
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const werdykt = join(dirname(fileURLToPath(import.meta.url)), 'werdykt.mjs');
const START = 1_000_000_000_000, STALE = START + 60_000;
function przebieg(kat, { proces = 'brak', znacznikOd = 65, licznik = true, czytelne = true }) {
  mkdirSync(join(kat, 'zrzuty'), { recursive: true });
  writeFileSync(join(kat, 'meta.json'), JSON.stringify({ startMs: START, staleMs: STALE }));
  writeFileSync(join(kat, 'proces.txt'), `== przed terminate\n123 Oczko.app/Oczko\n== po terminate\n${proces === 'brak' ? 'PROCES-BRAK (pgrep)\nLAUNCHCTL-BRAK' : 'PROCES-ISTNIEJE\nLAUNCHCTL-BRAK'}\n`);
  const tsv = [], ocr = [];
  for (let t = 10; t <= 110; t += 5) {
    const plik = `t${String(t).padStart(3, '0')}.png`;
    tsv.push(`${t}\t${START + t * 1000 + 800}\t${plik}`);
    const teksty = !czytelne ? [] : t >= znacznikOd ? ['STALE'] : licznik ? [`0:${String(t + 3).padStart(2, '0')}`] : ['0:05'];
    ocr.push(JSON.stringify({ plik, teksty, czerwone: t >= znacznikOd ? 500 : 0 }));
  }
  writeFileSync(join(kat, 'zrzuty.tsv'), tsv.join('\n'));
  writeFileSync(join(kat, 'ocr.jsonl'), ocr.join('\n'));
}
function uruchom(nazwa, opcje, oczekiwany) {
  const d = mkdtempSync(join(tmpdir(), 'pb-'));
  for (const i of [1, 2]) przebieg(join(d, `przebieg-${i}`), opcje);
  const wyjscie = execFileSync('node', [werdykt, d], { encoding: 'utf8' });
  const w = /WERDYKT: (\S+)/.exec(wyjscie)?.[1];
  console.log(`${w === oczekiwany ? 'OK ' : 'BŁĄD'} ${nazwa}: oczekiwano ${oczekiwany}, jest ${w}`);
  if (w !== oczekiwany) process.exitCode = 1;
}
// Przed staleDate (t ≤ 60) licznik rośnie, od t=65 widoczny jest znacznik; pierwszy odczyt po staleDate = t65 + 0,8 s → 5,8 s po staleDate (≤ 15 s).
uruchom('TAK: licznik rośnie, znacznik ≤ 15 s po staleDate', {}, 'TAK');
uruchom('NIE: znacznik dopiero 30 s po staleDate', { znacznikOd: 95 }, 'NIE');
uruchom('NIE: licznik stoi', { licznik: false }, 'NIE');
uruchom('PROCES-ISTNIEJE → nie TAK', { proces: 'jest' }, 'NIEROZSTRZYGNIETE');
uruchom('BRAK-ODCZYTU: OCR nic nie czyta', { czytelne: false }, 'BRAK-ODCZYTU');
