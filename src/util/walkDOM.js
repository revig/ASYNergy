export function walkDOM(rootEl, callback) {
    if (callback(rootEl) === false) {
        return;
    }

    let node = rootEl.firstElementChild;

    while (node) {
        walkDOM(node, callback);
        node = node.nextElementSibling;
    }
}
