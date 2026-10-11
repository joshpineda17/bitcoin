// Public catalogue. Cacao Media's story pages call this to show the experience that goes with a story.
import type { APIContext } from 'astro';
import { todosLosTours, urlTour } from '../../lib/tours';

export async function GET({ site }: APIContext) {
  const absoluta = (ruta: string) => new URL(ruta, site).href;
  const tours = (await todosLosTours()).map((t) => ({
    id: t.id,
    titulo: t.data.titulo,
    bajada: t.data.bajada,
    lugar: t.data.lugar,
    coords: t.data.coords ?? null,
    duracion: t.data.duracion,
    nivel: t.data.nivel,
    grupo: t.data.grupo,
    precio: t.data.precio,
    url: absoluta(urlTour(t)),
    foto: absoluta(t.data.portada),
    alt: t.data.alt,
    historias: t.data.historias,
  }));
  return Response.json({ version: 1, moneda: 'sats', demo: true, tours });
}
