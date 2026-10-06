const menu=document.querySelector('.menu-button'),mobile=document.querySelector('#mobile-nav');menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));mobile.hidden=!open});mobile.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{mobile.hidden=true;menu.setAttribute('aria-expanded','false')}));
/* Licensed local video footage. Visible backgrounds share a pause preference.
   A rejected autoplay attempt stays recoverable through a direct play-button gesture. */
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
let motionPaused=reducedMotion.matches;
const backgroundVideos=[...document.querySelectorAll('video[data-background-video],video[data-hero-scene]')];
const motionButtons=[...document.querySelectorAll('[data-motion-toggle]')];
const playback=new WeakMap();
const playIcon='<svg class="motion-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m8 5 11 7-11 7Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';
const pauseIcon='<svg class="motion-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 5v14M16 5v14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>';
function prepareVideo(video){video.defaultMuted=true;video.muted=true;video.playsInline=true;video.setAttribute('muted','');video.setAttribute('playsinline','');video.setAttribute('webkit-playsinline','')}
function ensureVideoSource(video){prepareVideo(video);if(!video.getAttribute('src')&&video.dataset.src){video.preload='auto';video.src=video.dataset.src;video.load()}}
function isActiveVideo(video){return !video.hasAttribute('data-hero-scene')||video.classList.contains('is-active')}
function shouldPlayVideo(video){return !motionPaused&&!document.hidden&&video.dataset.inView==='true'&&isActiveVideo(video)}
function setPlayback(video,status){const state=playback.get(video);state.status=status;video.dataset.playbackState=status}
function buttonVideos(button){const region=button.closest('.hero,.detail-hero,.visual-card,.story-media,.home-foundation-media,.argos-service-media');return region?backgroundVideos.filter(video=>region.contains(video)&&isActiveVideo(video)):backgroundVideos.filter(isActiveVideo)}
function renderMotionControls(){
 motionButtons.forEach(button=>{
  const videos=buttonVideos(button),playing=!motionPaused&&videos.some(video=>!video.paused&&playback.get(video).status==='playing');
  const failed=!motionPaused&&videos.some(video=>playback.get(video).status==='error');
  const blocked=!motionPaused&&videos.some(video=>playback.get(video).status==='blocked');
  const label=playing?'Pause background videos':failed?'Retry background video':'Play background videos';
  button.setAttribute('aria-pressed',String(motionPaused));button.setAttribute('aria-label',label);button.setAttribute('title',label);
  button.dataset.playbackState=playing?'playing':failed?'error':blocked?'blocked':motionPaused?'paused':'ready';
  button.innerHTML=playing?pauseIcon:playIcon;
  const notice=button.nextElementSibling;
  if(notice?.hasAttribute('data-video-status')){notice.hidden=!(failed||blocked);notice.textContent=failed?'Video unavailable. Tap play to retry.':blocked?'Tap play to start video.':''}
 });
}
function syncBackground(video,userGesture=false){
 const state=playback.get(video);
 if(!shouldPlayVideo(video)){
  if(state.pending||!video.paused){state.attempt++;state.pending=false;video.pause()}
  if(state.status!=='blocked'&&state.status!=='error')setPlayback(video,'paused');return;
 }
 if((state.status==='blocked'||state.status==='error')&&!userGesture)return;
 if(state.pending)return;
 if(!video.paused){setPlayback(video,'playing');return}
 if(userGesture&&state.status==='error'){video.load();setPlayback(video,'paused')}
 ensureVideoSource(video);prepareVideo(video);
 const attempt=++state.attempt;state.pending=true;setPlayback(video,'loading');
 // Keep play() in the click handler's synchronous call stack for iOS user activation.
 try{
  const started=video.play();
  Promise.resolve(started).then(()=>{
   if(state.attempt!==attempt)return;state.pending=false;
   if(!shouldPlayVideo(video)){video.pause();setPlayback(video,'paused')}else setPlayback(video,video.paused?'paused':'playing');
   renderMotionControls();
  }).catch(error=>{
   if(state.attempt!==attempt)return;state.pending=false;
   setPlayback(video,error.name==='NotAllowedError'?'blocked':error.name==='AbortError'?'paused':'error');renderMotionControls();
  });
 }catch(error){state.pending=false;setPlayback(video,error.name==='NotAllowedError'?'blocked':'error');renderMotionControls()}
}
function syncMotion(userGesture=false){backgroundVideos.forEach(video=>syncBackground(video,userGesture));renderMotionControls()}
motionButtons.forEach(button=>{
 const notice=document.createElement('span');notice.className='video-status';notice.setAttribute('data-video-status','');notice.setAttribute('role','status');notice.hidden=true;button.after(notice);
 button.addEventListener('click',()=>{const running=buttonVideos(button).some(video=>!video.paused&&playback.get(video).status==='playing');motionPaused=!motionPaused&&running;syncMotion(true)});
});
const visibilityObserver=new IntersectionObserver(entries=>{entries.forEach(entry=>{entry.target.dataset.inView=String(entry.isIntersecting);syncBackground(entry.target)});renderMotionControls()},{threshold:.05});
backgroundVideos.forEach(video=>{
 playback.set(video,{status:'paused',pending:false,attempt:0});prepareVideo(video);
 const rect=video.getBoundingClientRect();video.dataset.inView=String(rect.bottom>0&&rect.top<innerHeight&&rect.right>0&&rect.left<innerWidth);
 ['playing','pause','error'].forEach(event=>video.addEventListener(event,()=>{
  if(event==='playing'){if(!shouldPlayVideo(video)){video.pause();return}setPlayback(video,'playing')}
  else if(event==='error'){const state=playback.get(video);state.attempt++;state.pending=false;setPlayback(video,'error')}
  else if(playback.get(video).status==='playing')setPlayback(video,'paused');
  renderMotionControls();
 }));visibilityObserver.observe(video);
});
document.addEventListener('visibilitychange',()=>syncMotion());
addEventListener('pageshow',()=>syncMotion());
reducedMotion.addEventListener('change',event=>{motionPaused=event.matches;syncMotion()});
syncMotion();
const hero=document.querySelector('.hero');
if(hero){
 const buttons=[...document.querySelectorAll('[data-scene]')],videos=[...hero.querySelectorAll('[data-hero-scene]')];let sceneIndex=0;
 function selectScene(index,userGesture=false){
  const next=videos[index];if(!next)return;sceneIndex=index;
  // Show its poster immediately. Waiting for loadeddata can deadlock mobile preload
  // and would move play() outside the scene button's trusted user gesture.
  videos.forEach(video=>video.classList.toggle('is-active',video===next));
  buttons.forEach(button=>{const active=Number(button.dataset.scene)===index;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active))});
  syncMotion(userGesture);
  if(!motionPaused&&playback.get(next).status!=='blocked')ensureVideoSource(videos[(index+1)%videos.length]);
 }
 buttons.forEach(button=>button.addEventListener('click',()=>selectScene(Number(button.dataset.scene),true)));
 setInterval(()=>{const current=videos[sceneIndex];if(current&&shouldPlayVideo(current)&&!current.paused&&playback.get(current).status==='playing')selectScene((sceneIndex+1)%videos.length)},9000);
 if(videos.length>1&&!motionPaused)ensureVideoSource(videos[1]);
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
