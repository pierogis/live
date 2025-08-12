<script lang="ts">
	import { writable } from 'svelte/store';

	import {
		Card,
		CardsGrid,
		Divider,
		Interactable,
		ImageDisplay,
		Section
	} from '@pierogis/utensils';
	import { ReviewCard } from '$lib/components';

	export let data;
	$: ({ user, isUser, isAdmin, categories, reviewsScores } = data);

	$: originalSerial = user.serial;
	$: originalEmail = user.email;

	let serial = user.serial;
	let email = user.email;
</script>

{#if !isUser}
	<Card>
		{#if isAdmin}
			<span>#{user.id}</span>
		{/if}
		<span class="link-box" style:cursor="auto">{serial}</span>
	</Card>
{/if}

<br />

{#if isUser || isAdmin}
	<form method="post">
		<Card>
			{#if isAdmin}
				<span>#{user.id}</span>
			{/if}
			<input
				class="serial border inset"
				type="text"
				name="serial"
				bind:value={serial}
				placeholder={originalSerial}
				maxlength="7"
				autocomplete="off"
				autocapitalize="characters"
			/>
			{#if isUser}
				<input
					class="email border inset"
					type="text"
					name="email"
					disabled
					bind:value={email}
					placeholder={originalEmail}
				/>
			{/if}
			<div class="buttons">
				<Interactable>
					<button class="good border inset no-select">update</button>
				</Interactable>

				{#if isUser}
					<Interactable>
						<!-- svelte-ignore a11y-accesskey -->
						<button class="border inset no-select" form="logout" accesskey="l">logout</button>
					</Interactable>
				{/if}

				{#if !user.isAdmin}
					<Interactable>
						<a class="link-box bad border inset no-select" href={`/users/${user.serial}/delete`}>
							delete
						</a>
					</Interactable>
				{/if}
			</div>
		</Card>
	</form>
{/if}

<form id="logout" action="/logout" method="post" hidden></form>

<Divider horizontal={true} size="0.4rem"></Divider>

<Section column>
	{#snippet title()}
		<h3>reviews</h3>
	{/snippet}

	{#if user.reviews.length > 0}
		<CardsGrid>
			{#each user.reviews as review (review.id)}
				<ReviewCard
					{categories}
					review={writable({ ...review, user: user })}
					scores={reviewsScores[review.id]}
				>
					<a href="/plates/{review.modelId}">
						<ImageDisplay
							alt="model {review.modelId}"
							urls={review.model.images.map((image) => image.url)}
							width="200px"
							height="100px"
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
		width: 6rem;
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
