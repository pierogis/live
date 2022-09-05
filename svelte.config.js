import adapter from '@sveltejs/adapter-auto';
import preprocess from 'svelte-preprocess';

import mm from 'micromatch';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: preprocess(),

	kit: {
		adapter: adapter()
	},

	package: {
		files: mm.matcher('!(demo/**|.DS_Store)')
	}
};

export default config;
