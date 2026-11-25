# Różnica 1.0.1 względem a830eb21 (v1.0.0-b1221)

Baza: `a830eb21bfa5bf0ec148f9081a66f9f37732675d` · głowa: `881b4b5506df16cc72770f606fdb80d0a5c114f6` · wersja docelowa: `1.0.1` · skrypt: `node scripts/wydanie/roznica-wersji.mjs` (test: `tests/wydanie/roznica-wersji.test.ts`)

## Wynik: NARUSZENIA (2)

- tests/wydanie/co-nowego-1-0-1.test.ts: zmiana poza polami wersji i dokumentami wydania
- tests/wydanie/metadane-przeklad.test.ts: zmiana poza polami wersji i dokumentami wydania

## Pliki (git diff --name-status)

```
M	app.json
M	docs/decyzje.md
A	docs/jakosc/test-fizyczny/1221.md
A	docs/wydanie/lista-1-0-1.md
A	docs/wydanie/metadane/co-nowego-1-0-1.store.json
M	docs/wydanie/metadane/en.store.json
M	package-lock.json
M	package.json
A	scripts/wydanie/roznica-wersji.mjs
M	tests/jakosc/wersja-wydania.test.ts
A	tests/wydanie/co-nowego-1-0-1.test.ts
M	tests/wydanie/metadane-przeklad.test.ts
A	tests/wydanie/roznica-wersji.test.ts
```

## Linie wersji (app.json, package.json, package-lock.json, test wersji; git diff -U0)

```
-    "version": "1.0.0",
+    "version": "1.0.1",
-  "version": "1.0.0",
+  "version": "1.0.1",
-      "version": "1.0.0",
+      "version": "1.0.1",
-  "version": "1.0.0",
+  "version": "1.0.1",
-/* P-300, P-306 (B), P-519: wersja pierwszego wydania publicznego to 1.0.0; app.json i package.json(-lock) zgodne (scripts/verify-native.mjs:33).
+/* P-300, P-306 (B), P-519: wersja pierwszego wydania publicznego to 1.0.0; od KO-203 wydanie 1.0.1 (tylko nowe zrzuty w App Store Connect, kod jak build 1221);
+   app.json i package.json(-lock) zgodne (scripts/verify-native.mjs:33).
-test('P-306: app.json expo.version = 1.0.0', () => {
-  expect(pole(pole(czytaj('app.json'), 'expo'), 'version')).toBe('1.0.0');
+test('KO-203: app.json expo.version = 1.0.1 (wydanie tylko dla zrzutów; kod jak 1.0.0 b1221)', () => {
+  expect(pole(pole(czytaj('app.json'), 'expo'), 'version')).toBe('1.0.1');
-  expect([pole(czytaj('package.json'), 'version'), pole(lock, 'version'), pole(pole(pole(lock, 'packages'), ''), 'version')]).toEqual(['1.0.0', '1.0.0', '1.0.0']);
+  expect([pole(czytaj('package.json'), 'version'), pole(lock, 'version'), pole(pole(pole(lock, 'packages'), ''), 'version')]).toEqual(['1.0.1', '1.0.1', '1.0.1']);
```

## git diff --stat

```
 app.json                                         |  2 +-
 docs/decyzje.md                                  |  2 +
 docs/jakosc/test-fizyczny/1221.md                | 75 +++++++++++++++++++
 docs/wydanie/lista-1-0-1.md                      | 68 +++++++++++++++++
 docs/wydanie/metadane/co-nowego-1-0-1.store.json | 94 ++++++++++++++++++++++++
 docs/wydanie/metadane/en.store.json              |  8 +-
 package-lock.json                                |  4 +-
 package.json                                     |  2 +-
 scripts/wydanie/roznica-wersji.mjs               | 81 ++++++++++++++++++++
 tests/jakosc/wersja-wydania.test.ts              |  9 ++-
 tests/wydanie/co-nowego-1-0-1.test.ts            | 46 ++++++++++++
 tests/wydanie/metadane-przeklad.test.ts          |  2 +-
 tests/wydanie/roznica-wersji.test.ts             | 63 ++++++++++++++++
 13 files changed, 443 insertions(+), 13 deletions(-)
```
