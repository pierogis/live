import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export async function writePack(file: string | URL, data: unknown): Promise<void> {
	const path = file instanceof URL ? fileURLToPath(file) : file;
	const prettier = await import('prettier');
	const options = (await prettier.resolveConfig(path)) ?? {};
	await writeFile(
		path,
		await prettier.format(JSON.stringify(data), { ...options, filepath: path })
	);
}
