<script lang="ts">
	let inputElement: HTMLInputElement;

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

<div class="zone" use:dropAction>
	<input
		bind:this={inputElement}
		type="file"
		name="plates"
		accept="image/*"
		on:change={changeThumbnail}
	/>
	<img src={thumbnailSrc} alt="plate" />
</div>

<style>
	.zone {
		display: grid;
		grid-template-columns: 1fr;

		cursor: pointer;
		background-color: rgba(100, 100, 100, 0.2);

		border-top: dashed 4px rgba(100, 100, 100, 0.8);
		border-left: dashed 4px rgba(100, 100, 100, 0.8);
		border-bottom: dashed 4px rgba(150, 150, 150, 0.8);
		border-right: dashed 4px rgba(150, 150, 150, 0.8);
		border-radius: 8%;
	}

	.zone > * {
		height: 100%;
		width: 100%;
		grid-row-start: 1;
		grid-column-start: 1;
	}

	input[type='file'] {
		max-height: 100%;
		max-width: 100%;
		opacity: 0;
	}
</style>
