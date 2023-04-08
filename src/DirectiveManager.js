import MessageBus from './MessageBus';

export default {
    directives: new MessageBus(),

    register(name, callback) {
        if (this.has(name)) {
            throw `ASYNergy: Directive already registered: [${name}]`;
        }

        this.directives.register(name, callback);
    },

    call(name, el, directive, mutableElem, url) {
        this.directives.call(name, el, directive, mutableElem, url);
    },

    has(name) {
        return this.directives.has(name);
    }
};
