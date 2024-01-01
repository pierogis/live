<script lang="ts">
	/**
	 * maximum value in seconds for random animation length
	 * `min` must be less than `max`
	 * defaults to 6-8s
	 */
	export let randomLength = {
		x: { min: 6, max: 8 },
		y: { min: 6, max: 8 }
	};

	$: {
		if (randomLength.x.min > randomLength.x.max || randomLength.y.min > randomLength.y.max) {
			throw 'Shine random length min must not be greater than max';
		}
	}

	/**
	 * offset in seconds for start of animation
	 */
	export let offset = {
		x: Math.random() * (randomLength.x.max - 0) + 0,
		y: Math.random() * (randomLength.y.max - 0) + 0
	};

	/**
	 * specify length in seconds
	 * defaults to uniform distribution from `min` to `max` in `randomLength`
	 */
	export let length: { x?: number; y?: number } | undefined = undefined;

	$: realLengthX = length?.x
		? length.x
		: Math.random() * (randomLength.x.max - randomLength.x.min) + randomLength.x.min;

	$: realLengthY = length?.y
		? length.y
		: Math.random() * (randomLength.y.max - randomLength.y.min) + randomLength.y.min;

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
	export let borderRadius = '0px';
</script>

<div class="shine" style:border-radius={borderRadius}>
	<div
		class="shine-x"
		style:--length-x="{realLengthX}s"
		style:--length-y="{realLengthY}s"
		style:--start-x="-{offset.x}s"
		style:--start-y="-{offset.y}s"
		style:--blur={blur}
		style:--color={color}
		style:--unhoverOpacity={unhoverOpacity}
	/>
	<slot />
</div>

<style>
	.shine {
		display: flex;
		overflow: hidden;
		position: relative;
	}
	.shine-x {
		content: '';
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		position: absolute;
		z-index: 1;
		animation: slideX var(--length-x) infinite var(--start-x);
	}
	.shine-x:after {
		opacity: var(--unhoverOpacity);
		content: '';
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		position: absolute;
		z-index: 1;
		animation: slideY var(--length-y) infinite var(--start-y);

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

	.shine:hover .shine-x:after {
		opacity: 1;
	}

	/* animation */

	@keyframes slideX {
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

	@keyframes slideY {
		0% {
			transform: translateY(-60%);
		}
		50% {
			transform: translateY(60%);
		}
		100% {
			transform: translateY(-60%);
		}
	}
</style>
