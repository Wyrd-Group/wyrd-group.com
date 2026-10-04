'use strict';
(async () => {
  const $ = id => document.getElementById(id);
  const integer = value => value.toLocaleString('en-GB');
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const challenges = {
    allowed: ['A permitted action', 'A correctly scoped action reaches the controlled reservation effect.', 'Effect observed'],
    allowed_boundary: ['Exactly at the limit', 'The exact permitted amount boundary remains usable. A system that denies everything would fail this positive case.', 'Effect observed'],
    approval_race: ['Approval race', 'The recorded self-approval and follow-up race does not create an unauthorised effect.', 'Gated · no primary effect'],
    authority_unavailable: ['Authority unavailable', 'When the authority service is unavailable, the controlled action does not proceed.', 'Refused · no effect'],
    direct_bypass: ['Direct bypass', 'A request that avoids the approved authority path cannot create the reservation effect.', 'Refused · no effect'],
    effect_substitution: ['Changed execution material', 'Replacing the approved effect material does not preserve authority for the altered request.', 'Refused · no effect'],
    expired: ['Expired passport', 'Expired identity authority does not permit the action.', 'Refused · no effect'],
    expired_request: ['Expired request', 'An Office request outside its permitted time window produces no effect.', 'Refused · no effect'],
    missing_proof: ['Missing native permit', 'A direct fake-bank write with a service credential but no signed native action permit is refused. This tests the action permit, not missing joined Proof Spine records.', 'Refused · no effect'],
    over_limit: ['Over the allowance', 'The proposed action exceeds its mandate allowance and remains gated without an effect.', 'Gated · no effect'],
    payload_tamper: ['Tampered request', 'The changed signed payload cannot be used as if it were the original request.', 'Refused · no effect'],
    replay: ['Repeated submission', 'A replayed primary request does not create an additional effect. The separate duplicate races are counted outside this scenario.', 'Refused · no new effect'],
    revoked: ['Revoked passport', 'Previously issued authority is unusable after the passport is revoked.', 'Refused · no effect'],
    tampered_proof: ['Altered proof', 'An altered native action-proof object does not authorise the controlled effect.', 'Refused · no effect'],
    wrong_identity: ['Wrong identity', 'Authority bound to one caller cannot be presented as the authority of another.', 'Refused · no effect'],
    wrong_scope: ['Outside the scope', 'A request beyond the mandate scope cannot execute through the controlled path.', 'Refused · no effect']
  };
    const recovery={
      before:['PRESERVED STARTING STATE','One memo. One joined evidence trail.','The retained synthetic incident result links the authorised action to its observed outcome.','<span><b>1</b> authorised memo</span><span><b>16</b> original export files</span>'],
      restart:['RECORDED SERVICE REFRESH','Five services restarted.','Five service PIDs changed and five TCP listeners returned. The child gates and supervisor passed in 25.027 seconds.','<span><b>5</b> changed service PIDs</span><span><b>14</b> child gates passed</span>'],
      after:['RETAINED RESULT VERIFIED','Recovery created no extra action.','The original memo and joined proof remained. All sixteen original export files were byte-identical and the retained proof verified offline.','<span><b>0</b> new approvals or effects</span><span><b>16 / 16</b> unchanged export files</span>']
    };
    document.querySelectorAll('[data-recovery]').forEach(button=>button.addEventListener('click',()=>{
      document.querySelectorAll('[data-recovery]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
      const [label,title,description,stats]=recovery[button.dataset.recovery];
      $('recovery-label').textContent=label;$('recovery-title').textContent=title;$('recovery-text').textContent=description;$('recovery-stats').innerHTML=stats;
      document.querySelector('.recovery-panel').dataset.stage=button.dataset.recovery;
    }));
  try {
    const response = await fetch('/results/data/measurements.json');
    if (!response.ok) throw new Error('Measurement data unavailable');
    const data = await response.json();
    let selectedChallenge = 'allowed';
    const selectedRows = () => data.governance.scenarios.filter(row => $('run-select').value === 'all' || String(row.seed) === $('run-select').value);
    const selectedRuns = () => data.governance.runs.filter(row => $('run-select').value === 'all' || String(row.seed) === $('run-select').value);
    const sum = (rows,key) => rows.reduce((total,row) => total + row[key],0);
    function showChallenge() {
      const rows = selectedRows().filter(row => row.scenario === selectedChallenge);
      const cases=sum(rows,'completed_cases'), matches=sum(rows,'matched_expected_outcome'), effects=sum(rows,'observed_effects');
      const [title,description,verdict]=challenges[selectedChallenge];
      $('challenge-title').textContent=title; $('challenge-description').textContent=description;
      $('challenge-cases').textContent=integer(cases); $('challenge-effects').textContent=integer(effects);
      $('challenge-matches').textContent=`${integer(matches)} / ${integer(cases)}`;
      $('challenge-verdict').textContent=verdict;
      document.querySelectorAll('[data-challenge]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.challenge === selectedChallenge)));
    }
    function showRun() {
      const rows=selectedRows(), runs=selectedRuns();
      const total=sum(rows,'planned_cases');
      const allowed=sum(rows.filter(row => ['allowed','allowed_boundary'].includes(row.scenario)),'completed_cases');
      const gated=sum(rows.filter(row => ['approval_race','over_limit'].includes(row.scenario)),'completed_cases');
      const refused=total-allowed-gated;
      $('matched-count').textContent=`${integer(sum(rows,'matched_expected_outcome'))} / ${integer(total)}`;
      $('effect-count').textContent=`${integer(sum(runs,'observed_effects'))} / ${integer(sum(runs,'intended_effects'))}`;
      $('unauthorized-count').textContent=`${integer(sum(runs,'unauthorized_effects')+sum(runs,'duplicate_effects'))} observed`;
      [['allow',allowed],['refuse',refused],['gate',gated]].forEach(([id,n]) => $(id+'-bar').style.width=`${100*n/total}%`);
      $('allowed-value').textContent=integer(allowed); $('refused-value').textContent=integer(refused); $('gated-value').textContent=integer(gated);
      $('outcome-plot').setAttribute('aria-label',`${integer(total)} primary cases: ${integer(allowed)} allowed, ${integer(refused)} refused, ${integer(gated)} gated. ${integer(sum(rows,'matched_expected_outcome'))} expected outcomes matched.`);
      showChallenge();
    }
    function bars(target,rows,max,axis,format) {
      target.innerHTML=rows.map((row,i) => `<div class="bar-row"><div class="bar-label"><span>${esc(row.label)}</span><strong>${esc(format(row.value))}</strong></div><div class="bar-track"><span class="bar-fill ${i%2?'bar-secondary':''}" style="width:${row.value/max*100}%"></span></div>${row.context?`<small>${esc(row.context)}</small>`:''}</div>`).join('')+`<div class="chart-axis"><span>0</span><span>${esc(axis)}</span><span>${esc(format(max))}</span></div>`;
    }
    function showCore() {
      const metric=$('core-metric').value;
      bars($('core-chart'), data.governance.core.map(row => ({label:{govern:'Authority check',seal:'Seal the record',verify:'Verify the record'}[row.stage],value:row[metric]})),200,'Milliseconds',v=>`${v.toFixed(3)} ms`);
    }
    function showConcurrent() {
      const metric=$('concurrent-metric').value;
      bars($('concurrent-chart'),data.governance.runs.map((row,i) => ({label:`Run ${'ABC'[i]}`,value:row[metric]/1000})),14,'Seconds',v=>`${v.toFixed(3)} s`);
    }
    function showAccuracy() {
      const group=data.reflex.groups.find(row => row.id === $('reflex-group').value);
      bars($('accuracy-chart'),[{label:'First tier',value:100*group.first/group.total,context:`${group.first} / ${group.total} correct`},{label:'Two-tier cascade',value:100*group.cascade/group.total,context:`${group.cascade} / ${group.total} correct`}],100,'Accuracy',v=>`${v.toFixed(1)}%`);
      $('reflex-gain').textContent=`+${(100*(group.cascade-group.first)/group.total).toFixed(1)} percentage points · ${group.cascade-group.first} additional correct decisions`;
    }
    function showReflexTime() {
      const values=data.reflex.latency[$('reflex-metric').value];
      bars($('reflex-time-chart'),[{label:'First tier',value:values[0]},{label:'Two-tier cascade (composed)',value:values[1]}],$('reflex-metric').value==='p50'?200:8000,'Milliseconds',v=>`${v.toFixed(2)} ms`);
    }
    $('challenge-grid').innerHTML=Object.entries(challenges).map(([id,[title]])=>`<button type="button" data-challenge="${id}" aria-pressed="${id==='allowed'}">${esc(title)}</button>`).join('');
    $('challenge-grid').addEventListener('click',event=>{const button=event.target.closest('[data-challenge]');if(button){selectedChallenge=button.dataset.challenge;showChallenge();}});
    $('run-select').addEventListener('change',showRun); $('core-metric').addEventListener('change',showCore);
    $('concurrent-metric').addEventListener('change',showConcurrent); $('reflex-group').addEventListener('change',showAccuracy); $('reflex-metric').addEventListener('change',showReflexTime);
    showRun();showCore();showConcurrent();showAccuracy();showReflexTime();

  } catch (error) {
    $('data-error').hidden=false;
    document.querySelectorAll('.results-section select, [data-challenge]').forEach(control=>{ control.disabled=true; control.title='Recorded measurement data is unavailable'; });
  }
})();
