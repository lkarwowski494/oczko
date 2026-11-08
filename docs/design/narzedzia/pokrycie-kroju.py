# pokrycie-kroju.py — pokrycie pliku kroju dla języków aplikacji (M3-S3-04).
# Użycie: python3 -I pokrycie-kroju.py <plik.ttf> <katalog CLDR common/main *.xml> <jezyk[=plikCLDR]>...
# Kryterium: każda litera z głównego zbioru wzorcowego CLDR (exemplarCharacters bez typu), małe i wielkie, w NFC,
# ma glif w cmap pliku. Brak choćby jednej = język z krojem systemowym. Zbiór pomocniczy (auxiliary) i interpunkcja: informacyjnie.
# Źródło danych: Unicode CLDR 46, common/main/<język>.xml (github.com/unicode-org/cldr, tag release-46).
import sys, re, unicodedata
from fontTools.ttLib import TTFont

def zbior(tekst):
    """Rozwija prosty UnicodeSet CLDR: [a b c-e {ch} \\u0301 \\- …] → lista ciągów."""
    tekst = tekst.strip()[1:-1]
    tekst = re.sub(r'\\u([0-9A-Fa-f]{4})', lambda m: chr(int(m.group(1), 16)), tekst)
    tekst = tekst.replace('&quot;', '"').replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>').replace('&apos;', "'")
    wynik, i = [], 0
    while i < len(tekst):
        c = tekst[i]
        if c.isspace(): i += 1; continue
        if c == '{':
            j = tekst.index('}', i); wynik.append(tekst[i + 1:j]); i = j + 1; continue
        if c == '\\': c = tekst[i + 1]; i += 1
        if i + 2 < len(tekst) and tekst[i + 1] == '-' and not tekst[i + 2].isspace():
            k = tekst[i + 2]
            if k == '\\': k = tekst[i + 3]; i += 1
            wynik += [chr(x) for x in range(ord(c), ord(k) + 1)]; i += 3; continue
        wynik.append(c); i += 1
    return wynik

def wzorcowe(sciezka, typ=None):
    xml = open(sciezka, encoding='utf-8').read()
    wzor = r'<exemplarCharacters>(.*?)</exemplarCharacters>' if typ is None else r'<exemplarCharacters type="%s">(.*?)</exemplarCharacters>' % typ
    m = re.search(wzor, xml)
    return zbior(m.group(1)) if m else []

font, katalog, *jezyki = sys.argv[1:]
cmap = TTFont(font).getBestCmap()
brak_kodu = 0
for wpis in jezyki:
    jezyk, _, plik = wpis.partition('=')
    plik = plik or jezyk.replace('-', '_')
    sciezka = f'{katalog}/{plik}.xml'
    glowne = wzorcowe(sciezka)
    if not glowne:
        print(f'{jezyk}\tBŁĄD: brak zbioru wzorcowego w {plik}.xml'); brak_kodu = 1; continue
    def braki(lista):
        out = []
        for s in lista:
            for w in {unicodedata.normalize('NFC', s), unicodedata.normalize('NFC', s.upper())}:
                if any(ord(ch) not in cmap for ch in w): out.append(w)
        return sorted(set(out))
    b, ba, bp = braki(glowne), braki(wzorcowe(sciezka, 'auxiliary')), braki(wzorcowe(sciezka, 'punctuation'))
    werdykt = 'Bree' if not b else 'systemowy'
    print(f'{jezyk}\t{werdykt}\tlitery: {len(glowne)}, brak {len(b)}' + (f' (np. {" ".join(b[:6])})' if b else '')
          + f'\tpomocnicze brak {len(ba)}' + (f' ({" ".join(ba[:4])})' if ba else '')
          + f'\tinterpunkcja brak {len(bp)}' + (f' ({" ".join(bp[:6])})' if bp else ''))
sys.exit(brak_kodu)
