# Inwentarz wywołań ASC API: IAP i subskrypcje (KO-056, sesja BG, 2026-11-13)

Zakres: `scripts/asc/*.mjs` i `.github/workflows/asc-*.yml` na `2ed5215a`. Źródło Apple (odczyt 2026-11-13, surowy JSON stron dokumentacji, `curl`):
- Migracja: `https://developer.apple.com/tutorials/data/documentation/appstoreconnectapi/migrating-in-app-purchase-metadata-to-v2.json` — „Each deprecated v1 endpoint has a v2 equivalent that targets a version. The v1 endpoint keeps working; use it only for existing integrations that haven’t moved yet.”
- Cykl życia wersji: `.../working-with-in-app-purchase-versions.json`, `.../working-with-subscription-versions.json`, `.../working-with-subscription-group-versions.json` — „`PREPARE_FOR_SUBMISSION`: The version is open for editing. You can add, change, or remove localizations and images.”
- Flagi „deprecated” na stronach endpointów (np. `post-v1-inapppurchaselocalizations.json`: „This endpoint is deprecated. Use …”).
- OpenAPI 4.6 (`app-store-connect-openapi-specification.zip`, plik z 2026-11-04) zawiera zasoby v2 i `*Versions`, ale NIE oznacza v1 lokalizacji jako deprecated (spec starszy niż strony); release notes 4.4.1–4.6 nie wspominają o wycofaniu. **Termin usunięcia („od początku 2027”) pochodzi tylko z e-maila Apple Developer Relations (wskazówka, nie źródło): `[DO USTALENIA]`** — dokumentacja mówi „deprecated … remains available”, bez daty.

## Wywołania skryptu `iap-localizations.mjs` (jedyny skrypt z lokalizacjami IAP)

| # | Wiersz | Endpoint (stan 2ed5215a) | Wycofany? (źródło) | Zastępstwo |
|---|---|---|---|---|
| 1 | 96 | `GET /v1/apps/{id}/subscriptionGroups` | nie | bez zmian |
| 2 | 99 | `GET /v1/subscriptionGroups/{id}/subscriptionGroupLocalizations` | **tak** („This relationship is deprecated”, `get-v1-subscriptiongroups-_id_-subscriptiongrouplocalizations.json`) | `GET /v1/subscriptionGroups/{id}/versions` + `GET /v1/subscriptionGroupVersions/{vid}/localizations` |
| 3 | 100 | `POST /v1/subscriptionGroupLocalizations` | **tak** (`post-v1-subscriptiongrouplocalizations.json`) | `POST /v2/subscriptionGroupLocalizations`, relacja `version` → `subscriptionGroupVersions` |
| 4 | 101 | `PATCH /v1/subscriptionGroupLocalizations/{id}` | **tak** (`patch-v1-subscriptiongrouplocalizations-_id_.json`) | `PATCH /v2/subscriptionGroupLocalizations/{id}` (atrybuty `name`, `customAppName`) |
| 5 | 102 | `GET /v1/subscriptionGroups/{id}/subscriptions` | nie | bez zmian |
| 6 | 105 | `GET /v1/subscriptions/{id}/subscriptionLocalizations` | **tak** (`get-v1-subscriptions-_id_-subscriptionlocalizations.json`) | `GET /v1/subscriptions/{id}/versions` + `GET /v1/subscriptionVersions/{vid}/localizations` |
| 7 | 106 | `POST /v1/subscriptionLocalizations` | **tak** (`post-v1-subscriptionlocalizations.json`) | `POST /v2/subscriptionLocalizations`, relacja `version` → `subscriptionVersions` |
| 8 | 107 | `PATCH /v1/subscriptionLocalizations/{id}` | **tak** (`patch-v1-subscriptionlocalizations-_id_.json`) | `PATCH /v2/subscriptionLocalizations/{id}` |
| 9 | 112 | `GET /v1/apps/{id}/inAppPurchasesV2?filter[productId]=` | nie (`get-v1-apps-_id_-inapppurchasesv2.json`; wycofany jest tylko `…/inAppPurchases` bez V2) | bez zmian |
| 10 | 114 | `GET /v2/inAppPurchases/{id}/inAppPurchaseLocalizations` | **tak** (`get-v2-inapppurchases-_id_-inapppurchaselocalizations.json`, „This relationship is deprecated”) | `GET /v2/inAppPurchases/{id}/versions` + `GET /v1/inAppPurchaseVersions/{vid}/localizations` |
| 11 | 116 | `POST /v1/inAppPurchaseLocalizations` | **tak** (`post-v1-inapppurchaselocalizations.json`) | `POST /v2/inAppPurchaseLocalizations`, relacja `version` → `inAppPurchaseVersions` |
| 12 | 117 | `PATCH /v1/inAppPurchaseLocalizations/{id}` | **tak** (`patch-v1-inapppurchaselocalizations-_id_.json`) | `PATCH /v2/inAppPurchaseLocalizations/{id}` |
| — | (nowe) | tworzenie wersji, gdy brak edytowalnej | — | `POST /v1/inAppPurchaseVersions` / `/v1/subscriptionVersions` / `/v1/subscriptionGroupVersions` (stan startowy `PREPARE_FOR_SUBMISSION`) |

## `produkty.mjs` (workflow `asc-produkty.yml`) — brak wywołań z e-maila

Używa: `/v1/apps`, `/v1/territories`, `/v1/subscriptionGroups` (POST, GET), `/v1/subscriptions` (POST, PATCH, GET) i `…/prices`, `…/pricePoints`, `…/subscriptionAvailability`, `/v1/subscriptionPrices`, `/v1/subscriptionAvailabilities`, `/v2/inAppPurchases` (POST, PATCH) i `…/pricePoints`, `…/iapPriceSchedule`, `…/inAppPurchaseAvailability`, `/v1/inAppPurchasePriceSchedules`, `/v1/inAppPurchaseAvailabilities`, `/v1/apps/{id}/inAppPurchasesV2`. Apple: „What doesn’t change … The In-App Purchase resource: `POST /v2/inAppPurchases`, `GET`, and `PATCH`. The subscription resource … The subscription group resource … Pricing: `/v1/inAppPurchasePriceSchedules` and `/v1/subscriptionPricePoints` remain the same.” (migrating-…-to-v2.json). Wycofane: 0. Zakupy/subskrypcje nie są tu wysyłane do recenzji (`grep` po `Submissions`, `reviewSubmission` w `scripts/` i `.github/`: brak).

## Pozostałe pliki

`metadane.mjs`, `zrzuty.mjs`, `kontrola-oczekiwane.mjs`, `asc-metadane.yml`, `asc-zrzuty.yml`, `asc-kontrola.yml`: metadane i zrzuty wersji aplikacji (`appStoreVersionLocalizations` itd.), nie IAP/subskrypcje; poza zakresem KO-056. `grep -nE "inAppPurchase|subscription"` po `scripts/` i `.github/`: tylko `iap-localizations.mjs` i `produkty.mjs`. Nie wysyłamy zakupów do recenzji z API (wysyłka: ręcznie w ASC albo z wersją aplikacji), więc zasoby `*Submissions` nie występują; test chroni przed ich dodaniem.

## Wnioski do projektu

1. Zmiana nie jest podmianą ścieżek: lokalizacja należy do **wersji** (relacja `version`), a „Versions are read-only after creation” poza stanem `PREPARE_FOR_SUBMISSION` — zapis wymaga wersji edytowalnej (wybór istniejącej albo `POST …Versions`).
2. Apple nie opisuje, czy nowa wersja dziedziczy lokalizacje poprzedniej ani czy lokalizacje założone przez v1 są widoczne jako lokalizacje wersji: `[DO USTALENIA]`; skrypt po utworzeniu wersji czyta jej lokalizacje i planuje względem odczytu (działa w obu wariantach), a przebieg właściciela zaczyna się od dry-run (`przebieg-wlasciciela.md`).
