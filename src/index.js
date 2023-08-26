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


import { walkDOM } from './util/walkDOM';
import nodeInitializer from './init_tasks';
import store from './Store';
import Polling from './agent/Polling';
import DisableForms from './agent/DisableForms';
import LoadingStates from './agent/LoadingStates';
import SyncBrowserHistory from './agent/SyncBrowserHistory';

class ASYNergy {
    constructor() {
      this.appVersion = '1.0.0';
      this.agents = store;
      this.URL = '';
    }

    get version() {
        return this.appVersion;
    }
  
  set theURL(url) {
    this.URL = url;
  }

  get theURL() {
    return this.URL;
  }

    hook(name, callback) {
      this.agents.registerHook(name, callback);
    }

    emit(event, ...params) {
      this.agents.emit(event, ...params);
    }

    on(event, callback) {
      this.agents.on(event, callback);
    }

    stop() {
        this.agents.tearDownAgents();
    }

    reregisterEventListeners() {
      const URL = this.URL !== '' ? this.URL : window.location.href;
      const reregisterEvL = true;
      const callBackFn = (el) => {
          nodeInitializer.initialize(el, URL, reregisterEvL);
      };
      const bodyEl = document.body;
      walkDOM(bodyEl, callBackFn);
    }

    start() {
        // TODO check forms and handlerURL in init_tasks.js
      const URL = this.URL !== '' ? this.URL : window.location.href;

        const callBackFn = (el) => {
            nodeInitializer.initialize(el, URL);
        };

        const bodyEl = document.body;

        document.addEventListener(
            'visibilitychange',
            () => {
              store.asynergyIsInBackground = document.hidden;
            },
            false
        );

        window.addEventListener('offline', () => {
            store.asynergyIsOffline = true;
        });

        window.addEventListener('online', () => {
            store.asynergyIsOffline = false;
        });

        walkDOM(bodyEl, callBackFn);
    }
}

if (!window.ASYNergy) {
    window.ASYNergy = ASYNergy;
}

SyncBrowserHistory();
LoadingStates();
DisableForms();
Polling();


export default ASYNergy;
