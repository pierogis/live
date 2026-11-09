import { pages } from '#lib/mosaic/pages.server.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => pages.editor();
