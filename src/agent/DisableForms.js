import store from '../Store';
import { asynDirectives } from '../util/asynDirectives';

let cleanupStackByAgentId = {};

export default function () {
  store.registerHook('element.initialized', (el, agent) => {
    let directives = asynDirectives(el);

    if (directives.missing('submit')) return;

    // Set a forms "disabled" state on inputs and buttons.
    // ASYNergy will clean it all up automatically submitting the form.
    el.addEventListener('submit', () => {
      cleanupStackByAgentId[agent.agentID] = [];

      agent.walk(node => {
        if (!el.contains(node)) return;

        if (node.hasAttribute('asyn:ignore')) return false;

        if (
          // <button type="submit">
          (node.tagName.toLowerCase() === 'button' &&
            node.type === 'submit') ||
          // <select>
          node.tagName.toLowerCase() === 'select' ||
          // <input type="checkbox|radio">
          (node.tagName.toLowerCase() === 'input' &&
            (node.type === 'checkbox' || node.type === 'radio'))
        ) {

          if (!node.disabled)
            cleanupStackByAgentId[agent.agentID].push(
              () => (node.disabled = false)
            );

          node.disabled = true;
          // TODO: add node to disabled nodes array ---------------------------
          store.addDisabledNode(node);
        } else if (
          // <input type="text">
          node.tagName.toLowerCase() === 'input' ||
          // <textarea>
          node.tagName.toLowerCase() === 'textarea'
        ) {
          if (!node.readOnly)
            cleanupStackByAgentId[agent.agentID].push(
              () => (node.readOnly = false)
            );

          node.readOnly = true;
          // TODO: add node to readOnly nodes array ---------------------------
          store.addReadOnlyNode(node);
        }
      });
    });
  });

  store.registerHook('message.failed', (message, agent) => cleanup(agent));
  store.registerHook('message.received', (message, agent) => cleanup(agent));
}

function cleanup(agent) {
    if (!cleanupStackByAgentId[agent.agentID]) return;

    while (cleanupStackByAgentId[agent.agentID].length > 0) {
      cleanupStackByAgentId[agent.agentID].shift()();
    }
}
