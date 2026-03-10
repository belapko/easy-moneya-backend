import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import {defineConfig} from 'eslint/config';

export default defineConfig([
    {
        ignores: ['.idea/**', 'dist/**', 'node_modules/**'],
    },
    {
        files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
        plugins: {js},
        extends: ['js/recommended'],
        languageOptions: {globals: globals.browser},
        rules: {
            semi: ['error', 'always'],
            quotes: ['error', 'single', {avoidEscape: true}],
        },
    },
    tseslint.configs.recommended,
    {
        files: ['**/*.{ts,mts,cts}'],
        rules: {
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    varsIgnorePattern: '^_',
                    argsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                    destructuredArrayIgnorePattern: '^_',
                },
            ],
        },
    },
]);
