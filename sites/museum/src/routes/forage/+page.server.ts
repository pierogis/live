import { pages } from '#lib/forage/pages.server.js';
import type { PageServerLoad } from './$types';

// Rendered per request, so your ✓ marks and the way back to your level come from your save.
export const prerender = false;

export const load: PageServerLoad = ({ cookies }) => pages.home(cookies);
