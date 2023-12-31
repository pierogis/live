<script lang="ts">
	import { Interactable } from '@pierogis/utensils';

	const email = 'karl@pierogis.live';
</script>

<div class="container">
	<div class="links">
		<Interactable>
			<a class="border inset link-box" href="https://ko-fi.com/Q5Q6C0OK3" target="_blank"> kofi </a>
		</Interactable>
		<Interactable>
			<a class="border inset link-box" href="https://www.patreon.com/bePatron?u=72232597">
				patreon
			</a>
		</Interactable>
		<Interactable>
			<a class="border inset link-box" href="mailto:{email}">{email}</a>
		</Interactable>
	</div>
</div>

<style>
	.container {
		margin: 2rem;

		height: 100%;
		display: flex;
		flex-direction: column;

		justify-content: center;
	}

	.links {
		display: flex;
		justify-content: center;
		flex-wrap: wrap;

		gap: 1rem;
	}
</style>
