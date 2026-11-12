import { pages as forage } from '#lib/forage/pages.server.js';
import { pages as mosaic } from '#lib/mosaic/pages.server.js';
import type { PageServerLoad } from './$types';

export const prerender = false;

export const load: PageServerLoad = ({ cookies }) => ({
	covers: { mosaic: mosaic.current(cookies), forage: forage.current(cookies) }
});
