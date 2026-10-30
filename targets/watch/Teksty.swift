// Wygenerowane z src/i18n/slowniki/*.json (sekcja `aktywnosc`), src/i18n/jezyki.ts i src/i18n/plural.ts przez tests/adaptery/teksty-natywne.test.ts
// — nie edytować (ADR-0017). Język = język aplikacji ze stanu (P-139); brak albo nieznany → angielski (P-115).
import Foundation

enum Teksty {
  static let tabela: [String: [String: String]] = [
    "en": ["bez_telefonu_one": "iPhone not nearby. {{count}} change is saved on this watch.", "bez_telefonu_other": "iPhone not nearby. {{count}} changes are saved on this watch.", "blad_zapisu": "Try again.", "blad_zapisu_zegarek": "Try again or count on iPhone.", "karta_a11y": "{{nazwa}}, {{zrobione}}, now row {{n}}", "limit": "No free crafting days left in {{miesiac}}.", "limit_wznowienie": "Counting resumes {{data}}.", "minus": "−1 row", "minus_a11y": "Remove row", "nazwa_robocza": "Counter from {{data}}", "nie_dodano": "Row {{n}} wasn’t added", "nie_usunieto": "Row {{n}} wasn’t removed", "odblokuj": "Unlock iPhone to count.", "otworz_iphone": "Open Oczko on your iPhone to start counting.", "plus": "+1 row", "plus_a11y": "Add row. Now row {{n}}", "plus_a11y_przypomnienie": "Add row. Row {{n}}: {{tekst}}, {{k}} of {{razy}}", "podpis_plus": "tap when row {{n}} is done", "przypomnienie": "Row {{n}}: {{tekst}} · {{k}} of {{razy}}", "przypomnienie_a11y": "Row {{n}}: {{tekst}}, {{k}} of {{razy}}", "przypomnienie_krotkie": "Row {{n}}: {{tekst}}", "przypomnienie_wiecej_one": "+{{count}} more reminder in Oczko", "przypomnienie_wiecej_other": "+{{count}} more reminders in Oczko", "sesja_a11y": "session {{czas}}", "teraz": "Now row {{n}}", "wstrzymane": "Counting paused", "zablokowany": "Counter locked", "zablokowany_a11y": "{{nazwa}}, {{zrobione}}, counter locked", "zablokowany_jak": "Unlock it in Oczko.", "zablokowany_jak_zegarek": "Unlock it in Oczko on your iPhone.", "zachowane": "Your rows are kept.", "zrobione_one": "{{count}} row done", "zrobione_other": "{{count}} rows done"],
  ]
  /// Łańcuch zastępczy jak w aplikacji (wariant → język bazowy → źródło), `lancuchZastepczy` w src/i18n/jezyki.ts.
  static let lancuch: [String: [String]] = [
    "bg": ["bg", "en"],
    "cs": ["cs", "en"],
    "da": ["da", "en"],
    "de": ["de", "en"],
    "el": ["el", "en"],
    "en": ["en"],
    "es-419": ["es-419", "es", "en"],
    "es": ["es", "en"],
    "et": ["et", "en"],
    "fi": ["fi", "en"],
    "fr": ["fr", "en"],
    "hr": ["hr", "en"],
    "hu": ["hu", "en"],
    "id": ["id", "en"],
    "it": ["it", "en"],
    "ja": ["ja", "en"],
    "ko": ["ko", "en"],
    "lt": ["lt", "en"],
    "lv": ["lv", "en"],
    "ms": ["ms", "en"],
    "nb": ["nb", "en"],
    "nl": ["nl", "en"],
    "pl": ["pl", "en"],
    "pt-BR": ["pt-BR", "pt", "en"],
    "pt": ["pt", "en"],
    "ro": ["ro", "en"],
    "ru": ["ru", "en"],
    "sk": ["sk", "en"],
    "sl": ["sl", "en"],
    "sr": ["sr", "en"],
    "sv": ["sv", "en"],
    "tr": ["tr", "en"],
    "uk": ["uk", "en"],
    "vi": ["vi", "en"],
    "zh-Hant": ["zh-Hant", "en"],
  ]
  /// Kategorie CLDR liczb całkowitych (z, o, t, f, m, r = zero, one, two, few, many, other): n < 200 wprost, dalej 100 + n mod 100, pełne miliony osobno.
  static let liczby: [String: (String, String)] = [
    "bg": ("rorrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr", "r"),
    "cs": ("rofffrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr", "r"),
    "da": ("rorrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr", "r"),
    "de": ("rorrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr", "r"),
    "el": ("rorrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr", "r"),
    "en": ("rorrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr", "r"),
    "es-419": ("rorrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr", "m"),
    "es": ("rorrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr", "m"),
    "et": ("rorrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr", "r"),
    "fi": ("rorrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr", "r"),
    "fr": ("oorrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr", "m"),
    "hr": ("rofffrrrrrrrrrrrrrrrrofffrrrrrrofffrrrrrrofffrrrrrrofffrrrrrrofffrrrrrrofffrrrrrrofffrrrrrrofffrrrrrrofffrrrrrrrrrrrrrrrrofffrrrrrrofffrrrrrrofffrrrrrrofffrrrrrrofffrrrrrrofffrrrrrrofffrrrrrrofffrrrrr", "r"),
    "hu": ("rorrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr", "r"),
    "id": ("rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr", "r"),
    "it": ("rorrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr", "m"),
    "ja": ("rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr", "r"),
    "ko": ("rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr", "r"),
    "lt": ("roffffffffrrrrrrrrrrroffffffffroffffffffroffffffffroffffffffroffffffffroffffffffroffffffffroffffffffroffffffffrrrrrrrrrrroffffffffroffffffffroffffffffroffffffffroffffffffroffffffffroffffffffroffffffff", "r"),
    "lv": ("zorrrrrrrrzzzzzzzzzzzorrrrrrrrzorrrrrrrrzorrrrrrrrzorrrrrrrrzorrrrrrrrzorrrrrrrrzorrrrrrrrzorrrrrrrrzorrrrrrrrzzzzzzzzzzzorrrrrrrrzorrrrrrrrzorrrrrrrrzorrrrrrrrzorrrrrrrrzorrrrrrrrzorrrrrrrrzorrrrrrrr", "z"),
    "ms": ("rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr", "r"),
    "nb": ("rorrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr", "r"),
    "nl": ("rorrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr", "r"),
    "pl": ("mofffmmmmmmmmmmmmmmmmmfffmmmmmmmfffmmmmmmmfffmmmmmmmfffmmmmmmmfffmmmmmmmfffmmmmmmmfffmmmmmmmfffmmmmmmmfffmmmmmmmmmmmmmmmmmfffmmmmmmmfffmmmmmmmfffmmmmmmmfffmmmmmmmfffmmmmmmmfffmmmmmmmfffmmmmmmmfffmmmmm", "m"),
    "pt-BR": ("oorrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr", "m"),
    "pt": ("rorrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr", "m"),
    "ro": ("foffffffffffffffffffrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrfffffffffffffffffffrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr", "r"),
    "ru": ("mofffmmmmmmmmmmmmmmmmofffmmmmmmofffmmmmmmofffmmmmmmofffmmmmmmofffmmmmmmofffmmmmmmofffmmmmmmofffmmmmmmofffmmmmmmmmmmmmmmmmofffmmmmmmofffmmmmmmofffmmmmmmofffmmmmmmofffmmmmmmofffmmmmmmofffmmmmmmofffmmmmm", "m"),
    "sk": ("rofffrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr", "r"),
    "sl": ("rotffrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrotffrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr", "r"),
    "sr": ("rofffrrrrrrrrrrrrrrrrofffrrrrrrofffrrrrrrofffrrrrrrofffrrrrrrofffrrrrrrofffrrrrrrofffrrrrrrofffrrrrrrofffrrrrrrrrrrrrrrrrofffrrrrrrofffrrrrrrofffrrrrrrofffrrrrrrofffrrrrrrofffrrrrrrofffrrrrrrofffrrrrr", "r"),
    "sv": ("rorrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr", "r"),
    "tr": ("rorrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr", "r"),
    "uk": ("mofffmmmmmmmmmmmmmmmmofffmmmmmmofffmmmmmmofffmmmmmmofffmmmmmmofffmmmmmmofffmmmmmmofffmmmmmmofffmmmmmmofffmmmmmmmmmmmmmmmmofffmmmmmmofffmmmmmmofffmmmmmmofffmmmmmmofffmmmmmmofffmmmmmmofffmmmmmmofffmmmmm", "m"),
    "vi": ("rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr", "r"),
    "zh-Hant": ("rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr", "r"),
  ]

  static func tekst(_ klucz: String, _ jezyk: String?) -> String? {
    for j in lancuch[jezyk ?? "en"] ?? ["en"] { if let t = tabela[j]?[klucz] { return t } }
    return nil
  }
  static func podstaw(_ t: String, _ parametry: [String: String]) -> String {
    parametry.reduce(t) { $0.replacingOccurrences(of: "{{\($1.key)}}", with: $1.value) }
  }
  /// Tekst w języku aplikacji z parametrami `{{nazwa}}`; brak tekstu = klucz (wykrywa test kluczy).
  static func t(_ klucz: String, _ jezyk: String?, _ parametry: [String: String] = [:]) -> String {
    podstaw(tekst(klucz, jezyk) ?? klucz, parametry)
  }
  static func kategoria(_ jezyk: String?, _ n: Int) -> String {
    guard n >= 0, let (male, milion) = liczby[jezyk ?? "en"] ?? liczby["en"] else { return "other" }
    let znak: Character
    if n < 200 { znak = Array(male)[n] } else if n % 1_000_000 == 0 { znak = Character(milion) } else { znak = Array(male)[100 + n % 100] }
    return ["z": "zero", "o": "one", "t": "two", "f": "few", "m": "many"][znak] ?? "other"
  }
  /// Liczba mnoga (`klucz_one`, `klucz_few`, …, brak formy → `klucz_other`, ADR-0017) z `{{count}}` i parametrami.
  static func tl(_ klucz: String, _ count: Int, _ jezyk: String?, _ parametry: [String: String] = [:]) -> String {
    let forma = tekst("\(klucz)_\(kategoria(jezyk, count))", jezyk) ?? tekst("\(klucz)_other", jezyk) ?? klucz
    return podstaw(forma, parametry.merging(["count": String(count)]) { a, _ in a })
  }
}
