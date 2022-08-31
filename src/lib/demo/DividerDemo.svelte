<script lang="ts">
	import { Divider } from '$lib';
</script>

<span>a <code>Divider</code></span>
<Divider size={'4px'} horizontal />
<div class="horizontal-divider-flexbox">
	<span>can separate horizontally</span>
	<br />
	<Divider size={'4px'} />
	<br />
	<span>or vertically</span>
</div>

<style>
	.horizontal-divider-flexbox {
		height: 2rem;
		width: 100%;
		display: flex;
		flex-direction: row;
	}
	.horizontal-divider-flexbox > span {
		flex: 1 1 0px;
	}
</style>
