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
 assert.ok(read('dist/hunde/yam/index.html').includes('Ankörung'));
 assert.ok(!read('dist/hunde/yam/index.html').includes('begrenzte Zuchtzulassung'));
 assert.ok(read('dist/wuerfe/the-gods/index.html').includes('/nachzucht/the-gods-kama/'));
 assert.ok(read('dist/blog/birthday/index.html').includes('Aus unserem Archiv'));
 assert.equal(existsSync(resolve(root,'dist/blog/fotoshooting-8-weeks/index.html')),false);
 const entry=parse(read('src/content/posts/fotoshooting-8-weeks.md').split('---')[1]);
 assert.equal(entry.published,false);
});
test('Sitemap, Metadaten und Vorschausperre sind konsistent',()=>{
 const sitemap=read('dist/sitemap.xml');
 assert.ok(sitemap.includes('https://moyodogs.com/hunde/malu/'));
 assert.ok(sitemap.includes('https://moyodogs.com/nachzucht/</loc>'),'Nachzucht-Übersicht fehlt in der Sitemap');
 for(const excluded of ['localhost','127.0.0.1','pages.dev','/vorschau/','erster-beitrag','fotoshooting-8-weeks','/404'])assert.ok(!sitemap.includes(excluded));
 const urls=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
 assert.equal(new Set(urls).size,urls.length);
 for(const file of readdirSync(resolve(root,'dist'),{recursive:true}).filter(f=>f.endsWith('.html'))){
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
test('Geteilte Links zeigen die Social Card, Unterseiten behalten ihr eigenes Bild',()=>{
 assert.ok(existsSync(resolve(root,'public/media/social-card-v2.jpg')),'Social Card fehlt');
 const card='https://moyodogs.com/media/social-card-v2.jpg';
 const home=read('dist/index.html');
 assert.ok(home.includes(`<meta property="og:image" content="${card}">`));
 assert.ok(home.includes('<meta property="og:image:width" content="1200">'));
 assert.ok(home.includes('<meta property="og:image:height" content="630">'));
 assert.ok(home.includes('<meta property="og:image:type" content="image/jpeg">'));
 assert.ok(home.includes(`<meta name="twitter:image" content="${card}">`));
 const dog=read('dist/hunde/yam/index.html');
 assert.ok(dog.includes('<meta property="og:image" content="https://moyodogs.com/media/yam.webp">'));
 assert.ok(dog.includes('<meta name="twitter:image" content="https://moyodogs.com/media/yam.webp">'));
 assert.ok(!dog.includes('social-card-v2.jpg'));
 assert.ok(!dog.includes('og:image:width'));
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
test('Die Startseite führt vor dem Bildband zur Anfrage und erklärt den Ablauf',()=>{
 const home=read('dist/index.html');
 const cta=home.indexOf('Welpenanfrage');
 const band=home.indexOf('class="hero-band"');
 assert.ok(cta>0&&band>0&&cta<band,'Anfrage-Button steht erst nach dem Bildband');
 assert.ok(home.includes('wa.me/41767174965'),'WhatsApp-Link fehlt');
 assert.ok(home.includes(encodeURIComponent('Hallo Sandra, ich habe eine Frage zu MOYO DOGS.')),'WhatsApp-Text weicht ab');
 for(const fact of ['Charakter zuerst','Aufzucht im Alltag','Begleitung danach'])assert.ok(home.includes(fact),fact);
 assert.ok(!home.includes('HD A–B · ED 0 · LÜW 0'),'Gesundheitsleiste steht noch auf der Startseite');
 for(const step of ['Kennenlernen','Besuch','Wurf','Übergabe'])assert.ok(home.includes(step),step);
 assert.ok(home.includes('Frühestens mit acht Wochen'));
});
test('Kleine Labels erfüllen den Mindestkontrast von 4,5:1',()=>{
 const css=read('src/styles/neo.css');
 const token=name=>css.match(new RegExp(`${name}:\\s*#([0-9a-f]{6})`, 'i'))[1];
 const luminance=hex=>{
  const channels=[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16)/255)
   .map(value=>value<=0.04045?value/12.92:((value+0.055)/1.055)**2.4);
  return 0.2126*channels[0]+0.7152*channels[1]+0.0722*channels[2];
 };
 const ratio=(a,b)=>{
  const [high,low]=[luminance(a),luminance(b)].sort((x,y)=>y-x);
  return (high+0.05)/(low+0.05);
 };
 for(const name of ['muted','copper-deep']){
  assert.ok(ratio(token(name),token('paper'))>=4.5,`${name} auf Papier`);
  assert.ok(ratio(token(name),token('paper-2'))>=4.5,`${name} auf Papier 2`);
 }
 assert.ok(ratio(token('copper-light'),token('petrol'))>=4.5,'Kupfer hell auf Petrol');
});
test('Die Startseite beantwortet Abgabe und Ausland vor dem Journal',()=>{
 const home=read('dist/index.html');
 const steps=home.indexOf('id="ablauf"');
 const faq=home.indexOf('id="fragen"');
 const journal=home.indexOf('id="journal"');
 assert.ok(steps>0&&faq>steps&&journal>faq,'FAQ steht nicht zwischen Ablauf und Journal');
 assert.ok(home.includes('<details'),'FAQ ist kein Akkordeon');
 for(const question of ['Ab wann ziehen die Welpen um?','Kann ich einen Welpen ins Ausland mitnehmen?','Wer entscheidet, welcher Welpe zu wem kommt?']){
  assert.ok(home.includes(question),question);
 }
 for(const fact of ['acht Wochen','geimpft, gechipt','Mikrochip','Tollwutschutz','Schweizer Heimtierpass','BLV','Züchterin']){
  assert.ok(home.includes(fact),fact);
 }
});
test('Die Startseite stellt Sandra mit Foto zwischen FAQ und Journal vor',()=>{
 const home=read('dist/index.html');
 const faq=home.indexOf('id="fragen"');
 const portrait=home.indexOf('class="portrait-home wrap"');
 const journal=home.indexOf('id="journal"');
 assert.ok(portrait>faq&&journal>portrait,'Porträt steht nicht zwischen FAQ und Journal');
 assert.ok(home.includes('Ich bin Sandra'),'Überschrift fehlt');
 const media=JSON.parse(read('src/data/media.generated.json'));
 assert.ok(media['/media/sandra.jpg']?.variants?.avif?.length,'Foto ist nicht vorbereitet');
 assert.ok(home.includes('alt="Sandra mit ihren Hunden Malu und Yam"'),'Alternativtext fehlt');
 assert.ok(home.includes('href="/zucht/"')&&home.includes('instagram.com/dog.boss.vibes'),'Links fehlen');
});
test('Deckrüden sind über Navigation und Sprungband direkt erreichbar',()=>{
 const home=read('dist/index.html');
 const hunde=read('dist/hunde/index.html');
 assert.ok(home.includes('href="/hunde/#deckrueden"'),'Navigation ohne Deckrüden-Eintrag');
 assert.ok(hunde.includes('class="stud-jump"'),'Sprungband fehlt');
 assert.ok(hunde.includes('href="#deckrueden"'),'Sprungband verlinkt nicht auf die Sektion');
 assert.ok(hunde.includes('Zu den Deckrüden'),'Sprungband ohne Beschriftung');
 assert.ok(hunde.includes('Deckrüden <span>02</span>'),'Mobilmenü nicht neu nummeriert');
 assert.ok(!/Deckrüden <span>02<\/span>[\s\S]{0,240}?Würfe <span>02<\/span>/.test(hunde),'Doppelte Nummer im Mobilmenü');
});
test('Die FAQ sind als FAQPage ausgezeichnet und stimmen mit dem sichtbaren Text überein',()=>{
 const home=read('dist/index.html');
 const json=JSON.parse(home.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
 const faq=json['@graph'].find(node=>node['@type']==='FAQPage');
 assert.ok(faq,'FAQPage fehlt');
 assert.equal(faq.mainEntity.length,3);
 for(const item of faq.mainEntity){
  assert.equal(item['@type'],'Question');
  assert.ok(home.includes(item.name),`Frage nicht sichtbar: ${item.name}`);
  assert.ok(item.acceptedAnswer.text.length>80,'Antwort zu kurz');
 }
});
test('Organisation und Züchterin sind als Entitäten verknüpft',()=>{
 const home=read('dist/index.html');
 const json=JSON.parse(home.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
 const org=json['@graph'].find(node=>node['@type']==='Organization');
 const person=json['@graph'].find(node=>node['@type']==='Person');
 assert.ok(org?.logo?.url?.includes('/media/logo-original.jpg'),'Logo fehlt');
 assert.equal(org.founder['@id'],person['@id'],'Gründerin nicht verknüpft');
 assert.equal(person.worksFor['@id'],org['@id'],'Arbeitgeber nicht verknüpft');
 assert.ok(org.sameAs.includes('https://www.facebook.com/sandra.moyos'),'Facebook-URL fehlt');
});
test('llms.txt beschreibt die Seite für KI-Agenten',()=>{
 const llms=read('dist/llms.txt');
 for(const path of ['/hunde/','/zucht/','/wuerfe/','/nachzucht/','/blog/','/kontakt/']){
  assert.ok(llms.includes(`https://moyodogs.com${path}`),path);
 }
 assert.ok(llms.includes('zucht@moyodogs.com'));
});
test('Vollbildmenü schliesst mit Escape und hält den Fokus im Overlay',()=>{
 const script=read('src/scripts/site.ts');
 assert.ok(script.includes("event.key === 'Escape'"),'Escape fehlt');
 assert.ok(script.includes('element.inert = open'),'Hintergrund wird nicht inert');
 assert.ok(script.includes("'body > :not(#site-menu)"),'Selektoren für den Hintergrund fehlen');
});
test('Sprungziele liegen frei unter dem fixierten Header',()=>{
 const css=read('src/styles/neo.css');
 assert.ok(/:target\s*\{[^}]*scroll-margin-top/.test(css),'scroll-margin-top fehlt');
 assert.ok(read('dist/index.html').includes('id="inhalt" tabindex="-1"'),'Skip-Link-Ziel nicht fokussierbar');
});
test('Die Startseite zeigt drei Grundsätze statt der Gesundheitsleiste',()=>{
 const home=read('dist/index.html');
 for(const claim of ['Charakter zuerst','Aufzucht im Alltag','Begleitung danach']){
  assert.ok(home.includes(claim),`Grundsatz fehlt: ${claim}`);
 }
 assert.ok(!home.includes('HD A–B'),'Alte Gesundheitsleiste steht noch auf der Startseite');
 assert.ok(!home.includes('Alle Zuchthunde untersucht'));
 // Gesundheitswerte gehören zur einzelnen Hündin bzw. zum Rüden.
 const yam=read('dist/hunde/yam/index.html');
 assert.ok(yam.includes('HD B'));
 assert.ok(yam.includes('Free by Parentage'));
 assert.ok(yam.includes('SDCA 1 &amp; 2'));
});
test('Das Hero-Bild wird vorab geladen und teilt sich die Quelle mit dem Bild',()=>{
 const home=read('dist/index.html');
 const link=home.match(/<link rel="preload" as="image" type="image\/avif" imagesrcset="([^"]+)" imagesizes="([^"]+)" fetchpriority="high">/);
 assert.ok(link,'Hero-Preload fehlt oder ist unvollständig');
 const [,srcset,sizes]=link;
 assert.equal(sizes,'(max-width: 940px) 100vw, 92vw');
 assert.ok(home.includes(`<source type="image/avif" srcset="${srcset}" sizes="${sizes}">`),'Preload und Hero-Bild nutzen unterschiedliche Quellen');
});
test('Unveränderliche Assets werden lange gecacht',()=>{
 const headers=read('dist/_headers');
 for(const [path,rule] of [
  ['/_astro/*','public, max-age=31536000, immutable'],
  ['/generated/*','public, max-age=31536000, immutable'],
  ['/fonts/*','public, max-age=31536000, immutable'],
  ['/media/*','public, max-age=604800'],
 ]){
  assert.ok(headers.includes(`${path}\n  Cache-Control: ${rule}`),`Cache-Regel fehlt: ${path}`);
 }
 assert.ok(!/\/media\/\*\n\s+Cache-Control: public, max-age=31536000, immutable/.test(headers),'Medien dürfen nicht unveränderlich gecacht werden');
});
test('Tote Theme-Reste sind entfernt und werden nicht mehr referenziert',()=>{
 for(const file of ['src/styles/global.css','src/styles/studio.css','src/components/ThemeSelect.astro','src/components/FilmHero.astro','src/components/PhotoStage.astro','public/theme-init.js']){
  assert.ok(!existsSync(resolve(root,file)),`Datei existiert noch: ${file}`);
 }
 for(const file of ['src/layouts/Base.astro','src/pages/index.astro','src/styles/neo.css','src/scripts/site.ts']){
  const source=read(file);
  for(const token of ['global.css','studio.css','ThemeSelect','FilmHero','PhotoStage','theme-init']){
   assert.ok(!source.includes(token),`${file} verweist noch auf ${token}`);
  }
 }
});
test('Die Sitemap datiert Blogbeiträge, aber keine Listenseiten',()=>{
 const sitemap=read('dist/sitemap.xml');
 const blog=sitemap.match(/<loc>https:\/\/moyodogs\.com\/blog\/[^<]+\/<\/loc><lastmod>[^<]+<\/lastmod>/g) ?? [];
 assert.ok(blog.length>10,`Zu wenige datierte Blogbeiträge: ${blog.length}`);
 assert.ok(!/<loc>https:\/\/moyodogs\.com\/blog\/<\/loc><lastmod>/.test(sitemap),'Blog-Übersicht hat ein lastmod');
 const lastmods=blog.map(entry=>entry.match(/<lastmod>([^<]+)<\/lastmod>/)[1]);
 for(const value of lastmods)assert.match(value,/^\d{4}-\d{2}-\d{2}T/);
});
test('Die interne Konzeptseite ist entfernt und leitet auf die Startseite',()=>{
 assert.ok(!existsSync(resolve(root,'src/pages/konzept/index.astro')),'Konzeptseite existiert noch');
 assert.ok(!existsSync(resolve(root,'dist/konzept/index.html')),'Konzeptseite wird noch gebaut');
 for(const font of ['manrope-regular.ttf','manrope-bold.ttf','OFL-Manrope.txt'])assert.ok(!existsSync(resolve(root,'public/fonts',font)),`${font} existiert noch`);
 const redirects=read('dist/_redirects');
 assert.ok(redirects.includes('/konzept / 301'));
 assert.ok(redirects.includes('/konzept/ / 301'));
 assert.ok(!read('dist/_headers').includes('/konzept'));
});
test('Unter dem Hundename steht eine kompakte Gesundheitszeile',()=>{
 const overview=read('dist/hunde/index.html');
 assert.ok(overview.includes('class="portrait-health"'),'Gesundheitszeile fehlt auf der Übersicht');
 assert.ok(overview.includes('HD A · ED 0 · LÜW 0 · DM N/N · SDCA 1 &amp; 2 frei'));
 const yam=read('dist/hunde/yam/index.html');
 assert.ok(yam.includes('class="portrait-health"'),'Gesundheitszeile fehlt im Porträt');
 assert.ok(yam.includes('HD B · ED 0 · LÜW 0'));
  assert.ok(yam.includes('über Elterntiere'));
 // Die Deckrüden-Karten bleiben unverändert.
 const cards=overview.match(/<article class="stud-card"[\s\S]*?<\/article>/g)?.join('')??'';
 assert.ok(cards.includes('class="stud-data"'),'Deckrüden-Daten fehlen');
 assert.ok(!cards.includes('portrait-health'),'Deckrüden-Karte wurde verändert');
});
test('Ablauf und FAQ bilden einen gemeinsamen Abschnitt',()=>{
 const home=read('dist/index.html');
 assert.ok(home.includes('id="ablauf"'));
 assert.ok(home.includes('id="fragen"'));
 assert.ok(!/<section class="faq/.test(home),'FAQ steht noch als eigene Sektion');
 const merged=home.slice(home.indexOf('id="ablauf"'),home.indexOf('Interesse am Wurf'));
 assert.ok(merged.includes('Häufige Fragen'),'FAQ fehlt im Ablauf-Abschnitt');
 assert.equal((home.match(/id="fragen"/g)||[]).length,1,'FAQ-Anker ist nicht eindeutig');
});
test('Lange Startseiten-Abschnitte werden erst beim Scrollen gerendert',()=>{
 const css=read('src/styles/home.css');
 assert.ok(/\.proof,[\s\S]{0,200}?content-visibility:\s*auto/.test(css),'content-visibility fehlt');
 assert.ok(css.includes('contain-intrinsic-size: auto 620px'),'Intrinsic Size fehlt');
});
test('Startseiten-CSS wird nur auf der Startseite geladen',()=>{
 const links=html=>[...html.matchAll(/<link rel="stylesheet" href="(\/_astro\/[^"]+\.css)"/g)].map(m=>m[1]);
 const homeLinks=links(read('dist/index.html'));
 const hundeLinks=links(read('dist/hunde/index.html'));
 assert.equal(homeLinks.length,hundeLinks.length+1,'Startseite lädt kein zusätzliches Stylesheet');
 const extra=homeLinks.find(href=>!hundeLinks.includes(href));
 assert.ok(extra,'Kein eigenes Startseiten-Stylesheet gefunden');
 const homeCss=read('dist'+extra);
 assert.ok(homeCss.includes('.poster-hero'),'Hero-CSS fehlt im Startseiten-Stylesheet');
 assert.ok(homeCss.includes('.steps-grid'),'Ablauf-CSS fehlt im Startseiten-Stylesheet');
 for(const href of hundeLinks){
  assert.ok(!read('dist'+href).includes('.steps-grid'),`${href} enthält Startseiten-CSS`);
 }
});
