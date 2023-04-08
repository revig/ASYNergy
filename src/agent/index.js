import Message from '../Message';
import { debounce } from '../util/debounce';
import store from '../Store';
import DeferredModelAction from '../action/deferred-model';
import { walkDOM } from '../util/walkDOM';
import MessageBus from '../MessageBus';

export default class {
    constructor(el, connection, postValue, agentID) {
        this.el = el;
        this.updateQueue = [];
        this.deferredActions = {}; // temp test
        this.messageInTransit = undefined;
        this.connection = connection;
        this.postValue = postValue;
        this.agentID = agentID;
        this.tearDownCallbacks = [];
        this.scopedListeners = new MessageBus();
        this.listeners = [];
    }

    on(event, callback) {
      this.scopedListeners.register(event, callback);
    }

    addAction(action) {
        if (action instanceof DeferredModelAction) {
            this.deferredActions[action.name] = action;

            return;
        }

        this.updateQueue.push(action);

        // This debounce is here in-case two events fire at the "same" time:
        // For example: if you are listening for a click on element A,
        // and a "blur" on element B. If element B has focus, and then,
        // you click on element A, the blur event will fire before the "click"
        // event. This debounce captures them both in the actionsQueue and sends
        // them off at the same time.
        // Note: currently, it's set to 5ms, that might not be the right amount, we'll see.
        debounce(this.fireMessage, 5).apply(this);

        // Clear prefetches.
        // this.prefetchManager.clearPrefetches()
    }

    fireMessage() {
        Object.entries(this.deferredActions).forEach(([modelName, action]) => {
          this.updateQueue.unshift(action);
        });
        this.deferredActions = {};

        this.messageInTransit = new Message(this, this.updateQueue);

      let sendMessage = () => {
        this.connection.action(this.messageInTransit);

        store.callHook('message.sent', this.messageInTransit, this);

        this.updateQueue = [];
      };
        sendMessage();
    }

    walk(callback, callbackWhenNewComponentIsEncountered = el => { }) {
      walkDOM(this.el, el => {
        // Skip the root component element.
        if (el.isSameNode(this.el)) {
          callback(el);
          return;
        }

        if (callback(el) === false) {
          return false;
        }
      });
    }

    callAfterModelDebounce(callback) {
        // This is to protect against the following scenario:
        // A user is typing into a debounced input, and hits the enter key.
        // If the enter key submits a form or something, the submission
        // will happen BEFORE the model input finishes syncing because
        // of the debounce. This makes sure to clear anything in the debounce queue.

        if (this.modelDebounceCallbacks) {
            this.modelDebounceCallbacks.forEach(callbackRegister => {
                callbackRegister.callback();
                callbackRegister.callback = () => { };
            });
        }

      callback();
    }

    addListenerForTeardown(teardownCallback) {
        this.tearDownCallbacks.push(teardownCallback);
    }

    tearDown() {
        this.tearDownCallbacks.forEach(callback => callback());
    }
}
