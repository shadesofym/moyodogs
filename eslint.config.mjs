import js from '@eslint/js';
export default [
  { ignores: ['dist/**', '.astro/**', 'node_modules/**'] },
  { ...js.configs.recommended, files: ['scripts/**/*.mjs', 'tests/**/*.mjs'], languageOptions: { globals: { process: 'readonly', console: 'readonly', URL: 'readonly' } } },
];
