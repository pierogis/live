import { pages } from '#lib/forage/pages.server.js';
import type { PageServerLoad } from './$types';

// Rendered per request: it reads your save to send you straight to your level.
export const prerender = false;

export const load: PageServerLoad = ({ cookies }) => pages.start(cookies);
