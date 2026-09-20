"use strict";
(function(root){
  const prefix="wechat-digest.reading.v1:",ttl=30*24*60*60*1000;
  function valid(value,date,now=Date.now()){
    if(!value||value.date!==date||!Number.isFinite(value.savedAt)||now-value.savedAt>ttl||value.savedAt>now+60000)return null;
    if(!value.filters||typeof value.filters!=="object"||Array.isArray(value.filters)||typeof value.hash!=="string"||value.hash.length>500||!Number.isFinite(value.offset)||(value.anchor!==null&&(typeof value.anchor!=="string"||value.anchor.length>300)))return null;
    if(!Number.isFinite(value.y)||value.y<0||!Array.isArray(value.open)||value.open.length>5000||value.open.some(k=>typeof k!=="string"||k.length>300))return null;
    return value;
  }
  function create(win,current){
    const doc=win.document;let timer=null,position=null,stopTimer=null;
    try{win.history.scrollRestoration="manual"}catch{}
    function read(date){
      try{const h=valid(win.history.state?.wechatDigestReading,date);if(h)return h}catch{}
      try{return valid(JSON.parse(win.sessionStorage.getItem(prefix+date)),date)}catch{return null}
    }
    function expanded(){return [...doc.querySelectorAll("#report-view details[data-read-key][open]")].map(n=>n.dataset.readKey)}
    function expand(keys){const set=new Set(keys||[]);for(const n of doc.querySelectorAll("#report-view details[data-read-key]"))n.open=set.has(n.dataset.readKey)}
    function capture(){
      const view=current();if(!view||position)return;
      const candidates=[...doc.querySelectorAll("#report-view article[data-read-key]")];
      const anchor=candidates.find(n=>{const r=n.getBoundingClientRect();return r.bottom>0&&r.top<win.innerHeight});
      const state={date:view.date,filters:view.filters,open:expanded(),y:win.scrollY,anchor:anchor?.dataset.readKey||null,offset:anchor?.getBoundingClientRect().top||0,hash:win.location.hash,savedAt:Date.now()};
      try{win.history.replaceState({...win.history.state,wechatDigestReading:state},"")}catch{}
      try{
        for(let i=win.sessionStorage.length-1;i>=0;i--){const k=win.sessionStorage.key(i);if(k?.startsWith(prefix)){try{const old=JSON.parse(win.sessionStorage.getItem(k));if(Date.now()-old.savedAt>ttl)win.sessionStorage.removeItem(k)}catch{win.sessionStorage.removeItem(k)}}}
        win.sessionStorage.setItem(prefix+view.date,JSON.stringify(state));
      }catch{}
      return state;
    }
    function cancel(){position=null;win.clearTimeout(stopTimer)}
    function align(){
      if(!position)return;
      const view=current();if(!view||view.date!==position.date){cancel();return}
      const node=[...doc.querySelectorAll("#report-view article[data-read-key]")].find(n=>n.dataset.readKey===position.anchor);
      const y=node?win.scrollY+node.getBoundingClientRect().top-position.offset:position.y;
      win.scrollTo({top:Math.max(0,y),left:0,behavior:"instant"});
    }
    function restore(state){
      if(!state)return;
      cancel();position=state;expand(state.open);
      win.requestAnimationFrame(()=>win.requestAnimationFrame(align));
      stopTimer=win.setTimeout(()=>{align();cancel();capture()},2000);
    }
    function queue(){win.clearTimeout(timer);timer=win.setTimeout(capture,120)}
    win.addEventListener("scroll",queue,{passive:true});
    win.addEventListener("pagehide",()=>{if(!position)capture()});
    doc.addEventListener("visibilitychange",()=>{if(doc.visibilityState==="hidden")capture()});
    doc.addEventListener("click",event=>{if(event.target.closest?.("a[href]")){cancel();capture()}},true);
    doc.addEventListener("toggle",queue,true);
    doc.addEventListener("input",()=>{cancel();queue()});
    doc.addEventListener("change",queue);
    for(const event of ["wheel","touchstart","pointerdown","keydown"])win.addEventListener(event,cancel,{passive:true});
    doc.addEventListener("load",event=>{if(position&&event.target.tagName==="IMG")align()},true);
    return {read,capture,restore,expanded,expand,cancel};
  }
  const api={create,valid};if(typeof module!=="undefined"&&module.exports)module.exports=api;else root.DigestReadingState=api;
})(globalThis);
