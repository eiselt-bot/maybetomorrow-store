import nextPlugin from 'eslint-config-next';

// ESLint 9 flat config for mt-store.
export default [
  ...nextPlugin,
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'dist/**',
      'build/**',
      'drizzle/meta/**',
      'public/**',
      '.turbo/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      'react/no-unescaped-entities': 'off',
      '@next/next/no-img-element': 'off',
      // False positives for our registry-based component lookup pattern
      // (Layout + Home are pre-declared, just resolved at render-time):
      'react-hooks/static-components': 'off',
      // Our cart page's effect legitimately batches multiple setState
      // calls after an async fetch — the rule would force us into an
      // ugly single-state-object refactor for no real benefit:
      'react-hooks/set-state-in-effect': 'off',
    },
  },
];
