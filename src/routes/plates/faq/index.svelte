<script lang="ts">
	import Card from '$lib/components/Card.svelte';

	export let questions: { question: String; answer: String }[];
</script>

<svelte:head>
	<title>faq</title>
</svelte:head>

<div class="faqs">
	{#each questions as question}
		<div>
			<Card>
				<span class="question">{question.question}</span>
				<span class="answer">{question.answer}</span>
			</Card>
		</div>
	{/each}
</div>

<style>
	.faqs {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;

		justify-content: center;

		gap: 2rem;
	}

	.question {
		font-weight: bold;
		text-align: center;

		text-decoration: underline;
	}

	.answer {
		font-weight: normal;

		text-align: left;

		white-space: pre-line;
		font-family: 'Lora';
	}
</style>
