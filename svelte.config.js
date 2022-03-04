import adapter from '@sveltejs/adapter-auto';
import preprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: preprocess(),

	kit: {
		adapter: adapter(),
		methodOverride: {
			allowed: ['PUT', 'PATCH', 'DELETE']
		}
	}
};

export default config;
