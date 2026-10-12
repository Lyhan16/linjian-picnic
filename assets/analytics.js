/* Anonymous foreground-time collector. No task content, search params, or IDs
 * identifying a person are sent. The admin dashboard has separate server auth. */
(()=>{
 'use strict';
 const endpoint=document.currentScript?.dataset.endpoint;
 if(!endpoint||navigator.doNotTrack==='1'||navigator.globalPrivacyControl===true)return;
 const uuid=()=>crypto.randomUUID();
 let visitor;try{visitor=localStorage.getItem('linjian-anonymous-visitor-v1');if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(visitor||'')){visitor=uuid();localStorage.setItem('linjian-anonymous-visitor-v1',visitor);}}catch{visitor=uuid();}
 const id=uuid(),times=[0,0,0];let at=performance.now(),visible=!document.hidden&&document.hasFocus(),section=0;
 function page(){return document.getElementById('manual-dialog')?.open?1:document.getElementById('workbench-dialog')?.open?2:0}
 section=page();
 function tick(){const now=performance.now();if(visible)times[section]+=Math.min(30000,Math.max(0,now-at));at=now;section=page();}
 let source='';try{const host=new URL(document.referrer).hostname;if(host!==location.hostname)source=host;}catch{}
 const device=/ipad|tablet/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)?'平板':/mobile|android|iphone/i.test(navigator.userAgent)?'手机':'电脑';
 function send(ended=false){tick();const body=JSON.stringify({site:'linjian-picnic',id,visitor,times:times.map(Math.floor),device,source,ended});if(ended&&navigator.sendBeacon?.(endpoint,new Blob([body],{type:'text/plain'})))return;fetch(endpoint,{method:'POST',body,headers:{'Content-Type':'text/plain'},mode:'cors',credentials:'omit',keepalive:true}).catch(()=>{});}
 function visibility(){tick();visible=!document.hidden&&document.hasFocus();send(!visible);}
 document.addEventListener('visibilitychange',visibility);window.addEventListener('focus',visibility);window.addEventListener('blur',()=>{tick();visible=false;send(true)});
 window.addEventListener('pagehide',()=>send(true));window.addEventListener('pageshow',()=>{at=performance.now();visible=!document.hidden&&document.hasFocus();send(false)});
 new MutationObserver(tick).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});
 setInterval(()=>{if(visible)send(false)},15000);send(false);
})();
