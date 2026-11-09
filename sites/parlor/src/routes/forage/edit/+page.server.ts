import { pages } from '#lib/forage/pages.server.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => pages.editor();
