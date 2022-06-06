<script lang="ts">
	const email = 'karl@pierogis.live';
</script>

<div class="container">
	<div class="links">
		<a class="border inset shadow link-box" href="https://ko-fi.com/Q5Q6C0OK3" target="_blank">
			kofi
		</a>
		<a class="border inset shadow link-box" href="https://www.patreon.com/bePatron?u=72232597">
			patreon
		</a>
		<a class="border inset shadow link-box" href="mailto:{email}">{email}</a>
	</div>
</div>

<style>
	.container {
		padding-top: 30vh;

		display: flex;
		flex-direction: column;

		gap: 1rem;

		align-items: center;
		justify-content: center;
		text-align: center;
	}

	.links {
		display: flex;
		flex-direction: row;

		gap: 1rem;

		align-items: center;
		justify-content: center;
		flex-wrap: wrap;
	}
</style>
