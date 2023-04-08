import Action from '.';

export default class extends Action {
    constructor(modelAttrVal, params, modelVal, isCustomEvent, el) {
      super(el);

      this.isCustomEvent = isCustomEvent;
      this.type = 'fireEvent';
      this.name = modelAttrVal;
        this.payload = {
            modelAttrVal,
            params,
            modelVal
        };
    }

    // Overriding toId() becuase some EventActions don't have an "el"
    toId() {
        return btoa(encodeURIComponent(this.type, this.payload.event, JSON.stringify(this.payload.params)));
    }
}
