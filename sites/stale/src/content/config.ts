// Import utilities from `astro:content`
import { z, defineCollection } from "astro:content";
// Define a `type` and `schema` for each collection
const loafsCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    pubDate: z.date(),
    subtitle: z.string().optional(),
    description: z.string(),
    author: z.string(),
    twitterHandle: z.string().optional(),
    image: z.object({
      url: z.string().optional(),
      alt: z.string(),
    }),
    tags: z.array(z.string()),
  }),
});
// Export a single `collections` object to register your collection(s)
export const collections = {
  loafs: loafsCollection,
};
