import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const tours = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/tours' }),
  schema: z.object({
    titulo: z.string(),
    bajada: z.string(),
    lugar: z.string(),
    coords: z.string().optional(),
    /** Human readable: "4 horas", "Día completo". */
    duracion: z.string(),
    nivel: z.enum(['Fácil', 'Moderado', 'Exigente']),
    grupo: z.string(),
    /** Per person, in satoshis. */
    precio: z.number().int().positive(),
    incluye: z.array(z.string()),
    llevar: z.array(z.string()).default([]),
    portada: z.string(),
    alt: z.string(),
    credito: z.string().optional(),
    licencia: z.string().optional(),
    creditoUrl: z.url().optional(),
    /** Slugs of the Cacao Media stories this experience brings to life. */
    historias: z.array(z.string()).default([]),
  }),
});

export const collections = { tours };
