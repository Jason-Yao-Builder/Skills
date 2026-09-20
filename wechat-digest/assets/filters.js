"use strict";
(function(root){
  const scopes=["category","tag","region","source","group_tag","text"];
  const list=v=>Array.isArray(v)?v.filter(x=>typeof x==="string").map(x=>x.trim()).filter(Boolean):[];
  const words=v=>list(String(v||"").split(/[,，、;；\n]+/));
  const norm=v=>String(v||"").normalize("NFKC").toLocaleLowerCase();
  function defaults(value={}){
    const out={kind:["events","recruiting"].includes(value.kind)?value.kind:"all",participation:["online","offline","hybrid"].includes(value.participation)?value.participation:"all",fee:["free","paid"].includes(value.fee)?value.fee:"all",search:typeof value.search==="string"?value.search:"",category:typeof value.category==="string"?value.category:"",region:typeof value.region==="string"?value.region:"",rules:{}};
    for(const k of scopes)out.rules[k]={include:list(value.rules?.[k]?.include),exclude:list(value.rules?.[k]?.exclude)};
    return out;
  }
  function regions(item){const r=list(item.regions);return r.length?r:(["offline","hybrid"].includes(item.details?.participation)?["地域未注明"]:[])}
  function normalize(item){return {...item,category:item.category||"未分类",tags:list(item.tags),regions:regions(item),display_mode:item.display_mode==="compact"?"compact":"card",sources:Array.isArray(item.sources)?item.sources:[]}}
  function match(values,rule){
    const text=values.map(norm);const has=word=>text.some(x=>x.includes(norm(word)));
    return (!rule.include.length||rule.include.some(has))&&!rule.exclude.some(has);
  }
  function sourceMatch(source,rule){
    const has=word=>norm(word).endsWith("@chatroom")?norm(source.group_id)===norm(word):[source.group_name,source.group_id].some(v=>norm(v).includes(norm(word)));
    return (!rule.include.length||rule.include.some(has))&&!rule.exclude.some(has);
  }
  function eligibleSources(item,f){return item.sources.filter(s=>sourceMatch(s,f.rules.source)&&match(list(s.group_tags),f.rules.group_tag))}
  function feeState(value){
    const text=norm(value),prices=[...text.matchAll(/([0-9]+(?:\.[0-9]+)?)\s*(?:元|rmb|cny|\/人|\/位)/g)].map(m=>Number(m[1]));
    for(const m of text.matchAll(/[¥￥]\s*([0-9]+(?:\.[0-9]+)?)/g))prices.push(Number(m[1]));
    if(/^\s*[0-9]+(?:\.[0-9]+)?\s*$/.test(text))prices.push(Number(text));
    const unavailable=/(?:免费|0\s*元).{0,10}(?:已满|售罄|已截止|已结束|已取消)|(?:不再|并非|不|非)免费/.test(text);
    return {free:!unavailable&&(/免费|免收.{0,3}费|不收费/.test(text)||prices.includes(0)),paid:prices.some(x=>x>0)||(/收费/.test(text)&&!/不收费|免收费|无需收费/.test(text)&&!prices.includes(0))};
  }
  function searchTerms(query){return [...new Set(norm(query).trim().split(/[\s,，、;；]+/).filter(Boolean))]}
  function annotationText(value){
    if(typeof value==="string")return value;
    if(Array.isArray(value))return value.map(annotationText).join(" ");
    if(value&&typeof value==="object")return [value.text,value.content,value.comment].filter(v=>typeof v==="string").join(" ");
    return "";
  }
  function searchRank(item,query){
    const terms=searchTerms(query);if(!terms.length)return 0;
    const sources=item.sources||[],details=item.details||{};
    const fields=[
      [item.title,...list(item.tags),item.category,...regions(item),...sources.flatMap(s=>list(s.group_tags))],
      [item.summary,...Object.values(details).filter(v=>typeof v==="string"),...(item.links||[]).flatMap(l=>[l.title,l.url]),...sources.flatMap(s=>[s.group_name,s.excerpt,s.time])],
      [item.personal_relevance,annotationText(item.notes),annotationText(item.comments),annotationText(item.annotations)]
    ].map(values=>values.filter(v=>typeof v==="string").map(norm));
    let rank=0;
    for(const term of terms){const found=fields.findIndex(values=>values.some(value=>value.includes(term)));if(found===-1)return Infinity;rank=Math.max(rank,found)}
    return rank;
  }
  function searchCompare(a,b,query,keywords=[]){
    return searchRank(a,query)-searchRank(b,query)||Number(locationPriority(b,keywords))-Number(locationPriority(a,keywords));
  }
  function accepts(raw,filters){
    const x=normalize(raw),f=defaults(filters),d=x.details||{};
    if(f.kind!=="all"&&x.kind!==f.kind)return false;
    if(f.participation!=="all"&&d.participation!==f.participation)return false;
    if(f.category&&x.category!==f.category)return false;
    if(f.region&&!x.regions.includes(f.region))return false;
    if(!Number.isFinite(searchRank({...x,sources:eligibleSources(x,f)},f.search)))return false;
    if(f.fee!=="all"&&!feeState(d.cost||"")[f.fee])return false;
    const values={category:[x.category],tag:x.tags,region:x.regions,text:[x.title,x.summary]};
    for(const k of Object.keys(values))if(!match(values[k],f.rules[k]))return false;
    const hasSourceRule=["source","group_tag"].some(k=>f.rules[k].include.length||f.rules[k].exclude.length);
    return !hasSourceRule||eligibleSources(x,f).length>0;
  }
  function active(filters){const f=defaults(filters);return f.kind!=="all"||f.participation!=="all"||f.fee!=="all"||!!f.search||!!f.category||!!f.region||scopes.some(k=>f.rules[k].include.length||f.rules[k].exclude.length)}
  function locationPriority(item,keywords){
    if(!list(keywords).length)return false;
    if(["online","hybrid"].includes(item.details?.participation))return true;
    const places=[...regions(item),item.details?.location||""];
    return keywords.some(word=>places.some(place=>norm(place).includes(norm(word))));
  }
  const api={scopes,words,feeState,defaults,normalize,regions,accepts,eligibleSources,active,locationPriority,searchTerms,searchRank,searchCompare};
  if(typeof module!=="undefined"&&module.exports)module.exports=api;else root.DigestFilters=api;
})(globalThis);
