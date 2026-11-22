// I-002 (recenzja buildu 3, P2): lista bibliotek natywnych pomijała pody ciągnięte przez moduły Expo. Źródła (odczyt 2026-11-10):
//  - openiap 3.6.0: node_modules/expo-iap/openiap-versions.json ("apple": "3.6.0"); log CI testflight run 42746522234: „Installing openiap (3.6.0)”;
//    LICENSE: https://raw.githubusercontent.com/hyodotdev/openiap/3.6.0/LICENSE („Copyright (c) 2025 hyo.dev”, MIT).
//  - SDWebImage 5.21.1 i SDWebImageWebPCoder 0.14.6: node_modules/expo-image-manipulator/spm.config.json (`exact`); log CI: „SDWebImage.xcframework (5.21.1)”,
//    „SDWebImageWebPCoder.xcframework (0.14.6)” (prekompilowane, nie pody z CocoaPods); LICENSE (MIT) w tagach 5.21.1 i 0.14.6 tych repozytoriów.
//  - libwebp 1.1.0: statycznie w SDWebImageWebPCoder.xcframework (libwebp-Xcode); WebPGetDecoderVersion() w binarium zwraca 0x010100 (mov w0,#0x100; movk w0,#0x1,lsl #16),
//    czyli 1.1.0 (src/dec/vp8i_dec.h w tagu v1.1.0: DEC_MIN_VERSION 1); COPYING: https://raw.githubusercontent.com/webmproject/libwebp/v1.1.0/COPYING.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { NATYWNE_IOS, TEKSTY_LICENCJI } from '../../src/domena/licencje.generated';

const KORZEN = join(__dirname, '../..');
const json = (plik: string): unknown => JSON.parse(readFileSync(join(KORZEN, plik), 'utf8'));
const wpis = (nazwa: string) => NATYWNE_IOS.find((r) => r[0] === nazwa);

describe('I-002: biblioteki natywne z modułów Expo na liście w aplikacji', () => {
  test.each([
    ['openiap', '3.6.0', 'MIT', 'Copyright (c) 2025 hyo.dev'],
    ['SDWebImage', '5.21.1', 'MIT', 'Copyright (c) 2009-2020 Olivier Poitrey rs@dailymotion.com'],
    ['SDWebImageWebPCoder', '0.14.6', 'MIT', 'Copyright (c) 2018 Bogdan Poplauschi'],
    ['libwebp', '1.1.0', 'BSD-3-Clause', 'Copyright (c) 2010, Google Inc. All rights reserved.'],
  ])('%s %s: licencja %s i nota „%s” (ze źródła), treść licencji dostępna w aplikacji', (nazwa, wersja, licencja, nota) => {
    expect(wpis(nazwa)).toEqual([nazwa, wersja, licencja, [nota]]);
    expect(TEKSTY_LICENCJI[licencja]?.tekst.length).toBeGreaterThan(500);
  });
  test('wersje zgodne z tym, co trafia do paczki: openiap z expo-iap, SDWebImage i WebPCoder z spm.config.json expo-image-manipulator', () => {
    const iap = json('node_modules/expo-iap/openiap-versions.json') as { apple?: unknown };
    expect(wpis('openiap')?.[1]).toBe(iap.apple);
    const spm = json('node_modules/expo-image-manipulator/spm.config.json') as { products: { spmPackages: { productName: string; version: { exact: string } }[] }[] };
    const pakiety = spm.products.flatMap((p) => p.spmPackages);
    for (const nazwa of ['SDWebImage', 'SDWebImageWebPCoder']) expect(wpis(nazwa)?.[1]).toBe(pakiety.find((p) => p.productName === nazwa)?.version.exact);
  });
});
