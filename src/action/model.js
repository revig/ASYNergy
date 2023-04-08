import Action from '.';

export default class extends Action {
    constructor(modelAttrVal, params, modelVal, isCustomEvent, el) {
        super(el);

        this.isCustomEvent = isCustomEvent;
        this.type = 'syncInput';
        this.name = modelAttrVal;
        this.payload = {
            // id: this.signature,
            modelAttrVal,
            params,
            modelVal
        };
    }
}
