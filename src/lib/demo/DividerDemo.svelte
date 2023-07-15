<script lang="ts">
	import { Card, Divider } from '$lib';
</script>

<Card>
	<span>a <code>Divider</code></span>
	<Divider size={'4px'} horizontal />
	<div class="horizontal-divider-flexbox">
		<span>can separate horizontally</span>

		<Divider size={'4px'} />

		<span>or vertically</span>
	</div>
</Card>

<style>
	.horizontal-divider-flexbox {
		height: 2rem;
		width: 100%;
		display: flex;
		flex-direction: row;
	}
	.horizontal-divider-flexbox > span {
		flex: 1 1 0px;
		width: 100%;
		text-align: center;
		overflow: scroll;
	}
</style>
