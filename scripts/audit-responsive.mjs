// Browser-based viewport checks; Chromium emulation is not a real device test.
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const origin = 'https://moyodogs.com';
const devices = [
  {name:'phone-320', width:320,height:720, touch:true},
  {name:'phone-390', width:390,height:844, touch:true},
  {name:'tablet-768', width:768,height:1024, touch:true},
  {name:'desktop-1440', width:1440,height:900, touch:false},
];
const paths = ['/','/hunde/','/wuerfe/','/kontakt/'];
const failures = [];
const results = [];
await mkdir('audit-results/screenshots',{recursive:true});
const browser = await chromium.launch({headless:true,args:['--no-sandbox']});
try {
  for (const device of devices) {
    const context=await browser.newContext({
      viewport:{width:device.width,height:device.height},
      deviceScaleFactor:device.touch?2:1,
      hasTouch:device.touch,
      isMobile:device.touch,
      reducedMotion:'reduce',
    });
    const page=await context.newPage();
    for (const path of paths) {
      const key=device.name+(path==='/'?'-home':path.replaceAll('/','-'));
      try {
        const response=await page.goto(new URL(path,origin).href,{waitUntil:'domcontentloaded',timeout:30000});
        await page.locator('main').waitFor({timeout:12000});
        await page.evaluate(()=>document.fonts.ready);
        const metrics=await page.evaluate(()=>({
          viewport:document.documentElement.clientWidth,
          content:document.documentElement.scrollWidth,
          h1:document.querySelectorAll('h1').length,
          title:document.title,
        }));
        const screenshot='audit-results/screenshots/'+key+'.png';
        await page.screenshot({path:screenshot,fullPage:false});
        results.push({device:device.name,path,status:response?.status(),metrics,screenshot});
        if(response?.status()!==200)failures.push(key+': HTTP '+response?.status());
        if(metrics.content>metrics.viewport+2)failures.push(key+': horizontal scroll '+metrics.content+' > '+metrics.viewport);
        if(metrics.h1!==1)failures.push(key+': expected one h1, got '+metrics.h1);
        if(path==='/'&&device.touch) {
          const toggle=page.locator('[data-menu-toggle]');
          if(!(await toggle.isVisible()))failures.push(key+': mobile menu toggle not visible');
          else {
            await toggle.click();
            if(await toggle.getAttribute('aria-expanded')!=='true')failures.push(key+': menu did not open');
            const close=page.locator('[data-menu-close]');
            if(!(await close.isVisible()))failures.push(key+': close control hidden');
            await page.screenshot({path:'audit-results/screenshots/'+key+'-menu.png'});
            await close.click();
            if(await toggle.getAttribute('aria-expanded')!=='false')failures.push(key+': menu did not close');
          }
        }
      } catch(e) {failures.push(key+': '+String(e));}
    }
    await context.close();
  }
} finally {await browser.close();}
const report={checkedAt:new Date().toISOString(),origin,results,failures,note:'Emulated Chromium viewports, not physical iOS/Android testing.'};
await writeFile('audit-results/responsive-audit.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(failures.length)process.exitCode=1;
