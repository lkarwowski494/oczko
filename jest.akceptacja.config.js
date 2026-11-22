// Testy akceptacyjne przed kodem (DS-02, docs/jakosc/strategia.md): poza `npm test`; czerwone z właściwego powodu sprawdza scripts/jakosc/akceptacja-raport.mjs.
const wspolne = {
  // Zastępniki pakietów natywnych na Node (P-120 Q1a, jak w jest.config.js).
  moduleNameMapper: {
    '^expo-file-system$': '<rootDir>/tests/narzedzia/expo-file-system-node.ts',
    '^expo-sqlite$': '<rootDir>/tests/narzedzia/expo-sqlite-node.ts',
  },
  setupFiles: ['<rootDir>/jest.fast-check.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|react-native-svg|@testing-library/.*)',
  ],
};
module.exports = {
  testTimeout: 30000,
  projects: [
    { ...wspolne, displayName: 'akceptacja-node', preset: 'jest-expo/ios', testEnvironment: 'node', testMatch: ['<rootDir>/tests/akceptacja/{domena,dane,kontrole}/**/*.test.[jt]s'] },
    { ...wspolne, displayName: 'akceptacja-ekrany', preset: 'jest-expo/ios', testMatch: ['<rootDir>/tests/akceptacja/ekrany/**/*.test.[jt]s?(x)'] },
  ],
};
