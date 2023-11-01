<script lang="ts">
	import { Card } from '@pierogis/utensils';
</script>

<Card shadow={true}>
	<Card inset={false}>
		<Card border={false}>
			<span>a <code>Card</code> within a <code>Card</code></span>
		</Card>

		<span>within a <code>Card</code> !</span>
	</Card>
</Card>
