// Wygenerowane: node --experimental-strip-types scripts/natywne/generuj-stale.mjs — nie edytować (źródło: src/konfiguracja.ts).
// Zgodność z stale.json sprawdza `swift test` (StaleTests), z konfiguracja.ts — `--check` w jakosc:kontrole.
public enum Stale {
  /// LIMIT_DNI_W_MIESIACU
  public static let limitDniWMiesiacu: Int = 5
  /// PRZERWA_NOWEGO_DNIA_MS
  public static let przerwaNowegoDniaMs: Int64 = 3600000
  /// OKNO_OFFLINE_PRO_MS
  public static let oknoOfflineProMs: Int64 = 604800000
  /// PRODUKTY_PRO
  public static let produktyPro: [String] = ["oczko.pro.lifetime","oczko.pro.monthly","oczko.pro.yearly"]
  /// ZEGAREK_PONOWIENIE_MS
  public static let zegarekPonowienieMs: Int64 = 900000
}
