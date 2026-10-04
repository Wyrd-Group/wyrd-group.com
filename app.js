const menu=document.querySelector('.menu-button'),mobile=document.querySelector('#mobile-nav');menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));mobile.hidden=!open});mobile.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{mobile.hidden=true;menu.setAttribute('aria-expanded','false')}));
/* Licensed local video footage. Only visible backgrounds play; all share a pause control. */
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
let motionPaused=reducedMotion.matches;
const backgroundVideos=[...document.querySelectorAll('video[data-background-video],video[data-hero-scene]')];
const motionButtons=[...document.querySelectorAll('[data-motion-toggle]')];
function ensureVideoSource(video){if(!video.getAttribute('src')&&video.dataset.src){video.src=video.dataset.src;video.load()}}
function syncBackground(video){
 const active=!video.hasAttribute('data-hero-scene')||video.classList.contains('is-active');
 if(motionPaused||document.hidden||video.dataset.inView!=='true'||!active){video.pause();return}
 ensureVideoSource(video);video.muted=true;video.play().catch(()=>{});
}
function syncMotion(){motionButtons.forEach(button=>{button.setAttribute('aria-pressed',String(motionPaused));button.setAttribute('aria-label',motionPaused?'Play background videos':'Pause background videos');button.textContent=motionPaused?'▷':'Ⅱ'});backgroundVideos.forEach(syncBackground)}
motionButtons.forEach(button=>button.addEventListener('click',()=>{motionPaused=!motionPaused;syncMotion()}));
const visibilityObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{entry.target.dataset.inView=String(entry.isIntersecting);syncBackground(entry.target)}),{threshold:.05});
backgroundVideos.forEach(video=>{video.muted=true;visibilityObserver.observe(video)});
document.addEventListener('visibilitychange',syncMotion);
reducedMotion.addEventListener('change',event=>{motionPaused=event.matches;syncMotion()});
syncMotion();
const hero=document.querySelector('.hero');
if(hero){
 const buttons=[...document.querySelectorAll('[data-scene]')],videos=[...hero.querySelectorAll('[data-hero-scene]')];let sceneIndex=0,requestIndex=0;
 function selectScene(index){
  requestIndex=index;const next=videos[index];ensureVideoSource(next);
  function show(){if(requestIndex!==index)return;sceneIndex=index;videos.forEach(video=>video.classList.toggle('is-active',video===next));buttons.forEach(button=>{const active=Number(button.dataset.scene)===index;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active))});syncMotion();ensureVideoSource(videos[(index+1)%videos.length])}
  if(next.readyState>=2||motionPaused)show();else next.addEventListener('loadeddata',show,{once:true});
 }
 buttons.forEach(button=>button.addEventListener('click',()=>selectScene(Number(button.dataset.scene))));
 setInterval(()=>{if(!motionPaused&&!document.hidden&&videos[sceneIndex].dataset.inView==='true')selectScene((sceneIndex+1)%videos.length)},9000);
 ensureVideoSource(videos[1]);
}
const scenarioContent={bank:[['Find the approved procedure.','OMNIS retrieves the current incident procedure and permitted service records, with their sources and access boundaries.'],['Connect the affected operations.','ARGOS relates the failed payment service to impacted teams, deadlines and authorised customer information.'],['Prepare a coordinated response.','SUM compares response options against institutional priorities and coordinates the analysis needed for a recommendation.'],['Check the actual authority.','ICARUS checks whether the responsible person or delegated agent may perform the proposed action, within its exact scope and approval requirements.'],['Carry out and verify the work.','Approved assignments reach accountable teams through IRIS. Controlled execution and observed results are connected through the Proof Spine.']],industry:[['Retrieve the permitted inspection scope.','OMNIS provides the current procedure, asset records and relevant maintenance information within the worker’s access scope.'],['Understand the asset and conditions.','ARGOS relates the inspection to equipment state, dependencies and operational constraints.'],['Plan the supervised work.','SUM coordinates eligible models and capabilities to analyse the evidence and propose the next inspection or maintenance step.'],['Enforce the mission boundary.','ICARUS checks the delegated authority and approved scope. Physical safety systems retain their own independent stopping conditions.'],['Inspect and record the outcome.','A qualified executor performs its bounded assignment. Observations, action evidence and recovery conditions are recorded and checked.']]};let scenario='bank',step=0;
function showStep(){const c=scenarioContent[scenario][step];document.querySelector('#step-index').textContent=String(step+1).padStart(2,'0');document.querySelector('#step-title').textContent=c[0];document.querySelector('#step-description').textContent=c[1];document.querySelectorAll('[data-step]').forEach(b=>{const active=Number(b.dataset.step)===step;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))})}
document.querySelectorAll('[data-step]').forEach(b=>b.addEventListener('click',()=>{step=Number(b.dataset.step);showStep()}));document.querySelectorAll('[data-scenario]').forEach(b=>b.addEventListener('click',()=>{scenario=b.dataset.scenario;document.querySelectorAll('[data-scenario]').forEach(x=>{const active=x===b;x.classList.toggle('active',active);x.setAttribute('aria-pressed',String(active))});showStep()}));

/* Wyrd TrueSight port. Source: wyrd-site/wyrd/wyrd-truesight.js, decode() and armDecode().
   Same glyph alphabet, left-to-right settling and 2.4 frames/character progression.
   DOM text nodes preserve formatting, accessible labels and fixed character widths. */
(function(){
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const GLYPHS = '01<>/\\[]{}=+*#%&$ABCDEF0123456789ﬀﬁ▚▞░▒█·:;';
 function decode(el){const finalText=el.textContent; if(reduce){el.classList.add('ts-decoded');return}const chars=[...finalText],speed=Number(el.dataset.tsSpeed)||1,cells=[];el.classList.add('ts-decoding');el.replaceChildren();for(const c of chars){if(c===' '){el.append(document.createTextNode(' '));cells.push(null);continue}const cell=document.createElement('span');cell.className='decode-char';const final=document.createElement('span');final.className='decode-final';final.textContent=c;const cipher=document.createElement('span');cipher.className='ts-cipher';cipher.textContent=c;cell.append(final,cipher);el.append(cell);cells.push({cell,cipher})}let frame=0;function tick(){frame++;const settled=Math.min(chars.length,Math.floor(frame/(2.4/speed)));cells.forEach((c,i)=>{if(!c)return;if(i<settled)c.cell.classList.add('settled');else c.cipher.textContent=GLYPHS[(Math.random()*GLYPHS.length)|0]});if(settled<chars.length)requestAnimationFrame(tick);else{el.textContent=finalText;el.classList.remove('ts-decoding');el.classList.add('ts-decoded')}}requestAnimationFrame(tick)}
 const targets=[...document.querySelectorAll('[data-ts-decode]')];if(!targets.length)return;if(reduce){targets.forEach(decode);return}const observer=new IntersectionObserver(entries=>{entries.forEach(e=>{if(!e.isIntersecting)return;observer.unobserve(e.target);setTimeout(()=>decode(e.target),Number(e.target.dataset.tsDelay)||0)})},{rootMargin:'0px 0px -12% 0px',threshold:.2});targets.forEach(el=>observer.observe(el));
})();
