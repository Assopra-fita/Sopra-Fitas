import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        // Global injetada pelo script do Google Publisher Tag no index.html
        googletag: 'readonly',
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],

      // Todo o estilo mora em src/styles/. Estilo inline vence CSS, então
      // basta um sobrevivente para a regra global de foco, o token de cor ou
      // a media query não alcançarem aquele elemento.
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXAttribute[name.name="style"]',
          message:
            'Estilo no JSX não é permitido — use uma classe em src/styles/.',
        },
      ],
    },
  },
  {
    // Os componentes de anúncio ficam como estão, por decisão de quem cuida da
    // monetização: mexer neles é mexer em posição, tamanho ou comportamento de
    // criativo. Quando isso entrar em escopo, é só apagar este bloco.
    files: ['src/components/Anuncio*.jsx'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
]);
