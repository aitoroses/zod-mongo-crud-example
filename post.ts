import { z } from "zod";

export const Post = z.object({
  title: z.string()
});

export type Post = z.infer<typeof Post>;
