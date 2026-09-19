(()=>{
 const root=document.getElementById('myco-sequence');
 if(!root) return;
 const get=s=>root.querySelector(s),canvas=get('canvas'),ctx=canvas.getContext('2d'),map=get('.ms-map'),stages=[...root.querySelectorAll('.ms-stage')];
 const pause=get('[data-control="pause"]'),record=get('.ms-record'),phase=get('[data-phase]');
 if(!ctx || !('IntersectionObserver' in window) || !('ResizeObserver' in window)) return;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');

 const steps=[
  {label:'01 · CANDIDATE CARD',id:'C01 · Hypothesis',title:'Could retry discard tax exemption?',summary:'The PR replaces the amendment object. Brainstorm records a suspected state-loss bug.',json:{issue:'Possible state loss',category:'Correctness',reasoning:'Object replaced'},phase:'Brainstorm · form candidate cards'},
  {label:'02 · VALIDATED CARD',id:'C01 · Evidence attached',title:'The dependency omits taxExempt.',summary:'Codebase context links the restore function to TAX-19. Unsupported candidates stop here.',json:{requirement:'Preserve tax exemption',dependency:'retry-state.ts',evidence:'taxExempt omitted',validated:true},phase:'Validate · check against codebase context'},
  {label:'03 · SCORED CARD',id:'C01 · Illustrative assessment',title:'A high-confidence correctness issue.',summary:'The validated finding is assessed for confidence, priority, severity and impact.',json:{confidence:'High',priority:'P1',severity:'High',impact:'Incorrect tax calculation'},phase:'Score · assess the validated findings'},
  {label:'04 · RESPONSE POLICY',id:'C01 · Rule matched',title:'A blocking finding, not an auto-fix.',summary:'The configured policy routes this finding to a merge block. Other cards route to comments or suggestions.',json:{input:'Validated, scored card',rule:'Blocking criteria met',action:'Block PR merge',source_write:false},phase:'Act · apply the configured rules'},
  {label:'PR · REVIEWER OUTPUT',id:'C01 · Merge blocked',title:'Retry loses the tax exemption.',summary:'The reviewer sees the root cause and impact in the PR. A Jira ticket is linked when that integration is configured.',json:{priority:'P1',confidence:'High',severity:'High',impact:'Incorrect tax calculation'},phase:'Complete · findings returned to the PR'}
 ];
 let elapsed=18,playing=false,visible=false,raf=0,last=0,w=688,h=265,mobile=false,active=-1,hasPlayed=reduce.matches;
 const cap=n=>Math.max(0,Math.min(1,n)),smooth=n=>{n=cap(n);return n*n*(3-2*n)},lerp=(a,b,t)=>a+(b-a)*t;
 const ink='#12151a',dim='#4a515b',line='#c0c6cc',paper='#f0f2f4',teal='#0e8e7e';
 function path(points,color=line,width=1){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke()}
 function sq(x,y,s,fill,stroke){if(fill){ctx.fillStyle=fill;ctx.fillRect(x-s/2,y-s/2,s,s)}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.strokeRect(x-s/2,y-s/2,s,s)}}
 function packet(x,y,id,opacity=1,scored=false){ctx.save();ctx.globalAlpha=opacity;ctx.fillStyle='#f8f9fa';ctx.fillRect(x-13,y-17,26,34);ctx.strokeStyle=scored?ink:dim;ctx.lineWidth=1;ctx.strokeRect(x-13,y-17,26,34);sq(x-6,y-9,3,scored?ink:null,dim);for(let i=0;i<3;i++)path([{x:x-7,y:y+i*5},{x:x+7-(i===2?5:0),y:y+i*5}],line);ctx.restore()}
 function info(index){if(index===active)return;active=index;const data=steps[index];get('[data-record-label]').textContent=data.label;get('[data-card-id]').textContent=data.id;get('[data-record-title]').textContent=data.title;get('[data-record-summary]').textContent=data.summary;get('[data-json]').textContent=JSON.stringify(data.json,null,2);phase.textContent=data.phase;record.dataset.terminal=String(index===4);stages.forEach((s,i)=>s.dataset.active=String(i===index));}
 function draw(){
  ctx.clearRect(0,0,w,h);
  const t=elapsed,segment=t<4?0:t<8?1:t<12?2:t<16?3:4;info(segment);
  const nodes=Array.from({length:4},(_,i)=>mobile?{x:32,y:27+i*110}:{x:w*(i+.5)/4,y:102});
  path(nodes,line);
  // Stage glyphs are stationary. Only the current agent's local structure moves.
  nodes.forEach((p,i)=>{
   const current=segment===i,done=segment>i;
   sq(p.x,p.y,48,paper,current?ink:line);
   for(let n=0;n<9;n++){
    const x=p.x+(n%3-1)*9,y=p.y+(Math.floor(n/3)-1)*9;
    const motion=current?Math.sin(t*2.1+n*.85)*2:0;
    if(i===1){if(n<8)path([{x,y},{x:x+7,y:y+7}],done?dim:line);sq(x+motion,y,3,dim)}
    else if(i===2){path([{x:x-2,y:y+motion},{x:x+3,y:y+motion}],done?ink:dim,1+(n%3)*.3)}
    else sq(x+motion,y+(current?Math.cos(t*1.4+n)*1.5:0),n===4?5:3,done?ink:(n%2?line:dim));
   }
   if(!mobile){path([{x:p.x,y:128},{x:p.x,y:151}],current?dim:line);sq(p.x,151,4,paper,line)}
   if(done)sq(p.x+(mobile?-29:0),p.y+(mobile?0:-34),4,ink);
  });
  // One batch is handed off at a time. A rejected candidate never reaches Score.
  if(segment<3){
   const local=t-segment*4,start=nodes[segment],end=nodes[segment+1];
   const move=smooth((local-2.5)/1.5),count=segment===0?4:3;
   for(let i=0;i<count;i++){
    const spread=(i-(count-1)/2)*(mobile?8:10);
    const emergence=smooth((local-.25-i*.22)/.8);
    const x=lerp(start.x,end.x,move)+(mobile?spread:spread*(1-move*.5));
    const y=lerp(start.y,end.y,move)+(mobile?0:spread*.28);
    packet(x,y,i,emergence,segment===2);
   }
   if(segment===1&&local<2.5){const fall=smooth(local/2.4);const x=start.x+(mobile?42:0),y=start.y+(mobile?0:52)+fall*20;packet(x,y,3,1-fall,false);}
  }
  // Act routes output after scoring, not concurrently with upstream agents.
  if(segment>=3){
   const p=nodes[3],a=cap((t-12)/4),terminal=t>=16;
   if(!mobile){
    const bottom=232;
    const targets=[{x:w*.25,y:bottom,label:'Block merge'},{x:w*.56,y:bottom,label:'Inline comment'},{x:w*.84,y:bottom,label:'Suggestion'}];
    targets.forEach((q,i)=>{const from={x:p.x+25,y:p.y},outer={x:w-16,y:p.y},turn={x:w-16,y:bottom-26},via={x:q.x,y:bottom-26};const progress=smooth((a-.2-i*.12)/.45);path([from,outer,turn,via,{x:q.x,y:q.y-8}],terminal?teal:line);const travel=progress<.2?{x:lerp(from.x,outer.x,progress*5),y:from.y}:progress<.5?{x:outer.x,y:lerp(outer.y,turn.y,(progress-.2)/.3)}:{x:lerp(turn.x,via.x,(progress-.5)*2),y:turn.y};if(a<1&&progress>0)packet(travel.x,travel.y,i,1,true);sq(q.x,q.y-8,6,terminal?teal:paper,terminal?teal:line);ctx.font="11px 'JetBrains Mono',monospace";ctx.fillStyle=terminal?teal:dim;ctx.textAlign='center';ctx.fillText(q.label,q.x,q.y+13)});
   }else{
    const to={x:p.x,y:424};path([p,to],terminal?teal:line);sq(to.x,to.y,6,terminal?teal:paper,terminal?teal:line);
   }
  }else if(!mobile){ctx.font="11px 'JetBrains Mono',monospace";ctx.fillStyle=dim;ctx.textAlign='center';ctx.fillText('Structured cards carry the evidence forward',w/2,245)}
 }
 function controls(){pause.textContent=playing?'Pause':'Resume';pause.setAttribute('aria-label',playing?'Pause workflow animation':'Resume workflow animation');pause.disabled=reduce.matches;get('.ms-actions').hidden=reduce.matches;}
 function resize(){w=map.clientWidth;h=map.clientHeight;mobile=matchMedia('(max-width:800px)').matches;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);draw()}
 // Hold the finished evidence for five seconds, then begin the next illustrative run.
 function tick(now){raf=0;if(!playing||!visible||document.hidden||reduce.matches){last=0;return}if(last)elapsed=(elapsed+Math.min((now-last)/1000,.06))%21;last=now;draw();start()}
 function start(){if(!raf&&playing&&visible&&!document.hidden&&!reduce.matches)raf=requestAnimationFrame(tick)}
 pause.addEventListener('click',()=>{if(reduce.matches)return;hasPlayed=true;playing=!playing;last=0;controls();get('[data-announcement]').textContent=playing?'Animation playing.':'Animation paused.';start()});
 reduce.addEventListener('change',()=>{elapsed=reduce.matches?18:0;playing=!reduce.matches;hasPlayed=true;last=0;controls();draw();start()});
 document.addEventListener('visibilitychange',()=>{last=0;start()});
 new ResizeObserver(resize).observe(map);
 new IntersectionObserver(entries=>{const entry=entries[0];visible=entry.intersectionRatio>=.25;last=0;if(visible&&!hasPlayed&&!reduce.matches){hasPlayed=true;elapsed=0;playing=true;controls();}start()},{threshold:[0,.25]}).observe(map);
 resize();controls();draw();start();
})();
