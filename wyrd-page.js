/* Wyrd — shared page behaviour: sticky nav state, reveal-on-scroll,
   hero terminal typing. Loaded on every page, after the markup. */
(function(){
  var nav=document.getElementById('nav');
  if(nav){ var onScroll=function(){ nav.classList.toggle('scrolled', window.scrollY>8); };
    window.addEventListener('scroll',onScroll,{passive:true}); onScroll(); }

  var io=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }); },{rootMargin:'0px 0px -8% 0px',threshold:0.08});
  document.querySelectorAll('.reveal,.sec-head').forEach(function(el){ io.observe(el); });

  /* mobile drawer — mirrors the desktop nav below 1000px */
  var burger=document.getElementById('burger'), drawer=document.getElementById('drawer');
  if(burger&&drawer){
    var openDrawer=function(){ drawer.setAttribute('data-open','true'); burger.setAttribute('aria-expanded','true'); document.body.style.overflow='hidden';
      var f=drawer.querySelector('.dclose'); if(f) f.focus(); };
    var closeDrawer=function(){ drawer.setAttribute('data-open','false'); burger.setAttribute('aria-expanded','false'); document.body.style.overflow=''; burger.focus(); };
    burger.addEventListener('click',openDrawer);
    drawer.addEventListener('click',function(e){ if(e.target.closest('.dclose')||e.target.classList.contains('scrim')||e.target.classList.contains('dlink')) closeDrawer(); });
    document.addEventListener('keydown',function(e){ if(e.key==='Escape'&&drawer.getAttribute('data-open')==='true') closeDrawer(); });
    window.addEventListener('resize',function(){ if(window.innerWidth>1000&&drawer.getAttribute('data-open')==='true') closeDrawer(); });
  }

  var term=document.getElementById('term');
  if(!term) return;
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lines=[
    '<span class="pmt">$</span> <span class="cmd">wyrd agent run "settle the Q3 supplier batch"</span>',
    '<span class="dim">●</span> admission <span class="dim">(AEGIS)</span> → 3 sources, provenance checked   <span class="okc">✓ admitted</span>',
    '<span class="dim">●</span> model routing → local, <span class="dim">no egress</span>   <span class="okc">✓ policy satisfied</span>',
    '<span class="dim">●</span> mandate <span class="dim">(ICARUS)</span> → payment scope, limit exceeded   <span class="acc">→ review</span>',
    '<span class="dim">●</span> approval requested → treasury, dual key   <span class="dim">awaiting human</span>',
    '<span class="okc">✓</span> receipt written → <span class="sig">proof-spine ed25519:9f3a…c7</span>'
  ];
  function renderAll(){ term.innerHTML=lines.map(function(h){return '<span class="term-line">'+h+'</span>';}).join(''); }
  function play(){
    if(reduce){ renderAll(); return; }
    var i=0;
    (function next(){
      if(i>=lines.length) return;
      var s=document.createElement('span'); s.className='term-line'; s.innerHTML=lines[i]; term.appendChild(s);
      term.querySelectorAll('.term-cursor').forEach(function(c){c.remove();});
      var cur=document.createElement('span'); cur.className='term-cursor'; s.appendChild(cur);
      i++;
      if(i<lines.length) setTimeout(next,620);
      else setTimeout(function(){ term.querySelectorAll('.term-cursor').forEach(function(c){c.remove();}); },1200);
    })();
  }
  var started=false;
  var tio=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting&&!started){ started=true; play(); tio.disconnect(); } }); },{threshold:0.3});
  tio.observe(term);
})();
