// ESLint tylko dla warstwy danych (DS-12, P-092): puste `catch` i zakazane wywołania w src/dane (kontrola 05-8, ADR-0002).
import tsParser from '@typescript-eslint/parser';

export default [
  {
    files: ['src/dane/**/*.ts'],
    languageOptions: { parser: tsParser, ecmaVersion: 2023, sourceType: 'module' },
    rules: {
      'no-empty': ['error', { allowEmptyCatch: false }],
      'no-restricted-syntax': [
        'error',
        { selector: "CallExpression[callee.property.name='withExclusiveTransactionAsync']", message: 'Zakaz: drugie połączenie bez foreign_keys (ADR-0002).' },
        { selector: 'Literal[value=/OR\\s+REPLACE/i]', message: 'Zakaz INSERT OR REPLACE: tylko UPSERT (zasada wspólna 10).' },
        { selector: 'TemplateElement[value.raw=/OR\\s+REPLACE/i]', message: 'Zakaz INSERT OR REPLACE: tylko UPSERT (zasada wspólna 10).' },
        { selector: 'CatchClause > BlockStatement[body.length=0]', message: 'Błąd zapisu nigdy cicho (polityka błędów e3 §2).' },
      ],
    },
  },
];
