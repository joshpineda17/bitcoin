import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const historias = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/historias' }),
  schema: z.object({
    titulo: z.string(),
    bajada: z.string(),
    seccion: z.enum(['cronica', 'guia', 'cultura', 'cafe']),
    fecha: z.coerce.date(),
    autor: z.string(),
    lugar: z.string(),
    coords: z.string().optional(),
    minutos: z.number().int().positive(),
    precio: z.number().nonnegative().default(0.12),
    portada: z.string(),
    alt: z.string(),
    tags: z.array(z.string()).default([]),
    gratis: z.boolean().default(false),
  }),
});

export const collections = { historias };
