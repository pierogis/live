<script lang="ts">
	import { Card } from '@pierogis/utensils';

	import questions from './_faq.json';
</script>

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

		width: 90%;
	}

	.question {
		font-weight: bold;
		text-align: center;

		text-decoration: underline;
	}

	.answer {
		max-width: 40rem;

		text-align: left;

		white-space: pre-line;

		font-family: 'Lora';
		font-weight: normal;
	}
</style>
