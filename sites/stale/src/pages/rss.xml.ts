import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import rss from "@astrojs/rss";

export const GET: APIRoute = async (context) => {
  const loafs = await getCollection("loafs");
  return rss({
    title: "stale",
    description: "well beyond the pale",
    site: context.site!,
    items: loafs.map((loaf) => ({
      title: loaf.data.title,
      pubDate: loaf.data.publishedDate,
      description: loaf.data.description,
      link: `/loafs/${loaf.slug}/`,
    })),
    customData: `<language>en-us</language>`,
  });
};
