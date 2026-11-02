import type {APIRoute} from 'astro';
import {getCollection} from 'astro:content';
import {canonicalUrl,xmlEscape} from '../lib/seo';
export const GET:APIRoute=async()=>{
 const [dogs,litters,posts,offspring,pages]=await Promise.all([
  getCollection('dogs',({data})=>data.published),getCollection('litters',({data})=>data.published),
  getCollection('posts',({data})=>data.published),getCollection('offspring',({data})=>data.published),getCollection('pages'),
 ]);
 const paths=['/','/hunde/','/wuerfe/','/blog/','/kontakt/',
  ...dogs.map(e=>`/hunde/${e.id}/`),...litters.map(e=>`/wuerfe/${e.id}/`),
  ...posts.map(e=>`/blog/${e.id}/`),...offspring.map(e=>`/nachzucht/${e.id}/`),...pages.map(e=>`/${e.id}/`)];
 const urls=[...new Set(paths)].sort();
 return new Response('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+urls.map(path=>`<url><loc>${xmlEscape(canonicalUrl(path))}</loc></url>`).join('')+'</urlset>\n',{headers:{'Content-Type':'application/xml; charset=utf-8'}});
};
