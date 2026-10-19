import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';

import js from '@eslint/js';
import astro from 'eslint-plugin-astro';
import prettier from 'eslint-config-prettier';
import svelte from 'eslint-plugin-svelte';
import ts from 'typescript-eslint';

export default defineConfig(
	globalIgnores([
		'**/.DS_Store',
		'**/.svelte-kit',
		'**/.astro',
		'**/.wrangler',
		'**/node_modules',
		'**/build',
		'**/dist',
		'**/.env',
		'**/.env.*',
		'!**/.env.example',
		'**/vite.config.js.*',
		'**/vite.config.ts.*',
		'**/pnpm-lock.yaml',
		'**/pnpm-workspace.yaml',
		'**/.changeset',
		'**/worker-configuration.d.ts'
	]),
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs.recommended,
	astro.configs.recommended,
	prettier,
	...svelte.configs.prettier,

	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node }
		},
		rules: {
			// typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
			// see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
			'no-undef': 'off',
			'@typescript-eslint/no-explicit-any': ['warn']
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				extraFileExtensions: ['.svelte'],
				parser: ts.parser
			}
		},
		rules: {
			// The rule cannot see a parent read a $bindable() default through bind:.
			'no-useless-assignment': 'off',
			'svelte/no-at-html-tags': ['warn'],
			'svelte/no-navigation-without-resolve': 'off'
		}
	},
	{
		files: ['**/*.astro'],
		languageOptions: {
			parserOptions: {
				extraFileExtensions: ['.astro'],
				parser: ts.parser
			}
		}
	}
);
