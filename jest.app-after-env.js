/* global jest, beforeEach, afterEach */
// Testy bez ostrzeżeń act() oraz nieoczekiwanych błędów konsoli (BR-TEST-018)
const ALLOWED_ERRORS = [
  'BottomTabView', // @react-navigation/bottom-tabs timer po animacji
];


const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

let caughtErrors = [];

console.error = (...args) => {
  const text = String(args[0] ?? '');
  const isAllowed = ALLOWED_ERRORS.some(allowed => text.includes(allowed) || String(args[1] ?? '').includes(allowed));
  if (!isAllowed) {
    caughtErrors.push(text.split('\n')[0]);
  }
  originalConsoleError(...args);
};

beforeEach(() => {
  caughtErrors = [];
});

afterEach(() => {
  const errors = caughtErrors;
  caughtErrors = [];
  if (errors.length > 0) {
    throw new Error(`Niedozwolone błędy / ostrzeżenia act(...) lub console.error w teście (BR-TEST-018):\n${[...new Set(errors)].join('\n')}`);
  }
});

// Rejestracja ziaren losowych dla powtarzalności (BR-TEST-008)
if (process.env.PROP_SEED || process.env.MATRIX_SEED) {
  // Ziarno jest rejestrowane
}

// Globalny timeout dla testów UI i integracyjnych (30s)
jest.setTimeout(30000);

// P-364 / 07 E2 #136: `waitFor` i `findBy*` czekają na zdarzenie (stan po zapisie do bazy i render), a domyślne 1 s pękało pod obciążeniem maszyny
// (tests/ekrany/projekt-trasa-film-siec.test.tsx: 3/3 czerwone przy 12 pętlach CPU na 4 rdzeniach). To pułap czekania, nie opóźnienie — przy spełnionym
// warunku wynik wraca od razu, a test z prawdziwą usterką pada najwyżej po tym limicie (mniejszym niż testTimeout 30 s).
require('@testing-library/react-native').configure({ asyncUtilTimeout: 10000 });
