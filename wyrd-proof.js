/* Wyrd — proof register. Rendered from wyrd-proof.json so the published
   counts cannot drift from the manifest. Every card shows snapshot time,
   repo, branch, commit, command, pass/fail/skip, receipt hash, limitations
   and evidence status. Systems with no suite say so instead of implying one. */
(function(){
  var host=document.getElementById('receipts');
  if(!host) return;

  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function when(iso){
    var d=new Date(iso); if(isNaN(d)) return esc(iso);
    var p=function(n){ return String(n).padStart(2,'0'); };
    return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+' '+p(d.getHours())+':'+p(d.getMinutes());
  }
  // Non-cryptographic content digest (FNV-1a, 64-bit). Its only job is change
  // detection: if any count, commit or command in a receipt changes, this value
  // changes. It is NOT a signature and is never labelled as one — the manifest's
  // ed25519 signature is the single signed artifact.
  function digest(s){
    var h1=0x811c9dc5, h2=0x01000193;
    for(var i=0;i<s.length;i++){ h1=(h1^s.charCodeAt(i))>>>0; h1=(h1*16777619)>>>0; h2=(h2+((h1^s.charCodeAt(i))>>>0)*2654435761)>>>0; }
    return (h1>>>0).toString(16).padStart(8,'0')+(h2>>>0).toString(16).padStart(8,'0');
  }

  function row(k,v,cls){ return '<div class="rrow"><div class="rk">'+k+'</div><div class="rv'+(cls?' '+cls:'')+'">'+v+'</div></div>'; }

  function card(s,m){
    var hasSuite = s.passed!==null && s.passed!==undefined;
    var receipt = digest([s.id,s.commit,s.command,s.passed,s.failed,s.skipped,s.captured].join('|'));
    var summary = hasSuite
      ? '<span class="pass">'+s.passed+' passed</span><span class="fail">'+s.failed+' failed</span><span>'+s.skipped+' skipped</span><span>'+esc(s.commit)+'</span>'
      : '<span>'+esc(s.evidence_status)+'</span><span>'+esc(s.commit)+'</span>';
    return '<details class="rcpt"><summary>'+
      '<div class="rh"><h4>'+esc(s.name)+'</h4><span class="st '+esc(s.status)+'">'+esc(s.label)+'</span></div>'+
      '<span class="rmore">Receipt</span>'+
      '<div class="rsum">'+summary+'</div>'+
      '</summary><div class="rbody">'+
      row('Snapshot', when(s.captured)+' <span style="color:var(--ink-4)">'+esc(m.timezone)+'</span>')+
      row('Repository', esc(s.repo), 'mono')+
      row('Branch', esc(s.branch), 'mono')+
      row('Commit', esc(s.commit), 'mono')+
      row('Command', esc(s.command), 'mono')+
      (hasSuite ? row('Result', s.passed+' passed · '+s.failed+' failed · '+s.skipped+' skipped · '+s.total+' total', 'mono')
                : row('Result', 'No test suite is claimed for this entry.', 'no'))+
      row('Artifacts', esc(s.artifacts))+
      row('Establishes', esc(s.establishes))+
      row('Does not', esc(s.does_not), 'no')+
      row('Evidence status', esc(s.evidence_status))+
      row('Content digest', 'fnv1a64:'+esc(receipt)+' <span style="color:var(--ink-4)">· change-detection checksum, not a signature</span>', 'mono')+
      '</div></details>';
  }

  function paint(d){
    var m=d.manifest;
    if(!d.systems || !d.systems.length){
      host.innerHTML='<div class="note"><div class="k">Register pending generation</div>'+
        '<p>'+esc(m && m.note ? m.note : 'This register is not yet generated from real, pinned evidence, so nothing is published here rather than showing placeholder figures.')+'</p>'+
        (m && m.verification_key ? '<p style="margin-top:10px">Verification key: <span style="font-family:var(--font-mono)">'+esc(m.verification_key)+'</span></p>' : '')+
        '</div>';
      var bar0=document.getElementById('manifest-bar'); if(bar0) bar0.textContent='Register pending generation';
      var meta0=document.getElementById('manifest-meta'); if(meta0) meta0.innerHTML='';
      return;
    }
    host.innerHTML=d.systems.map(function(s){ return card(s,m); }).join('');
    var meta=document.getElementById('manifest-meta');
    if(meta) meta.innerHTML=
      '<div class="rrow"><div class="rk">Manifest</div><div class="rv mono">'+esc(m.name)+' · v'+esc(m.version)+'</div></div>'+
      '<div class="rrow"><div class="rk">Snapshot</div><div class="rv mono">'+when(m.snapshot)+' '+esc(m.timezone)+'</div></div>'+
      '<div class="rrow"><div class="rk">Issuer</div><div class="rv mono">'+esc(m.issuer)+'</div></div>'+
      '<div class="rrow"><div class="rk">Manifest signature</div><div class="rv mono">'+esc(m.signature)+'</div></div>'+
      '<div class="rrow"><div class="rk">Systems</div><div class="rv mono">'+d.systems.length+' entries · counts never summed</div></div>'+
      '<div class="rrow"><div class="rk">Per-receipt</div><div class="rv">Each card carries a non-cryptographic FNV-1a content digest for change detection. The ed25519 signature above covers the manifest as a whole.</div></div>';
    var bar=document.getElementById('manifest-bar');
    if(bar) bar.textContent='Snapshot '+when(m.snapshot)+' '+m.timezone;
  }

  // The manifest is the single source of truth. It ships inline so the register
  // renders in any context, and stays available as wyrd-proof.json for anyone
  // who wants to diff the published counts against the file.
  var inline=document.getElementById('proof-manifest');
  if(inline){
    try { paint(JSON.parse(inline.textContent)); return; } catch(err){}
  }
  fetch('wyrd-proof.json').then(function(r){ return r.json(); }).then(paint).catch(function(){
    host.innerHTML='<div class="note"><div class="k">Register unavailable</div><p>The proof manifest could not be loaded in this context. Request the signed manifest directly through the Design Partner Office.</p></div>';
  });
})();
