/* Wyrd — division switcher. Clicking a unit highlights the shared
   blocks it inherits and stacks them into that unit's products. */
(function(){
  var root=document.getElementById('divswitch');
  if(!root) return;

  var UNITS={
    labs:{
      lead:'Wyrd Labs creates and maintains the shared software — primitives, engines, cryptography, simulation, integration layers and technical IP. It is the software-production division, not a speculative annex.',
      blocks:['T-AOS','CAOS','ALEC','ICARUS','Proof Spine','ARGOS','AEGIS','HIVE','NINA','DAEDALUS','RASOS','Wyrd MCP','IRIS','Master Brain'],
      products:[
        {n:'ICARUS Forge',d:'Generate, test and compare governed agents and policies.',s:'program',l:'Integration program'},
        {n:'DAEDALUS',d:'Simulate plans, failures, counterfactuals and deployment blueprints.',s:'arch',l:'Architecture defined'},
        {n:'NINA Foundry',d:'Generate and benchmark optimization methods under constraints.',s:'research',l:'Research prototype'},
        {n:'Conformity Lab',d:'Rehearse certification and audit pressure before formal review.',s:'working',l:'Working software'}
      ]
    },
    nestar:{
      lead:'Nestar commercializes governed enterprise AI: a private agent environment where every agent has an identity, a mandate, an approval path and a receipt. Nestar is the product; ICARUS is the substrate underneath it.',
      blocks:['ICARUS','ALEC','Proof Spine','RASOS','Master Brain','CAOS','ARGOS'],
      products:[
        {n:'Nestar Agentic OS',d:'Company-wide governed environment for agents, memory, approvals and proof.',s:'alpha',l:'Integrated alpha'},
        {n:'Bank Edition',d:'Role and department models, dual key, audit evidence, rollback.',s:'pilot',l:'Pilot candidate'},
        {n:'Mandate Network',d:'Authorizes agent value-requests before they reach a payment rail.',s:'program',l:'Integration program'},
        {n:'Perfect-Secrecy Vault',d:'Information-theoretic k-of-n protection for crown-jewel material.',s:'working',l:'Working software'}
      ]
    },
    biota:{
      lead:'Biota commercializes the person-facing stack: personal intelligence, body signals, health, performance, home and devices. Your devices know you, your data obeys you, your Cortex serves you.',
      blocks:['ALEC','CAOS','ICARUS','T-AOS','Proof Spine','Master Brain'],
      products:[
        {n:'Personal Cortex / ALEC',d:'A governed model of how one person decides, refuses, approves and prefers.',s:'alpha',l:'Integrated alpha'},
        {n:'Biota Vital',d:'Body and environment signals into owner-approved changes in daily life.',s:'arch',l:'Architecture defined'},
        {n:'Themis',d:'Sport, scouting, training, movement and performance intelligence.',s:'working',l:'Working software'},
        {n:'Raphael',d:'Doctor-support infrastructure. Raphael suggests; the clinician judges and signs.',s:'pilot',l:'Pilot candidate'}
      ]
    },
    corpus:{
      lead:'CORP-US commercializes protected operations, civil resilience, critical-infrastructure security, robotics, drones, maritime and B2G systems. Public framing is civil protection and human accountability; restricted capability stays in authorized channels.',
      blocks:['HIVE','AEGIS','ARGOS','ICARUS','CAOS','RASOS','NINA','T-AOS'],
      products:[
        {n:'RADOME',d:'Identity-gated continuity bubble when normal infrastructure degrades.',s:'pilot',l:'Pilot candidate'},
        {n:'Leviathan',d:'Maritime and subsea missions — inspection, ports, search, monitoring.',s:'program',l:'Integration program'},
        {n:'CTOS',d:'City and institutional operating layer. Planning and advisory first.',s:'arch',l:'Architecture defined'},
        {n:'Phaeton',d:'Multimodular robotics — reconfigurable bodies under a governed local brain.',s:'research',l:'Research prototype'}
      ]
    }
  };
  var ALL=['T-AOS','CAOS','ALEC','ICARUS','Proof Spine','ARGOS','AEGIS','HIVE','NINA','DAEDALUS','RASOS','Wyrd MCP','IRIS','Master Brain'];

  var tabs=root.querySelectorAll('[data-unit]');
  var lead=root.querySelector('[data-lead]');
  var blocks=root.querySelector('[data-blocks]');
  var products=root.querySelector('[data-products]');

  blocks.innerHTML=ALL.map(function(b){ return '<span class="blk" data-b="'+b+'">'+b+'</span>'; }).join('');

  function select(key){
    var u=UNITS[key];
    tabs.forEach(function(t){ var on=t.dataset.unit===key; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
    if(panel) panel.setAttribute('aria-labelledby','divtab-'+key);
    lead.textContent=u.lead;
    blocks.querySelectorAll('.blk').forEach(function(el){ el.classList.toggle('use', u.blocks.indexOf(el.dataset.b)>-1); });
    products.innerHTML=u.products.map(function(p){
      return '<div class="prod"><div class="pn">'+p.n+'</div><div class="pd">'+p.d+'</div><span class="st '+p.s+'">'+p.l+'</span></div>';
    }).join('');
  }
  var order=[].slice.call(tabs);
  order.forEach(function(t,i){
    t.setAttribute('aria-controls','divpanel');
    t.id='divtab-'+t.dataset.unit;
    t.tabIndex = t.dataset.unit==='nestar' ? 0 : -1;
    t.addEventListener('click',function(){ select(t.dataset.unit); });
    t.addEventListener('keydown',function(e){
      var d = e.key==='ArrowRight'||e.key==='ArrowDown' ? 1 : (e.key==='ArrowLeft'||e.key==='ArrowUp' ? -1 : 0);
      if(e.key==='Home'){ e.preventDefault(); order[0].focus(); select(order[0].dataset.unit); return; }
      if(e.key==='End'){ e.preventDefault(); order[order.length-1].focus(); select(order[order.length-1].dataset.unit); return; }
      if(!d) return;
      e.preventDefault();
      var next=order[(i+d+order.length)%order.length];
      next.focus(); select(next.dataset.unit);
    });
  });
  var panel=root.querySelector('.divbox');
  if(panel){ panel.id='divpanel'; panel.setAttribute('role','tabpanel'); panel.setAttribute('tabindex','0'); }
  select('nestar');
})();
