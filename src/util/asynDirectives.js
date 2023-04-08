export function asynDirectives(el) {
    return new DirectiveManager(el);
}

class DirectiveManager {
    constructor(el) {
        this.el = el;
        this.directives = this.extractTypeModifiersAndValue();
    }

    all() {
        return this.directives;
    }

    has(type) {
        return this.directives.map(directive => directive.type).includes(type);
    }

    missing(type) {
        return !this.has(type);
    }

    get(type) {
        return this.directives.find(directive => directive.type === type);
    }

    extractTypeModifiersAndValue() {
        return Array.from(this.el.getAttributeNames()

        // FILTER ONLY THE ASYNergy DIRECTIVES
        .filter(name => name.match(new RegExp('asyn:')))

        // PARSE OUT THE TYPE, MODIFIERS, AND VALUE FROM IT
        .map(name => {
                const [type, ...modifiers] = name.replace(new RegExp('asyn:'), '').split('.');

                return new Directive(type, modifiers, name, this.el);
            }));
    }
}

class Directive {
    constructor(type, modifiers, fullName, el) {
        this.type = type;
        this.modifiers = modifiers;
        this.fullName = fullName;
        this.el = el;
        this.eventContext;
        this.lcFunc = null;
        this.emitEvent = false;
    }

    setEventContext(context) {
        this.eventContext = context;
    }
    
    get isEmitEvent() {
      return emitEvent;
    }
    
    set isEmitEvent(theBool) {
      if (typeof theBool == "boolean") {
        this.emitEvent = theBool;
      }
    }

    get value() {
        return this.el.getAttribute(this.fullName);
    }
    
    get lcFunction() {
      if (this.fullName === "asyn:mutable") {
        const fullVal = this.el.getAttribute(this.fullName);

        // GET LIVECODE FUNCTION TO BE CALLED
        const pos = fullVal.search(/\./);
        if (pos !== -1) {
            this.lcFunc = fullVal.split(".")[1];
        }
      }
      return this.lcFunc;
    }
    
    get modelValue() {
      return this.el.value !== undefined ? this.el.value : this.el.innerText;
    }

    get handler() {
      const { handler } = this.parseOutHandlerAndParams(this.value);
      return handler;
    }

    get params() {
      const { params } = this.parseOutHandlerAndParams(this.value);

        return params;
    }

    durationOr(defaultDuration) {
        let durationInMilliSeconds;
        const durationInMilliSecondsString = this.modifiers.find(mod => mod.match(/([0-9]+)ms/));
        const durationInSecondsString = this.modifiers.find(mod => mod.match(/([0-9]+)s/));

        if (durationInMilliSecondsString) {
            durationInMilliSeconds = Number(durationInMilliSecondsString.replace('ms', ''));
        } else if (durationInSecondsString) {
            durationInMilliSeconds = Number(durationInSecondsString.replace('s', '')) * 1000;
        }

        return durationInMilliSeconds || defaultDuration;
    }

    parseOutHandlerAndParams(rawHandler) {
      let handler = rawHandler;
        let params = [];
        const handlerAndParamString = handler.match(/(.*?)\((.*)\)/s);

        if (handlerAndParamString) {
          handler = handlerAndParamString[1];

            // USE A FUNCTION THAT RETURNS IT'S ARGUMENTS TO PARSE AND EVAL ALL PARAMS
            // THIS "$EVENT" IS FOR USE INSIDE THE ASYNergy EVENT HANDLER
            // ---------------- $event NOT USED ----------------------- //
            let func = new Function('$event', `return (function () {
              for (var l=arguments.length, p=new Array(l), k=0; k<l; k++) {
                p[k] = arguments[k];
              }
              return [].concat(p);
            })(${handlerAndParamString[2]})`);

            params = func(this.eventContext);
        }
        return { handler, params };
    }

    cardinalDirectionOr(fallback = 'right') {
        if (this.modifiers.includes('up')) {
            return 'up';
        }
        if (this.modifiers.includes('down')) {
            return 'down';
        }
        if (this.modifiers.includes('left')) {
            return 'left';
        }
        if (this.modifiers.includes('right')) {
            return 'right';
        }
        return fallback;
    }

    modelSyncDebounce(callback, time) {
        // Prepare yourself for what's happening here.
        // Any text input with asyn:model on it should be "debounced" by ~150ms by default.
        // We can't use a simple debounce function because we need a way to clear all the pending
        // debounces if a user submits a form or performs some other action.
        // This is a modified debounce function that acts just like a debounce, except it stores
        // the pending callbacks in a global property so we can "clear them" on command instead
        // of waiting for their setTimeouts to expire.
        if (!this.modelDebounceCallbacks) {
            this.modelDebounceCallbacks = [];
        }

        // This is a "null" callback. Each asyn:model will register one of these upon initialization.
        let callbackRegister = { callback: () => { } };

        this.modelDebounceCallbacks.push(callbackRegister);

        // This is a normal "timeout" for a debounce function.
        var timeout;

        return e => {
            clearTimeout(timeout);

            timeout = setTimeout(() => {
                callback(e);
                timeout = undefined;

                // Because we just called the callback, let's return the
                // callback register to it's normal "null" state.
                callbackRegister.callback = () => { };
            }, time);

            // Register the current callback in the register as a kind-of "escape-hatch".
            callbackRegister.callback = () => {
                clearTimeout(timeout);
                callback(e);
            };
        };
    }
}
