// Visual regression smoke for the generated Astro preview. No production writes.
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const origin='http://127.0.0.1:4321';
const widths=[320,390,768,1440];
const routes=['/','/hunde/yam/','/wuerfe/'];
const results=[];
const errors=[];
await mkdir('preview-check/screenshots',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
  for(const width of widths){
    const context=await browser.newContext({
      viewport:{width,height:width===1440?900:width===768?1024:800},
      reducedMotion:'reduce',
      deviceScaleFactor:1
    });
    const page=await context.newPage();
    for(const path of routes){
      const key=width+'-'+(path==='/'?'start':path.replaceAll('/','-'));
      try{
        const response=await page.goto(origin+path,{waitUntil:'load',timeout:30000});
        await page.locator('main').waitFor();
        const dim=await page.locator('html').evaluate(el=>({scroll:el.scrollWidth,viewport:el.clientWidth}));
        const headings=await page.locator('h1').count();
        const shot='preview-check/screenshots/'+key+'.png';
        await page.screenshot({path:shot});
        if(response?.status()!==200)errors.push(key+': HTTP '+response?.status());
        if(dim.scroll>dim.viewport+2)errors.push(key+': horizontal overflow '+dim.scroll+'/'+dim.viewport);
        if(headings!==1)errors.push(key+': '+headings+' H1 headings');
        if(path==='/hunde/yam/' && await page.getByText('Auf einen Blick',{exact:true}).count()!==1)errors.push(key+': facts heading missing');
        if(path==='/wuerfe/' && await page.getByRole('link',{name:/Welpenanfrage/}).count()===0)errors.push(key+': enquiry link missing');
        if(path==='/' && width<=768){
          const toggle=page.locator('[data-menu-toggle]');
          if(!(await toggle.isVisible()))errors.push(key+': menu control invisible');
          else{
            await toggle.click();
            if(await toggle.getAttribute('aria-expanded')!=='true')errors.push(key+': mobile menu cannot open');
            await page.locator('[data-menu-close]').click();
            if(await toggle.getAttribute('aria-expanded')!=='false')errors.push(key+': mobile menu cannot close');
          }
        }
        results.push({width,path,status:response?.status(),dim,headings,shot});
      }catch(error){errors.push(key+': '+String(error));}
    }
    await context.close();
  }
}finally{await browser.close();}
const report={checkedAt:new Date().toISOString(),origin,results,errors};
await writeFile('preview-check/report.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({pages:results.length,errors},null,2));
if(errors.length)process.exitCode=1;
