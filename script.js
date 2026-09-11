const hero = document.querySelector('#hero-video');
const pause = document.querySelector('#hero-pause');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const saveData = navigator.connection?.saveData;
let manualPause = false;
if (reduceMotion.matches || saveData) {hero.autoplay = false;hero.pause();manualPause = true;}
function updatePause(){pause.textContent=hero.paused?'▶':'Ⅱ';pause.setAttribute('aria-label',hero.paused?'Play background video':'Pause background video');}
pause.addEventListener('click',()=>{if(hero.paused){manualPause=false;hero.play().catch(()=>{});}else{manualPause=true;hero.pause();}});
hero.addEventListener('play',updatePause);hero.addEventListener('pause',updatePause);updatePause();
const heroObserver = new IntersectionObserver(entries=>entries.forEach(({isIntersecting})=>{
  if(!isIntersecting)hero.pause();else if(!manualPause&&!reduceMotion.matches&&!saveData)hero.play().catch(()=>{});
}),{threshold:.2});heroObserver.observe(hero);
const demos=document.querySelectorAll('main video');
demos.forEach(video=>{video.loop=true;video.addEventListener('play',()=>hero.pause());});
const demoObserver=new IntersectionObserver(entries=>entries.forEach(({target,isIntersecting})=>{
  if(!isIntersecting)target.pause();
  else if(!reduceMotion.matches&&!saveData)target.play().catch(()=>{});
}),{threshold:.2});demos.forEach(v=>demoObserver.observe(v));
const nav=document.querySelector('.sidebar-nav');
const links=[...nav.querySelectorAll('a')];
const sections=links.map(a=>document.querySelector(a.getAttribute('href')));
function updateNav(){
  const visible=scrollY>document.querySelector('.hero').offsetHeight*.75;
  nav.classList.toggle('visible',visible);nav.inert=!visible;
  let active=sections[0];for(const section of sections)if(section.getBoundingClientRect().top<innerHeight*.35)active=section;
  links.forEach(a=>{const current=a.hash==='#'+active.id;a.classList.toggle('active',current);if(current)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
}
addEventListener('scroll',updateNav,{passive:true});addEventListener('resize',updateNav);updateNav();
document.addEventListener('visibilitychange',()=>{if(document.hidden){hero.pause();demos.forEach(v=>v.pause());}});
