<script lang="ts">
	import { writable } from 'svelte/store';

	import { Card, CardsGrid, Divider, ImageDisplay, Section } from '@pierogis/utensils';
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
		<span class="link-box">{data.user.serial}</span>
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
				class="serial border inset shadow"
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
					class="email border inset shadow"
					type="text"
					name="email"
					disabled
					bind:value={data.user.email}
					placeholder={originalEmail}
				/>
			{/if}
			<div class="buttons">
				<button class="good border inset shadow no-select" type="submit">update</button>

				{#if data.isUser}
					<!-- svelte-ignore a11y-accesskey -->
					<button class="border inset shadow no-select" type="submit" form="logout" accesskey="l">
						logout
					</button>
				{/if}

				<a href={`/users/${data.user.serial}/delete`}>
					<button class="bad border inset shadow no-select">delete</button>
				</a>
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
