import { getCollection, type CollectionEntry } from 'astro:content';

export type Tour = CollectionEntry<'tours'>;

/** Sister publication. Its stories are fetched from its public API. */
export const MEDIA_URL = (import.meta.env.PUBLIC_MEDIA_URL ?? 'https://cacaomedia.vercel.app').replace(/\/$/, '');

/** All experiences, cheapest first. */
export async function todosLosTours(): Promise<Tour[]> {
  return (await getCollection('tours')).sort((a, b) => a.data.precio - b.data.precio);
}

export const urlTour = (t: Tour): string => `/experiencias/${t.id}/`;

/** Prices are in satoshis: 45,000 sats. */
export const sats = (n: number): string => `${n.toLocaleString('en-US')} sats`;
