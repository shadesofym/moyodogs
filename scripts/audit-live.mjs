// Read-only live website smoke test. The report is saved even on failure.
import { mkdir, writeFile } from 'node:fs/promises';

const origin = 'https://moyodogs.com';
const pages = ['/','/hunde/','/hunde/yam/','/wuerfe/','/zucht/','/blog/','/kontakt/'];
const findings = [];
const results = [];
function assert(ok, description, detail = '') {
  if (!ok) findings.push({ description, detail });
}
async function read(path, redirect = 'follow') {
  const url = new URL(path, origin);
  const r = await fetch(url, { redirect, signal: AbortSignal.timeout(20000),
    headers: { 'user-agent': 'MOYODOGS-Site-Audit/1.0' } });
  const body = await r.text();
  results.push({ path, status: r.status, finalUrl: r.url });
  return { r, body };
}
async function inspect(path, fn) {
  try { await fn(await read(path)); }
  catch (e) { assert(false, path + ' could not be checked', String(e)); }
}
for (const path of pages) {
  await inspect(path, ({ r, body }) => {
    assert(r.status === 200, path + ' must return 200', String(r.status));
    assert(body.includes('MOYO DOGS'), path + ' is missing the expected site text');
    assert(!/(^|\s)noindex/i.test(r.headers.get('x-robots-tag') ?? ''), path + ' HTTP header blocks indexing');
    assert(!/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(body), path + ' HTML blocks indexing');
    if (path === '/') {
      assert(/<title>[^<]*MOYO DOGS/i.test(body), 'Home page title missing');
      assert(/rel=["']canonical["'][^>]*https:\/\/moyodogs\.com\//i.test(body), 'Canonical origin missing');
      assert(Boolean(r.headers.get('content-security-policy')), 'Content-Security-Policy header missing');
    }
  });
}
await inspect('/robots.txt', ({ r, body }) => {
  assert(r.status === 200, 'robots.txt is unavailable');
  assert(/User-agent:\s*\*/i.test(body), 'robots.txt has no user agent');
  assert(!/^Disallow:\s*\/\s*$/mi.test(body), 'robots.txt blocks the website');
  assert(/Sitemap:\s*https:\/\/moyodogs\.com\/sitemap\.xml/i.test(body), 'robots.txt sitemap line missing');
});
await inspect('/sitemap.xml', ({ r, body }) => {
  assert(r.status === 200, 'Sitemap is unavailable');
  assert(/xml/i.test(r.headers.get('content-type') ?? ''), 'Sitemap has wrong Content-Type');
  assert(body.includes('<urlset') && body.includes('<loc>https://moyodogs.com/</loc>'), 'Sitemap is incomplete');
});
for (const [oldPath,newPath] of [
  ['/2023/03/31/the-eleven/','/blog/the-eleven/'],
  ['/2022/06/01/frisbee/','/blog/frisbee/']
]) {
  try {
    const {r} = await read(oldPath, 'manual');
    assert([301,308].includes(r.status), oldPath + ' should permanently redirect', String(r.status));
    const target = r.headers.get('location');
    assert(Boolean(target) && new URL(target,origin).pathname === newPath, oldPath + ' wrong redirect', String(target));
  } catch(e) { assert(false, oldPath + ' redirect test failed', String(e)); }
}
await inspect('/nicht-verfuegbar/', ({r}) => {
  assert(r.status === 404, 'Not-found page must have HTTP 404', String(r.status));
});
await mkdir('audit-results', {recursive:true});
const report = {checkedAt:new Date().toISOString(), origin, results, findings};
await writeFile('audit-results/http-audit.json', JSON.stringify(report,null,2)+'\n');
await writeFile('audit-results/http-audit.md',
  '# MOYO DOGS HTTP and SEO audit\n\n' +
  'Checked at: '+report.checkedAt+'\n\n' +
  results.map(x=>'- '+x.path+': '+x.status+' '+x.finalUrl).join('\n') +
  '\n\nFindings ('+findings.length+'):\n' +
  (findings.map(x=>'- '+x.description+' '+x.detail).join('\n')||'- None')+'\n');
console.log(JSON.stringify(report,null,2));
if(findings.length) process.exitCode=1;
