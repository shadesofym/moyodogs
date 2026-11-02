(function(){
 if(window.__moyoThemeReady)return;window.__moyoThemeReady=true;
 const key='moyodogs-theme';const device=window.matchMedia('(prefers-color-scheme: dark)');
 const valid=value=>['light','dark','auto'].includes(value);
 let choice='dark';try{const saved=localStorage.getItem(key);if(valid(saved))choice=saved;}catch{}
 function resolved(){return choice==='auto'?(device.matches?'dark':'light'):choice;}
 function apply(root=document.documentElement){root.dataset.theme=resolved();root.dataset.themeChoice=choice;root.style.colorScheme=resolved();}
 function sync(){apply();document.querySelectorAll('[data-theme-choice]').forEach(select=>select.value=choice);document.querySelector('meta[name="theme-color"]')?.setAttribute('content',resolved()==='dark'?'#141414':'#F5F3EE');}
 apply();
 document.addEventListener('change',event=>{if(!event.target.matches?.('[data-theme-choice]')||!valid(event.target.value))return;choice=event.target.value;try{localStorage.setItem(key,choice);}catch{}sync();});
 document.addEventListener('astro:before-swap',event=>apply(event.newDocument.documentElement));
 document.addEventListener('astro:page-load',sync);
 document.addEventListener('DOMContentLoaded',sync);
 device.addEventListener('change',()=>{if(choice==='auto')sync();});
 window.addEventListener('storage',event=>{if(event.key===key){choice=valid(event.newValue)?event.newValue:'dark';sync();}});
})();
