import MessageBus from './MessageBus';

export default {
	availableHooks: [
		/**
		* Public Hooks
		*/
		'agent.initialized',
		'element.initialized',
		'element.updating',
		'element.updated',
		'element.removed',
		'message.sent',
		'message.failed',
		'message.received',
		'message.processed',
		'allMessages.processed',
		'request',

		/**
		* Private Hooks
		*/
		'interceptAsynModelSetValue',
		'interceptAsynModelAttachListener',
		'beforeReplaceState',
		'beforePushState'
	],

  bus: new MessageBus(),

  register(name, callback) {
    if (!this.availableHooks.includes(name)) {
      throw `ASYNergy: Referencing unknown hook: [${name}]`;
    }

    this.bus.register(name, callback);
  },

  call(name, ...params) {
    this.bus.call(name, ...params);
  }
};
