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
		height: 80vh;

		display: flex;
		flex-direction: column;

		justify-content: center;
	}

	.links {
		display: flex;

		gap: 1rem;
	}
</style>
