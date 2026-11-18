// Fail on new high/critical advisories while reporting one known, currently unpatched upstream ReDoS.
import {readFile} from 'node:fs/promises';

const path=process.argv[2];
if(!path)throw new Error('Usage: node scripts/check-production-audit.mjs <npm-audit.json>');
const data=JSON.parse(await readFile(path,'utf8'));
if(data.error || !data.vulnerabilities || !data.metadata?.vulnerabilities){
  throw new Error('npm audit did not provide a valid advisory report');
}
const highEntries=Object.entries(data.vulnerabilities)
  .filter(([,detail])=>['high','critical'].includes(detail.severity));
const directAdvisories=highEntries.flatMap(([pkg,detail])=>
  detail.via.filter(item=>typeof item==='object'&&item!==null)
    .map(item=>({pkg,...item})));
const known=new Set(['https://github.com/advisories/GHSA-fc5q-39xc-vjpf']);
const unexpected=directAdvisories.filter(item=>!known.has(item.url));
const critical=data.metadata.vulnerabilities.critical??0;
console.log('npm audit production high/critical:',data.metadata.vulnerabilities);
console.log('Affected dependencies:',highEntries.map(([pkg])=>pkg).join(', ')||'none');
if(critical || unexpected.length || (highEntries.length&&!directAdvisories.length)){
  console.error('Unexpected production dependency vulnerabilities:',unexpected);
  process.exitCode=1;
}else if(highEntries.length){
  console.warn('::warning title=Unpatched picomatch advisory::GHSA-fc5q-39xc-vjpf still affects the transitive build toolchain; see docs/DEPENDENCY-SECURITY-20261118.md');
}
