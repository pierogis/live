<script lang="ts">
	import { Card } from '$lib';
</script>

<Card border={false}>
	<Card inset={false}>
		<Card shadow={true}>
			<span>a <code>Card</code> within a <code>Card</code></span>
		</Card>

		<span>within a <code>Card</code> !</span>
	</Card>
</Card>
