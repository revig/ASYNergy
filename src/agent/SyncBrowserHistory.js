import store from '../Store';
import Message from '../Message';

export default function () {

	let initializedPath = false;

	let agentIdsThatAreWritingToHistoryState = new Set;

	ASYNergyStateManager.clearState();
    
	let browserHistoryOn = false;
    
	store.registerHook('agent.initialized', agent => {
		if (store.mutableIncludesModel === true) {
        
			if (initializedPath === false) {
              
				let url = window.location.href;
              
				let responseItemNum = 0;
              
				let asynergyResponse = {};
              
				for (const mutablesItem in store.mutables) {
					responseItemNum += 1;

					asynergyResponse[responseItemNum] = {
						mutableID: store.mutables[mutablesItem].el.id,
						syncModelID: "",
						mutableVal: store.mutables[mutablesItem].el.innerHTML,
						mutableAttrVal: store.mutables[mutablesItem].el.getAttribute('asyn:mutable'),
					};
				};
              
				let response = {
					asynergyResponse
				};

				ASYNergyStateManager.replaceState(url, response, agent);

				agentIdsThatAreWritingToHistoryState.add(agent.agentID);

				initializedPath = true;
				browserHistoryOn = true;
			};
		};
	});


	store.registerHook('allMessages.processed', (message) => {
		if (browserHistoryOn === true) {
			// Preventing a circular dependancy.
			if (message.replaying) return;

			let { response } = message;

			let effects = response.effects || {};

			let url = window.location.href;
			ASYNergyStateManager.pushState(url, response, message.agent);

		};
	});


	window.addEventListener('popstate', event => {
		if (browserHistoryOn === true) {
        
			if (ASYNergyStateManager.missingState(event)) return;

			ASYNergyStateManager.replayResponses(event, (response, agent) => {
 
				let updateEl = agent.connection.updateEl;
				let message = new Message(agent, []);

				message.storeResponse(response);

				message.replaying = true;

				agent.doReplayResponse(event, agent, response);
			});
		};
	});
}


let ASYNergyStateManager = {
    replaceState(url, response, agent) {
			this.updateState('replaceState', url, response, agent);
    },

    pushState(url, response, agent) {
			this.updateState('pushState', url, response, agent);
    },

    updateState(method, url, response, agent) {
			let state = this.currentState();

			state.storeResponse(response, agent);

			let stateArray = state.toStateArray();

        // Copy over existing history state if it's an object, so we don't overwrite it.
			let fullstateObject = Object.assign(history.state || {}, { ASYNergy: stateArray });

			let capitalize = subject => subject.charAt(0).toUpperCase() + subject.slice(1);

			store.callHook('before'+capitalize(method), fullstateObject, url, agent);

        try {
            if (decodeURI(url) != 'undefined') {
							url = decodeURI(url).replaceAll(' ', '+').replaceAll('\\', '%5C');
            }

            history[method](fullstateObject, '', url);

        } catch (error) {
            // Firefox has a 160kb limit to history state entries.
            // If that limit is reached, we'll instead put it in
            // sessionStorage and store a reference to it.
            if (error.name === 'NS_ERROR_ILLEGAL_VALUE') {
							let key = this.storeInSession(stateArray);

							fullstateObject.asynergy = key;

							history[method](fullstateObject, '', url);

            } else {
              console.error('history.' + method + ': ' + error);
            };
        };
    },

    replayResponses(event, callback) {
        if (! event.state.ASYNergy) return;

        let state = typeof event.state.ASYNergy === 'string'
            ? new ASYNergyState(this.getFromSession(event.state.ASYNergy))
				: new ASYNergyState(event.state.ASYNergy);

        state.replayResponses(callback);
    },

    currentState() {
        if (! history.state) return new ASYNergyState;
        if (! history.state.ASYNergy) return new ASYNergyState;

        let state = typeof history.state.ASYNergy === 'string'
            ? new ASYNergyState(this.getFromSession(history.state.ASYNergy))
				: new ASYNergyState(history.state.ASYNergy);

        return state;
    },

    missingState(event) {
			return ! (event.state && event.state.ASYNergy);
    },

    clearState() {
        // This is to prevent exponentially increasing the size of our state on page refresh.
        if (window.history.state) window.history.state.ASYNergy = (new ASYNergyState).toStateArray();
    },

    storeInSession(value) {
			let key = 'asynergy:'+(new Date).getTime();

			let stringifiedValue = JSON.stringify(value);

			this.tryToStoreInSession(key, stringifiedValue);

			return key;
    },

    tryToStoreInSession(key, value) {
        // sessionStorage has a max storage limit (usally 5MB).
        // If we meet that limit, we'll start removing entries
        // (oldest first), until there's enough space to store
        // the new one.
        try {
					sessionStorage.setItem(key, value);
        } catch (error) {
            // 22 is Chrome, 1-14 is other browsers.
            if (! [22, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].includes(error.code)) return;

            let oldestTimestamp = Object.keys(sessionStorage)
                .map(key => Number(key.replace('asynergy:', '')))
                .sort()
						.shift();

            if (! oldestTimestamp) return;

            sessionStorage.removeItem('asynergy:'+oldestTimestamp);

            this.tryToStoreInSession(key, value);
        }
    },

    getFromSession(key) {
			let item = sessionStorage.getItem(key);

        if (! item) return;

        return JSON.parse(item);
    },
}


class ASYNergyState
{
    constructor(stateArray = []) { this.items = stateArray };

    toStateArray() { return this.items };


    pushItemInProperOrder(signature, response, agent) {
        let targetItem = { signature, response };
        
        // REMOVE CIRCULAR REFERENCE TO AGENT IN agent.messageInTransit
        // delete agent.messageInTransit;

        // First, we'll check if this signature already has an entry, if so, replace it.
        let existingIndex = this.items.findIndex(item => item.signature === signature);

        if (existingIndex !== -1) return this.items[existingIndex] = targetItem;
          
          return this.items.unshift(targetItem);
    }


    storeResponse(response, agent) {
      let signature = agent.agentID;

      this.pushItemInProperOrder(signature, response, agent);
    }


		replayResponses(callback) {
			let state = ASYNergyStateManager.currentState();
			let signature = state.items[0].signature;
			let response = state.items[0].response;
			let agent = this.findAgentBySignature(signature);

			if (! agent) return;
          
			callback(response, agent);
		}


    findAgentBySignature(signature) {
      let agent = store.getAgentsByID(signature);

      // If we found the agent in the proper place, return it,
      // otherwise return the first one.
      return agent[0] || store.agents[0] || console.warn(`ASYNergy: couldn't find agent with ID: ${signature}`);
    }

}
