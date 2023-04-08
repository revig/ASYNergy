import HandlerAction from '../action/handler';
import { asynDirectives } from '../util/asynDirectives';
import store from '../Store';

export default function () {
    store.registerHook('element.initialized', (el, agent) => {
        let directive = asynDirectives(el).get('poll');

        if (directive === undefined) {
            return;
        }

        let intervalId = fireActionOnInterval(el, agent);

        agent.addListenerForTeardown(() => {
          clearInterval(intervalId);
        });

        el.__asynergy_polling_interval = intervalId;
    });
}

function fireActionOnInterval(node, agent) {
    let interval = asynDirectives(node).get('poll').durationOr(2000);

    return setInterval(() => {
        if (node.isConnected === false) {
            return;
        }

        const directive = asynDirectives(node).get('poll');

        if (directive === undefined) {
            return;
        }

        const handler = directive.handler || 'refresh';

        // Don't poll when the tab is in the background.
        // (unless the "asyn:poll.keep-alive" modifier is attached)
        if (store.asynergyIsInBackground && !directive.modifiers.includes('keep-alive')) {
            // This "Math.random" business effectivlly prevents 95% of requests
            // from executing. We still want "some" requests to get through.
            if (Math.random() < .95) {
                return;
            }
        }

        // Only poll visible elements. Visible elements are elements that
        // are visible in the current viewport.
        if (directive.modifiers.includes('visible') && !inViewport(directive.el)) {
            return;
        }

        // Don't poll if asynergy is offline as well.
        if (store.asynergyIsOffline) {
            return;
        }
        agent.addAction(new HandlerAction(handler, directive.params, directive.modelValue, directive.emitEvent, node));
    }, interval);
}

function inViewport(el) {
    var bounding = el.getBoundingClientRect();

    return (
        bounding.top < (window.innerHeight || document.documentElement.clientHeight) &&
        bounding.left < (window.innerWidth || document.documentElement.clientWidth) &&
        bounding.bottom > 0 &&
        bounding.right > 0
    );
}
