<script lang="ts">
	export let inputElement: HTMLInputElement;

	function dropAction(element: HTMLElement) {
		const dropHandler = (event: DragEvent) => {
			// prevent file from being opened
			event.preventDefault();

			if (event.dataTransfer.files.length > 0) {
				inputElement.files = event.dataTransfer.files;
			}
		};
		const dragOverHandler = (event: DragEvent) => {
			event.preventDefault();
		};

		element.addEventListener('drop', dropHandler);
		element.addEventListener('dragover', dragOverHandler);

		return {
			destroy() {
				element.removeEventListener('drop', dropHandler);
				element.removeEventListener('dragover', dragOverHandler);
			}
		};
	}
	let thumbnailSrc = '#';

	function changeThumbnail(event) {
		let image = event.target.files[0];
		const reader = new FileReader();

		reader.readAsDataURL(image);

		reader.onload = (e) => {
			thumbnailSrc = e.target.result.toString();
		};
	}
</script>

<div class="zone inset shadow" use:dropAction>
	<input
		bind:this={inputElement}
		type="file"
		name="image"
		accept="image/*"
		on:change={changeThumbnail}
	/>
	<img class="image" src={thumbnailSrc} alt="upload" />
</div>

<form />

<style>
	.zone {
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: 192px;

		cursor: pointer;

		border-top: dashed 4px var(--text-color);
		border-left: dashed 4px var(--text-color);
		border-bottom: dashed 4px var(--text-color);
		border-right: dashed 4px var(--text-color);
		border-radius: 12px;

		background-color: rgba(100, 100, 100, 0.2);
	}

	.zone > * {
		height: 100%;
		width: 100%;

		grid-row-start: 1;
		grid-column-start: 1;
		justify-self: center;
		align-self: center;
	}

	.image {
		max-height: 90%;
		max-width: 90%;
		width: auto;
		height: auto;
	}

	input[type='file'] {
		opacity: 0;
	}
</style>
