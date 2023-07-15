<script lang="ts">
	export let border = true;
	export let inset = true;
	export let shadow = false;
</script>

<div class="card" class:border class:inset class:shadow>
	<slot />
</div>

<style>
	.card {
		padding: 12px;
		max-width: 80vw;
		height: 100%;

		display: flex;
		flex-direction: column;
		place-items: center;
		place-content: center;
		gap: 12px;

		position: relative;

		background-color: var(--primary-color);
	}
</style>
