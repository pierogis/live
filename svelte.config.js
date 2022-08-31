import adapter from '@sveltejs/adapter-auto';
import preprocess from 'svelte-preprocess';

import pkg from 'micromatch';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: preprocess(),

	kit: {
		adapter: adapter()
	},

	package: {
		files: pkg.matcher('!demo/**')
	}
};

export default config;
