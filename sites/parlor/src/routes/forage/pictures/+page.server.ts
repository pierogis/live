import { pages } from '#lib/forage/pages.server.js';
import type { PageServerLoad } from './$types';

// Rendered per request, so your ✓ marks come from your save right away.
export const prerender = false;

export const load: PageServerLoad = ({ cookies }) => pages.pictures(cookies);
