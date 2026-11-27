# ZR10 — źródło API: usuwanie placementu zrzutu (KO-210)

Odczyt: 2026-11-25 ok. 16:52 UTC, surowy JSON dokumentacji Apple (`curl https://developer.apple.com/tutorials/data/documentation/appstoreconnectapi/<strona>.json`), cytaty dosłowne z pola tekstu strony.

## Operacja

- Strona: https://developer.apple.com/documentation/appstoreconnectapi/delete-v1-appassetlibraryplacements-_id_ — „Delete an app asset library placement.” (Web Service Endpoint).
- Metoda i ścieżka: `DELETE https://api.appstoreconnect.apple.com/v1/appAssetLibraryPlacements/{id}`; parametr ścieżki `id` (wymagany). Odpowiedź `204 No Content`; błędy 400, 401, 403 („Request not authorized.”), 404 („Resource not found.”), 409 — w dokumentacji operacji jest tylko 204/400/401/403/404 (odczyt: lista `restResponses`; 409 poniżej wynika z artykułu o placementach, nie z tej strony).
- Przykład z dokumentacji: `DELETE https://api.appstoreconnect.apple.com/v1/appAssetLibraryPlacements/2e000005-e036-8f0b-8f25-6dbc2baa784a` → `HTTP/1.1 204 No Content`.

## Skutek dla obrazu w bibliotece

Artykuł https://developer.apple.com/documentation/appstoreconnectapi/placing-assets-on-your-app-store-surfaces, sekcja „Delete a placement”:

> „Remove a placement with `DELETE /v1/appAssetLibraryPlacements/{id}`, which returns `204 No Content`. This removes the asset from that surface but leaves the underlying asset in your library, along with any other placements that reuse it. To remove an asset, delete its placements first, then the asset. Deletion runs in one direction only. Deleting a placement leaves its asset intact, but deleting an asset that still has placements fails.”

Wniosek: zdjęcie placementu zostawia obraz w bibliotece (można go odtworzyć ponownym `POST /v1/appAssetLibraryPlacements` + `POST …/appAssetLibraryPlacementOrderingRequests`). Skrypt nie woła nigdy `DELETE` na obrazie biblioteki.

## Zamiana zrzutu — sposób zalecany przez Apple

Ten sam artykuł, sekcja „Replace a placement’s asset”:

> „You can’t change a placement after you create it. […] To show a different asset in the same spot, delete the placement, create a new one that relates to the new asset, and then reorder the group so the new placement takes the old one’s position.”

Odczyt placementów grupy z kolejnością i nazwą obrazu (ten sam artykuł): `GET /v1/appStoreVersionLocalizations/{id}/placements?filter[placementType]=APP_SCREENSHOT&filter[placementGroup]=<grupa>&sort=placementGroupPosition&include=image&fields[appAssetLibraryImages]=referenceName,state,imageAsset` — „Sorting by `placementGroupPosition` returns the placements in the order they display.”

## Stan wersji

Ten sam artykuł: „The parent surface has to be editable. You can’t add a placement to a custom product page version or App Store version that’s already approved” (przykład `409 STATE_ERROR.INVALID_STATE`, „Creating a placement is not permitted in AppCustomProductPageVersion's current state”). Strona operacji DELETE nie opisuje zachowania dla wersji niedostępnej do edycji `[DO USTALENIA]` (nie sprawdzone na żywo — zakaz wywołań ASC w ZR10); dlatego skrypt sam odmawia zdejmowania placementów, gdy wersja nie jest w stanie edytowalnym (`EDITABLE_STATES`, 1.0.1 w przygotowaniu), zamiast polegać na odpowiedzi API.

## Niepewności (nie blokują)

- Czy usunięcie ostatniego placementu grupy przed utworzeniem nowych jest dopuszczalne w każdym stanie wersji w przygotowaniu — dokumentacja mówi „editable”; dowód dopiero z dry-run/apply koordynatora `[DO USTALENIA]`.
- Kolejność działań w skrypcie dobrana tak, żeby ewentualna odmowa zdjęcia placementu nastąpiła przed jakąkolwiek zmianą widoczną na stronie: najpierw wgranie nowych obrazów do biblioteki (nic nie zmienia strony), potem zdjęcie starych placementów grupy, potem nowe placementy i kolejność.
