import { storeScores } from '$lib/api/scores';

import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, parent, data }) => {
	const { sessionUser } = await parent();
	const { jurisdiction, categories } = data;

	const canonical = `https://emporium.pierogis.live/jurisdictions/${params.id}`;
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
