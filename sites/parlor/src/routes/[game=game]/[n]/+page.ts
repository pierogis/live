import { loadPlay } from '../play.js';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, data }) => ({
	...data,
	...(await loadPlay(params.game))
});
