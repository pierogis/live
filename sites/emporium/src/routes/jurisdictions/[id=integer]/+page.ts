import { storeScores } from '$lib/api/scores';

import type { PageLoad } from './$types';

export const load: PageLoad = async (event) => {
	const { sessionUser } = await event.parent();
	const { jurisdiction, categories } = event.data;

	const canonical = `https://emporium.pierogis.live/jurisdictions/${event.params.id}`;
	const title = `${jurisdiction.name} plates`;
	const description = `plates from ${jurisdiction.name}`;

	const platesInfo = jurisdiction.plates.map((plate) => {
		const { userScores, editorialScores, allScores } = storeScores(
			plate.model.scores,
			plate.modelId,
			sessionUser?.id,
			categories,
			fetch
		);

		return { plate, userScores, editorialScores, allScores };
	});

	return { canonical, title, description, jurisdiction, categories, platesInfo };
};
