const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
const scrollDriven=typeof CSS!=='undefined'&&typeof CSS.supports==='function'&&CSS.supports('animation-timeline: view()');
let observer:IntersectionObserver|undefined;
function prepare(){
 document.querySelectorAll<HTMLElement>('[data-reveal-auto]').forEach(container=>{
  Array.from(container.children).forEach(child=>{
   if(child instanceof HTMLElement&&!child.hasAttribute('data-reveal'))child.setAttribute('data-reveal','');
  });
 });
}
function reveal(){
 observer?.disconnect();document.querySelectorAll('[data-reveal]').forEach(element=>element.classList.remove('will-reveal'));
 prepare();
 if(scrollDriven||reduced.matches||!('IntersectionObserver' in window))return;
 observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.remove('will-reveal');observer?.unobserve(entry.target);}}),{threshold:.08});
 document.querySelectorAll<HTMLElement>('[data-reveal]').forEach(element=>{if(element.getBoundingClientRect().top>window.innerHeight){element.classList.add('will-reveal');observer?.observe(element);}});
}
document.addEventListener('astro:page-load',reveal);reduced.addEventListener('change',reveal);reveal();
document.addEventListener('astro:before-swap',()=>observer?.disconnect());
