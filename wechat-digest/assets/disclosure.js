"use strict";
(function(root){
  const states=new WeakMap(),installed=new WeakSet();
  function prepare(node){
    let body=node.querySelector(":scope > .disclosure-body");
    if(!body){
      body=document.createElement("div");body.className="disclosure-body";
      for(const child of [...node.childNodes])if(child.nodeType!==1||child.tagName!=="SUMMARY")body.append(child);
      node.append(body);
    }
    if(!body.querySelector(":scope > .disclosure-content")){
      const content=document.createElement("div");content.className="disclosure-content";
      content.append(...body.childNodes);body.append(content);
    }
    node.classList.add("animated-disclosure");
    return body;
  }
  function setOpen(node,open,animate=true){
    const body=prepare(node),previous=states.get(node),from=node.open?body.getBoundingClientRect().height:0;
    if(previous){cancelAnimationFrame(previous.frame);previous.animation?.cancel()}
    states.delete(node);
    body.style.height="";body.style.overflow="";
    if(!animate||matchMedia("(prefers-reduced-motion: reduce)").matches){node.open=open;return}
    const state={open,frame:null,animation:null};states.set(node,state);
    node.open=true;body.style.height=`${from}px`;body.style.overflow="hidden";
    // Let the browser lay out previously closed details before measuring their content.
    state.frame=requestAnimationFrame(()=>{
      if(!node.isConnected){states.delete(node);return}
      const to=open?body.firstElementChild.getBoundingClientRect().height:0;
      state.animation=body.animate([{height:`${from}px`},{height:`${to}px`}],{duration:300,easing:"cubic-bezier(.4,0,.2,1)",fill:"both"});
      state.animation.onfinish=()=>{
        node.open=open;state.animation.cancel();body.style.height="";body.style.overflow="";states.delete(node);
      };
    });
  }
  function install(container=document){
    if(installed.has(container))return;installed.add(container);
    container.querySelectorAll("details").forEach(prepare);
    container.addEventListener("click",event=>{
      const summary=event.target.closest?.("summary"),node=summary?.parentElement;
      if(node?.tagName!=="DETAILS"||event.target.closest("a,button,input,select,textarea"))return;
      event.preventDefault();setOpen(node,!(states.get(node)?.open??node.open));
    });
  }
  root.DigestDisclosure={install,setOpen};
})(globalThis);
