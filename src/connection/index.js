import store from '../Store';
import Deferred from '../action/Deferred';

export default class Connection {
  constructor(URL, updateEl, modelAttrVal, modelEl, event) {
        this.url = URL;
        this.updateEl = updateEl;
        // this.postKey = postKey;
        this.modelAttrVal = modelAttrVal;
        this.event = event;
        this.action = this.ajax;
        this.callback = this.completed_callback;
        this.headers = '';
      this.asynPayload = {};
      this.mutablesData = [];
      this.modelEl = modelEl;
      this.actionType = '';
      this.modelSyncTimeout = 1000;
      this.isCustomEvent = undefined;
			this.reregisterEvLis = false;
    }
		
		
    onMessage(message, payload) {
      message.agent.receiveMessage(message, payload);
    }
    
    handleResponse(event, agent, responseObj, fetchedResponse) {
      if (fetchedResponse !== true) {
        this.event = event;
        this.updateEl = agent.connection.updateEl;
      };
      
      store.callHook('element.updating', this.updateEl, agent, event);

      Object.values(responseObj.asynergyResponse).forEach(respItem => {
        if (respItem.url !== undefined) {
          location = respItem.url;
          return;
        }

        if ((respItem.mutableVal === null) || (typeof(respItem.mutableVal) === "object") &&
        (Object.keys(respItem.mutableVal).length === 0)) {
          respItem.mutableVal = "";
        }

        if ((typeof respItem.mutableVal === "string") && (respItem.mutableVal.search(/asyn:/)) !== -1) {
          this.reregisterEvLis = true;
        }

        this.updateEl.updated = 0;

        this.updateMutablesByID(respItem);
                
        this.updateMutablesByAttrVal(respItem);
                
        if (this.updateEl.updated === 0) {
          this.updateEl.innerHTML = respItem.mutableVal;
        }
                  
        store.callHook('element.updated', this.updateEl, agent, this.event);
                
        this.syncModels(respItem);

        store.callHook('message.processed', this.updateEl, agent, this.event);

      });

      if (this.reregisterEvLis === true) {
        ASYNergy.reregisterEventListeners();
      };

    }
		

    // FETCH COMPLETED ACTION //
    completed_callback(msg) {
			store.clearDisabledReadOnlyNodesArrays();
			store.callHook('allMessages.processed', msg);
    }
    

    ajax(message) {
        const payload = message.payload();
        const modelVal = payload.updates[0].payload.modelVal;
        const listenerType = message.agent.el.type;
        const modelParams = payload.updates[0].payload.params;

        this.asynPayload = {};

        this.asynPayload.modelData = {'modelAttrVal': this.modelAttrVal, 'modelVal': modelVal, 'modelParams': modelParams};

        // CSRF
        if (store.csrf.tokenName !== undefined && store.csrf.token !== '') {
            this.asynPayload[store.csrf.tokenName] = store.csrf.token;
        }
        
        // GET MUTABLE ELEMENTS DATA
        this.asynPayload.mutablesData = [];
        this.asynPayload = store.mutabelsData(this.asynPayload);
        this.mutablesData = this.asynPayload.mutablesData;
        
        if (this.mutablesData === null) {
          console.warn("Missing data of any mutable element!");
          return;
        }
        
        if (this.updateEl === null) {
          this.updateEl = this.mutablesData[0].el;
        }
        let index;

        var mutableAttrVal = this.mutablesData[0].mutableAttrVal;

        // GET TRANSMISSION ELEMENTS DATA
        this.asynPayload.transmissionElsData = {};
        this.asynPayload = store.transmissionElsData(this.asynPayload, listenerType, 'modelVal');

        // GET DEFERRED MODEL ACTIONS
        this.asynPayload.deferredModelData = Deferred.deferredActionsData;

        this.asynPayload.actionType = message.updateQueue[0].type;
        this.actionType = this.asynPayload.actionType;
        
        this.asynPayload.isCustomEvent = message.updateQueue[0].isCustomEvent;
        this.isCustomEvent = this.asynPayload.isCustomEvent;

        this.asynPayload = JSON.stringify(this.asynPayload);


        fetch(this.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'text/html, application/xhtml+xml',
                'X-ASYNergy': true,

                // SET CUSTOM HEADERS
                ...(this.headers),

                // WE'LL SET THIS EXPLICITLY TO MITIGATE POTENTIAL
                // INTERFERENCE FROM AD-BLOCKERS/ETC.
                'Referer': window.location.href
            },
            body: this.asynPayload
        })   
        .then(response => {
            if (response.ok) {

              response.text().then(response => {

                const responseObj = JSON.parse(response);

                this.onMessage(message, responseObj);
                
                const fetchedResponse = true;
                
                this.handleResponse(event, message.agent, responseObj, fetchedResponse);

                this.callback(message);

              });
            }
        })
        
        .catch((error) => {
            console.error(error);
          });
    }
    
    // IF THE RESPONSE INCLUDES IDs OF MUTABLE ELEMENTS
    // UPDATE ALL APPROPRIATE ELEMENTS
    updateMutablesByID (responseObj) {
      if ((responseObj.mutableID !== "") && 
      (responseObj.mutableID !== null)) {
        const mutableID = responseObj.mutableID;
        
        if (typeof(mutableID) === "object") {
          Object.values(mutableID).forEach(theID => {
            this.updateEl = document.getElementById(`${theID}`);

            this.updateEl.nodeName === "INPUT" ? this.updateEl.value = responseObj.mutableVal : this.updateEl.innerHTML = responseObj.mutableVal;
            this.updateEl.updated = 1;
          });
        } else {
          this.updateEl = document.getElementById(`${mutableID}`);
          this.updateEl.nodeName === "INPUT" ? this.updateEl.value = responseObj.mutableVal : this.updateEl.innerHTML = responseObj.mutableVal;

          this.updateEl.updated = 1;
        }
      }
    }

    // IF MULTIPLE MUTABLE ELEMENTS ARE SPECIFIED BY MUTABLE
    // ATTRIBUTE VALUES IN THE RESPONSE, UPDATE ALL MUTABLE
    // ELEMENTS THAT HAVE THE APPROPRIATE MUTABLE ATTRIBUTE VALUE
    updateMutablesByAttrVal(responseObj) {
      if (responseObj.mutableAttrVal !== "") {
        if (this.mutablesData.length > 0) {
          let attrValFragments = [];
          let attrValPrefix = '';
          this.mutablesData.forEach(mutable => {
            const compoundAttrVal = mutable.mutableAttrVal.search(/[.]/);
            if (compoundAttrVal !== -1) {
              attrValFragments = /^.+(?=(\.))/.exec(mutable.mutableAttrVal);
              attrValPrefix = attrValFragments[0];
            }

            if ((mutable.mutableAttrVal === responseObj.mutableAttrVal) || 
                (mutable.mutableAttrVal === attrValPrefix) || 
                (Object.values(responseObj.mutableAttrVal).indexOf(mutable.mutableAttrVal) > -1)) {
              this.updateEl = mutable.el;

              this.updateEl.nodeName === "INPUT" ? this.updateEl.value = responseObj.mutableVal : this.updateEl.innerHTML = responseObj.mutableVal;
              this.updateEl.updated = 1;
            }
            
          });
        }
      }
    }
    
    // SYNCHRONIZE ANY MODEL TO THE DATA OF THE MUTABLE ELEMENT
    syncModels(responseObj) {
      if ((responseObj.syncModelID !== "") && 
      (responseObj.syncModelID !== null)) {
        let modelID = responseObj.syncModelID;

        if (this.actionType === "syncInput") {
          // SYNCHRONIZING NEEDS A DELAY, OTHERWISE SOME INPUT MAY BE LOST
          let timer;
          const model = document.getElementById(`${modelID}`);
          const mutableEl = this.updateEl;
          const timeOut = this.modelSyncTimeout;

          if (model.getAttribute('listener') !== 'true') {
            model.value = mutableEl.innerHTML;
          }

          model.addEventListener("input", function (e) {
            model.setAttribute('listener', 'true');
            clearTimeout(timer);
            timer = setTimeout(() => {
              model.value = mutableEl.innerHTML;
              model.removeAttribute('listener');
            }, timeOut);
          });
          
        } else {
          
          const modelID = responseObj.syncModelID;
          
          // IF modelID IS AN OBJECT, THEN THERE ARE MULTIPLE OBJECTS TO BE SYNCED
          if (typeof(modelID) === "object") {
            Object.values(modelID).forEach(theID => {
              document.getElementById(`${theID}`).value = responseObj.mutableVal;
            });
          } else {
            // THERE IS ONLY ONE MODEL TO BE SYNCED
            document.getElementById(`${modelID}`).value = responseObj.mutableVal; // ?????????????
          }
        }
      }
    }
}
