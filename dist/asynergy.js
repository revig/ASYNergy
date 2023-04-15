var _asynergy=function(){"use strict";function e(t,s){if(!1===s(t))return;let a=t.firstElementChild;for(;a;)e(a,s),a=a.nextElementSibling}function t(e,t,s){var a;return function(){var i=this,n=arguments,l=function(){a=null,s||e.apply(i,n)},r=s&&!a;clearTimeout(a),a=setTimeout(l,t),r&&e.apply(i,n)}}function s(e){return new a(e)}class a{constructor(e){this.el=e,this.directives=this.extractTypeModifiersAndValue()}all(){return this.directives}has(e){return this.directives.map(e=>e.type).includes(e)}missing(e){return!this.has(e)}get(e){return this.directives.find(t=>t.type===e)}extractTypeModifiersAndValue(){return Array.from(this.el.getAttributeNames().filter(e=>e.match(new RegExp("asyn:"))).map(e=>{const[t,...s]=e.replace(new RegExp("asyn:"),"").split(".");return new i(t,s,e,this.el)}))}}class i{constructor(e,t,s,a){this.type=e,this.modifiers=t,this.fullName=s,this.el=a,this.eventContext,this.lcFunc=null,this.emitEvent=!1}setEventContext(e){this.eventContext=e}get isEmitEvent(){return emitEvent}set isEmitEvent(e){"boolean"==typeof e&&(this.emitEvent=e)}get value(){return this.el.getAttribute(this.fullName)}get lcFunction(){if("asyn:mutable"===this.fullName){const e=this.el.getAttribute(this.fullName);-1!==e.search(/\./)&&(this.lcFunc=e.split(".")[1])}return this.lcFunc}get modelValue(){return void 0!==this.el.value?this.el.value:this.el.innerText}get handler(){const{handler:e}=this.parseOutHandlerAndParams(this.value);return e}get params(){const{params:e}=this.parseOutHandlerAndParams(this.value);return e}durationOr(e){let t;const s=this.modifiers.find(e=>e.match(/([0-9]+)ms/)),a=this.modifiers.find(e=>e.match(/([0-9]+)s/));return s?t=Number(s.replace("ms","")):a&&(t=1e3*Number(a.replace("s",""))),t||e}parseOutHandlerAndParams(e){let t=e,s=[];const a=t.match(/(.*?)\((.*)\)/s);if(a){t=a[1],s=new Function("$event",`return (function () {\n              for (var l=arguments.length, p=new Array(l), k=0; k<l; k++) {\n                p[k] = arguments[k];\n              }\n              return [].concat(p);\n            })(${a[2]})`)(this.eventContext)}return{handler:t,params:s}}cardinalDirectionOr(e="right"){return this.modifiers.includes("up")?"up":this.modifiers.includes("down")?"down":this.modifiers.includes("left")?"left":this.modifiers.includes("right")?"right":e}modelSyncDebounce(e,t){this.modelDebounceCallbacks||(this.modelDebounceCallbacks=[]);let s={callback:()=>{}};var a;return this.modelDebounceCallbacks.push(s),i=>{clearTimeout(a),a=setTimeout(()=>{e(i),a=void 0,s.callback=()=>{}},t),s.callback=()=>{clearTimeout(a),e(i)}}}}class n{constructor(e,t=!1){this.el=e,this.skipWatcher=t,this.updateQueue=[]}}class l extends n{constructor(e,t,s,a,i){super(i),this.isCustomEvent=a,this.type="fireEvent",this.name=e,this.payload={modelAttrVal:e,params:t,modelVal:s}}toId(){return btoa(encodeURIComponent(this.type,this.payload.event,JSON.stringify(this.payload.params)))}}function r(e,t,s,a){const i=new CustomEvent(t,s);e.addEventListener(t,a),e.dispatchEvent(i)}class o{constructor(){this.listeners={}}register(e,t){this.listeners[e]||(this.listeners[e]=[]),this.listeners[e].push(t)}call(e,...t){(this.listeners[e]||[]).forEach(e=>{e(...t)})}has(e){return Object.keys(this.listeners).includes(e)}}var d={availableHooks:["agent.initialized","element.initialized","element.updating","element.updated","element.removed","message.sent","message.failed","message.received","message.processed","interceptAsynModelSetValue","interceptAsynModelAttachListener","beforeReplaceState","beforePushState"],bus:new o,register(e,t){if(!this.availableHooks.includes(e))throw`ASYNergy: Referencing unknown hook: [${e}]`;this.bus.register(e,t)},call(e,...t){this.bus.call(e,...t)}};const u={csrf:{},transmissionEls:[],mutables:[],directives:{directives:new o,register(e,t){if(this.has(e))throw`ASYNergy: Directive already registered: [${e}]`;this.directives.register(e,t)},call(e,t,s,a,i){this.directives.call(e,t,s,a,i)},has(e){return this.directives.has(e)}},asynergyIsInBackground:!1,asynergyIsOffline:!1,hooks:d,agents:[],listeners:new o,nodesSetToDisabled:[],nodesSetToReadOnly:[],theAgents(){return Object.keys(this.agents).map(e=>this.agents[e])},registerHook(e,t){this.hooks.register(e,t)},callHook(e,...t){this.hooks.call(e,...t)},addAgent(e){return this.agents.push(e),this.agents[this.agents.length-1]},tearDownAgents(){let e=this.agents.length;for(let t=0;t<e;t++){let e=this.agents.length-1;this.removeAgent(this.agents[e],e)}},emit(e,...t){this.listeners.call(e,...t),this.agentsListeningForEvent(e).forEach(s=>{s.addAction(new l(e,t))})},agentsListeningForEvent(e){return this.theAgents().filter(t=>t.listeners.includes(e))},addEmitEvent(e,t,s,a){let i={};this.on(s,(...n)=>{const l=[];let o;if(l[0]=[],void 0!==n&0!==n.length){if(void 0!==n[0]&0!==n[0].length&&(l[0]=n[0].split(",")),Array.isArray(n)&l[0].toString()===t.toString()){switch(e.type){case"text":void 0!==n[1]&&(e.value=n[1]);break;case"checkbox":case"radio":void 0!==n[2]&&(e.checked=n[2]);break;case"select-multiple":void 0!==n[1]&&(o=n[1].split(",")),void 0!==o&&(i.detail=o);for(const t of e.options)-1!==o.indexOf(t.value)?t.setAttribute("selected","selected"):t.removeAttribute("selected");break;case"submit":if(void 0!==n[1]){const e=n[1].split(",");void 0!==e&&(i.detail=e)}}r(e,s,i,a)}}else r(e,s,i,a)})},on(e,t){this.listeners.register(e,t)},removeAgent(e,t){e.tearDown(),this.agents.splice(t,1)},transmissionElsData(e,t,s){if(void 0!==this.transmissionEls[0]){let a;for(a=0;a<this.transmissionEls.length;a++){const i="checkbox"===this.transmissionEls[a].type,n="radio"===this.transmissionEls[a].type,l=this.transmissionEls[a].mutable>=0;if(i){const t=this.transmissionEls[a].checked;e.transmissionElsData[this.transmissionEls[a].getAttribute("asyn:transmit")]=t?this.transmissionEls[a].value:"false"}else if(n){this.transmissionEls[a].checked&&(e.transmissionElsData[this.transmissionEls[a].getAttribute("asyn:transmit")]=this.transmissionEls[a].value)}else e.transmissionElsData[this.transmissionEls[a].getAttribute("asyn:transmit")]="INPUT"===this.transmissionEls[a].tagName||"TEXTAREA"===this.transmissionEls[a].tagName||"SELECT"===this.transmissionEls[a].tagName?this.transmissionEls[a].value:this.transmissionEls[a].innerHTML,"checkbox"===t&&l&&(e.modelData[s]=this.transmissionEls[a].innerHTML)}}return e},addDisabledNode(e){this.nodesSetToDisabled.push(e)},addReadOnlyNode(e){this.nodesSetToReadOnly.push(e)},clearDisabledReadOnlyNodesArrays(){let e;for(e=0;e<this.nodesSetToDisabled.length;e++)this.nodesSetToDisabled[e].disabled=!1;for(this.nodesSetToDisabled.length=0,e=0;e<this.nodesSetToReadOnly.length;e++)this.nodesSetToReadOnly[e].readOnly=!1;this.nodesSetToReadOnly.length=0},mutabelsData(e){if(void 0!==this.mutables[0]){let t;for(t=0;t<this.mutables.length;t++)e.mutablesData[t]={},e.mutablesData[t].mutableAttrVal=this.mutables[t].value,e.mutablesData[t].el=this.mutables[t].el,e.mutablesData[t].mutableInnerHTML=this.mutables[t].el.innerHTML,e.mutablesData[t].lcFunc=this.mutables[t].lcFunc,e.mutablesData[t].id=this.mutables[t].el.id}else e.mutablesData=null;return e}};class c extends n{constructor(e,t,s,a,i,n=!1){super(i,n),this.isCustomEvent=a,this.type="syncInput",this.name=e,this.payload={modelAttrVal:e,params:t,modelVal:s}}}var h={deferredActions:{},addAction(e,t,s){this.deferredActions[e]||(new c(e,t,s),this.deferredActions[e]=[]),this.deferredActions[e].push(t),this.deferredActions[e].push(s)},get deferredActionsData(){let e={};if(0!==this.deferredActions.length)for(let t in this.deferredActions)if(this.deferredActions.hasOwnProperty(t)){let s=this.deferredActions[t];e[/(?:(\.)).+$/.exec(t)[0].substr(1)]=s[1].value}return e}};class m{constructor(e,t,s,a,i){this.url=e,this.updateEl=t,this.modelAttrVal=s,this.event=i,this.action=this.ajax,this.callback=this.completed_callback,this.headers="",this.asynPayload={},this.mutablesData=[],this.modelEl=a,this.actionType="",this.modelSyncTimeout=1e3,this.isCustomEvent=void 0}completed_callback(e){u.clearDisabledReadOnlyNodesArrays()}ajax(e){const t=e.payload(),s=t.updates[0].payload.modelVal,a=e.agent.el.type,i=t.updates[0].payload.params;if(this.asynPayload={},this.asynPayload.modelData={modelAttrVal:this.modelAttrVal,modelVal:s,modelParams:i},void 0!==u.csrf.tokenName&&""!==u.csrf.token&&(this.asynPayload[u.csrf.tokenName]=u.csrf.token),this.asynPayload.mutablesData=[],this.asynPayload=u.mutabelsData(this.asynPayload),this.mutablesData=this.asynPayload.mutablesData,null!==this.mutablesData){null===this.updateEl&&(this.updateEl=this.mutablesData[0].el);this.mutablesData[0].mutableAttrVal;this.asynPayload.transmissionElsData={},this.asynPayload=u.transmissionElsData(this.asynPayload,a,"modelVal"),this.asynPayload.deferredModelData=h.deferredActionsData,this.asynPayload.actionType=e.updateQueue[0].type,this.actionType=this.asynPayload.actionType,this.asynPayload.isCustomEvent=e.updateQueue[0].isCustomEvent,this.isCustomEvent=this.asynPayload.isCustomEvent,this.asynPayload=JSON.stringify(this.asynPayload),fetch(this.url,{method:"POST",headers:{"Content-Type":"application/json","X-Requested-With":"XMLHttpRequest",Accept:"text/html, application/xhtml+xml","X-ASYNergy":!0,...this.headers,Referer:window.location.href},body:this.asynPayload}).then(t=>{t.ok&&(u.callHook("element.updating",this.updateEl,e.agent,this.event),t.text().then(t=>{const s=JSON.parse(t);Object.values(s.asynergyResponse).forEach(t=>{void 0===t.url?((null===t.mutableVal||"object"==typeof t.mutableVal&&0===Object.keys(t.mutableVal).length)&&(t.mutableVal=""),this.updateEl.updated=0,this.updateMutablesByID(t),this.updateMutablesByAttrVal(t),0===this.updateEl.updated&&(this.updateEl.innerHTML=t.mutableVal),u.callHook("element.updated",this.updateEl,e.agent,this.event),this.syncModels(t),u.callHook("message.processed",this.updateEl,e.agent,this.event)):location=t.url})}))}).then(this.callback(this.updateEl)).catch(e=>{console.error("Error:",e)})}else console.warn("Missing data of any mutable element!")}updateMutablesByID(e){if(""!==e.mutableID&&null!==e.mutableID){const t=e.mutableID;"object"==typeof t?Object.values(t).forEach(t=>{this.updateEl=document.getElementById(`${t}`),"INPUT"===this.updateEl.nodeName?this.updateEl.value=e.mutableVal:this.updateEl.innerHTML=e.mutableVal,this.updateEl.updated=1}):(this.updateEl=document.getElementById(`${t}`),"INPUT"===this.updateEl.nodeName?this.updateEl.value=e.mutableVal:this.updateEl.innerHTML=e.mutableVal,this.updateEl.updated=1)}}updateMutablesByAttrVal(e){if(""!==e.mutableAttrVal&&this.mutablesData.length>0){let t=[],s="";this.mutablesData.forEach(a=>{-1!==a.mutableAttrVal.search(/[.]/)&&(t=/^.+(?=(\.))/.exec(a.mutableAttrVal),s=t[0]),(a.mutableAttrVal===e.mutableAttrVal||a.mutableAttrVal===s||Object.values(e.mutableAttrVal).indexOf(a.mutableAttrVal)>-1)&&(this.updateEl=a.el,"INPUT"===this.updateEl.nodeName?this.updateEl.value=e.mutableVal:this.updateEl.innerHTML=e.mutableVal,this.updateEl.updated=1)})}}syncModels(e){if(""!==e.syncModelID&&null!==e.syncModelID){let t=e.syncModelID;if("syncInput"===this.actionType){let e;const s=document.getElementById(`${t}`),a=this.updateEl,i=this.modelSyncTimeout;"true"!==s.getAttribute("listener")&&(s.value=a.innerHTML),s.addEventListener("input",(function(t){s.setAttribute("listener","true"),clearTimeout(e),e=setTimeout(()=>{s.value=a.innerHTML,s.removeAttribute("listener")},i)}))}else{const t=e.syncModelID;"object"==typeof t?Object.values(t).forEach(t=>{document.getElementById(`${t}`).value=e.mutableVal}):document.getElementById(`${t}`).value=e.mutableVal}}}}var p={allModelElementsInside:e=>Array.from(e.querySelectorAll("[asyn\\:model]")),getByAttributeAndValue:(e,t)=>document.querySelector(`[asyn\\:${e}="${t}"]`),hasAttribute:(e,t)=>e.hasAttribute(`asyn:${t}`),getAttribute:(e,t)=>e.getAttribute(`asyn:${t}`),removeAttribute:(e,t)=>e.removeAttribute(`asyn:${t}`),setAttribute:(e,t,s)=>e.setAttribute(`asyn:${t}`,s),hasFocus:e=>e===document.activeElement,isInput:e=>["INPUT","TEXTAREA","SELECT"].includes(e.tagName.toUpperCase()),isTextInput:e=>["INPUT","TEXTAREA"].includes(e.tagName.toUpperCase())&&!["checkbox","radio"].includes(e.type),valueFromInput(e,t){if("checkbox"===e.type){let a=s(e).get("model").value,i=t.deferredActions[a]?t.deferredActions[a].asynPayload.value:e.checked;return Array.isArray(i)?this.mergeCheckboxValueIntoArray(e,i):!!e.checked&&(e.getAttribute("value")||!0)}return"SELECT"===e.tagName&&e.multiple?this.getSelectValues(e):e.value},mergeCheckboxValueIntoArray:(e,t)=>e.checked?t.includes(e.value)?t:t.concat(e.value):t.filter(t=>t!=e.value),setInputValueFromModel(e,t){const a=s(e).get("model").value,i=get(t.data,a);"input"===e.tagName.toLowerCase()&&"file"===e.type||this.setInputValue(e,i)},setInputValue(e,t){if("radio"===e.type)e.checked=e.value==t;else if("checkbox"===e.type)if(Array.isArray(t)){let s=!1;t.forEach(t=>{t==e.value&&(s=!0)}),e.checked=s}else e.checked=!!t;else"SELECT"===e.tagName?this.updateSelect(e,t):(t=void 0===t?"":t,e.value=t)},getSelectValues:e=>Array.from(e.options).filter(e=>e.selected).map(e=>e.value||e.text),updateSelect(e,t){const s=[].concat(t).map(e=>e+"");Array.from(e.options).forEach(e=>{e.selected=s.includes(e.value)})}};class y extends n{constructor(e,t,s,a,i,n=!1){super(i,n),this.isCustomEvent=a,this.type="callHandler",this.name=e,this.payload={modelAttrVal:e,params:t,modelVal:s}}}class g extends n{constructor(e,t,s,a,i){super(i),this.isCustomEvent=a,this.type="syncInput",this.name=e,this.payload={modelAttrVal:e,params:t,modelVal:s}}}class f{constructor(e,t){this.agent=e,this.updateQueue=t}payload(){return{updates:this.updateQueue.map(e=>({type:e.type,payload:e.payload}))}}}class b{constructor(e,t,s,a){this.el=e,this.updateQueue=[],this.deferredActions={},this.messageInTransit=void 0,this.connection=t,this.postValue=s,this.agentID=a,this.tearDownCallbacks=[],this.scopedListeners=new o,this.listeners=[]}on(e,t){this.scopedListeners.register(e,t)}addAction(e){e instanceof c?this.deferredActions[e.name]=e:(this.updateQueue.push(e),t(this.fireMessage,5).apply(this))}fireMessage(){Object.entries(this.deferredActions).forEach(([e,t])=>{this.updateQueue.unshift(t)}),this.deferredActions={},this.messageInTransit=new f(this,this.updateQueue);(()=>{this.connection.action(this.messageInTransit),u.callHook("message.sent",this.messageInTransit,this),this.updateQueue=[]})()}walk(t,s=(e=>{})){e(this.el,e=>{if(!e.isSameNode(this.el))return!1!==t(e)&&void 0;t(e)})}callAfterModelDebounce(e){this.modelDebounceCallbacks&&this.modelDebounceCallbacks.forEach(e=>{e.callback(),e.callback=()=>{}}),e()}addListenerForTeardown(e){this.tearDownCallbacks.push(e)}tearDown(){this.tearDownCallbacks.forEach(e=>e())}}var v={initialize(e,t){let a=!1;if(s(e).all().forEach(s=>{let i;switch(s.type){case"model":{if(!s.value){console.warn("ASYNergy: [asyn:model] is missing a value.",e);break}let i="",n=s.value.search(/[.]/);if(-1!==n){i=/^.+(?=(\.))/.exec(s.value)[0]}else i=s.value;if(-1!==(n=s.value.search(/[\(]/))){i=/^.+(?=(\())/.exec(s.value)[0]}let l=document.querySelector(`[asyn\\:mutable=${i}]`),r=this.modelAttr(s.fullName,i),o=document.querySelector(`[${r}]`);null!==l?this.attachModelListener(e,s,l,t,o,i):null!==(l=document.querySelector(`[asyn\\:mutable^=${i}\\.]`))?this.attachModelListener(e,s,l,t,o,i):console.warn("ASYNergy: [asyn:model] is missing a corresponding [asyn:mutable] element.",e),a=!0;break}case"mutable":i=s.lcFunction,u.mutables.push(s),a=!1;break;case"transmit":s.el.mutable=e.getAttributeNames().indexOf("asyn:mutable"),u.transmissionEls.push(s.el),a=!0;break;case"csrf":u.csrf.tokenName=s.value,u.csrf.token=e.value,a=!1;break;default:const n=s.params;let l=s.value;0!==n.length&&(l=s.handler);let r=document.querySelector(`[asyn\\:mutable=${l}]`);null===r&&(r=document.querySelector(`[asyn\\:mutable^=${l}\\.]`));let o=this.modelAttr(s.fullName,s.value),d=document.querySelector(`[${o}]`);u.directives.has(s.type)&&u.directives.call(s.type,e,s,r,t),this.attachDomListener(e,s,r,t,d),a=!0}}),!0===a){let t=u.agents.length-1,s=u.agents[t],a=s.connection.event;u.callHook("element.initialized",e,s,a)}a=!1},attachModelListener(e,t,s,a,i,n){const l=t.modifiers.includes("lazy"),r=t.modifiers.includes("debounce");u.callHook("interceptAsynModelAttachListener",t,e,s);let o="select"===e.tagName.toLowerCase()||["checkbox","radio"].includes(e.type)||t.modifiers.includes("lazy")?"change":"input";"input"===e.tagName.toLowerCase()&&t.modifiers.includes("blur")&&(o="blur");const d=new m(a+"/"+n,s,n,i,o);let y=u.agents.length+1,f=u.addAgent(new b(e,d,e.value,y));t.modifiers.includes("defer")&&h.addAction(t.value,e.value,e);let v=((e,s,a)=>e?t.modelSyncDebounce(s,a):s)(r||p.isTextInput(e)&&!l,e=>{let s=t.value,a=t.params,i=e.target;const n=e instanceof CustomEvent;t.emitEvent=!!n;let l=e instanceof CustomEvent&&void 0!==e.detail&&void 0===window.document.documentMode?e.detail||e.target.value:p.valueFromInput(i,f);t.modifiers.includes("defer")?f.addAction(new c(s,a,l,n,i)):f.addAction(new g(s,a,l,n,i))},t.durationOr(150));u.addEmitEvent(e,t.params,t.handler,v),e.addEventListener(o,v),f.addListenerForTeardown(()=>{e.removeEventListener(o,v)}),/^((?!chrome|android).)*safari/i.test(navigator.userAgent)&&e.addEventListener("animationstart",e=>{"asynergyAutofill"===e.animationName&&(e.target.dispatchEvent(new Event("change",{bubbles:!0})),e.target.dispatchEvent(new Event("input",{bubbles:!0})))})},attachDomListener(e,t,s,a,i){switch(t.type){case"keydown":case"keyup":this.attachListener(e,t,e=>{const s=["ctrl","shift","alt","meta","cmd","super"].filter(e=>t.modifiers.includes(e));if(s.length>0){if(s.filter(t=>("cmd"!==t&&"super"!==t||(t="meta"),!e[`${t}Key`])).length>0)return!1}if(32===e.keyCode||" "===e.key||"Spacebar"===e.key)return t.modifiers.includes("space");let a=t.modifiers.filter(e=>!e.match(/^debounce$/)&&!e.match(/^[0-9]+m?s$/));return Boolean(0===a.length||e.key&&a.includes(function(e){return e.replace(/([a-z])([A-Z])/g,"$1-$2").replace(/[_\s]/,"-").toLowerCase()}(e.key)))},s,a,i);break;case"click":this.attachListener(e,t,s=>{if(t.modifiers.includes("self"))return e.isSameNode(s.target)},s,a,i);break;default:this.attachListener(e,t,t=>e===t.target,s,a,i)}},attachListener(e,s,a,i,n,l){const r=s.type,o=s.handler,d=new m(n+"/"+o,i,o,l,r);let c=u.agents.length+1,h=u.addAgent(new b(e,d,(()=>void 0!==e.value?e.value:e.innerText)(),c));const p=e=>{if(a&&!1===a(e))return;const t=e instanceof CustomEvent;h.callAfterModelDebounce(()=>{const a=e.target;s.setEventContext(e),this.preventAndStop(e,s.modifiers);const i=s.handler;let n=s.params,l=s.modelValue;t?(s.emitEvent=!0,void 0!==e.detail&&(l=e.detail)):s.emitEvent=!1,0===n.length&&t&&e.detail&&n.push(e.detail),s.value&&h.addAction(new y(i,n,l,t,a))})},g=((e,s,a)=>e?t(s,a):s)(s.modifiers.includes("debounce"),p,s.durationOr(150));u.addEmitEvent(e,s.params,s.handler,p),e.addEventListener(r,g),h.addListenerForTeardown(()=>{e.removeEventListener(r,g)})},preventAndStop(e,t){t.includes("prevent")&&e.preventDefault(),t.includes("stop")&&e.stopPropagation()},modelAttr(e,t){return this.escapedStr(e)+'="'+this.escapedStr(t)+'"'},escapedStr(e){let t=e;return t=t.replace(/\:|\.|"|'/gi,(function(e){return"\\"+e}))}};let E={};function A(e){if(E[e.agentID])for(;E[e.agentID].length>0;)E[e.agentID].shift()()}
/*!
    * ASYNergy
    *
    * revIgniter JavaScript application *
    * inspired by and adopted from Livewire *
    * a framework for making network requests *
    * and changing things on the page *
    * Version 0.1.0 *
    *
    * Author: Ralf Bitter, rabit@revigniter.com
    *
    */
class k{constructor(){this.appVersion="1.0.0",this.agents=u,this.URL=""}get version(){return this.appVersion}set theURL(e){this.URL=e}get theURL(){return this.URL}hook(e,t){this.agents.registerHook(e,t)}emit(e,...t){this.agents.emit(e,...t)}on(e,t){this.agents.on(e,t)}stop(){this.agents.tearDownAgents()}start(){const t=""!==this.URL?this.URL:window.location.href,s=document.body;document.addEventListener("visibilitychange",()=>{u.asynergyIsInBackground=document.hidden},!1),window.addEventListener("offline",()=>{u.asynergyIsOffline=!0}),window.addEventListener("online",()=>{u.asynergyIsOffline=!1}),e(s,e=>{v.initialize(e,t)})}}return window.ASYNergy||(window.ASYNergy=k),u.registerHook("agent.initialized",e=>{e.targetedLoadingElsByAction={},e.genericLoadingEls=[],e.currentlyActiveLoadingEls=[],e.currentlyActiveUploadLoadingEls=[]}),u.registerHook("element.initialized",(e,t)=>{let a=s(e);a.missing("loading")||a.directives.filter(e=>"loading"===e.type)}),u.registerHook("message.sent",(e,t)=>{e.updateQueue.filter(e=>"callHandler"===e.type).map(e=>e.payload.modelAttrVal),e.updateQueue.filter(e=>"callHandler"===e.type).map(e=>(function(e,t){return e+btoa(encodeURIComponent(e.toString()))})(e.payload.modelAttrVal,e.payload.params)),e.updateQueue.filter(e=>"syncInput"===e.type).map(e=>{let t=e.payload.modelAttrVal;if(!t.includes("."))return t;let s=[];return s.push(t.split(".").reduce((e,t)=>(s.push(e),e+"."+t))),s}).flat()}),u.registerHook("element.initialized",(e,t)=>{s(e).missing("submit")||e.addEventListener("submit",()=>{E[t.agentID]=[],t.walk(s=>{if(e.contains(s))return!s.hasAttribute("asyn:ignore")&&void("button"===s.tagName.toLowerCase()&&"submit"===s.type||"select"===s.tagName.toLowerCase()||"input"===s.tagName.toLowerCase()&&("checkbox"===s.type||"radio"===s.type)?(s.disabled||E[t.agentID].push(()=>s.disabled=!1),s.disabled=!0,u.addDisabledNode(s)):"input"!==s.tagName.toLowerCase()&&"textarea"!==s.tagName.toLowerCase()||(s.readOnly||E[t.agentID].push(()=>s.readOnly=!1),s.readOnly=!0,u.addReadOnlyNode(s)))})})}),u.registerHook("message.failed",(e,t)=>A(t)),u.registerHook("message.received",(e,t)=>A(t)),u.registerHook("element.initialized",(e,t)=>{if(void 0===s(e).get("poll"))return;let a=function(e,t){let a=s(e).get("poll").durationOr(2e3);return setInterval(()=>{if(!1===e.isConnected)return;const a=s(e).get("poll");if(void 0===a)return;const i=a.handler||"refresh";u.asynergyIsInBackground&&!a.modifiers.includes("keep-alive")&&Math.random()<.95||a.modifiers.includes("visible")&&!function(e){var t=e.getBoundingClientRect();return t.top<(window.innerHeight||document.documentElement.clientHeight)&&t.left<(window.innerWidth||document.documentElement.clientWidth)&&t.bottom>0&&t.right>0}(a.el)||u.asynergyIsOffline||t.addAction(new y(i,a.params,a.modelValue,a.emitEvent,e))},a)}(e,t);t.addListenerForTeardown(()=>{clearInterval(a)}),e.__asynergy_polling_interval=a}),k}();
//# sourceMappingURL=asynergy.js.map