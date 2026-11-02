import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {parse} from 'yaml';
import {canonicalUrl,indexingEnabled,excludedFromSearch,jsonLd,unpublishedPostRedirects} from '../src/lib/seo.ts';
const root=resolve(import.meta.dirname,'..');
const read=path=>readFileSync(resolve(root,path),'utf8');
test('Zurückgezogene Blogbeiträge sperren alte Cache-Adressen und lassen sich wieder veröffentlichen',()=>{
 const draft={id:'2026-11-02-cms-funktionstest',published:false};
 const rules=unpublishedPostRedirects([draft,{id:'insight',published:true}]);
 assert.deepEqual(rules,[
  '/blog/2026-11-02-cms-funktionstest/ /nicht-verfuegbar/ 302',
  '/blog/2026-11-02-cms-funktionstest /nicht-verfuegbar/ 302',
  '/blog/2026-11-02-cms-funktionstest/index.html /nicht-verfuegbar/ 302',
 ]);
 assert.deepEqual(unpublishedPostRedirects([{...draft,published:true}]),[]);
 for(const id of ['../secret','test\n/other','https://example.com'])assert.throws(()=>unpublishedPostRedirects([{id,published:false}]));
 const deployed=read('dist/_redirects');
 assert.ok(deployed.includes(rules[0]));
 assert.ok(!deployed.includes('/blog/insight/ /nicht-verfuegbar/'));
 assert.ok(read('dist/_headers').includes('/blog/*\n  Cache-Control: no-store'));
});
test('Suchmaschinenfreigabe ist ausdrücklich und auf den Hauptbranch begrenzt',()=>{
 for(const value of [undefined,'','true','false','disabled'])assert.equal(indexingEnabled(value,'main'),false);
 assert.equal(indexingEnabled('enabled','main'),true);
 assert.equal(indexingEnabled('enabled','vorschau'),false);
 assert.equal(indexingEnabled('enabled'),true);
 assert.ok(excludedFromSearch('/vorschau/journal/yam/'));
 assert.ok(excludedFromSearch('/404.html'));
 assert.ok(!excludedFromSearch('/blog/birthday/'));
});
test('Kanonische Adressen verweisen auf die Hauptdomain und JSON-LD kann keinen Script-Tag einschleusen',()=>{
 assert.equal(canonicalUrl('/hunde/malu/?preview=1#foto'),'https://moyodogs.com/hunde/malu/');
 assert.throws(()=>canonicalUrl('https://example.com/'));
 const serialized=jsonLd({headline:'</script><script>alert(1)</script>'});
 assert.ok(!serialized.includes('</script>'));
 assert.equal(JSON.parse(serialized).headline,'</script><script>alert(1)</script>');
});
test('Jede alte WordPress-Seite hat ein existierendes Ziel ohne Weiterleitungsketten',()=>{
 const inventory=JSON.parse(read('docs/wordpress-migration.json'));
 assert.equal(inventory.routes.length,60);
 const lines=read('public/_redirects').split('\n').filter(l=>l&&!l.startsWith('#')).map(l=>l.split(' '));
 assert.ok(lines.length<=2000);
 const rules=new Map(lines.map(([a,b])=>[a,b]));
 assert.equal(rules.size,lines.length);
 for(const [from,to,status] of lines){
  assert.equal(status,'301');assert.ok(to.startsWith('/')&&!to.startsWith('//'));
  assert.ok(!rules.has(to),`${from} hat eine Weiterleitungskette`);
  const target=to.endsWith('/')?to+'index.html':to;
  assert.ok(existsSync(resolve(root,'dist','.'+target)),`${from}: Ziel fehlt ${to}`);
 }
 for(const row of inventory.routes){
  assert.ok(existsSync(resolve(root,'dist','.'+row.new+'index.html')));
  if(row.old!==row.new)assert.equal(rules.get(row.old),row.new);
 }
});
test('Importierte Bilder, Nachzucht und Archivbeiträge sind vorhanden, Entwürfe bleiben ausgeschlossen',()=>{
 const inventory=JSON.parse(read('docs/wordpress-migration.json'));
 assert.equal(inventory.images,381);
 assert.equal(readdirSync(resolve(root,'public/media/wordpress')).filter(p=>p.endsWith('.webp')).length,381);
 assert.ok(read('dist/hunde/malu/index.html').includes('04.09.2019'));
 assert.ok(!read('dist/hunde/malu/index.html').includes('04.09.2029'));
 assert.ok(read('dist/hunde/yam/index.html').includes('begrenzte Zuchtzulassung'));
 assert.ok(read('dist/wuerfe/the-gods/index.html').includes('/nachzucht/the-gods-kama/'));
 assert.ok(read('dist/blog/birthday/index.html').includes('Aus unserem Archiv'));
 assert.equal(existsSync(resolve(root,'dist/blog/fotoshooting-8-weeks/index.html')),false);
 const entry=parse(read('src/content/posts/fotoshooting-8-weeks.md').split('---')[1]);
 assert.equal(entry.published,false);
});
test('Sitemap, Metadaten und Vorschausperre sind konsistent',()=>{
 const sitemap=read('dist/sitemap.xml');
 assert.ok(sitemap.includes('https://moyodogs.com/hunde/malu/'));
 for(const excluded of ['localhost','127.0.0.1','pages.dev','/vorschau/','/konzept/','erster-beitrag','fotoshooting-8-weeks','/404'])assert.ok(!sitemap.includes(excluded));
 const urls=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
 assert.equal(new Set(urls).size,urls.length);
 for(const file of readdirSync(resolve(root,'dist'),{recursive:true}).filter(f=>f.endsWith('.html')&&!f.startsWith('konzept/'))){
  const html=read('dist/'+file);
  assert.ok(html.includes('rel="canonical"'),file);
  assert.ok(html.includes('noindex, follow'),file);
  assert.ok(!html.includes('http://127.0.0.1'),file);
 }
 const post=read('dist/blog/birthday/index.html');
 const raw=[...post.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)][0]?.[1];
 assert.ok(raw);const ld=JSON.parse(raw);
 assert.equal(ld['@graph'].find(x=>x['@type']==='BlogPosting').datePublished,'2023-01-11T00:00:00.000Z');
 assert.equal(read('dist/robots.txt'),'User-agent: *\nDisallow: /\n');
 assert.ok(read('dist/_headers').includes('https://:version.:project.pages.dev/*'));
});
test('Jede reguläre Seite hat einen eigenen Suchergebnis-Titel',()=>{
 const seen=new Map();
 for(const file of readdirSync(resolve(root,'dist'),{recursive:true}).filter(f=>f.endsWith('.html'))){
  const path='/'+file.replace(/index\.html$/,'');
  if(excludedFromSearch(path))continue;
  const title=read('dist/'+file).match(/<title>(.*?)<\/title>/)?.[1];
  assert.ok(title,file);assert.ok(!seen.has(title),`${file} und ${seen.get(title)} haben denselben Titel`);
  seen.set(title,file);
 }
});
