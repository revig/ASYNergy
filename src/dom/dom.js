import { asynDirectives } from '../util/asynDirectives';

/**
 * This is intended to isolate all native DOM operations. The operations that happen
 * one specific element will be instance methods, the operations you would normally
 * perform on the "document" (like "document.querySelector") will be static methods.
 */
export default {
    allModelElementsInside(root) {
        return Array.from(root.querySelectorAll(`[asyn\\:model]`));
    },

    getByAttributeAndValue(attribute, value) {
        return document.querySelector(`[asyn\\:${attribute}="${value}"]`);
    },

    hasAttribute(el, attribute) {
        return el.hasAttribute(`asyn:${attribute}`);
    },

    getAttribute(el, attribute) {
        return el.getAttribute(`asyn:${attribute}`);
    },

    removeAttribute(el, attribute) {
        return el.removeAttribute(`asyn:${attribute}`);
    },

    setAttribute(el, attribute, value) {
        return el.setAttribute(`asyn:${attribute}`, value);
    },

    hasFocus(el) {
        return el === document.activeElement;
    },

    isInput(el) {
        return ['INPUT', 'TEXTAREA', 'SELECT'].includes(
            el.tagName.toUpperCase()
        );
    },

    isTextInput(el) {
        return (
            ['INPUT', 'TEXTAREA'].includes(el.tagName.toUpperCase()) &&
            !['checkbox', 'radio'].includes(el.type)
  );
    },

    valueFromInput(el, agent) {
        if (el.type === 'checkbox') {
            let modelName = asynDirectives(el).get('model').value;
            // If there is an update from asyn:model.defer in the chamber,
            // we need to pretend that is the actual data from the server.
            let modelValue = agent.deferredActions[modelName]
                ? agent.deferredActions[modelName].asynPayload.value
                // : get(agent.data, modelName);
                : el.checked;

            if (Array.isArray(modelValue)) {
                return this.mergeCheckboxValueIntoArray(el, modelValue);
            }

            if (el.checked) {
                return el.getAttribute('value') || true;
            } else {
                return false;
            }
        } else if (el.tagName === 'SELECT' && el.multiple) {
            return this.getSelectValues(el);
        }

        return el.value;
    },

    mergeCheckboxValueIntoArray(el, arrayValue) {
        if (el.checked) {
            return arrayValue.includes(el.value)
                ? arrayValue
                : arrayValue.concat(el.value);
        }

        return arrayValue.filter(item => item != el.value);
    },
      
      setInputValueFromModel(el, agent) {
          const modelString = asynDirectives(el).get('model').value;
          const modelValue = get(agent.data, modelString);

          // Don't manually set file input's values.
          if (
              el.tagName.toLowerCase() === 'input' &&
              el.type === 'file'
          )
              return;

          this.setInputValue(el, modelValue);
      },

    setInputValue(el, value) {
        if (el.type === 'radio') {
            el.checked = el.value == value;
        } else if (el.type === 'checkbox') {
            if (Array.isArray(value)) {
                // I'm purposely not using Array.includes here because it's
                // strict, and because of Numeric/String mis-casting, I
                // want the "includes" to be "fuzzy".
                let valueFound = false;
                value.forEach(val => {
                    if (val == el.value) {
                        valueFound = true;
                    }
                });

                el.checked = valueFound;
            } else {
                el.checked = !!value;
            }
        } else if (el.tagName === 'SELECT') {
            this.updateSelect(el, value);
        } else {
            value = value === undefined ? '' : value;

            el.value = value;
        }
    },

    getSelectValues(el) {
        return Array.from(el.options)
          .filter(option => option.selected)
          .map(option => option.value || option.text);
    },

    updateSelect(el, value) {
        const arrayWrappedValue = [].concat(value).map(value => value + '');

        Array.from(el.options).forEach(option => {
            option.selected = arrayWrappedValue.includes(option.value);
        });
    }
};
