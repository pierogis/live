// Import utilities from `astro:content`
import { z, defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

// Define a `type` and `schema` for each collection
const loafsCollection = defineCollection({
	loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/loafs' }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			publishedDate: z.date(),
			updatedDate: z.date(),
			subtitle: z.string().optional(),
			description: z.string(),
			author: z.object({
				name: z.string(),
				twitterHandle: z.string().optional()
			}),
			image: z.object({
				og: image(),
				// .refine((img) => img.width === 1200, {
				//   message: "open graph image must be 1200 pixels wide",
				// })
				// .refine((img) => img.height === 630, {
				//   message: "open graph image must be 630 pixels tall",
				// }),
				twitter: image(),
				// .refine((img) => img.width === 1200, {
				//   message: "twitter image must be 1200 pixels wide",
				// })
				// .refine((img) => img.height === 600, {
				//   message: "twitter image must be 600 pixels tall",
				// }),
				'1200x600': image(),
				// .refine((img) => img.width === 1200, {
				//   message: "1200w image must be 1200 pixels wide",
				// })
				// .refine((img) => img.height === 600, {
				//   message: "1200w image must be 600 pixels tall",
				// }),
				'600x300': image(),
				// .refine((img) => img.width === 600, {
				//   message: "600w image must be 600 pixels wide",
				// })
				// .refine((img) => img.height === 300, {
				//   message: "600w image must be 300 pixels tall",
				// }),
				'300x300': image()
				// .refine((img) => img.width === 300, {
				//   message: "300w image must be 300 pixels wide",
				// })
				// .refine((img) => img.height === 300, {
				//   message: "300w image must be 300 pixels tall",
				// }),
			}),
			alt: z.string(),
			tags: z.array(z.string())
		})
});
// Export a single `collections` object to register your collection(s)
export const collections = {
	loafs: loafsCollection
};
