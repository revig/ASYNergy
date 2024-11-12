import EventAction from './action/event';  // ----------------------- temp test events
import { dispatch } from './util/dispatch'; // ------------------------------ temp test events
import HookManager from './HookManager';
import MessageBus from './MessageBus'; // -------- temp test events
import DirectiveManager from './DirectiveManager';
// import Agent from './agent/index';

const store = {
    csrf: {},
    transmissionEls: [],
    mutables: [],
    directives: DirectiveManager,
    asynergyIsInBackground: false,
    asynergyIsOffline: false,
    hooks: HookManager,
    agents: [],
    listeners: new MessageBus(),
    nodesSetToDisabled: [],
    nodesSetToReadOnly: [],
    mutableIncludesModel: false,

    theAgents() {
      return Object.keys(this.agents).map(key => {
        return this.agents[key];
      });
    },

    registerHook(name, callback) {
        this.hooks.register(name, callback);
    },

    callHook(name, ...params) {
        this.hooks.call(name, ...params);
    },

    addAgent(agent) {
        this.agents.push(agent);
        return this.agents[this.agents.length - 1];
    },

    getAgentsByID(agentID) {
      return this.agents.filter(agent => {
        return agent.agentID === agentID;
      });
    },

    tearDownAgents() {
        let agentsLength = this.agents.length;
        for (let i = 0; i < agentsLength; i++) {
            let index = this.agents.length - 1;
            this.removeAgent(this.agents[index], index);
        }
    },

    emit(event, ...params) {
      this.listeners.call(event, ...params);
        this.agentsListeningForEvent(event).forEach(agent => {
          agent.addAction(new EventAction(event, params));
        });
    },

    agentsListeningForEvent(event) {
        return this.theAgents().filter(agent => {
          return agent.listeners.includes(event);
        });
    },
    
    addEmitEvent(el, directiveParams, handlerName, handler) {
      let options = {};
      const eventHandler = (...paramsA) => {
        
        const modelParams = [];
        modelParams[0] = [];
        let selectValues;
        
        if (paramsA !== undefined & paramsA.length !== 0) {
          if (paramsA[0] !== undefined & paramsA[0].length !== 0) {
            modelParams[0] = paramsA[0].split(',');
          }

          if (Array.isArray(paramsA) & (modelParams[0].toString() === directiveParams.toString())) {
            
            switch(el.type) {             
              case 'text':
                if (paramsA[1] !== undefined) {
                  el.value = paramsA[1];
                }

                break;
              
              case 'checkbox':
                if (paramsA[2] !== undefined) {
                  el.checked = paramsA[2];
                }
                
                break;
						
              case 'radio':
                if (paramsA[2] !== undefined) {
                  el.checked = paramsA[2];
                }
                
                break;

              case 'range':
                if (paramsA[1] !== undefined) {
                  el.value = paramsA[1];
                }
                
                break;
                
              case 'select-multiple':
                if (paramsA[1] !== undefined) {
                  selectValues = paramsA[1].split(',');
                }
                
                if (selectValues !== undefined) {
                  options.detail = selectValues;
                }

                for (const option of el.options) {
                  if (selectValues.indexOf(option.value) !== -1) {
                    option.setAttribute('selected', 'selected');
                  } else {
                    option.removeAttribute('selected');
                  }
                }
                
                break;

              case 'submit':
                if ( paramsA[1] !== undefined) {
                  const modelValue = paramsA[1].split(',');
                
                  if (modelValue !== undefined) {
                    options.detail = modelValue;
                  }
                }
                
                break;
            }

            dispatch(el, handlerName, options, handler);
          }
        } else { // if (paramsA !== undefined)
          dispatch(el, handlerName, options, handler);
        }
      };
      this.on(handlerName, eventHandler);
    },

    on(event, callback) {
      this.listeners.register(event, callback);
    },

    removeAgent(agent, index) {
        // Remove event listeners attached to the DOM.
        agent.tearDown();
        // Remove the component from the store.
        // delete this.agents[index];
        this.agents.splice(index, 1);
    },

      transmissionElsData(payload, listenerType, modelValueKey) {
          if (this.transmissionEls[0] !== undefined) {
            let index;
            for (index = 0; index < this.transmissionEls.length; index++) {
              if (this.transmissionEls[index].getAttribute('asyn:transmit') !== null) {

                const transmissionElIsCheckbox = this.transmissionEls[index].type === 'checkbox';
							const transmissionElIsRadio = this.transmissionEls[index].type === 'radio';
                const transmissionElIsMutable = this.transmissionEls[index].mutable >= 0;
							
                if (transmissionElIsCheckbox) {
                    const isChecked = this.transmissionEls[index].checked;
                    payload.transmissionElsData[this.transmissionEls[index].getAttribute('asyn:transmit')] = isChecked ? this.transmissionEls[index].value : 'false';
							
	              } else if (transmissionElIsRadio) {
	                  const isChecked = this.transmissionEls[index].checked;
	                  if (isChecked) {
	                      payload.transmissionElsData[this.transmissionEls[index].getAttribute('asyn:transmit')] = this.transmissionEls[index].value;
	                  }
							
                } else {
                    payload.transmissionElsData[this.transmissionEls[index].getAttribute('asyn:transmit')] = (this.transmissionEls[index].tagName === 'INPUT') || (this.transmissionEls[index].tagName === 'TEXTAREA') || (this.transmissionEls[index].tagName === 'SELECT') ? this.transmissionEls[index].value : this.transmissionEls[index].innerHTML;

                    // REPLACE CHECKBOX MODEL VALUE WITH MUTABLE ELEMENT DATA
                    if (listenerType === 'checkbox' && transmissionElIsMutable) {
                        payload.modelData[modelValueKey] = this.transmissionEls[index].innerHTML;
                    }

                }
              }
            }
        }
        return payload;
    },

    addDisabledNode(theNode) {
      this.nodesSetToDisabled.push(theNode);
    },

    addReadOnlyNode(theNode) {
      this.nodesSetToReadOnly.push(theNode);
    },

    clearDisabledReadOnlyNodesArrays() {
      let index;

      for (index = 0; index < this.nodesSetToDisabled.length; index++) {
        this.nodesSetToDisabled[index].disabled = false;
      }
      this.nodesSetToDisabled.length = 0;

      for (index = 0; index < this.nodesSetToReadOnly.length; index++) {
        this.nodesSetToReadOnly[index].readOnly = false;
      }
      this.nodesSetToReadOnly.length = 0;
    },

    mutabelsData(payload) {
      if (this.mutables[0] !== undefined) {
        let index;
        for (index = 0; index < this.mutables.length; index++) {

          payload.mutablesData[index] = {};
          payload.mutablesData[index].mutableAttrVal = this.mutables[index].value;
          payload.mutablesData[index].el = this.mutables[index].el;
          payload.mutablesData[index].mutableInnerHTML = this.mutables[index].el.innerHTML;
          payload.mutablesData[index].lcFunc = this.mutables[index].lcFunc;
          payload.mutablesData[index].id = this.mutables[index].el.id;
        }
      } else {
        payload.mutablesData = null;
      }
      
      return payload;
    }
};

export default store;
