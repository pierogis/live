import css from '@pierogis/utensils/styles/pierogis.css?inline';

export const GET = async () => {
	return new Response(css.trim(), {
		headers: {
			'Content-Type': 'application/css'
		}
	});
};
