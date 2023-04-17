export const load = async ({ parent, params, data }) => {
	const { user } = data;

	const { plate, sessionUser } = await parent();
	const isUser = sessionUser?.id == user.id;

	const scores = plate.model.scores.filter((score) => score.userId == user.id);

	return { scores, serial: params.serial, isUser };
};
