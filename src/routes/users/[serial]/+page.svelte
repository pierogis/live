<script lang="ts">
	import { Card, CardsGrid, Divider, ImageDisplay, Section } from '@pierogis/utensils';

	import ReviewCard from '$lib/components/ReviewCard.svelte';
	import { storeScores } from '$lib/api/scores';

	import type { PageData } from './$types';
	export let data: PageData;
	$: ({ user, isUser, isAdmin, categories } = data);

	$: originalSerial = user.serial;
	$: originalEmail = user.email;
</script>

<svelte:head>
	<title>{'user: ' + user.serial.toUpperCase()}</title>
</svelte:head>

{#if !isUser}
	<Card>
		{#if isAdmin}
			<span>#{user.id}</span>
		{/if}
		<span>{user.serial}</span>
	</Card>
{/if}

{#if isUser || isAdmin}
	<form action="/users/{user.id}/edit" method="post">
		<Card>
			{#if isAdmin}
				<span>#{user.id}</span>
			{/if}
			<input
				class="serial border inset shadow"
				type="text"
				name="serial"
				bind:value={user.serial}
				placeholder={originalSerial}
				maxlength="7"
				autocomplete="off"
				autocapitalize="characters"
			/>
			<input
				class="email border inset shadow"
				type="text"
				name="email"
				disabled
				bind:value={user.email}
				placeholder={originalEmail}
			/>
			<div class="buttons">
				<button class="good border inset shadow no-select" type="submit">update</button>

				{#if isUser}
					<!-- svelte-ignore a11y-accesskey -->
					<button class="border inset shadow no-select" type="submit" form="logout" accesskey="l">
						logout
					</button>
				{/if}

				<a href={`/users/${user.id}/delete`}>
					<button class="bad border inset shadow no-select">delete</button>
				</a>
			</div>
		</Card>
	</form>
{/if}

<form id="logout" action="/logout" method="post" />

<Divider horizontal={true} />

<Section title="reviews">
	{#if user.reviews.length > 0}
		<CardsGrid>
			{#each user.reviews as review}
				<ReviewCard
					{categories}
					{review}
					scores={storeScores(review.model.scores, review.modelId, user?.id, categories).allScores}
				>
					<a href="/plates/{review.modelId}">
						<ImageDisplay
							alt="model {review.modelId}"
							urls={review.model.images.map((image) => image.url)}
							small={true}
						/>
					</a>
				</ReviewCard>
			{/each}
		</CardsGrid>
	{/if}
</Section>

<style>
	form {
		display: flex;
		flex-direction: column;
	}
	input.serial {
		width: 4.25rem;
		text-transform: uppercase;
	}
	input.email {
		width: 16rem;
		max-width: 90%;
	}
	.buttons {
		display: flex;
		gap: 1rem;
	}
</style>
