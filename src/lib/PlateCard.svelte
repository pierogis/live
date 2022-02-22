<script lang="ts">
	import type { Plate } from '$lib/plates';

	export let plate: Plate;
</script>

<div class="card">
	<a href={'/' + plate.id}>
		<img
			src="https://www.flhsmv.gov/wp-content/uploads/plate1-1.jpg"
			alt={`${plate.state} license plate for ${plate.startYear}-${plate.endYear}`}
			width="90%"
		/>
	</a>

	<a href={'/' + plate.id}>
		<span>{`${plate.state} ${plate.startYear}-${plate.endYear}`}</span>
	</a>
</div>

<style>
	.card {
		height: 200px;
		max-width: 200px;

		display: flex;
		flex-direction: column;
		justify-content: center;
		align-content: center;

		text-align: center;

		background-color: (--primary-color);

		box-shadow: 5px 5px 0 var(--accent-color), -5px -5px 0 var(--secondary-color),
			0px 0px 10px 2px rgba(0, 0, 0, 0.4);
	}
</style>
