import { z } from "zod";
import { extractYoutubeId } from "./youtube";

const categoryEnum = z.enum(["MOVIE", "SHORT", "DOCUMENTARY", "EXPERIMENTAL"]);

const youtubeFields = z
  .object({
    youtubeUrl: z.string().max(500).optional().nullable(),
    youtubeId: z.string().max(20).optional().nullable(),
  })
  .transform((data) => {
    const id =
      (data.youtubeId && extractYoutubeId(data.youtubeId)) ||
      (data.youtubeUrl && extractYoutubeId(data.youtubeUrl)) ||
      null;
    return {
      youtubeId: id,
      youtubeUrl: id ? `https://www.youtube.com/watch?v=${id}` : data.youtubeUrl ?? null,
      posterUrl: id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : undefined,
    };
  });

export const movieCreateSchema = z
  .object({
    title: z.string().min(1).max(200),
    slug: z.string().min(1).max(120).optional(),
    tagline: z.string().max(300).optional().nullable(),
    description: z.string().max(5000).optional().nullable(),
    releaseYear: z.number().int().min(1888).max(new Date().getFullYear() + 5),
    posterUrl: z.string().url().optional().nullable(),
    youtubeUrl: z.string().max(500).optional().nullable(),
    youtubeId: z.string().max(20).optional().nullable(),
    category: categoryEnum.optional().default("SHORT"),
    runtimeSeconds: z.number().int().positive().optional().nullable(),
    format: z.string().max(120).optional().nullable(),
    crew: z.string().max(500).optional().nullable(),
    isLatestRelease: z.boolean().optional().default(false),
    isFmacSelect: z.boolean().optional().default(false),
  })
  .transform((data) => {
    const id =
      (data.youtubeId && extractYoutubeId(data.youtubeId)) ||
      (data.youtubeUrl && extractYoutubeId(data.youtubeUrl)) ||
      null;
    const poster =
      data.posterUrl ??
      (id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : null);
    return {
      ...data,
      youtubeId: id,
      youtubeUrl: id ? `https://www.youtube.com/watch?v=${id}` : data.youtubeUrl ?? null,
      posterUrl: poster,
    };
  });

export const movieUpdateSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    slug: z.string().min(1).max(120).optional(),
    tagline: z.string().max(300).optional().nullable(),
    description: z.string().max(5000).optional().nullable(),
    releaseYear: z.number().int().min(1888).max(new Date().getFullYear() + 5).optional(),
    posterUrl: z.string().url().optional().nullable(),
    youtubeUrl: z.string().max(500).optional().nullable(),
    youtubeId: z.string().max(20).optional().nullable(),
    category: categoryEnum.optional(),
    runtimeSeconds: z.number().int().positive().optional().nullable(),
    format: z.string().max(120).optional().nullable(),
    crew: z.string().max(500).optional().nullable(),
    isLatestRelease: z.boolean().optional(),
    isFmacSelect: z.boolean().optional(),
  })
  .transform((data) => {
    const hasYoutube = data.youtubeUrl !== undefined || data.youtubeId !== undefined;
    if (!hasYoutube) return data;
    const id =
      (data.youtubeId && extractYoutubeId(data.youtubeId)) ||
      (data.youtubeUrl && extractYoutubeId(data.youtubeUrl ?? "")) ||
      null;
    return {
      ...data,
      youtubeId: id,
      youtubeUrl: id ? `https://www.youtube.com/watch?v=${id}` : data.youtubeUrl ?? null,
      posterUrl:
        data.posterUrl ??
        (id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : undefined),
    };
  });

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200),
});

export type MovieCreateInput = z.infer<typeof movieCreateSchema>;
export type MovieUpdateInput = z.infer<typeof movieUpdateSchema>;
