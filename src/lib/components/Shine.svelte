<script lang="ts">
	/**
	 * maximum value in seconds for random animation length
	 * `min` must be less than `max`
	 * defaults to 6-8s
	 */
	export let randomLength = {
		min: 6,
		max: 8
	};

	$: {
		if (randomLength.min > randomLength.max) {
			throw 'Shine random length min must not be greater than max';
		}
	}

	/**
	 * offset in seconds for start of animation
	 */
	export let offset = Math.random() * (randomLength.max - 0) + 0;

	/**
	 * specify length in seconds
	 * defaults to uniform distribution from `min` to `max` in `randomLength`
	 */
	export let length: number | undefined = undefined;

	$: realLength = length
		? length
		: Math.random() * (randomLength.max - randomLength.min) + randomLength.min;

	/**
	 * blur filter applied over shine gradient (use 0 for no blur)
	 * defaults to 50px
	 */
	export let blur = '50px';

	/**
	 * main color of the shine
	 * defaults to white with 40% opacity
	 */
	export let color = 'rgba(255, 255, 255, 0.4)';

	/**
	 * opacity when not hovering (combines with alpha in the color)
	 */
	export let unhoverOpacity = 0.4;
</script>

<div
	class="shine"
	style:--length="{realLength}s"
	style:--start="-{offset}s"
	style:--blur={blur}
	style:--color={color}
	style:--unhoverOpacity={unhoverOpacity}
>
	<slot />
</div>

<style>
	.shine {
		display: flex;
		overflow: hidden;
		position: relative;
	}
	.shine:after {
		opacity: var(--unhoverOpacity);
		content: '';
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		position: absolute;
		z-index: 1;
		animation: slide var(--length) infinite var(--start);

		transition: opacity 2000ms;

		background: linear-gradient(
			to right,
			rgba(255, 255, 255, 0) 0%,
			var(--color) 40%,
			var(--color) 60%,
			rgba(125, 185, 232, 0) 100%
		);
		filter: blur(50px);
	}

	.shine:hover:after {
		opacity: 1;
	}

	/* animation */

	@keyframes slide {
		0% {
			transform: translateX(-60%);
		}
		50% {
			transform: translateX(60%);
		}
		100% {
			transform: translateX(-60%);
		}
	}
</style>
