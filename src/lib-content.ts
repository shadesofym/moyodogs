import { getCollection } from 'astro:content';
const publishedDogs = async () => (await getCollection('dogs', ({ data }) => data.published)).sort((a, b) => a.data.order - b.data.order || a.id.localeCompare(b.id));
// Charakterköpfe sind die Hunde, die bei uns leben. Deckrüden sind alle Rüden mit Zuchtzulassung –
// auch die, die nicht bei uns leben (role: deckruede).
export const publicDogs = async () => (await publishedDogs()).filter(({ data }) => data.role !== 'deckruede');
export const studDogs = async () => (await publishedDogs()).filter(({ data }) => data.studAvailable);
export const allPublicDogs = publishedDogs;
export const publicLitters = async () => (await getCollection('litters', ({ data }) => data.published)).sort((a, b) => a.data.order - b.data.order || a.id.localeCompare(b.id));
export const publicPosts = async () => (await getCollection('posts', ({ data }) => data.published)).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf() || a.id.localeCompare(b.id));
export const publicOffspring = async () => (await getCollection('offspring', ({ data }) => data.published)).sort((a, b) => a.data.title.localeCompare(b.data.title, 'de-CH'));
