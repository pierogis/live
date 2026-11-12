import { pages } from '#lib/forage/pages.server.js';
import type { PageServerLoad } from './$types';

export const prerender = false;

export const load: PageServerLoad = ({ cookies }) => pages.home(cookies);
