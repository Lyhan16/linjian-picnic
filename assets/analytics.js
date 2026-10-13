/* Foreground-time collector. Inputs and project content are never sent.
 * Network IPs are observed server-side and visible only in the private dashboard. */
(async()=>{
 'use strict';
 const endpoint=document.currentScript?.dataset.endpoint;
 if(!endpoint)return;
 const preferenceKey='linjian-analytics-excluded-v1',visitorKey='linjian-anonymous-visitor-v1';
 const uuidPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
 const url=new URL(location.href),intent=url.searchParams.get('analytics');
 let excluded=false,persisted=true,knownVisitor='';
 try{excluded=localStorage.getItem(preferenceKey)==='1';knownVisitor=localStorage.getItem(visitorKey)||'';}catch{persisted=false;}
 if(intent==='off'||intent==='on'){
  excluded=intent==='off';
  try{if(excluded)localStorage.setItem(preferenceKey,'1');else localStorage.removeItem(preferenceKey);}catch{persisted=false;}
  url.searchParams.delete('analytics');history.replaceState(null,'',url.href);
  const notice=document.createElement('div');notice.id='picnic-analytics-preference';notice.setAttribute('role','status');notice.style.cssText='position:fixed;top:18px;left:50%;transform:translateX(-50%);z-index:99999;max-width:90vw;padding:12px 16px;border:1px solid #d9dfd6;border-radius:9px;background:#fff;color:#28322d;font:13px Microsoft YaHei,sans-serif;display:flex;gap:14px;align-items:center;box-shadow:0 3px 14px #00000009';
  const label=document.createElement('span');label.textContent=excluded?(persisted?'此浏览器已不参与访问统计':'此次访问已暂停统计；浏览器无法记住设置'):'此浏览器已恢复访问统计';notice.append(label);
  const close=document.createElement('button');close.type='button';close.textContent='×';close.setAttribute('aria-label','关闭统计设置提示');close.style.cssText='border:0;background:none;color:inherit;font-size:18px;cursor:pointer';close.onclick=()=>notice.remove();notice.append(close);document.body.append(notice);
  if(uuidPattern.test(knownVisitor)){
   try{const result=await fetch(endpoint.replace(/\/collect(?:\?.*)?$/,'/preference'),{method:'POST',body:JSON.stringify({visitor:knownVisitor,action:excluded?'exclude':'include'}),headers:{'Content-Type':'text/plain'},mode:'cors',credentials:'omit',keepalive:true});if(!result.ok)label.textContent=excluded?'此浏览器已暂停统计；云端排除暂未成功，请关闭旧标签页':'云端恢复暂未成功，请稍后再试';if(!result.ok&&!excluded)return;}catch{if(!excluded){label.textContent='云端恢复暂未成功，请稍后再试';return;}}
  }
 }
 if(excluded||navigator.doNotTrack==='1'||navigator.globalPrivacyControl===true)return;
 const uuid=()=>crypto.randomUUID();
 let visitor;try{visitor=localStorage.getItem(visitorKey);if(!uuidPattern.test(visitor||'')){visitor=uuid();localStorage.setItem(visitorKey,visitor);}}catch{visitor=uuid();}
 const id=uuid(),times=[0,0,0];let at=performance.now(),visible=!document.hidden&&document.hasFocus(),section=0;
 function page(){return document.getElementById('manual-dialog')?.open?1:document.getElementById('workbench-dialog')?.open?2:0}
 section=page();
 function tick(){const now=performance.now();if(visible)times[section]+=Math.min(30000,Math.max(0,now-at));at=now;section=page();}
 let source='';try{const host=new URL(document.referrer).hostname;if(host!==location.hostname)source=host;}catch{}
 const device=/ipad|tablet/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)?'平板':/mobile|android|iphone/i.test(navigator.userAgent)?'手机':'电脑';
 function send(ended=false){try{if(localStorage.getItem(preferenceKey)==='1')return;}catch{}tick();const body=JSON.stringify({site:'linjian-picnic',id,visitor,times:times.map(Math.floor),device,source,ended});if(ended&&navigator.sendBeacon?.(endpoint,new Blob([body],{type:'text/plain'})))return;fetch(endpoint,{method:'POST',body,headers:{'Content-Type':'text/plain'},mode:'cors',credentials:'omit',keepalive:true}).catch(()=>{});}
 function visibility(){tick();visible=!document.hidden&&document.hasFocus();send(!visible);}
 document.addEventListener('visibilitychange',visibility);window.addEventListener('focus',visibility);window.addEventListener('blur',()=>{tick();visible=false;send(true)});
 window.addEventListener('pagehide',()=>send(true));window.addEventListener('pageshow',()=>{at=performance.now();visible=!document.hidden&&document.hasFocus();send(false)});
 new MutationObserver(tick).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});
 setInterval(()=>{if(visible)send(false)},15000);send(false);
})();
