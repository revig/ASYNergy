import DeferredModelAction from './deferred-model';

export default {
  deferredActions: {},

  addAction(name, value, el) {
    if (!this.deferredActions[name]) {
      new DeferredModelAction(name, value, el);
      this.deferredActions[name] = [];
    }

    this.deferredActions[name].push(value);
    this.deferredActions[name].push(el);
  },

  get deferredActionsData() {
    let payloadDeferred = {};

    if (this.deferredActions.length !== 0) {

      // GET NAMES AND VALUES OF DEFERRED ACTIONS
      for (let action in this.deferredActions) {
        if (this.deferredActions.hasOwnProperty(action)) {
          let actionData = this.deferredActions[action];

          // actionData[0], IS THE INITIAL VALUE actionData[1] IS THE ELEMENT
          // this.asynPayload[action] = actionData[1].value;
          // USE THE ACTION SUFFIX AS PAYLOAD KEY

          // REGULAR EXPRESSION (?<=(\.)).+$ DOES NOT WORK WITH WEBKIT
          // DUE TO LOOKBEHIND. WE USE (?:(\.)).+$ AND STRIP THE FIRST
          // CHARACTER, A DOT IN THIS CASE
          // const actionSuffix = /(?<=(\.)).+$/.exec(action);
          // this.asynPayload[actionSuffix[0]] = actionData[1].value;
          const actionExecResult = /(?:(\.)).+$/.exec(action);
          const actionSuffix = actionExecResult[0].substr(1);
          payloadDeferred[actionSuffix] = actionData[1].value;
        }
      }
    }
    return payloadDeferred;
  }
};
