/* Wyrd — design-partner qualification form.
   Static hosting has no backend, so the form validates, then composes a
   structured mailto to the Design Partner Office. No data is stored or sent
   anywhere else, and nothing leaves the browser until the user's mail client
   opens with the message visible to them. */
(function(){
  var form=document.getElementById('qualify');
  if(!form) return;
  var out=document.getElementById('qsent'), body=document.getElementById('qsent-body');

  function invalid(el,msg){
    el.setAttribute('aria-invalid','true');
    el.style.borderColor='color-mix(in oklab, #d98b6a 60%, var(--line-2))';
    el.focus();
    out.setAttribute('data-on','true');
    out.querySelector('.qk').textContent='Incomplete';
    body.textContent=msg;
  }
  function clear(el){ el.removeAttribute('aria-invalid'); el.style.borderColor=''; }

  form.addEventListener('input',function(e){ clear(e.target); });

  form.addEventListener('submit',function(e){
    e.preventDefault();
    var f={};
    ['name','email','org','role','jurisdiction','sector','deployment','entry','workflow'].forEach(function(k){
      var el=form.elements[k]; f[k]=el?el.value.trim():''; 
    });
    var required=[['name','Add a name so we know who to reply to.'],
      ['email','A work email is required — we do not reply to personal addresses for partner enquiries.'],
      ['org','Name the institution or company.'],
      ['jurisdiction','Jurisdiction determines what can be released and how.'],
      ['sector','Select the sector.'],
      ['deployment','Select a deployment preference, or choose "advise us".'],
      ['workflow','Describe the workflow — a real constraint is what the method needs.']];
    for(var i=0;i<required.length;i++){
      if(!f[required[i][0]]){ invalid(form.elements[required[i][0]], required[i][1]); return; }
    }
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email)){ invalid(form.elements.email,'That email address does not look complete.'); return; }

    var lines=[
      'Design-partner enquiry',
      '',
      'Name: '+f.name,
      'Organization: '+f.org,
      'Role: '+(f.role||'—'),
      'Jurisdiction: '+f.jurisdiction,
      'Sector: '+f.sector,
      'Deployment preference: '+f.deployment,
      'Starting point: '+(f.entry||'—'),
      'Work email: '+f.email,
      '',
      'Intended workflow:',
      f.workflow
    ].join('\n');

    var href='mailto:partners@wyrd-group.com?subject='+encodeURIComponent('Design partner — '+f.org+' ('+f.sector+')')+'&body='+encodeURIComponent(lines);
    out.setAttribute('data-on','true');
    out.querySelector('.qk').textContent='Ready to send';
    body.innerHTML='Your mail client is opening with this enquiry addressed to the Design Partner Office. If nothing opens, copy the details to <a href="mailto:partners@wyrd-group.com" style="color:var(--signal)">partners@wyrd-group.com</a>. Expect a reply within five working days; depth of response follows jurisdiction and authority.';
    window.location.href=href;
  });
})();
