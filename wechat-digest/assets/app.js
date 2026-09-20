"use strict";
const $=id=>document.getElementById(id),F=DigestFilters;
let readingReady=false;
let report=null,filters=F.defaults(),configured=F.defaults(),generation=0,preferencesLoaded=false,locationKeywords=[],settings=null,settingsBusy=false;
const reading=DigestReadingState.create(window,()=>readingReady&&!$("report-view").hidden?{date:$("date").value,filters}:null);
const detailLabels={start_time:"时间",end_time:"结束",deadline:"截止",location:"地点",cost:"费用",organizer:"主办",application:"参加方式",company:"公司",salary:"薪资",requirements:"要求"};
const statuses={open:"可参与",uncertain:"待核实",closed:"已截止",cancelled:"已取消"};
const modes={online:"线上",offline:"线下",hybrid:"线上＋线下",unknown:"方式未注明"};
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n};
const imageViewer=$("image-viewer"),viewerImage=$("viewer-image"),viewerStage=$("viewer-stage");
let imageOpener=null,imageScroll=0;
function openImage(image,opener){
  reading.capture();imageOpener=opener;imageScroll=window.scrollY;
  viewerImage.src=image.src;viewerImage.alt=image.alt;
  $("viewer-caption").textContent=opener.getAttribute("aria-label").replace(/^放大图片：/,"");
  viewerStage.classList.remove("zoomed");$("zoom-image").textContent="放大";$("zoom-image").setAttribute("aria-pressed","false");
  document.body.classList.add("viewing-image");imageViewer.showModal();viewerStage.scrollTo(0,0);
}
$("close-image").addEventListener("click",()=>imageViewer.close());
imageViewer.addEventListener("click",event=>{if(event.target===imageViewer)imageViewer.close()});
imageViewer.addEventListener("close",()=>{
  document.body.classList.remove("viewing-image");viewerImage.removeAttribute("src");
  imageOpener?.focus({preventScroll:true});window.scrollTo(0,imageScroll);
});
$("zoom-image").addEventListener("click",()=>{
  const zoomed=viewerStage.classList.toggle("zoomed");
  $("zoom-image").textContent=zoomed?"适合窗口":"放大";$("zoom-image").setAttribute("aria-pressed",String(zoomed));
  viewerStage.scrollTo(0,0);
});
function safeUrl(v){try{const u=new URL(v);return ["http:","https:"].includes(u.protocol)?u.href:null}catch{return null}}
function published(value){const d=new Date(value);if(!value||Number.isNaN(d.getTime()))return "时间未记录";return new Intl.DateTimeFormat("sv-SE",{timeZone:"Asia/Shanghai",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}).format(d)}
function links(item,compact=false){const out=el("div",undefined,compact?"compact-links":"links");for(const l of item.links||[]){const url=safeUrl(l.url);if(!url)continue;const a=el("a",l.title||"报名 / 原文 ↗");a.href=url;a.target="_blank";a.rel="noopener noreferrer";out.append(a)}return out}
function sourceDetails(item){const d=el("details"),ss=item.sources||[];d.dataset.readKey="sources:"+item.id;d.append(el("summary",`核对 ${ss.length} 条来源`));for(const s of ss){const box=el("div",undefined,"source-item");box.append(el("div",`${s.group_name||s.group_id} · 群内发布于 ${published(s.time)}`),el("p",s.excerpt||"图片或链接消息","quote"));if(s.time)box.append(el("span",`原始时间 ${s.time}`,"source-time"));for(const path of s.images||[]){if(!/^\/media\/\d{4}-\d{2}-\d{2}\/[a-zA-Z0-9_.-]+$/.test(path))continue;const img=el("img",undefined,"poster");img.src=path;img.alt="消息中的图片";img.loading="lazy";const button=el("button",undefined,"poster-button");button.type="button";button.setAttribute("aria-label",`放大图片：${item.title} · ${s.group_name||s.group_id} · ${published(s.time)}`);button.title="点击放大图片";button.append(img);button.addEventListener("click",()=>openImage(img,button));box.append(button)}d.append(box)}return d}
function leadingSource(item){const ss=F.eligibleSources(item,filters);return ss[0]||item.sources[0]}
function sourceLead(item){const s=leadingSource(item);return s?`${s.group_name||s.group_id} · 群内发布于 ${published(s.time)}${item.sources.length>1?` · 另 ${item.sources.length-1} 条来源`:""}`:"来源待核验"}
function badges(item){const box=el("div",undefined,"tag-list");for(const region of item.regions)box.append(el("span",region,"badge region"));for(const tag of item.tags)box.append(el("span",tag,"badge topic"));return box}
function card(item){
  const n=el("article",undefined,"card"),top=el("div",undefined,"card-status"),tags=el("div",undefined,"card-tags");
  n.dataset.readKey="item:"+item.id;
  top.append(el("span",item.kind==="recruiting"?"招聘机会":modes[item.details?.participation]||"活动","badge"),el("span",statuses[item.status]||"待核实",`badge ${item.status||"uncertain"}`));
  tags.append(badges(item),top);
  n.append(el("h3",item.title),tags,el("p",item.summary,"description"));
  for(const [key,label] of Object.entries(detailLabels)){const v=item.details?.[key];if(!v)continue;const row=el("div",undefined,"detail-row");row.append(el("span",label),el("span",v));n.append(row)}
  if(item.personal_relevance)n.append(el("p",item.personal_relevance,"relevance"));
  n.append(links(item));const sources=el("div",undefined,"sources");sources.append(el("div",sourceLead(item),"source-lead"),sourceDetails(item));n.append(sources);return n;
}
function compactList(items){
  const list=el("div",undefined,"compact-list");
  for(const item of items){
    const row=el("article",undefined,"compact-entry"),heading=el("div",undefined,"compact-entry-heading"),d=item.details||{};
    row.dataset.readKey="item:"+item.id;
    heading.append(el("h3",item.title),el("span",statuses[item.status]||"待核实",`badge ${item.status||"uncertain"}`));
    if(modes[d.participation])heading.append(el("span",modes[d.participation],"badge"));
    heading.append(badges(item));
    row.append(heading);
    if(item.summary)row.append(el("p",item.summary,"compact-description"));
    const facts=el("div",undefined,"compact-facts");
    for(const [key,label] of Object.entries(detailLabels)){
      if(!d[key])continue;
      const fact=el("span",undefined,"compact-fact");
      const value=["start_time","end_time","deadline"].includes(key)&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(d[key])&&!Number.isNaN(new Date(d[key]).getTime())?published(d[key]):d[key];
      fact.append(el("span",`${label}：`,"fact-label"),el("span",value));facts.append(fact);
    }
    row.append(facts);
    if(item.links?.length)row.append(links(item,true));
    const sources=el("div",undefined,"compact-sources");sources.append(el("span",sourceLead(item)),sourceDetails(item));row.append(sources);
    list.append(row);
  }
  return list;
}
function excluded(){
  const node=$("excluded-groups");node.replaceChildren();const groups=report?.excluded_groups||[];if(!groups.length)return;
  const matched=groups.filter(x=>x.matched),d=el("details",undefined,"exclusion-panel");
  d.dataset.readKey="excluded";
  d.append(el("summary",`已排除 ${matched.length} 个群${groups.length>matched.length?` · ${groups.length-matched.length} 个配置群未匹配`:""}`));
  d.append(el("p","根据群处理配置与本轮统计生成。","muted"));
  for(const g of groups){const row=el("div",undefined,"exclusion-row");row.append(el("strong",g.name||g.id),el("span",g.reason),el("small",g.matched?(g.message_count==null?"已排除 · 消息数未统计":`已排除 · ${g.message_count} 条`):"未匹配本地群目录"));d.append(row)}node.append(d);
}
function render(){
  const opened=reading.expanded();
  const cards=$("cards"),compact=$("compact-items");cards.replaceChildren();compact.replaceChildren();
  if(!report){cards.append(el("div","这一天尚未生成日报。","empty"));compact.append(el("div","暂无精简内容。","empty compact-empty"));$("filter-count").textContent="";$("card-count").textContent="0";$("compact-count").textContent="0";excluded();return}
  const searching=F.searchTerms(filters.search).length>0;
  const all=(report.items||[]).map(F.normalize),shown=all.filter(x=>F.accepts(x,filters));
  if(searching)shown.sort((a,b)=>F.searchCompare({...a,sources:F.eligibleSources(a,filters)},{...b,sources:F.eligibleSources(b,filters)},filters.search,locationKeywords));
  const full=shown.filter(x=>x.display_mode==="card"),short=shown.filter(x=>x.display_mode==="compact");
  $("filter-count").textContent=`共 ${all.length} 条，当前显示 ${shown.length} 条，隐藏 ${all.length-shown.length} 条${searching?" · 按标题／标签、正文、注释的匹配顺序排列":""}`;
  $("card-count").textContent=full.length;$("compact-count").textContent=short.length;
  if(!full.length)cards.append(el("div",all.length?"当前没有符合条件的卡片。":"本轮尚无线索，请结合读取说明核对。","empty"));
  if(searching){
    if(full.length){const grid=el("div",undefined,"grid");full.forEach(item=>grid.append(card(item)));cards.append(grid)}
    if(short.length)compact.append(compactList(short));else compact.append(el("div","当前没有匹配的精简活动。","empty compact-empty"));
    excluded();reading.expand(opened);return;
  }
  for(const [title,test] of [["",x=>x.status==="open"],["待核实的参加线索",x=>x.status==="uncertain"],["截止与取消更新",x=>["closed","cancelled"].includes(x.status)]]){
    const section=full.filter(test);if(!section.length)continue;let container=cards;
    if(title){const fold=el("details",undefined,"status-section");fold.dataset.readKey="card-status:"+section[0].status;fold.append(el("summary",`${title} · ${section.length}`,"section-title"));cards.append(fold);container=fold}
    const priority=locationKeywords.length?[["",section.filter(x=>F.locationPriority(x,locationKeywords))],["其他活动",section.filter(x=>!F.locationPriority(x,locationKeywords))]]:[["",section]];
    for(const [heading,entries] of priority){if(!entries.length)continue;if(heading)container.append(el("h3",heading,"priority-title"));for(const category of [...new Set(entries.map(x=>x.category))]){const group=entries.filter(x=>x.category===category);container.append(el("h3",`${category} · ${group.length}`,"category-title"));const grid=el("div",undefined,"grid");group.forEach(x=>grid.append(card(x)));container.append(grid)}}
  }
  const open=short.filter(x=>x.status==="open"),other=short.filter(x=>x.status!=="open");if(open.length)compact.append(compactList(open));
  if(other.length){const d=el("details",undefined,"status-section");d.dataset.readKey="compact-status";d.append(el("summary",`待核实与状态更新 · ${other.length}`),compactList(other));compact.append(d)}
  if(!short.length)compact.append(el("div","当前没有符合条件的精简活动。","empty compact-empty"));excluded();reading.expand(opened);
}

function controls(){
  for(const id of ["participation","fee","search","category","region"])$(id).value=filters[id];
}
function choices(){
  for(const [id,values,title] of [["category",(report?.items||[]).map(x=>x.category||"未分类"),"所有分类"],["region",(report?.items||[]).flatMap(F.regions),"所有地域"]]){
    const select=$(id);select.replaceChildren(el("option",title));select.firstChild.value="";
    if(filters[id])values.push(filters[id]);for(const v of [...new Set(values)].sort()){const o=el("option",v);o.value=v;select.append(o)}select.value=filters[id];
  }
}
async function load(date){
  readingReady=false;reading.cancel();
  const saved=reading.read(date);if(saved){filters=F.defaults(saved.filters);controls()}
  const token=++generation;report=null;$("title").textContent=`${date.slice(5).replace("-","月")}日 · 线索`;$("cards").replaceChildren(el("div","正在读取…","empty"));$("compact-items").replaceChildren();$("excluded-groups").replaceChildren();
  for(const id of ["count","groups"])$(id).textContent="—";
  try{
    const r=await fetch(`/api/report?date=${encodeURIComponent(date)}`,{cache:"no-store"});if(token!==generation)return;
    if(r.status===404||r.status===410){$("meta").textContent=r.status===410?"该日期已超过保留期。":"该日期尚未生成日报。";render();return}
    if(!r.ok)throw Error();const data=await r.json();if(token!==generation)return;report=data;
    $("meta").textContent=`${published(report.range_start)} - ${published(report.range_end)}`;
    $("count").textContent=report.items.length;$("groups").textContent=report.coverage?.groups_scanned??"—";
    choices();controls();render();readingReady=true;
    if(saved&&saved.hash===location.hash)reading.restore(saved);else if(location.hash)document.getElementById(location.hash.slice(1))?.scrollIntoView();
  }catch{if(token!==generation)return;$("meta").textContent="日报服务暂时不可用。";$("cards").replaceChildren(el("div","暂时无法读取日报，请稍后刷新。","empty"))}
}
function closeDatePicker(focus=false){
  $("date-options").hidden=true;$("date-toggle").setAttribute("aria-expanded","false");
  if(focus)$("date-toggle").focus({preventScroll:true});
}
function syncDatePicker(){
  $("date-toggle").textContent=$("date").value||"选择日期";
  $("date-options").replaceChildren();
  for(const option of $("date").options){
    const button=el("button",option.textContent);button.type="button";button.tabIndex=-1;
    button.setAttribute("role","option");button.setAttribute("aria-selected",String(option.selected));
    button.addEventListener("click",()=>{
      closeDatePicker(true);
      if($("date").value===option.value)return;
      $("date").value=option.value;$("date").dispatchEvent(new Event("change"));
    });
    $("date-options").append(button);
  }
}
function openDatePicker(){
  if($("date-toggle").disabled)return;
  $("date-options").hidden=false;$("date-toggle").setAttribute("aria-expanded","true");
  const selected=$("date-options").querySelector('[aria-selected="true"]')||$("date-options").firstElementChild;
  selected?.focus({preventScroll:true});selected?.scrollIntoView({block:"nearest"});
}
$("date-toggle").addEventListener("click",()=>$("date-options").hidden?openDatePicker():closeDatePicker());
$("date-toggle").addEventListener("keydown",event=>{
  if(["ArrowDown","ArrowUp"].includes(event.key)){event.preventDefault();openDatePicker()}
});
$("date-options").addEventListener("keydown",event=>{
  if(event.key==="Escape"){event.preventDefault();closeDatePicker(true);return}
  if(event.key==="Tab"){closeDatePicker(true);return}
  const options=[...$("date-options").children],index=options.indexOf(document.activeElement);
  const next={ArrowDown:Math.min(index+1,options.length-1),ArrowUp:Math.max(index-1,0),Home:0,End:options.length-1}[event.key];
  if(next!==undefined){event.preventDefault();options[next]?.focus({preventScroll:true});options[next]?.scrollIntoView({block:"nearest"})}
});
document.addEventListener("pointerdown",event=>{if(!event.target.closest(".date-control"))closeDatePicker()});
document.addEventListener("focusin",event=>{if(!event.target.closest(".date-control"))closeDatePicker()});
async function refreshDates(requested){
  const response=await fetch("/api/days",{cache:"no-store"});if(!response.ok)throw Error("无法更新日报日期列表。");
  const data=await response.json(),chosen=requested||data.latest||data.today;
  $("date").replaceChildren();
  for(const day of data.days){const option=el("option",`${day.date}${day.available?"":" · 未生成"}`);option.value=day.date;$("date").append(option)}
  if(!data.days.some(day=>day.date===chosen)){const option=el("option",chosen+" · 不在当前日期窗口");option.value=chosen;$("date").prepend(option)}
  $("date").value=chosen;syncDatePicker();
}
async function init(){
  try{const r=await fetch("/api/preferences",{cache:"no-store"});if(r.ok){const p=await r.json();configured=F.defaults(p.defaults);locationKeywords=F.words((p.location_keywords||[]).join(","));preferencesLoaded=true}}catch{}
  filters=F.defaults(configured);updateLocationHint();
  choices();controls();
  try{await refreshDates(new URL(location.href).searchParams.get("date"));await load($("date").value)}catch{$("cards").replaceChildren(el("div","无法连接本地日报服务。","empty"))}
}
$("date").addEventListener("change",()=>{syncDatePicker();readingReady=false;reading.cancel();const u=new URL(location.href);u.searchParams.set("date",$("date").value);u.hash="";history.replaceState(null,"",u);load($("date").value)});
for(const id of ["participation","fee","search","category","region"])$(id).addEventListener(id==="search"?"input":"change",()=>{filters[id]=$(id).value;render()});
$("restore-filters").addEventListener("click",()=>{filters=F.defaults(configured);choices();controls();render();$("filter-feedback").textContent=preferencesLoaded?"已重置为设置中的默认筛选。":"未能读取默认设置，已清空当前筛选。"});
$("clear-filters").addEventListener("click",()=>{filters=F.defaults();choices();controls();render();$("filter-feedback").textContent="已显示全部；保存的默认筛选未变。"});


function updateLocationHint(){
  $("location-hint").hidden=!locationKeywords.length;
  $("location-hint").textContent=`优先呈现：${locationKeywords.join("、")}与线上活动。`;
}
function settingsMessage(text,error=false){const node=$("settings-feedback");node.textContent=text;node.className=error?"settings-error":"settings-success"}
function setSettingsBusy(value){settingsBusy=value;$("settings-content").querySelectorAll("button,input,select,textarea").forEach(n=>n.disabled=value);updateGroupPageButtons()}
function fillOptions(id,values,current,title){const select=$(id);select.replaceChildren();const first=el("option",title);first.value="";select.append(first);for(const value of [...new Set([...values,current].filter(Boolean))].sort()){const option=el("option",value);option.value=value;select.append(option)}select.value=current}
function fillSettings(){
  $("location-keywords").value=settings.location_keywords.join("，");
  $("retention-days").value=settings.retention_days;
  $("interests-text").value=settings.interests;
  const defaults=F.defaults(settings.default_filters);
  for(const key of ["kind","participation","fee"])$("default-"+key).value=defaults[key];
  fillOptions("default-category",[...(settings.categories||[]),...(report?.items||[]).map(x=>x.category)],defaults.category,"所有分类");
  fillOptions("default-region",(report?.items||[]).flatMap(F.regions),defaults.region,"所有地域");
  renderSettingGroups();
}
function applySettings(value){
  settings=value;configured=F.defaults(value.default_filters);preferencesLoaded=true;
  locationKeywords=F.words(value.location_keywords.join(","));updateLocationHint();
}
async function openSettings(){
  reading.capture();
  $("settings-view").hidden=false;$("report-view").hidden=true;$("open-settings").hidden=true;$("close-settings").hidden=false;$("date").disabled=true;$("date-toggle").disabled=true;closeDatePicker();
  $("settings-heading").focus();settingsMessage("正在读取设置…");$("settings-content").hidden=true;
  try{const response=await fetch("/api/settings",{cache:"no-store"});if(!response.ok)throw Error("暂时无法读取设置，请返回日报后重试。");applySettings(await response.json());fillSettings();$("settings-content").hidden=false;settingsMessage("")}
  catch(error){settingsMessage(error.message,true)}
}
async function saveSettings(section,value){
  if(settingsBusy||!settings)return false;setSettingsBusy(true);settingsMessage("正在保存…");
  try{
    const response=await fetch("/api/settings",{method:"PATCH",headers:{"Content-Type":"application/json","X-Digest-Settings":"1"},body:JSON.stringify({revision:settings.revision,section,value})});
    const data=await response.json();
    if(!response.ok){if(response.status===409)throw Error("设置已被其他操作更新，或整理任务正在进行。请保留你的修改内容，稍后返回日报再进入设置重试。");throw Error(typeof data.error==="string"?data.error:"保存失败，请检查填写内容后重试。")}
    applySettings(data);
    if(section==="defaults"){filters=F.defaults(configured);choices();controls()}
    if(section==="group"){groupDrafts.delete(value.id);renderSettingGroups()}
    if(section==="retention"){await refreshDates($("date").value);await load($("date").value)}
    render();settingsMessage(["group","interests"].includes(section)?"已保存，将用于未来的整理任务；历史日报保持原样。":"已保存，日报已应用新设置。");return true;
  }catch(error){settingsMessage(error.message,true);return false}
  finally{setSettingsBusy(false)}
}
let groupPage=1,groupPageCount=1;
const groupPageSize=20,groupDrafts=new Map();
function updateGroupPageButtons(){
  $("group-prev").disabled=settingsBusy||groupPage<=1;
  $("group-next").disabled=settingsBusy||groupPage>=groupPageCount;
  $("group-page").disabled=settingsBusy||groupPageCount<=1;
}
function renderSettingGroups(){
  const query=$("group-search").value.trim().normalize("NFKC").toLocaleLowerCase(),mode=$("group-mode-filter").value,groups=settings.groups.filter(g=>(mode==="all"||g.mode===mode)&&[g.name,g.id,...g.tags].join(" ").normalize("NFKC").toLocaleLowerCase().includes(query));
  $("group-settings-count").textContent=`共 ${settings.groups.length} 个群，卡片 ${settings.groups.filter(g=>g.mode==="card").length} 个群，精简 ${settings.groups.filter(g=>g.mode==="compact").length} 个群，忽略 ${settings.groups.filter(g=>g.mode==="exclude").length} 个群`;
  groupPageCount=Math.max(1,Math.ceil(groups.length/groupPageSize));
  groupPage=Math.min(groupPage,groupPageCount);
  $("group-page").replaceChildren();
  for(let page=1;page<=groupPageCount;page++){const option=el("option",`第 ${page} 页`);option.value=page;$("group-page").append(option)}
  $("group-page").value=groupPage;
  $("group-page-count").textContent=`共 ${groupPageCount} 页 · ${groups.length} 个匹配群`;
  updateGroupPageButtons();
  const list=$("group-settings-list");list.replaceChildren();
  if(!groups.length){list.append(el("p","没有匹配的群聊。","muted"));return}
  for(const group of groups.slice((groupPage-1)*groupPageSize,groupPage*groupPageSize)){
    const draft=groupDrafts.get(group.id);
    const row=el("article",undefined,"group-setting"),heading=el("div",undefined,"group-setting-heading");const name=el("h4",group.name||group.id);name.title=group.name||group.id;heading.append(name);
    const switches=el("div",undefined,"mode-switch");switches.setAttribute("role","group");switches.setAttribute("aria-label",`${group.name}的处理方式`);
    const reasonLabel=el("label","忽略原因","group-reason"),reason=el("input");reason.value=draft?.reason??group.reason??"";reason.placeholder="请填写忽略这个群的原因";reason.maxLength=1000;reasonLabel.append(reason);reasonLabel.hidden=group.mode!=="exclude";
    const tagsBox=el("div",undefined,"group-tags"),tags=el("input");tags.value=draft?.tags??group.tags.join("，");tags.placeholder="标签（可选）";tags.setAttribute("aria-label",`${group.name}的群标签`);tags.title="多个标签用逗号分隔";tagsBox.append(tags);
    const feedback=el("p",undefined,"group-feedback");feedback.setAttribute("role","status");
    for(const input of [reason,tags])input.addEventListener("input",()=>groupDrafts.set(group.id,{reason:reason.value,tags:tags.value}));
    function groupValue(mode){return {id:group.id,mode,reason:reason.value.trim(),tags:F.words(tags.value)}}
    for(const [mode,label] of [["card","卡片"],["compact","精简"],["exclude","忽略"]]){
      const button=el("button",label,group.mode===mode?"selected":"");button.setAttribute("aria-pressed",String(group.mode===mode));
      button.addEventListener("click",async()=>{
        if(mode===group.mode)return;
        if(mode==="exclude"&&!reason.value.trim()){reasonLabel.hidden=false;reason.setAttribute("aria-invalid","true");reason.focus();feedback.textContent="填写忽略原因后，再点击“忽略”即可保存。";return}
        reason.removeAttribute("aria-invalid");if(!await saveSettings("group",groupValue(mode)))feedback.textContent=$("settings-feedback").textContent;
      });switches.append(button);
    }
    const save=el("button","保存","group-save");save.title="保存标签与原因";save.setAttribute("aria-label",`保存${group.name}的标签与原因`);
    save.addEventListener("click",async()=>{if(group.mode==="exclude"&&!reason.value.trim()){reason.setAttribute("aria-invalid","true");reason.focus();feedback.textContent="忽略群必须填写原因。";return}if(!await saveSettings("group",groupValue(group.mode)))feedback.textContent=$("settings-feedback").textContent});
    tagsBox.append(save);row.append(heading,switches,tagsBox,reasonLabel,feedback);list.append(row);
  }
}
DigestDisclosure.install();
let navigationFrame=null;
function cancelNavigation(){cancelAnimationFrame(navigationFrame);navigationFrame=null}
for(const event of ["wheel","touchstart","pointerdown","keydown"])window.addEventListener(event,cancelNavigation,{passive:true});
for(const link of document.querySelectorAll(".section-nav a"))link.addEventListener("click",event=>{
  if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  event.preventDefault();cancelNavigation();reading.cancel();
  const target=document.querySelector(link.hash),column=target.querySelector(".animated-disclosure");
  DigestDisclosure.setOpen(column,true,false);
  const start=scrollY,end=Math.max(0,Math.min(start+target.getBoundingClientRect().top-24,document.documentElement.scrollHeight-innerHeight));
  history.replaceState(history.state,"",link.hash);
  if(matchMedia("(prefers-reduced-motion: reduce)").matches){scrollTo({top:end,behavior:"instant"});reading.capture();return}
  const began=performance.now();
  function step(now){
    const progress=Math.min(1,(now-began)/360),eased=1-Math.pow(1-progress,3);
    scrollTo({top:start+(end-start)*eased,behavior:"instant"});
    if(progress<1)navigationFrame=requestAnimationFrame(step);else{navigationFrame=null;reading.capture()}
  }
  navigationFrame=requestAnimationFrame(step);
});
$("open-settings").addEventListener("click",openSettings);
$("close-settings").addEventListener("click",()=>{$("settings-view").hidden=true;$("report-view").hidden=false;$("open-settings").hidden=false;$("close-settings").hidden=true;$("date").disabled=false;$("date-toggle").disabled=false;render();$("open-settings").focus({preventScroll:true});reading.restore(reading.read($("date").value))});
for(const [id,event] of [["group-search","input"],["group-mode-filter","change"]])$(id).addEventListener(event,()=>{groupPage=1;renderSettingGroups()});
$("group-prev").addEventListener("click",()=>{groupPage=Math.max(1,groupPage-1);renderSettingGroups()});
$("group-next").addEventListener("click",()=>{groupPage=Math.min(groupPageCount,groupPage+1);renderSettingGroups()});
$("group-page").addEventListener("change",()=>{groupPage=Number($("group-page").value);renderSettingGroups()});
$("save-retention").addEventListener("click",()=>{
  const input=$("retention-days");if(!input.reportValidity())return;
  saveSettings("retention",input.valueAsNumber);
});
$("save-location").addEventListener("click",()=>saveSettings("location",F.words($("location-keywords").value)));
$("save-interests").addEventListener("click",()=>saveSettings("interests",$("interests-text").value));
$("save-defaults").addEventListener("click",()=>{const value={...settings.default_filters};for(const key of ["kind","participation","fee","category","region"])value[key]=$("default-"+key).value;saveSettings("defaults",value)});
init();
