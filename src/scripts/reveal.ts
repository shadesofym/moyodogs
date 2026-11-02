const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
let observer:IntersectionObserver|undefined;
function reveal(){
 observer?.disconnect();document.querySelectorAll('[data-reveal]').forEach(element=>element.classList.remove('will-reveal'));
 if(reduced.matches||!('IntersectionObserver' in window))return;
 observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.remove('will-reveal');observer?.unobserve(entry.target);}}),{threshold:.08});
 document.querySelectorAll<HTMLElement>('[data-reveal]').forEach(element=>{if(element.getBoundingClientRect().top>window.innerHeight){element.classList.add('will-reveal');observer?.observe(element);}});
}
document.addEventListener('astro:page-load',reveal);reduced.addEventListener('change',reveal);reveal();
document.addEventListener('astro:before-swap',()=>observer?.disconnect());
