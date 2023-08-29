import { debounce } from './util/debounce';
import { kebabCase } from './util';
import { asynDirectives } from './util/asynDirectives';
import Connection from './connection/index';
import DOM from './dom/dom';
import HandlerAction from './action/handler';
import store from './Store';
import ModelAction from './action/model';
import DeferredModelAction from './action/deferred-model';
import Deferred from './action/Deferred';
import Agent from './agent/index';

export default {

    initialize(el, url, reregisterEvl) {
        let isAgent = false;
        asynDirectives(el).all().forEach(directive => {
            let test;
            let lcFunc;
            switch (directive.type) {

            case 'model': {
                if (!directive.value) {
                    console.warn('ASYNergy: [asyn:model] is missing a value.', el);

                    break;
                }

                // CHECK FOR COMPUND MODEL ATTRIBUTE VALUE, USE THE PREFIX
                // TO CHECK IF THERE IS A CORRESPONDING MUTABLE ELEMENT
                let directiveVal = '';
                let compoundAttrVal = directive.value.search(/[.]/);
                if (compoundAttrVal !== -1) {
                    const dirValPrefix = /^.+(?=(\.))/.exec(directive.value);
                    directiveVal = dirValPrefix[0];
                } else {
                    directiveVal = directive.value;
                }
							
                // GET RID OF THE MODEL PARAMETERS
                compoundAttrVal = directive.value.search(/[\(]/);
                
                if (compoundAttrVal !== -1) {
                  const dirVal = /^.+(?=(\())/.exec(directive.value);
                  directiveVal = dirVal[0];
                }

                let mutableElem = document.querySelector(`[asyn\\:mutable=${directiveVal}]`);

                // GET ATTRIBUTE
                let attr = this.modelAttr(directive.fullName, directiveVal);               
                let modelElem = document.querySelector(`[${attr}]`);

                if (mutableElem !== null) {
                  this.attachModelListener(el, directive, mutableElem, url, modelElem, directiveVal);
                } else {
                    mutableElem = document.querySelector(`[asyn\\:mutable^=${directiveVal}\\.]`);
                    if (mutableElem !== null) {
                      this.attachModelListener(el, directive, mutableElem, url, modelElem, directiveVal);
                    } else {
                        console.warn(
                        'ASYNergy: [asyn:model] is missing a corresponding [asyn:mutable] element.',
                        el);
                    }
                }

                test = 'model';
                isAgent = true;
                break;
            }

            case 'mutable':
              if (reregisterEvl !== true) {

                if ((typeof directive.el.innerHTML === "string") && (directive.el.innerHTML.search(/asyn:/)) !== -1) {
                  store.mutableIncludesModel = true;
                }

                lcFunc = directive.lcFunction;
                store.mutables.push(directive);

                test = 'mutable';
                isAgent = false;
              }
            break;

            case 'transmit':
                // CHECK IF ELEMENT IS A MUTABLE ELEMENT, NEEDED TO
                // REPLACE A MODEL CHECKBOX VALUE WITH THE MODEL INPUT VALUE
                directive.el.mutable = el.getAttributeNames().indexOf('asyn:mutable');

                store.transmissionEls.push(directive.el);

                test = 'transmit';
                isAgent = true;
                break;

            case 'csrf':
                store.csrf.tokenName = directive.value;
                store.csrf.token = el.value;

                test = 'csrf';
                isAgent = false;
                break;

            default:
              const params = directive.params;
              let handler = directive.value;
              if (params.length !== 0) {
                handler = directive.handler;
              }

                let mutableElem = document.querySelector(`[asyn\\:mutable=${handler}]`);
                if (mutableElem === null) {
                    mutableElem = document.querySelector(`[asyn\\:mutable^=${handler}\\.]`);
                }

                // GET ATTRIBUTE
                let attr = this.modelAttr(directive.fullName, directive.value);
                let modelElem = document.querySelector(`[${attr}]`);

                if (store.directives.has(directive.type)) {
                    store.directives.call(
                      directive.type,
                      el,
                      directive,
                      mutableElem,
                      url
                          );
                }

                this.attachDomListener(el, directive, mutableElem, url, modelElem);

                test = 'default';
                isAgent = true;
                break;
        }

        });

        if (isAgent === true) {
            let index = store.agents.length - 1;
            let theAgent = store.agents[index];
            let eventType = theAgent.connection.event;
            store.callHook('element.initialized', el, theAgent, eventType);
        }
        isAgent = false;
    },

    attachModelListener(el, directive, mutableEl, url, modelEl, modelAttrVal) {
        const isLazy = directive.modifiers.includes('lazy');

        const debounceIf = (condition, callback, time) =>
          condition ? directive.modelSyncDebounce(callback, time) : callback;

        const hasDebounceModifier = directive.modifiers.includes('debounce');

      store.callHook('interceptAsynModelAttachListener', directive, el, mutableEl);

        let event = el.tagName.toLowerCase() === 'select'
        || ['checkbox', 'radio'].includes(el.type)
        || directive.modifiers.includes('lazy') ? 'change' : 'input';
        
        if (el.tagName.toLowerCase() === 'input' && directive.modifiers.includes('blur')) {
          event = 'blur';
        }

        let model = modelAttrVal;

        // TODO check for trailing slashes
        const handlerURL = url + '/' + model;
      const initConnection = new Connection(handlerURL, mutableEl, model, modelEl, event);

        const connect = {
            sendMessage: function () {
                // INPUT FIELD VALUE
                let postValue = el.value;
                initConnection.action(postValue);
            }
        };

        let agentID = store.agents.length + 1;
        let agent = store.addAgent(new Agent(el, initConnection, el.value, agentID));

        if (directive.modifiers.includes('defer')) {
            Deferred.addAction(directive.value, el.value, el);
        }

        // If it's a text input and not .lazy, debounce, otherwise fire immediately.
        let handler = debounceIf(hasDebounceModifier || (DOM.isTextInput(el) && !isLazy), e => {
            let model = directive.value;
            let params = directive.params;
            let el = e.target;

            const isCustomEvent = e instanceof CustomEvent;

            isCustomEvent ? directive.emitEvent = true : directive.emitEvent = false;

            let modelVal = e instanceof CustomEvent
                // We have to check for typeof e.detail here for IE 11.
                && typeof e.detail != 'undefined'
                && typeof window.document.documentMode == 'undefined'
                    // With autofill in Safari, Safari triggers a custom event and assigns
                    // the value to e.target.value, so we need to check for that value as well.
                    ? e.detail || e.target.value
                    : DOM.valueFromInput(el, agent);

            if (directive.modifiers.includes('defer')) {
                agent.addAction(new DeferredModelAction(model, params, modelVal, isCustomEvent, el));
            } else {
                agent.addAction(new ModelAction(model, params, modelVal, isCustomEvent, el));
            }
        }, directive.durationOr(150));

        store.addEmitEvent(el, directive.params, directive.handler, handler);

        el.addEventListener(event, handler);

        agent.addListenerForTeardown(() => {
          el.removeEventListener(event, handler);
        });

        // Taken from: https://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser
      let isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

        // Safari is weird and doesn't properly fire input events when
        // a user "autofills" a asyn:model(.lazy) field. So we are
        // firing them manually for assurance.
      isSafari && el.addEventListener('animationstart', e => {
        if (e.animationName !== 'asynergyAutofill') {
          return;
        }

        e.target.dispatchEvent(new Event('change', { bubbles: true }));
        e.target.dispatchEvent(new Event('input', { bubbles: true }));
      });
    },

    attachDomListener(el, directive, mutableEl, url, modelEl) {
        switch (directive.type) {
        case 'keydown':
        case 'keyup':

            this.attachListener(el, directive, e => {
                // Detect system modifier key combinations if specified.
                const systemKeyModifiers = [
                 'ctrl',
                 'shift',
                 'alt',
                 'meta',
                 'cmd',
                 'super'
                ];
                const selectedSystemKeyModifiers = systemKeyModifiers.filter(
                       key => directive.modifiers.includes(key)
                   );

                if (selectedSystemKeyModifiers.length > 0) {
                    const selectedButNotPressedKeyModifiers = selectedSystemKeyModifiers.filter(
                      key => {
                                // Alias "cmd" and "super" to "meta"
                                if (key === 'cmd' || key === 'super') {
                                    key = 'meta';
                                }
                                return !e[`${key}Key`];
                            }
                       );

                    if (selectedButNotPressedKeyModifiers.length > 0) {
                        return false;
                    }
                }

                // Handle spacebar
                if (e.keyCode === 32 || (e.key === ' ' || e.key === 'Spacebar')) {
                    return directive.modifiers.includes('space');
                }

                // Strip 'debounce' modifier and time modifiers from modifiers list
                let modifiers = directive.modifiers.filter(modifier =>
                        (
                           !modifier.match(/^debounce$/) &&
                           !modifier.match(/^[0-9]+m?s$/)
                       )
                   );

                // Only handle listener if no, or matching key modifiers are passed.
                // It's important to check that e.key exists - OnePassword's extension
                // does weird things.
                return Boolean(modifiers.length ===
                  0 || (e.key && modifiers.includes(kebabCase(e.key))));
            }, mutableEl, url, modelEl);

            break;
        case 'click':

            this.attachListener(el, directive, e => {
                // We only care about elements that have the .self modifier on them.
                if (!directive.modifiers.includes('self')) {
                    return;
                }

                // This ensures a listener is only run if the event originated
                // on the elemenet that registered it (not children).
                // This is useful for things like modal back-drop listeners.
              return el.isSameNode(e.target);
            }, mutableEl, url, modelEl);

            break;
        default:
            this.attachListener(el, directive, e => el === e.target, mutableEl, url, modelEl);
            break;
    			}
    },

    attachListener(el, directive, callback, mutableEl, url, modelEl) {
        const event = directive.type;
        const model = directive.handler;

        // TODO check for trailing slashes
        const handlerURL = url + '/' + model;

        const initConnection = new Connection(handlerURL, mutableEl, model, modelEl, event);

        let postValue = () => {
            return el.value !== undefined ? el.value : el.innerText;
        };

        let agentID = store.agents.length + 1;
        let agent = store.addAgent(new Agent(el, initConnection, postValue(), agentID));

        const handler = e => {
            if (callback && callback(e) === false) {
                return;
            }
            
            const isCustomEvent = e instanceof CustomEvent;

          agent.callAfterModelDebounce(() => {
            const el = e.target;

            directive.setEventContext(e);

            // This is outside the conditional below so "asyn:click.prevent"
            // without a value still prevents default.
            this.preventAndStop(e, directive.modifiers);
            const handler = directive.handler;
            let params = directive.params;
            let modelVal = directive.modelValue;

            if (isCustomEvent) {
              directive.emitEvent = true;
              if (e.detail !== undefined) {
                modelVal = e.detail;
              }
            } else {
              directive.emitEvent = false;
            }

            if (
              params.length === 0 &&
              isCustomEvent &&
              e.detail
            ) {
              params.push(e.detail);
            }

            if (directive.value) {
              agent.addAction(new HandlerAction(handler, params, modelVal, isCustomEvent, el));
            }

          });
        };

        const debounceIf = (condition, callback, time) =>
          condition ? debounce(callback, time) : callback;

        const hasDebounceModifier = directive.modifiers.includes('debounce');
        const debouncedHandler = debounceIf(
           hasDebounceModifier,
           handler,
           directive.durationOr(150)
        );

        store.addEmitEvent(el, directive.params, directive.handler, handler);

        el.addEventListener(event, debouncedHandler);

        agent.addListenerForTeardown(() => {
          el.removeEventListener(event, debouncedHandler);
        });
    },
    
    preventAndStop(event, modifiers) {
      modifiers.includes('prevent') && event.preventDefault();
      modifiers.includes('stop') && event.stopPropagation();
    },

    modelAttr(fullName, attrVal) {
      let escFullName = this.escapedStr(fullName);
      let escAttrVal = this.escapedStr(attrVal);
      let attr = escFullName + "=" + "\"" + escAttrVal + "\"";
      return attr;
    },
    
    escapedStr(str) {
      let escapedStr = str;
      escapedStr = escapedStr.replace(/\:|\.|"|'/gi, function (x) {
        return "\\" + x;
      });
      return escapedStr;
    }
};
