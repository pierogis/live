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
		height: 30vh;
		margin: 20px;

		display: flex;
		flex-direction: column;
		justify-content: center;
		align-content: center;

		text-align: center;
		border: 1px solid black;
	}
</style>
