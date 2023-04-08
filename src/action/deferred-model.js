import Action from '.';

export default class extends Action {
    constructor(modelAttrVal, params, modelVal, isCustomEvent, el, skipWatcher = false) {
        super(el, skipWatcher);

        this.isCustomEvent = isCustomEvent;
        this.type = 'syncInput';
        this.name = modelAttrVal;
        this.payload = {
            modelAttrVal,
            params,
            modelVal
        };
    }
}
