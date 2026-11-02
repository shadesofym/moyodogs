import settings from '../data/seo.json' with {type:'json'};
export const siteOrigin=settings.origin;
export function indexingEnabled(value?:string,branch?:string){
 return value==='enabled'&&(!branch||branch==='main');
}
export function excludedFromSearch(path:string){
 return /^\/(?:vorschau(?:\/|$)|konzept(?:\/|$)|404(?:\.html|\/|$)|impressum(?:\/|$)|datenschutz(?:\/|$))/.test(path);
}
export function canonicalUrl(path:string){
 const url=new URL(path,siteOrigin);
 if(url.origin!==siteOrigin)throw new Error('Kanonische Adresse muss zur Website gehören.');
 url.search='';url.hash='';
 return url.href;
}
export function jsonLd(value:unknown){return JSON.stringify(value).replaceAll('<','\\u003c');}
export function xmlEscape(value:string){return value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');}
