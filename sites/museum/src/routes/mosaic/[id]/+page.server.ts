import { pages } from '#lib/mosaic/pages.server.js';
import type { EntryGenerator, PageServerLoad } from './$types';

export const entries: EntryGenerator = pages.entries;

export const load: PageServerLoad = ({ params }) => pages.level(params.id);
