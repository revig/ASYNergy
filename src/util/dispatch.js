export function dispatch(el, eventName, options, theHandler) {
    const event = new CustomEvent(eventName, options);
    el.addEventListener(eventName, theHandler);
    el.dispatchEvent(event);
}