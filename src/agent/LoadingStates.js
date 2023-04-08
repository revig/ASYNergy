import store from '../Store';
import { asynDirectives } from '../util/asynDirectives';

export default function () {
    store.registerHook('agent.initialized', agent => {
      agent.targetedLoadingElsByAction = {};
      agent.genericLoadingEls = [];
      agent.currentlyActiveLoadingEls = [];
      agent.currentlyActiveUploadLoadingEls = [];
    });

    store.registerHook('element.initialized', (el, agent) => {
      let directives = asynDirectives(el);

        if (directives.missing('loading')) return;

        const loadingDirectives = directives.directives.filter(
            i => i.type === 'loading'
        );
    });


    store.registerHook('message.sent', (message, agent) => {
        const actions = message.updateQueue
            .filter(action => {
              return action.type === 'callHandler';
            })
            .map(action => action.payload.modelAttrVal);

        const actionsWithParams = message.updateQueue
            .filter(action => {
              return action.type === 'callHandler';
            })
            .map(action =>
                generateSignatureFromHandlerAndParams(
                  action.payload.modelAttrVal,
                    action.payload.params
                )
            );

      const models = message.updateQueue
        .filter(action => {
          return action.type === 'syncInput';
        })
        .map(action => {
          let name = action.payload.modelAttrVal;
          if (!name.includes('.')) {
            return name;
          }

          let modelActions = [];

          modelActions.push(
            name.split('.').reduce((fullAction, part) => {
              modelActions.push(fullAction);

              return fullAction + '.' + part;
            })
          );

          return modelActions;
        })
        .flat();
    });
}

export function setUploadLoading(agent, modelName) {
    const actionTargetedEls =
  agent.targetedLoadingElsByAction[modelName] || [];

  const allEls = removeDuplicates(agent.genericLoadingEls.concat(actionTargetedEls));

  startLoading(allEls);

  agent.currentlyActiveUploadLoadingEls = allEls;
}


export function unsetUploadLoading(agent) {
  endLoading(agent.currentlyActiveUploadLoadingEls);

  agent.currentlyActiveUploadLoadingEls = [];
}


function startLoading(els) {
    els.forEach(({ el, directive }) => {
        if (directive.modifiers.includes('class')) {
          let classes = directive.value.split(' ').filter(Boolean);

            doAndSetCallbackOnElToUndo(
                el,
                directive,
                () => el.classList.add(...classes),
                () => el.classList.remove(...classes)
            );
        } else if (directive.modifiers.includes('attr')) {
            doAndSetCallbackOnElToUndo(
                el,
                directive,
                () => el.setAttribute(directive.value, true),
                () => el.removeAttribute(directive.value)
            );
        } else {
            let cache = window
                .getComputedStyle(el, null)
          .getPropertyValue('display');

            doAndSetCallbackOnElToUndo(
                el,
                directive,
                () => {
                  el.style.display = directive.modifiers.includes('remove')
                    ? cache
                    : getDisplayProperty(directive);
                },
                () => {
                  el.style.display = 'none';
                }
            );
        }
    });
}


function getDisplayProperty(directive) {
    return (['inline', 'block', 'table', 'flex', 'grid', 'inline-flex']
  .filter(i => directive.modifiers.includes(i))[0] || 'inline-block');
}


function doAndSetCallbackOnElToUndo(el, directive, doCallback, undoCallback) {
  if (directive.modifiers.includes('remove'))
    [doCallback, undoCallback] = [undoCallback, doCallback];

    if (directive.modifiers.includes('delay')) {
      let duration = 200;

        let delayModifiers = {
            'shortest': 50,
            'shorter': 100,
            'short': 150,
            'long': 300,
            'longer': 500,
            'longest': 1000,
        };

        Object.keys(delayModifiers).some(key => {
            if(directive.modifiers.includes(key)) {
              duration = delayModifiers[key];
              return true;
            }
        });

      let timeout = setTimeout(() => {
        doCallback();
        el.__asynergy_on_finish_loading.push(() => undoCallback());
      }, duration);

      el.__asynergy_on_finish_loading.push(() => clearTimeout(timeout));
    } else {
      doCallback();
      el.__asynergy_on_finish_loading.push(() => undoCallback());
    }
}


function endLoading(els) {
  els.forEach(({ el }) => {
    while (el.__asynergy_on_finish_loading.length > 0) {
      el.__asynergy_on_finish_loading.shift()();
    }
  });
}


function generateSignatureFromHandlerAndParams(handler, params) {
  return handler + btoa(encodeURIComponent(handler.toString()));
}


function removeDuplicates(arr) {
  return Array.from(new Set(arr));
}
