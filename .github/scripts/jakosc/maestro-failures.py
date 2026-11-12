#!/usr/bin/env python3
"""Po porażce E2E: nieudane polecenia Maestro, kilka poprzednich i teksty z ekranu w chwili błędu — do publicznego logu.

Artefakty przebiegu (zrzuty) nie zawsze da się pobrać, a log jest zawsze. Czyta pliki commands-*.json z katalogu
--test-output-dir Maestro. Ciągi w formacie UUID (np. identyfikator symulatora) są maskowane. Zawsze kończy się kodem 0.
07-jakosc-002: krok w stanie RUNNING (przerwany, np. awarią sterownika XCTest) też jest wypisywany, z przyczyną z junit
(<katalog>.xml obok katalogu, jak w jakosc-ios.yml), zamiast „brak nieudanych kroków”.
Użycie: python3 scripts/ci/maestro-failures.py e2e-out [plik-z-listą-zrzutów]
"""
import glob, html, json, os, re, sys

UUID = re.compile(r'[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}')
TEXT_KEYS = ('text', 'accessibilityText', 'hintText', 'title', 'value', 'resource-id')
PREV = 4

def mask(s): return UUID.sub('<UUID>', s)
def short(o, n=200): return mask(json.dumps(o, ensure_ascii=False))[:n]

def texts(o, out):
    if isinstance(o, dict):
        for k, v in o.items():
            if k in TEXT_KEYS and isinstance(v, str) and v.strip() and v not in out: out.append(v)
            else: texts(v, out)
    elif isinstance(o, list):
        for v in o: texts(v, out)
    return out

def junit_cause(d):
    p = d.rstrip('/' + os.sep) + '.xml'
    if not os.path.isfile(p): return 'brak pliku ' + os.path.basename(p)
    m = re.search(r'<(failure|error)\b[^>]*>([\s\S]*?)</\1>', open(p, encoding='utf-8', errors='replace').read())
    if not m: return 'brak <failure> w ' + os.path.basename(p)
    t = html.unescape(m.group(2)).strip().splitlines()
    return mask(t[0].strip())[:500] if t else '(pusty <failure>)'

def main(d, screens_out=None):
    if not os.path.isdir(d): print(f'maestro-failures: brak katalogu {d}'); return
    found = 0; screens = []
    for f in sorted(glob.glob(os.path.join(d, '**', 'commands*.json'), recursive=True)):
        try: cmds = json.load(open(f, encoding='utf-8'))
        except Exception as e: print(f'maestro-failures: nie da się odczytać {f}: {e}'); continue
        if not isinstance(cmds, list): continue
        for i, c in enumerate(cmds):
            meta = c.get('metadata') or {}
            status = meta.get('status')
            if status not in ('FAILED', 'RUNNING'): continue
            found += 1
            if status == 'RUNNING':  # 07-jakosc-002: krok nie zakończył się (awaria sterownika) — nazwa kroku i przyczyna z junit
                print(f'=== {os.path.relpath(f, d)} — krok {i + 1}/{len(cmds)} przerwany (RUNNING, krok się nie zakończył)')
                for p in cmds[max(0, i - PREV):i]:
                    pm = p.get('metadata') or {}
                    print(f'  {pm.get("status")}: {short(p.get("command"))}')
                print(f'  PRZERWANY: {short(c.get("command"), 400)}')
                print('  przyczyna (junit): ' + junit_cause(d))
                continue
            print(f'=== {os.path.relpath(f, d)} — krok {i + 1}/{len(cmds)}')
            for p in cmds[max(0, i - PREV):i]:
                pm = p.get('metadata') or {}
                print(f'  {pm.get("status")}: {short(p.get("command"))}')
            print(f'  FAILED: {short(c.get("command"), 400)}')
            err = meta.get('error') or {}
            if isinstance(err, dict) and err.get('message'): print('  błąd: ' + mask(str(err['message']))[:500])
            t = texts(err, [])
            print('  teksty na ekranie: ' + (' | '.join(mask(x)[:120] for x in t[:150]) if t else '(brak hierarchii w wyniku)'))
            # Maestro zapisuje zrzut nieudanego kroku jako <przepływ>/screenshots/step-NNN-<polecenie>.png (NNN = numer kroku).
            shots = sorted(glob.glob(os.path.join(os.path.dirname(f), 'screenshots', f'step-{i + 1:03d}-*.png')))
            for sh in shots: print('  zrzut: ' + os.path.relpath(sh, d)); screens.append(sh)
    if not found: print('maestro-failures: brak nieudanych kroków w ' + d)
    if screens_out:
        with open(screens_out, 'w', encoding='utf-8') as o: o.write(''.join(x + '\n' for x in screens))

if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'e2e-out', sys.argv[2] if len(sys.argv) > 2 else None)
