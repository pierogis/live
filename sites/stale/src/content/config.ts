// Import utilities from `astro:content`
import { z, defineCollection } from "astro:content";
// Define a `type` and `schema` for each collection
const loafsCollection = defineCollection({
  type: "content",
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      publishedDate: z.date(),
      updatedDate: z.date(),
      subtitle: z.string().optional(),
      description: z.string(),
      author: z.string(),
      twitterHandle: z.string().optional(),
      image: image()
        .refine((img) => img.width == 1200, {
          message: "image must be 1200 pixels wide",
        })
        .refine((img) => img.height == 630, {
          message: "image must be 630 pixels tall",
        }),
      alt: z.string(),
      tags: z.array(z.string()),
    }),
});
// Export a single `collections` object to register your collection(s)
export const collections = {
  loafs: loafsCollection,
};
