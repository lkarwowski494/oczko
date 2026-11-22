module.exports = {
  preset: 'jest-expo/ios',
  setupFiles: ['<rootDir>/jest.fast-check.js'],
  // Zastępniki pakietów natywnych na Node (P-120 Q1a, jak Trening): prawdziwy dysk i prawdziwy SQLite, nie atrapa.
  moduleNameMapper: {
    '^expo-file-system$': '<rootDir>/tests/narzedzia/expo-file-system-node.ts',
    '^expo-sqlite$': '<rootDir>/tests/narzedzia/expo-sqlite-node.ts',
    '^expo-crypto$': '<rootDir>/tests/narzedzia/expo-crypto-node.ts',
    // Trasy w Jest bez kontenera nawigacji: `usePreventRemove` z zastępnika (M1-audytor-generalny-020); `useNavigation` z expo-router przez atrapę testu (M1-122).
    '^expo-router/react-navigation$': '<rootDir>/tests/narzedzia/expo-router-react-navigation.ts',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.app-after-env.js'],
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|standard-navigation)',
  ],
  // Testy oczekujące są poza głównym zestawem (DS-02): npm run test:akceptacja.
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/tests/akceptacja/', '<rootDir>/.claude/'], // .claude/: worktree pod-agentów (08 partia 6)
  testTimeout: 30000,
  workerIdleMemoryLimit: '800MB',
};
