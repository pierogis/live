import { fileURLToPath } from 'node:url';

import globals from 'globals';

import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';

import prettier from 'eslint-config-prettier';
import ts from 'typescript-eslint';
import eslintPluginAstro from 'eslint-plugin-astro';
import svelte from 'eslint-plugin-svelte';

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

export default ts.config(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs.recommended,
	...eslintPluginAstro.configs.recommended,
	prettier,
	...svelte.configs.prettier,
	...eslintPluginAstro.configs.prettier,
	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node }
		},
		rules: {
			// typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
			// see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
			'no-undef': 'off'
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser
			}
		}
	}
);
