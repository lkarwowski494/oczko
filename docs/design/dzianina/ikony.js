// Ikony zastępcze (SF Symbols nie da się narysować w Chromium na Linuksie). Kreska 1.8 na siatce 24, zaokrąglone końce.
// Na iOS rola 08 bierze odpowiedniki z SF Symbols (tabela w design-spec.md); kształt tu tylko pokazuje miejsce i wagę.
const IKONY = {
  zebatka: '<path d="M10.3 3h3.4l.5 2.4 1.7.9 2.2-1.1 2.4 2.4-1.1 2.2.9 1.7 2.4.5v3.4l-2.4.5-.9 1.7 1.1 2.2-2.4 2.4-2.2-1.1-1.7.9-.5 2.4h-3.4l-.5-2.4-1.7-.9-2.2 1.1-2.4-2.4 1.1-2.2-.9-1.7L3 13.7v-3.4l2.4-.5.9-1.7-1.1-2.2 2.4-2.4 2.2 1.1 1.7-.9z"/><circle cx="12" cy="12" r="3.2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  dzis: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/><circle cx="12" cy="14.8" r="1.8" fill="currentColor" stroke="none"/>',
  projekty: '<rect x="4" y="8" width="16" height="12.5" rx="2.5"/><path d="M6.5 5h11M9 2.5h6"/>',
  narzedzia: '<path d="M4 19.5L19.5 4"/><circle cx="19.6" cy="3.9" r="1.2" fill="currentColor" stroke="none"/><path d="M3 9.5l11.5 11.5M5.2 11.7l1.6-1.6M7.6 14.1l1.6-1.6M10 16.5l1.6-1.6"/>',
  historia: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 9.5h17M8 3v4M16 3v4M7.5 13.5h2M11 13.5h2M14.5 13.5h2M7.5 17h2M11 17h2"/>',
  wzor: '<path d="M6 3h8.5L19 7.5V21H6z"/><path d="M14.5 3v4.5H19M9 11.5h7M9 14.5h7M9 17.5h4"/>',
  druty: '<path d="M5 20L17.5 4.5M9 20.5L19.5 7"/><circle cx="18.2" cy="3.7" r="1.4"/><circle cx="20.2" cy="6.2" r="1.4"/><path d="M4 15.5c3 1 6.5 1 9.5-1.5"/>',
  probka: '<rect x="4" y="4" width="16" height="16" rx="1.5"/><path d="M4 8h3M4 12h3M4 16h3M8 4v3M12 4v3M16 4v3"/>',
  nowy: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8.5v7M8.5 12h7"/>',
  szewron: '<path d="M9 5l7 7-7 7"/>',
  zegar: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  dzwonek: '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z"/><path d="M10 20.5h4"/>',
  notatka: '<path d="M5 3.5h10l4 4V20.5H5z"/><path d="M8.5 10h7M8.5 13.5h7M8.5 17h4"/>',
  stoper: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 13.5V9.5M10 2.5h4M18.5 6l1.5-1.5"/>',
  cel: '<path d="M6 21V3.5"/><path d="M6 4h11l-2.5 3.5L17 11H6"/>',
  kropki: '<circle cx="5.5" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="18.5" cy="12" r="1.6" fill="currentColor" stroke="none"/>',
  wstecz: '<path d="M15 5l-7 7 7 7"/>',
  szukaj: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L20 20"/>',
  historiaZmian: '<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1"/><path d="M3.5 4v4h4M12 7.5V12l3 2"/>',
  zegarek: '<rect x="6.5" y="6" width="11" height="12" rx="3"/><path d="M8.5 6l.7-3h5.6l.7 3M8.5 18l.7 3h5.6l.7-3M12 9.5V12l1.8 1.2"/>',
  rodzina: '<circle cx="8.5" cy="8" r="3"/><circle cx="16.5" cy="9.5" r="2.4"/><path d="M3 20c0-3.3 2.5-5.5 5.5-5.5S14 16.7 14 20M14.2 15.2c.7-.5 1.5-.7 2.3-.7 2.5 0 4.5 1.8 4.5 4.8"/>',
  dane: '<path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.2-7.5 9.5-4.3-1.3-7.5-4.9-7.5-9.5V6z"/><path d="M8.8 12.2l2.3 2.3 4.3-4.6"/>',
  ptaszek: '<path d="M6 12.5l4 4 8-9"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5"/><circle cx="12" cy="7.8" r="1.1" fill="currentColor" stroke="none"/>',
  // M3-S3-08: dzień dziergany (kafel 1 ofert) — kwadrat dzianiny z oczkami „V”, jak dzień w kalendarzu; inny niż kalendarz zakładki Historia.
  dzien: '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M6.5 8l2 3 2-3M10.5 8l2 3 2-3M14.5 8l2 3 2-3M6.5 13l2 3 2-3M10.5 13l2 3 2-3M14.5 13l2 3 2-3"/>',
  zamknij: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  klepsydra: '<path d="M7 3.5h10M7 20.5h10M8 3.5c0 4 4 5.5 4 8.5s-4 4.5-4 8.5M16 3.5c0 4-4 5.5-4 8.5s4 4.5 4 8.5"/>',
  // M3-MAK-01..03 (2026-11-08): zdjęcie, edycja projektu, Narzędzia (na iOS SF Symbols: square.and.arrow.up, trash, minus.circle.fill, scribble.variable)
  udostepnij: '<path d="M12 3.5v11M8 7l4-4 4 4"/><path d="M8.5 10.5H6v10h12v-10h-2.5"/>',
  kosz: '<path d="M4.5 6.5h15M9.5 6.5V4h5v2.5M6.5 6.5l1 14h9l1-14M10 10v7M14 10v7"/>',
  minusKolo: '<circle cx="12" cy="12" r="9" fill="currentColor" stroke="none"/><path d="M8 12h8" stroke="var(--powierzchnia)" stroke-width="2.4"/>',
  wloczka: '<circle cx="12" cy="12" r="8"/><path d="M5.5 8.5c4 0 9 2.5 12 7M4.5 12.5c3.5 0 7.5 2 9.5 7.5M8 4.8c3 .8 7.5 4 10.6 9.4"/>',
};
document.querySelectorAll('[data-ik]').forEach((el) => {
  el.classList.add('ik');
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${el.dataset.gr || 1.8}" stroke-linecap="round" stroke-linejoin="round">${IKONY[el.dataset.ik] || ''}</svg>`;
});
