// Wygenerowane: node scripts/icloud/generuj-schemat-ckdb.mjs — nie edytować (źródło: docs/architektura/icloud-tabele.json, schemat.sql).
// Typ rekordu CloudKit dla encji i pola zapisywane jako Double (REAL); reszta liczb INT64, tekst STRING, zasób pliku `dane` (ASSET).

enum Pola {
  static let typ: [String: String] = [
    "plik": "Plik",
    "projekt": "Projekt",
    "czesc": "Czesc",
    "licznik": "Licznik",
    "zdarzenie": "Zdarzenie",
    "notatka_rzedu": "NotatkaRzedu",
    "przypomnienie": "Przypomnienie",
    "sesja": "Sesja",
    "wzor": "Wzor",
    "rysunek": "Rysunek",
    "wloczka": "Wloczka",
    "narzedzie": "Narzedzie",
    "projekt_wloczka": "ProjektWloczka",
    "zdjecie": "Zdjecie",
    "obliczenie": "Obliczenie",
    "dzien_limitu": "DzienLimitu",
    "ustawienie": "Ustawienie",
  ]
  static let double: [String: Set<String>] = [
    "projekt": ["drut_mm"],
    "wloczka": ["waga_motka_g", "dlugosc_motka_m", "motki"],
    "narzedzie": ["rozmiar_mm"],
    "projekt_wloczka": ["zuzyto_motki", "odjeto_motki"],
  ]
  static let zasob = "dane"
}
