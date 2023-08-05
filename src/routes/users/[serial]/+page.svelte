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

	$: originalSerial = data.user.serial;
	$: originalEmail = data.user.email;
</script>

<svelte:head>
	<title>{'user: ' + data.user.serial.toUpperCase()}</title>
</svelte:head>

{#if !data.isUser}
	<Card>
		{#if data.isAdmin}
			<span>#{data.user.id}</span>
		{/if}
		<span class="link-box" style:cursor="auto">{data.user.serial}</span>
	</Card>
{/if}

<br />

{#if data.isUser || data.isAdmin}
	<form method="post">
		<Card>
			{#if data.isAdmin}
				<span>#{data.user.id}</span>
			{/if}
			<input
				class="serial border inset"
				type="text"
				name="serial"
				bind:value={data.user.serial}
				placeholder={originalSerial}
				maxlength="7"
				autocomplete="off"
				autocapitalize="characters"
			/>
			{#if data.isUser}
				<input
					class="email border inset"
					type="text"
					name="email"
					disabled
					bind:value={data.user.email}
					placeholder={originalEmail}
				/>
			{/if}
			<div class="buttons">
				<Interactable>
					<button class="good border inset no-select">update</button>
				</Interactable>

				{#if data.isUser}
					<Interactable>
						<!-- svelte-ignore a11y-accesskey -->
						<button class="border inset no-select" form="logout" accesskey="l">logout</button>
					</Interactable>
				{/if}

				{#if !data.user.isAdmin}
					<Interactable>
						<a
							class="link-box bad border inset no-select"
							href={`/users/${data.user.serial}/delete`}
						>
							delete
						</a>
					</Interactable>
				{/if}
			</div>
		</Card>
	</form>
{/if}

<form id="logout" action="/logout" method="post" hidden />

<Divider horizontal={true} size={'0.4rem'} />

<Section title="reviews" column>
	{#if data.user.reviews.length > 0}
		<CardsGrid>
			{#each data.user.reviews as review}
				<ReviewCard
					categories={data.categories}
					review={writable({ ...review, user: data.user })}
					scores={data.reviewsScores[review.id]}
				>
					<a href="/plates/{review.modelId}">
						<ImageDisplay
							alt="model {review.modelId}"
							urls={review.model.images.map((image) => image.url)}
							width={'200px'}
							height={'100px'}
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
