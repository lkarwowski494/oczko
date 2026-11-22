# 15. Publikacja w App Store i TestFlight — Oczko (Purlo) 🧶📲

> **Wydawca:** Apps4Brew Studio  
> **Bundle ID:** `com.apps4brew.knitting`  
> **Data przygotowania standardu:** 17.10.2026 (BRD-QA-REL 1.0)  

---

## 1. Architektura Publikacji za 0 PLN

Oczko korzysta ze standaryzowanego potoku **Natywnego TestFlight CI/CD** opartego wyłącznie na GitHub Actions (darmowe maszyny `macos` dla repozytoriów publicznych) i bezpośrednim połączeniu z API App Store Connect Apple (zgodnie z `BR-REL-001`..`022` i `NFR-SEC-001`..`004`), bez zewnętrznych płatnych platform chmurowych (0 zł stałych kosztów).

```
                      POTOK WYDANIA TESTFLIGHT (0 PLN)
┌─────────────────────────┐
│ Commit na origin/main   │
│ Weryfikacja przodka     │
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ GitHub Actions:         │
│ .github/workflows/      │
│ testflight.yml          │
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐      Klucz App Store Connect API (.p8)
│ Maszyna macos           │ ───► (ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_P8_BASE64)
│ • npm ci                │      - umask 077
│ • npm run verify        │      - dekodowanie po pod install & archive
│ • expo prebuild         │      - usuwanie credentials w always()
│ • verify-native.mjs     │
│ • xcodebuild archive    │
│ • xcodebuild -export    │ ───► Filtrowanie logów sed (<KEY_ID>, <ISSUER_ID>)
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ App Store Connect       │
│ • Przetwarzanie Apple   │ ───► TestFlight na iPhonie w 15–20 minut
└─────────────────────────┘
```

---

## 2. Wymagane Sekrety Repozytorium GitHub

W ustawieniach repozytorium GitHub (**Settings → Secrets and variables → Actions**):

| Nazwa Sekretu | Pochodzenie w App Store Connect | Format / Bezpieczeństwo |
|---|---|---|
| `APPLE_TEAM_ID` | **Apple Developer Account → Membership** | 10-znakowy identyfikator zespołu |
| `ASC_KEY_ID` | **Users and Access → Integrations → Keys** | 10-znakowy identyfikator klucza |
| `ASC_ISSUER_ID` | **Users and Access → Integrations → Keys** | Identyfikator wystawcy UUID |
| `ASC_KEY_P8_BASE64` | Plik `.p8` pobrany z ASC | Zawartość pliku `.p8` zakodowana w `base64` |

> [!IMPORTANT]
> Zgodnie z `NFR-SEC-003` i `NFR-SEC-004`:
> 1. Klucz prywatny `.p8` jest dekodowany z `umask 077` i uprawnieniami `600` do katalogu tymczasowego runnera dopiero **PO** zakończeniu `pod install` i `xcodebuild archive`.
> 2. Identyfikatory i klucze są maskowane w logach przez filtr `sed` zamieniający wartości na `<KEY_ID>`, `<ISSUER_ID>` i `<TEAM_ID>`.
> 3. Żadne pliki `.ipa` ani `.xcarchive` nie są wysyłane do publicznych artefaktów GitHuba (`BR-REL-022`).

---

## 3. Niezmienniki Konfiguracji Apple iOS (`verify-native.mjs`)

Projekt natywny generowany przez `npx expo prebuild --platform ios --no-install` musi spełniać 20 niezmienników sprawdzanych przez `scripts/verify-native.mjs`:
1. `PRODUCT_BUNDLE_IDENTIFIER = com.apps4brew.knitting;`
2. `ITSAppUsesNonExemptEncryption = false` w `Info.plist` (pomija ankietę kryptografii w TestFlight).
3. Brak zbędnych uprawnień śledzących (`NSUserTrackingUsageDescription`, `NSLocation*`, `NSContacts*`, itp.).
4. `supportsTablet: false` i `UIRequiresFullScreen = true` (`TARGETED_DEVICE_FAMILY = "1"`).
5. 4 kategorie Required Reason APIs w `PrivacyInfo.xcprivacy`:
   - `NSPrivacyAccessedAPICategoryUserDefaults`
   - `NSPrivacyAccessedAPICategoryFileTimestamp`
   - `NSPrivacyAccessedAPICategorySystemBootTime`
   - `NSPrivacyAccessedAPICategoryDiskSpace`
6. `assets/icon.png` o wymiarach 1024x1024 w formacie PNG RGB bez kanału przezroczystości alfa (`colorType === 2`, `RD-ENG-11`).
7. Ciemny wariant ekranu powitalnego w `SplashScreenBackground.colorset`.

---

## 4. Strony Prawne i Wsparcie (GitHub Pages)

Zgodnie z `BR-REL-019` i `BR-REL-020`:
- **Strona główna:** `site/index.html`
- **Polityka prywatności (PL/EN):** `site/privacy.html` (URL dla App Store Connect: `https://lkarwowski494.github.io/Oczko/privacy.html`)
- **Strona wsparcia:** `site/support.html` (Support URL dla App Store Connect: `https://lkarwowski494.github.io/Oczko/support.html`)
- Wdrażane automatycznie przez `.github/workflows/pages.yml`.
